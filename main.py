from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from jose import JWTError, jwt
from sqlalchemy import select
from database import init_db, async_session
from config import SECRET_KEY, ALGORITHM
from models import User, TeamMember
import models  # Import models to register them with Base.metadata
from routers import auth, teams, lists, todos
from websocket import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Collaborative TODO", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(lists.router)
app.include_router(todos.router)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.websocket("/ws/teams/{team_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    team_id: int,
    token: str = Query(...)
):
    # Verify token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        await websocket.close(code=4001)
        return

    # Verify team membership
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4001)
            return

        result = await db.execute(
            select(TeamMember).where(
                TeamMember.user_id == user_id,
                TeamMember.team_id == team_id
            )
        )
        if not result.scalar_one_or_none():
            await websocket.close(code=4003)
            return

    await manager.connect(websocket, team_id, user_id, user.username)

    try:
        while True:
            data = await websocket.receive_text()
            # Could handle client messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, team_id, user_id, user.username)
        await manager.broadcast_offline(team_id, user_id, user.username)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
