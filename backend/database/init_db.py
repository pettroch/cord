from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from .schemes.Base import Base
from .schemes.User import User
from .schemes.Room import Room
from .schemes.Online import Online
from .schemes.UserRooms import UserRooms

DATABASE_URL = "sqlite+aiosqlite:///./database.db"

# Создание двигателя базы данных
engine = create_async_engine(DATABASE_URL, echo=True)

# Создание фабрики сессий
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


# Асинхронная инициализация базы данных
async def init_db():
    async with engine.begin() as conn:  # Используем контекстный менеджер для асинхронного подключения
        await conn.run_sync(Base.metadata.create_all)
