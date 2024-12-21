from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from .Base import Base


class Online(Base):
    __tablename__ = "online"

    id = Column(Integer, primary_key=True, index=True)

    # Внешний ключ для связи с пользователем
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Внешний ключ для связи с комнатой
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    # Связь с пользователем
    user = relationship("User", back_populates="online_rooms")

    # Связь с комнатой
    room = relationship("Room", back_populates="online_users")
