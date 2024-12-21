from authx import AuthX, AuthXConfig
from datetime import timedelta
from fastapi import HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.db import get_db
from database.schemes.User import User


# Конфигурация AuthX
config = AuthXConfig()
config.JWT_SECRET_KEY = "rdcftvgybhu345678uDRCFTTGVHBJ"
config.JWT_ACCESS_COOKIE_NAME = "access_token"
config.JWT_TOKEN_LOCATION = ["cookies"]
config.JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
config.JWT_COOKIE_CSRF_PROTECT = False

# Создание экземпляра AuthX
security = AuthX(config=config)


# Зависимость для получения текущего пользователя
async def user_identity(request: Request, db: AsyncSession = Depends(get_db)):
    # Извлекаем токен из cookies
    token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)

    if token is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    try:
        # Получаем ID пользователя из токена
        user_id = security.get_jwt_identity(request)

        # Асинхронный запрос в базу данных для получения пользователя
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        return user

    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
