from fastapi import APIRouter, HTTPException
from auth import config
from jose import JWTError, jwt

# Инициализация приложения
router = APIRouter()


# Проверка токена
def verify_token(token: str):
    try:
        payload = jwt.decode(
            token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
        )
        # Проверка на наличие обязательных данных (например, user_id)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# Роут для проверки авторизации
@router.get("/")
def check_auth(token: str):
    """
    Проверяет, действителен ли токен.
    """
    if verify_token(token):  # Если токен недействителен, вызовет HTTPException
        return {"message": "Authenticated"}
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")
