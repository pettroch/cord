from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.schemes.User import User


# Получение пользователя по имени
async def get_user_by_username(db: AsyncSession, username: str):
    try:
        # Выполнение асинхронного запроса с фильтрацией по имени пользователя
        result = await db.execute(select(User).filter(User.username == username))

        # Получаем пользователя
        user = result.scalars().first()

        # Если пользователь найден
        if user:
            return user
        else:
            print(f"Пользователь с именем {username} не найден.")
            return None  # Возвращаем None, если пользователь не найден

    except Exception as e:
        print(f"Ошибка: {e}")
        return None  # Возвращаем None в случае ошибки


# Проверка на уникальность имени пользователя
async def is_username_taken(db: AsyncSession, username: str):
    # Используем select() вместо query()
    stmt = select(User).filter(User.username == username)
    result = await db.execute(stmt)
    user = result.scalars().first()  # Получаем первый результат (если есть)
    return user is not None
