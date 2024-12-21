from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .Base import Base
from .UserRooms import UserRooms  # Убедитесь, что импортируете UserRooms


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)

    # Связь с таблицей "online"
    online_rooms = relationship("Online", back_populates="user")

    # Связь с таблицей "users_rooms"
    rooms = relationship("UserRooms", back_populates="user")  # Добавляем это поле
