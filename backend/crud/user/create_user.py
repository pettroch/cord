from sqlalchemy.ext.asyncio import AsyncSession
from database.schemes.User import User
from sqlalchemy.exc import SQLAlchemyError


async def create_user(db: AsyncSession, username: str, password: str) -> User:
    try:
        # Создаем нового пользователя
        new_user = User(username=username, hashed_password=password)

        # Добавляем нового пользователя в базу данных
        db.add(new_user)
        await db.commit()  # Сохраняем изменения в базе данных
        await db.refresh(new_user)  # Обновляем объект новым состоянием из базы

        return new_user

    except SQLAlchemyError as e:
        # Логируем ошибку и возвращаем None
        print(f"Database error: {e}")
        await db.rollback()  # Откатываем изменения, если ошибка произошла
        return None

    except Exception as e:
        # Логируем исключение
        print(f"An error occurred: {e}")
        return None
