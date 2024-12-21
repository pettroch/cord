from pydantic import BaseModel
import uuid


class RoomResponse(BaseModel):
    room_uuid: uuid.UUID
    room_name: str
