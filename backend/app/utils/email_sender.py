# app/utils/email_sender.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import Optional
from app.core.config import settings

# Конфигурация для Mail.ru
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=465,  # Явно укажите 465
    MAIL_SERVER="smtp.mail.ru",
    MAIL_STARTTLS=False,  # ВЫКЛЮЧИТЬ
    MAIL_SSL_TLS=True,    # ВКЛЮЧИТЬ
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False
)


class EmailSender:
    """Отправка email уведомлений через Mail.ru"""
    
    @staticmethod
    async def send_email(to_email: str, subject: str, body: str) -> bool:
        """Базовый метод отправки письма"""
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            print("⚠️ Email не настроен, пропускаем отправку")
            return False
        
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[to_email],
                body=body,
                subtype="html"
            )
            
            fm = FastMail(conf)
            await fm.send_message(message)
            print(f"✅ Email отправлен на {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка отправки email: {e}")
            return False
    
    @staticmethod
    async def send_mentor_request_notification(
        to_email: str,
        student_name: str,
        slot_time: str,
        message: Optional[str] = None
    ) -> bool:
        """Уведомление ментору о новом запросе на встречу"""
        subject = "🔔 Новый запрос на встречу | Student & T"
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }}
                .info {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Новый запрос на встречу</h1>
                </div>
                <div class="content">
                    <p>У вас новый запрос на менторскую встречу!</p>
                    <div class="info">
                        <p><strong>👤 Студент:</strong> {student_name}</p>
                        <p><strong>🕐 Время:</strong> {slot_time}</p>
                        {f'<p><strong>💬 Сообщение:</strong> {message}</p>' if message else ''}
                    </div>
                    <p>Перейдите в личный кабинет, чтобы подтвердить или отклонить запрос.</p>
                    <a href="http://localhost:5173/mentor/requests" class="button">Перейти к запросам</a>
                    <div class="footer">
                        <p>Student & T Hub Platform</p>
                        <p>Это автоматическое уведомление, не отвечайте на него.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailSender.send_email(to_email, subject, body)
    
    @staticmethod
    async def send_mentor_request_response(
        to_email: str,
        mentor_name: str,
        status: str,
        slot_time: str
    ) -> bool:
        """Уведомление студенту о решении по запросу"""
        if status == "ACCEPTED":
            subject = "✅ Запрос на встречу ПРИНЯТ | Student & T"
            status_color = "#28a745"
            status_text = "ПРИНЯТ"
            emoji = "✅"
        else:
            subject = "❌ Запрос на встречу ОТКЛОНЕН | Student & T"
            status_color = "#dc3545"
            status_text = "ОТКЛОНЕН"
            emoji = "❌"
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {status_color}; color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }}
                .info {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
                .status {{ font-size: 24px; font-weight: bold; color: {status_color}; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{emoji} Статус запроса изменен</h1>
                </div>
                <div class="content">
                    <p class="status">{status_text}</p>
                    <div class="info">
                        <p><strong>👨‍🏫 Ментор:</strong> {mentor_name}</p>
                        <p><strong>🕐 Время встречи:</strong> {slot_time}</p>
                    </div>
                    <a href="http://localhost:5173/student/meetings" class="button">Перейти к встречам</a>
                    <div class="footer">
                        <p>Student & T Hub Platform</p>
                        <p>Это автоматическое уведомление, не отвечайте на него.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailSender.send_email(to_email, subject, body)
    
    @staticmethod
    async def send_booking_status_notification(
        to_email: str,
        room_name: str,
        status: str,
        booking_time: str
    ) -> bool:
        """Уведомление о статусе бронирования"""
        status_map = {
            "APPROVED": ("✅ ОДОБРЕНО", "#28a745"),
            "REJECTED": ("❌ ОТКЛОНЕНО", "#dc3545"),
            "PENDING": ("⏳ НА РАССМОТРЕНИИ", "#ffc107")
        }
        
        status_text, status_color = status_map.get(status, (status, "#000000"))
        subject = f"Статус бронирования: {status_text} | Student & T"
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {status_color}; color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }}
                .info {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Статус бронирования</h1>
                </div>
                <div class="content">
                    <p style="font-size: 20px; font-weight: bold; color: {status_color};">{status_text}</p>
                    <div class="info">
                        <p><strong>🚪 Комната:</strong> {room_name}</p>
                        <p><strong>🕐 Время:</strong> {booking_time}</p>
                    </div>
                    <a href="http://localhost:5173/bookings" class="button">Перейти к бронированиям</a>
                    <div class="footer">
                        <p>Student & T Hub Platform</p>
                        <p>Это автоматическое уведомление, не отвечайте на него.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await EmailSender.send_email(to_email, subject, body)