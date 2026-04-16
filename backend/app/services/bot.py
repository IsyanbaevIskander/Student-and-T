from aiogram import Bot
from app.core.config import settings

async def send_notification(tg_id: int, message: str) -> None:
    if not settings.TELEGRAM_BOT_TOKEN or not tg_id:
        return
    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
    try:
        await bot.send_message(chat_id=tg_id, text=message)
    except Exception as e:
        print(f"Error sending message to {tg_id}: {e}")
    finally:
        await bot.session.close()
