from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession  # Используем асинхронные сессии
from uuid import uuid4

from authx import TokenPayload

from database.schemes.UserRooms import UserRooms
from database.schemes.User import User
from database.schemes.Online import Online
from database.db import get_db
from database.schemes.Room import Room

from models.RoomResponse import RoomResponse
from models.RoomCreate import RoomCreate

from sqlalchemy.future import select
from sqlalchemy import delete

from auth import config

from auth import (
    user_identity,
    security,
)  # Функция получения пользователя, которую вы используете для аутентификации

router = APIRouter()


# Зависимость для получения текущего пользователя
async def get_current_user(
    token: str = Depends(user_identity),
):  # Используем user_identity для аутентификации
    return token


@router.get("/user", response_model=list[RoomResponse])
async def get_user_rooms(
    payload: TokenPayload = Depends(security.access_token_required),
    db: AsyncSession = Depends(get_db),
):
    user_id = payload.sub  # Получаем user_id из токена

    try:
        # Запрос к таблице UserRooms для получения всех комнат, где есть пользователь
        result = await db.execute(
            select(Room)  # Выбираем все поля из таблицы Room
            .join(
                UserRooms, UserRooms.room_uuid == Room.room_id
            )  # Соединяем с таблицей UserRooms
            .filter(UserRooms.user_id == user_id)  # Фильтруем по user_id
        )

        rooms = result.scalars().all()  # Извлекаем список комнат

        if not rooms:
            raise HTTPException(status_code=404, detail="Комнаты не найдены")

        # Преобразуем объекты Room в формат Pydantic
        return [
            RoomResponse(room_uuid=room.room_id, room_name=room.name) for room in rooms
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ошибка при получении комнат: {str(e)}"
        )


# Маршрут для создания комнаты
@router.post("/")
async def create_room(
    room: RoomCreate,
    payload: TokenPayload = Depends(security.access_token_required),
    db: AsyncSession = Depends(get_db),
):
    user_id = payload.sub
    room_uuid = uuid4()

    try:
        # Проверяем, существует ли уже комната у пользователя
        query = select(UserRooms).filter(
            UserRooms.user_id == user_id, UserRooms.room_uuid == str(room_uuid)
        )
        result = await db.execute(query)
        user_room = result.scalar_one_or_none()

        # Если комната уже существует, возвращаем ошибку
        if user_room:
            raise HTTPException(
                status_code=400,
                detail="Вы уже являетесь участником этой комнаты.",
            )

        # Создание новой комнаты
        new_room = Room(room_id=str(room_uuid), name=room.room_name)
        db.add(new_room)

        # Привязываем пользователя к комнате
        user_room = UserRooms(room_uuid=str(room_uuid), user_id=user_id)
        db.add(user_room)

        await db.commit()
        await db.refresh(new_room)
        await db.refresh(user_room)

        return {
            "room_id": new_room.room_id,
            "room_name": new_room.name,
        }
    except Exception as e:
        await db.rollback()  # Откатываем изменения в случае ошибки
        raise HTTPException(
            status_code=500, detail=f"Ошибка при создании комнаты: {str(e)}"
        )


@router.post("/check")
async def check_room(
    room_id: str,  # ID комнаты, которую проверяет пользователь
    payload: TokenPayload = Depends(security.access_token_required),
    db: AsyncSession = Depends(get_db),
):
    user_id = payload.sub

    try:
        # Проверяем, есть ли эта комната у текущего пользователя
        query = select(UserRooms).filter(
            UserRooms.user_id == user_id, UserRooms.room_uuid == room_id
        )
        result = await db.execute(query)
        user_room = result.scalar_one_or_none()

        # Если комната найдена у пользователя, возвращаем сообщение
        if user_room:
            return {"message": "Вы уже являетесь участником этой комнаты."}

        # Если комнаты нет у пользователя, возвращаем сообщение
        return {"message": "Комната не найдена у пользователя."}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ошибка при проверке комнаты: {str(e)}"
        )


@router.post("/add")
async def add_room(
    room_id: str,  # ID комнаты, которую добавляем
    payload: TokenPayload = Depends(security.access_token_required),
    db: AsyncSession = Depends(get_db),
):
    user_id = payload.sub

    try:
        # Проверяем, существует ли комната в базе данных
        query = select(Room).filter(Room.room_id == room_id)
        result = await db.execute(query)
        room = result.scalar_one_or_none()

        # Если комната не существует
        if not room:
            raise HTTPException(status_code=404, detail="Комната не найдена.")

        # Проверяем, есть ли уже эта комната у текущего пользователя
        query = select(UserRooms).filter(
            UserRooms.user_id == user_id, UserRooms.room_uuid == room_id
        )
        result = await db.execute(query)
        user_room = result.scalar_one_or_none()

        # Если пользователь уже является участником этой комнаты
        if user_room:
            raise HTTPException(
                status_code=400, detail="Вы уже являетесь участником этой комнаты."
            )

        # Если все проверки прошли успешно, добавляем комнату пользователю
        user_room = UserRooms(room_uuid=room_id, user_id=user_id)
        db.add(user_room)
        await db.commit()
        await db.refresh(user_room)

        return {"message": f"Комната {room.name} успешно добавлена к вашим комнатам."}

    except Exception as e:
        await db.rollback()  # Откатываем изменения в случае ошибки
        raise HTTPException(
            status_code=500, detail=f"Ошибка при добавлении комнаты: {str(e)}"
        )


@router.get("/{channel_id}")
async def get_channel(channel_id: str, db: AsyncSession = Depends(get_db)):
    # Выполняем асинхронный запрос к базе данных
    result = await db.execute(select(Room).where(Room.room_id == channel_id))
    channel = result.scalars().first()

    # Если канал найден, возвращаем данные
    if channel:
        return {"channel_id": channel.room_id, "name": channel.name}

    # Если канал не найден, выбрасываем исключение 404
    raise HTTPException(status_code=404, detail="Канал не найден")


@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    payload: TokenPayload = Depends(security.access_token_required),
):
    # Проверяем, существует ли комната
    query = select(Room).filter(Room.room_id == room_id)
    result = await db.execute(query)
    room = result.scalars().first()

    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")

    # Проверяем, что пользователь состоит в комнате
    query = select(UserRooms).filter(
        UserRooms.room_uuid == room_id,
        UserRooms.user_id == payload.sub,
    )
    result = await db.execute(query)
    user_room = result.scalars().first()

    if not user_room:
        raise HTTPException(status_code=403, detail="Вы не состоите в этой комнате")

    # Удаляем связь пользователя с комнатой
    await db.execute(
        delete(UserRooms).where(
            UserRooms.room_uuid == room_id, UserRooms.user_id == payload.sub
        )
    )
    await db.commit()

    return {"message": "deleted"}
