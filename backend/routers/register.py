from fastapi import APIRouter, HTTPException, status, Depends
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from models.UserCreate import UserCreate
from models.UserResponse import UserResponse
from database.db import get_db
from crud.user.get_username import is_username_taken
from crud.user.create_user import create_user
import utils


router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/", response_model=UserResponse)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Проверка, что пользователь с таким именем уже существует
        existing_user = await is_username_taken(db, user.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь уже зарегистрирован",
            )

        # Хэшируем пароль
        hashed_password = utils.hash_password(
            user.password
        )  # Не забыть хешировать пароль

        # Создаем нового пользователя в базе данных
        new_user = await create_user(
            db, username=user.username, password=hashed_password
        )

        # Возвращаем пользователя, преобразованного в схему Pydantic
        return UserResponse(id=new_user.id, username=new_user.username)

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь уже зарегистрирован",
        )
