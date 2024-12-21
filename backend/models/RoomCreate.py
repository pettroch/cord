from pydantic import BaseModel


class RoomCreate(BaseModel):
    room_name: str
