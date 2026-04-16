import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

class MentorTestFlow:
    def __init__(self):
        self.student_token = None
        self.mentor_token = None
        self.admin_token = None
        self.mentor_id = None
        self.slot_id = None
        self.request_id = None
        self.hub_id = None
        
    def register_user(self, email, password):
        response = requests.post(f"{BASE_URL}/auth/register", json={
            "email": email, "password": password, "tg_username": f"@{email.split('@')[0]}"
        })
        if response.status_code == 400:
            return self.login_user(email, password)
        assert response.status_code == 200, response.text
        return response.json()
    
    def login_user(self, email, password):
        response = requests.post(f"{BASE_URL}/auth/login", data={
            "username": email, "password": password
        })
        assert response.status_code == 200, response.text
        return response.json()
    
    def test_mentor_flow(self):
        print("=" * 60)
        print("🚀 ТЕСТ МЕНТОРОВ")
        print("=" * 60)
        
        # 1. Логин админа (должен уже существовать в БД)
        print("\n1. Логин админа...")
        admin_login = self.login_user("admin@mail.com", "admin123")
        self.admin_token = admin_login["access_token"]
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        print("✅ Админ авторизован")
        
        # 2. Получаем или создаем хаб
        print("\n2. Проверка хаба...")
        hubs_response = requests.get(f"{BASE_URL}/hubs/", headers=admin_headers)
        
        if hubs_response.status_code == 200 and hubs_response.json():
            self.hub_id = hubs_response.json()[0]["id"]
            print(f"✅ Хаб уже существует: ID={self.hub_id}")
        else:
            hub_response = requests.post(f"{BASE_URL}/admin/hubs", headers=admin_headers, json={
                "name": "Тестовый Хаб",
                "location": "Москва",
                "info": "Хаб для тестирования"
            })
            assert hub_response.status_code == 200, hub_response.text
            self.hub_id = hub_response.json()["id"]
            print(f"✅ Хаб создан: ID={self.hub_id}")
        
        # 3. Регистрация ментора
        print("\n3. Регистрация ментора...")
        self.register_user("mentor@test.com", "123456")
        
        # 4. Логин ментора
        mentor_login = self.login_user("mentor@test.com", "123456")
        self.mentor_token = mentor_login["access_token"]
        mentor_headers = {"Authorization": f"Bearer {self.mentor_token}"}
        
        # 5. Подача заявки (если уже подана - пропускаем)
        # В файле test_mentor_flow.py, строка 73-79
        print("\n4. Подача заявки на менторство...")
        apply = requests.post(f"{BASE_URL}/mentors/apply", headers=mentor_headers, json={
            "hub_id": self.hub_id
        })

        if apply.status_code == 400 and "уже подана" in apply.text:
            print("⚠️ Заявка уже была подана ранее")
        else:
            # Добавим более детальную информацию об ошибке
            if apply.status_code != 200:
                print(f"❌ Ошибка при подаче заявки:")
                print(f"   Status: {apply.status_code}")
                print(f"   Response: {apply.text}")
                print(f"   Headers: {mentor_headers}")
                print(f"   Data: {{'hub_id': {self.hub_id}}}")
            assert apply.status_code == 200, f"Failed with: {apply.text}"
            print("✅ Заявка подана")
        
        # 6. Получение ID ментора
        me = requests.get(f"{BASE_URL}/auth/me", headers=mentor_headers)
        self.mentor_id = me.json()["id"]
        
        # 7. Одобрение заявки (если еще не одобрен)
        print("\n5. Проверка статуса ментора...")
        profile = requests.get(f"{BASE_URL}/mentors/profile/{self.mentor_id}", headers=mentor_headers)
        
        if profile.status_code == 200 and profile.json().get("status") == "APPROVED":
            print("✅ Ментор уже одобрен")
        else:
            print("Одобрение заявки...")
            approve = requests.put(f"{BASE_URL}/admin/mentor-applications/{self.mentor_id}/approve", 
                                  headers=admin_headers)
            if approve.status_code == 200:
                print("✅ Ментор одобрен")
            else:
                print(f"⚠️ Не удалось одобрить: {approve.text}")
        
        # 8. Обновление профиля
        print("\n6. Обновление профиля...")
        update = requests.put(f"{BASE_URL}/mentors/profile", headers=mentor_headers, json={
            "bio": "Опытный Python разработчик",
            "skills": "Python, FastAPI, Docker",
            "tags": ["python", "fastapi", "docker"]
        })
        
        if update.status_code == 200:
            print("✅ Профиль обновлен")
        else:
            print(f"⚠️ Не удалось обновить: {update.text}")
        
        # 9. Создание слота
        print("\n7. Создание слота...")
        start_at = (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0).isoformat()
        end_at = (datetime.now() + timedelta(days=1)).replace(hour=11, minute=0).isoformat()
        slot = requests.post(f"{BASE_URL}/mentors/slots", headers=mentor_headers, json={
            "start_at": start_at, "end_at": end_at
        })
        
        if slot.status_code == 200:
            self.slot_id = slot.json()["id"]
            print(f"✅ Слот создан: ID={self.slot_id}")
        elif slot.status_code == 400 and "пересекается" in slot.text:
            print("⚠️ Слот уже существует")
            # Получаем существующие слоты
            slots = requests.get(f"{BASE_URL}/mentors/my-slots", headers=mentor_headers)
            if slots.status_code == 200 and slots.json():
                self.slot_id = slots.json()[0]["id"]
                print(f"✅ Используем существующий слот: ID={self.slot_id}")
        else:
            assert slot.status_code == 200, slot.text
        
        # 10. Регистрация студента
        print("\n8. Регистрация студента...")
        self.register_user("student@test.com", "123456")
        
        # 11. Логин студента
        student_login = self.login_user("student@test.com", "123456")
        student_token = student_login["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        # 12. Поиск менторов
        print("\n9. Поиск менторов...")
        search = requests.post(f"{BASE_URL}/mentors/search", headers=student_headers, json={
            "query": "python fastapi"
        })
        assert search.status_code == 200, search.text
        print(f"✅ Найдено менторов: {len(search.json().get('mentors', []))}")
        
        # 13. Получение доступных слотов
        print("\n10. Доступные слоты...")
        slots = requests.get(f"{BASE_URL}/mentors/slots/available", headers=student_headers)
        assert slots.status_code == 200, slots.text
        print(f"✅ Доступно слотов: {len(slots.json())}")
        
        # 14. Запрос на встречу
        if self.slot_id:
            print("\n11. Запрос на встречу...")
            meeting = requests.post(f"{BASE_URL}/mentors/request-meeting", headers=student_headers, json={
                "mentor_id": self.mentor_id,
                "slot_id": self.slot_id,
                "message": "Нужна консультация"
            })
            
            if meeting.status_code == 200:
                self.request_id = meeting.json()["request_id"]
                print(f"✅ Запрос отправлен: ID={self.request_id}")
            elif meeting.status_code == 400:
                print("⚠️ Запрос уже существует или слот занят")
            else:
                assert meeting.status_code == 200, meeting.text
        
        # 15. Просмотр входящих запросов
        print("\n12. Входящие запросы...")
        incoming = requests.get(f"{BASE_URL}/mentors/requests/incoming", headers=mentor_headers)
        assert incoming.status_code == 200, incoming.text
        print(f"✅ Входящих запросов: {len(incoming.json())}")
        
        # 16. Принятие запроса
        if self.request_id:
            print("\n13. Принятие запроса...")
            accept = requests.put(f"{BASE_URL}/mentors/requests/{self.request_id}", 
                                 headers=mentor_headers, json={"status": "ACCEPTED"})
            if accept.status_code == 200:
                print("✅ Запрос принят")
            else:
                print(f"⚠️ Не удалось принять: {accept.text}")
        
        # 17. Статистика
        print("\n14. Статистика...")
        stats = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
        assert stats.status_code == 200, stats.text
        print(f"✅ Статистика: {stats.json()}")
        
        print("\n" + "=" * 60)
        print("🎉 ТЕСТ ЗАВЕРШЕН!")
        print("=" * 60)
        return True

if __name__ == "__main__":
    test = MentorTestFlow()
    test.test_mentor_flow()