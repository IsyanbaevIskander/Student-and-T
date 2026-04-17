import os

class Settings:
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "student_t_db")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", 5432))
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    GIGACHAT_CREDENTIALS: str = os.getenv("GIGACHAT_CREDENTIALS", "")
    
    # Email settings (Mail.ru)
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "timkazy@mail.ru")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "LXrKIRT0UUbEJzpfiS92")
    # MAIL_FROM: str = os.getenv("MAIL_FROM", "timkazy@mail.ru")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 465))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.mail.ru")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "False").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "True").lower() == "true"

    # File upload settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/backend/uploads/resumes")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB in bytes
    ALLOWED_EXTENSIONS: set = {'.pdf'}
    ALLOWED_MIME_TYPES: set = {'application/pdf'}

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
