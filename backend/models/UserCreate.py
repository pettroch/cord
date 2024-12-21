from pydantic import BaseModel, Field, field_validator
from typing import ClassVar


class UserCreate(BaseModel):
    username: str = Field(
        ..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9._-]+$"
    )
    password: str = Field(..., min_length=8, max_length=100)

    # Список запрещенных имен
    restricted_usernames: ClassVar[set] = {
        "admin",
        "administrator",
        "root",
        "moderator",
        "superuser",
    }

    @field_validator("username")
    def validate_username(cls, value: str) -> str:
        # Проверка на то, что username не состоит только из цифр
        if value.isdigit():
            raise ValueError("Имя пользователя не должно состоять из цифр")

        # Проверка на запрещенные имена
        if value.lower() in cls.restricted_usernames:
            raise ValueError("Это имя пользователя запрещено")

        return value

    @field_validator("password")
    def validate_password(cls, value: str) -> str:
        # Проверка на то, что пароль не состоит только из цифр или только из букв
        if value.isdigit() or value.isalpha():
            raise ValueError("Пароль должен содержать буквы, цифры, символы")

        # Проверка на пробелы в пароле
        if " " in value:
            raise ValueError("Пароль не должен содержать пробелы")

        # Проверка на наличие хотя бы одной заглавной буквы и цифры
        if not any(char.isdigit() for char in value):
            raise ValueError("Пароль должен содержать хотя бы одну цифру.")
        if not any(char.isupper() for char in value):
            raise ValueError("Пароль должен содержать хотя бы одну заглавную букву.")

        return value
