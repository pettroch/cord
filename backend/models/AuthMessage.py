from pydantic import BaseModel


class AuthMessage(BaseModel):
    type: str
    token: str
