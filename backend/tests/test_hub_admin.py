import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test():
    session = requests.Session()
    
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ АДМИНИСТРАТОРА ХАБА")
    print("=" * 60)
    
    # ========== 1. РЕГИСТРАЦИЯ ==========
    print("\n1. РЕГИСТРАЦИЯ (все получают STUDENT)")
    
    # Студент
    resp = session.post(f"{BASE_URL}/api/v1/auth/register",
        json={"email": "student@example.com", "password": "student123", "tg_username": "@student"})
    if resp.status_code == 400:
        print("  Студент уже существует")
    else:
        print(f"  Студент создан: ID={resp.json().get('id')}")
    
    # Ментор
    resp = session.post(f"{BASE_URL}/api/v1/auth/register",
        json={"email": "mentor@example.com", "password": "mentor123", "tg_username": "@mentor"})
    if resp.status_code == 400:
        print("  Ментор уже существует")
    else:
        print(f"  Ментор создан: ID={resp.json().get('id')}")
    
    # Будущий админ хаба
    resp = session.post(f"{BASE_URL}/api/v1/auth/register",
        json={"email": "hub_admin@mail.com", "password": "hub123", "tg_username": "@hubadmin"})
    if resp.status_code == 400:
        print("  Админ хаба уже существует")
    else:
        print(f"  Будущий админ хаба создан: ID={resp.json().get('id')}")
    
    # ========== 2. ЛОГИН (отдельно после регистрации) ==========
    print("\n2. ЛОГИН ПОЛЬЗОВАТЕЛЕЙ")
    
    # Логин студента
    resp = session.post(f"{BASE_URL}/api/v1/auth/login",
        data={"username": "student@example.com", "password": "student123"})
    if resp.status_code != 200:
        print(f"  Ошибка логина студента: {resp.status_code} - {resp.text}")
        return
    student_token = resp.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("  Студент: OK")
    
    # Логин ментора
    resp = session.post(f"{BASE_URL}/api/v1/auth/login",
        data={"username": "mentor@example.com", "password": "mentor123"})
    if resp.status_code != 200:
        print(f"  Ошибка логина ментора: {resp.status_code} - {resp.text}")
        return
    mentor_token = resp.json()["access_token"]
    mentor_headers = {"Authorization": f"Bearer {mentor_token}"}
    print("  Ментор: OK")
    
    # ========== 3. ЛОГИН ГЛОБАЛЬНОГО АДМИНА ==========
    print("\n3. ЛОГИН ГЛОБАЛЬНОГО АДМИНА")
    
    resp = session.post(f"{BASE_URL}/api/v1/auth/login",
        data={"username": "admin@mail.com", "password": "admin123"})
    
    if resp.status_code != 200:
        print("  ОШИБКА: Глобальный админ не создан в БД!")
        print("  Выполните в БД:")
        print("  INSERT INTO users (email, hashed_password, role, tg_username)")
        print("  VALUES ('admin@mail.com', '$2b$12$...', 'ADMIN', '@admin');")
        return
    
    global_token = resp.json()["access_token"]
    global_headers = {"Authorization": f"Bearer {global_token}"}
    print("  Глобальный админ: OK")
    
    # Получаем ID пользователей
    resp = session.get(f"{BASE_URL}/api/v1/auth/me", headers=student_headers)
    student_id = resp.json()["id"]
    
    resp = session.get(f"{BASE_URL}/api/v1/auth/me", headers=mentor_headers)
    mentor_id = resp.json()["id"]
    
    # ========== 4. СОЗДАНИЕ ХАБОВ ==========
    print("\n4. СОЗДАНИЕ ХАБОВ (глобальный админ)")
    
    resp = session.post(f"{BASE_URL}/api/v1/hubs/",
        json={"name": "Хаб Центральный", "location": "Москва", "info": "Главный хаб"},
        headers=global_headers)
    hub1_id = resp.json()["id"]
    
    resp = session.post(f"{BASE_URL}/api/v1/hubs/",
        json={"name": "Хаб Северный", "location": "СПБ", "info": "Второй хаб"},
        headers=global_headers)
    hub2_id = resp.json()["id"]
    
    print(f"  Созданы хабы: ID={hub1_id}, ID={hub2_id}")
    
    # ========== 5. НАЗНАЧЕНИЕ АДМИНИСТРАТОРА ХАБА ==========
    print("\n5. НАЗНАЧЕНИЕ АДМИНИСТРАТОРА ХАБА")
    
    # Сначала логинимся как hub_admin, чтобы получить его ID
    resp = session.post(f"{BASE_URL}/api/v1/auth/login",
        data={"username": "hub_admin@mail.com", "password": "hub123"})
    if resp.status_code != 200:
        print("  Ошибка: пользователь hub_admin@mail.com не зарегистрирован")
        return
    hub_admin_token = resp.json()["access_token"]
    hub_admin_headers = {"Authorization": f"Bearer {hub_admin_token}"}
    
    resp = session.get(f"{BASE_URL}/api/v1/auth/me", headers=hub_admin_headers)
    hub_admin_id = resp.json()["id"]
    
    # Назначаем админом первого хаба
    resp = session.post(f"{BASE_URL}/api/v1/hub-admin/assign",
        json={"user_id": hub_admin_id, "hub_id": hub1_id},
        headers=global_headers)
    print(f"  Пользователь {hub_admin_id} назначен админом хаба {hub1_id}: {resp.status_code}")
    
    # ========== 6. ЗАЯВКА НА МЕНТОРСТВО ==========
    print("\n6. ЗАЯВКА НА МЕНТОРСТВО")
    
    resp = session.post(f"{BASE_URL}/api/v1/mentors/apply",
        json={"hub_id": hub1_id},
        headers=mentor_headers)
    print(f"  Ментор подал заявку в хаб {hub1_id}: {resp.status_code}")
    
    resp = session.put(f"{BASE_URL}/api/v1/admin/mentor-applications/{mentor_id}/approve",
        headers=global_headers)
    print(f"  Админ подтвердил заявку: {resp.status_code}")
    
    resp = session.get(f"{BASE_URL}/api/v1/auth/me", headers=mentor_headers)
    print(f"  Роль ментора после подтверждения: {resp.json().get('role')}")
    
    # ========== 7. ПРОВЕРКА АДМИНИСТРАТОРА ХАБА ==========
    print("\n7. ПРОВЕРКА АДМИНИСТРАТОРА ХАБА")
    
    resp = session.get(f"{BASE_URL}/api/v1/hub-admin/my-hubs", headers=hub_admin_headers)
    if resp.status_code == 200:
        hubs = resp.json()
        print(f"  Доступные хабы: {[h['name'] for h in hubs]}")
    else:
        print(f"  Ошибка: {resp.status_code}")
    
    # ========== 8. ДОБАВЛЕНИЕ КОМНАТЫ ==========
    print("\n8. ДОБАВЛЕНИЕ КОМНАТЫ (админ хаба)")
    
    resp = session.post(f"{BASE_URL}/api/v1/hub-admin/hubs/{hub1_id}/rooms",
        json={"type": "GROUP", "capacity": 20},
        headers=hub_admin_headers)
    
    if resp.status_code == 200:
        room_id = resp.json()["id"]
        print(f"  Добавлена комната ID={room_id}")
    else:
        print(f"  Ошибка: {resp.status_code} - {resp.text}")
        room_id = None
    
    # ========== 9. БРОНИРОВАНИЕ ==========
    print("\n9. БРОНИРОВАНИЕ (студент)")
    
    now = datetime.utcnow()
    start_at = (now + timedelta(days=1)).isoformat() + "Z"
    end_at = (now + timedelta(days=1, hours=2)).isoformat() + "Z"
    
    if room_id:
        resp = session.post(f"{BASE_URL}/api/v1/bookings/",
            json={
                "hub_id": hub1_id,
                "room_id": room_id,
                "start_at": start_at,
                "end_at": end_at,
                "booking_type": "EVENT"
            },
            headers=student_headers)
        
        if resp.status_code == 200 and resp.json():
            booking_id = resp.json()[0]["id"]
            print(f"  Студент создал бронь ID={booking_id}")
            
            # ========== 10. ПОДТВЕРЖДЕНИЕ БРОНИ ==========
            print("\n10. ПОДТВЕРЖДЕНИЕ БРОНИ (админ хаба)")
            
            resp = session.put(f"{BASE_URL}/api/v1/hub-admin/bookings/{booking_id}/approve",
                headers=hub_admin_headers)
            print(f"  Бронь подтверждена: {resp.status_code}")
    
    # ========== 11. СТАТИСТИКА ==========
    print("\n11. СТАТИСТИКА")
    
    resp = session.get(f"{BASE_URL}/api/v1/hub-admin/stats/simple",
        headers=hub_admin_headers)
    print(f"  Простая статистика: {resp.status_code}")
    
    if resp.status_code == 200:
        stats = resp.json()
        print(f"    Всего хабов: {stats.get('total_hubs')}")
        print(f"    Менторов: {stats.get('total_mentors')}")
        print(f"    Студентов: {stats.get('total_students')}")
    
    # ========== 12. ПРОВЕРКА ОГРАНИЧЕНИЙ ==========
    print("\n12. ПРОВЕРКА ОГРАНИЧЕНИЙ")
    
    # Админ хаба НЕ может управлять вторым хабом
    resp = session.put(f"{BASE_URL}/api/v1/hub-admin/hubs/{hub2_id}",
        json={"name": "Попытка взлома", "location": "x", "info": "x"},
        headers=hub_admin_headers)
    print(f"  Попытка обновить чужой хаб (ожидается 403): {resp.status_code}")
    
    # Студент НЕ может получить статистику
    resp = session.get(f"{BASE_URL}/api/v1/hub-admin/stats/simple",
        headers=student_headers)
    print(f"  Студент пытается получить статистику (ожидается 403): {resp.status_code}")
    
    # ========== 13. МГНОВЕННОЕ БРОНИРОВАНИЕ ==========
    print("\n13. МГНОВЕННОЕ БРОНИРОВАНИЕ (админ хаба)")

    if room_id:
        start_at2 = (now + timedelta(days=2)).isoformat()
        end_at2 = (now + timedelta(days=2, hours=1)).isoformat()
        
        resp = session.post(
            f"{BASE_URL}/api/v1/hub-admin/book-room-immediate",
            params={"room_id": room_id, "start_at": start_at2, "end_at": end_at2},
            headers=hub_admin_headers)
        print(f"  Админ забронировал мгновенно: {resp.status_code}")

    # ========== 14. ДЕТАЛЬНАЯ СТАТИСТИКА ==========
    print("\n14. ДЕТАЛЬНАЯ СТАТИСТИКА")

    now = datetime.utcnow()
    date_from = (now - timedelta(days=30)).isoformat()
    date_to = (now + timedelta(days=30)).isoformat()

    resp = session.post(f"{BASE_URL}/api/v1/hub-admin/stats",
        json={
            "hub_ids": [hub1_id],
            "date_from": date_from,
            "date_to": date_to,
            "group_by": "day"
        },
        headers=hub_admin_headers)
    print(f"  Детальная статистика по хабу: {resp.status_code}")
    if resp.status_code == 200:
        stats = resp.json()
        print(f"    Всего бронирований: {stats.get('total_bookings', 0)}")
        print(f"    Уникальных пользователей: {stats.get('unique_users', 0)}")
    else:
        print(f"    Ошибка: {resp.text}")

    print("\n" + "=" * 60)
    print("ТЕСТ ЗАВЕРШЕН")
    print("=" * 60)

if __name__ == "__main__":
    test()