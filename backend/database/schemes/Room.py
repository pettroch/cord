import uuid
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .Base import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(
        String,  # Ожидаем строку, которая будет хранить UUID в виде строки
        default=lambda: str(
            uuid.uuid4()
        ),  # Используем str(uuid.uuid4()) для генерации UUID в строковом формате
        unique=True,
        nullable=False,
        index=True,
    )
    name = Column(String, nullable=False)

    # Связь с таблицей "online"
    online_users = relationship("Online", back_populates="room")
