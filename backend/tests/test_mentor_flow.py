import requests
from datetime import datetime, timedelta
import time
import os

BASE_URL = "http://localhost:8000/api/v1"
os.environ["MAIL_USERNAME"] = ""

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
    
    def promote_to_admin(self, user_id, admin_token):
        """Повысить пользователя до админа"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.put(f"{BASE_URL}/admin/users/{user_id}/role", 
                               headers=headers, params={"role": "ADMIN"})
        return response.status_code == 200
    
    def test_mentor_flow(self):
        print("=" * 60)
        print("🚀 ТЕСТ МЕНТОРОВ")
        print("=" * 60)
        
        # 1. Регистрация первого пользователя (будет админом)
        print("\n1. Регистрация пользователя...")
        self.register_user("admin@mail.com", "admin123")
        
        # 2. Логин
        admin_login = self.login_user("admin@mail.com", "admin123")
        self.admin_token = admin_login["access_token"]
        
        # 3. Получаем ID пользователя
        me = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {self.admin_token}"})
        user_id = me.json()["id"]
        
        
        # 5. Создание хаба
        print("\n3. Создание хаба...")
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        hub_response = requests.post(f"{BASE_URL}/admin/hubs", headers=admin_headers, json={
            "name": "Тестовый Хаб",
            "location": "Москва",
            "info": "Хаб для тестирования"
        })
        assert hub_response.status_code == 200, hub_response.text
        self.hub_id = hub_response.json()["id"]
        print(f"✅ Хаб создан: ID={self.hub_id}")
        
        # 6. Регистрация ментора
        print("\n4. Регистрация ментора...")
        self.register_user("mentor@test.com", "123456")
        
        # 7. Логин ментора
        mentor_login = self.login_user("mentor@test.com", "123456")
        self.mentor_token = mentor_login["access_token"]
        mentor_headers = {"Authorization": f"Bearer {self.mentor_token}"}
        
        # 8. Подача заявки
        print("\n5. Подача заявки на менторство...")
        apply = requests.post(f"{BASE_URL}/mentors/apply", headers=mentor_headers, json={
            "hub_id": self.hub_id
        })
        assert apply.status_code == 200, apply.text
        print("✅ Заявка подана")
        
        # 9. Получение ID ментора
        me = requests.get(f"{BASE_URL}/auth/me", headers=mentor_headers)
        self.mentor_id = me.json()["id"]
        
        # 10. Одобрение заявки админом
        print("\n6. Одобрение заявки...")
        approve = requests.put(f"{BASE_URL}/admin/mentor-applications/{self.mentor_id}/approve", 
                              headers=admin_headers)
        assert approve.status_code == 200, approve.text
        print("✅ Ментор одобрен")
        
        # 11. Обновление профиля
        print("\n7. Обновление профиля...")
        update = requests.put(f"{BASE_URL}/mentors/profile", headers=mentor_headers, json={
            "bio": "Опытный Python разработчик",
            "skills": "Python, FastAPI, Docker",
            "tags": ["python", "fastapi", "docker"]
        })
        assert update.status_code == 200, update.text
        print("✅ Профиль обновлен")
        
        # 12. Создание слота
        print("\n8. Создание слота...")
        start_at = (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0).isoformat()
        end_at = (datetime.now() + timedelta(days=1)).replace(hour=11, minute=0).isoformat()
        slot = requests.post(f"{BASE_URL}/mentors/slots", headers=mentor_headers, json={
            "start_at": start_at, "end_at": end_at
        })
        assert slot.status_code == 200, slot.text
        self.slot_id = slot.json()["id"]
        print(f"✅ Слот создан: ID={self.slot_id}")
        
        # 13. Регистрация студента
        print("\n9. Регистрация студента...")
        self.register_user("student@test.com", "123456")
        
        # 14. Логин студента
        student_login = self.login_user("student@test.com", "123456")
        student_token = student_login["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        
        # 15. Поиск менторов
        print("\n10. Поиск менторов...")
        search = requests.post(f"{BASE_URL}/mentors/search", headers=student_headers, json={
            "query": "python fastapi"
        })
        assert search.status_code == 200, search.text
        print(f"✅ Найдено менторов: {len(search.json().get('mentors', []))}")
        
        # 16. Получение доступных слотов
        print("\n11. Доступные слоты...")
        slots = requests.get(f"{BASE_URL}/mentors/slots/available", headers=student_headers)
        assert slots.status_code == 200, slots.text
        print(f"✅ Доступно слотов: {len(slots.json())}")
        
        # 17. Запрос на встречу
        print("\n12. Запрос на встречу...")
        meeting = requests.post(f"{BASE_URL}/mentors/request-meeting", headers=student_headers, json={
            "mentor_id": self.mentor_id,
            "slot_id": self.slot_id,
            "message": "Нужна консультация"
        })
        assert meeting.status_code == 200, meeting.text
        self.request_id = meeting.json()["request_id"]
        print(f"✅ Запрос отправлен: ID={self.request_id}")
        
        # 18. Просмотр входящих запросов
        print("\n13. Входящие запросы...")
        incoming = requests.get(f"{BASE_URL}/mentors/requests/incoming", headers=mentor_headers)
        assert incoming.status_code == 200, incoming.text
        print(f"✅ Входящих запросов: {len(incoming.json())}")
        
        # 19. Принятие запроса
        print("\n14. Принятие запроса...")
        accept = requests.put(f"{BASE_URL}/mentors/requests/{self.request_id}", 
                             headers=mentor_headers, json={"status": "ACCEPTED"})
        assert accept.status_code == 200, accept.text
        print("✅ Запрос принят")
        
        # 20. Проверка статистики
        print("\n15. Статистика...")
        stats = requests.get(f"{BASE_URL}/admin/stats", headers=admin_headers)
        assert stats.status_code == 200, stats.text
        print(f"✅ Статистика: {stats.json()}")
        
        print("\n" + "=" * 60)
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("=" * 60)
        return True

if __name__ == "__main__":
    test = MentorTestFlow()
    test.test_mentor_flow()