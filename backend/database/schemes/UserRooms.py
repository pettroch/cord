from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
import uuid
from .Base import Base


class UserRooms(Base):
    __tablename__ = "users_rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)  # Первичный ключ
    room_uuid = Column(
        String,  # Ожидаем строку, которая будет хранить UUID в виде строки
        default=lambda: str(
            uuid.uuid4()
        ),  # Используем str(uuid.uuid4()) для генерации UUID в строковом формате
        unique=False,
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )  # Идентификатор пользователя

    # Определяем отношение с таблицей пользователей
    user = relationship("User", back_populates="rooms")  # Связь с моделью пользователя
