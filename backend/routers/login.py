from auth import security
from fastapi import APIRouter, HTTPException, Depends, Response
from models.UserLogin import UserLogin
from auth import config
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import get_db
from crud.user.get_username import get_user_by_username
from passlib.context import CryptContext


router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/")
async def login(
    creds: UserLogin, response: Response, db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_username(db, creds.username)

    if user is None:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    if not pwd_context.verify(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    token = security.create_access_token(uid=str(user.id))

    response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token)

    return {"access_token": token}
