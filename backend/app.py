import uvicorn
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.init_db import init_db
from routers import register, login, room, check_auth


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Разрешенные источники
    allow_credentials=True,
    allow_methods=["*"],  # Разрешить все HTTP методы
    allow_headers=["*"],  # Разрешить все заголовки
)


app.include_router(register.router, prefix="/api/register")
app.include_router(login.router, prefix="/api/login")
app.include_router(room.router, prefix="/api/rooms")
app.include_router(check_auth.router, prefix="/api/check_auth")


if __name__ == "__main__":
    asyncio.run(init_db())
    uvicorn.run("app:app", port=5000, log_level="info")
