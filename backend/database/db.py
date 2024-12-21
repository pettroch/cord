from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = "sqlite+aiosqlite:///./database.db"

# Создание двигателя базы данных
engine = create_async_engine(DATABASE_URL, echo=True)

# Создание фабрики сессий
SessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Базовый класс для моделей
Base = declarative_base()


# Функция для получения сессии
async def get_db():
    async with SessionLocal() as session:  # Используем контекстный менеджер
        try:
            yield session
        finally:
            await session.close()  # Асинхронное закрытие сессии
