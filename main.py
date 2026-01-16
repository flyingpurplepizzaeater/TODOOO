from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from config import SECRET_KEY, ALGORITHM
from database import init_db, async_session
from sqlalchemy import select
from models import User, TeamMember
from websocket import manager
from routers import auth, teams, lists, todos

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Collaborative TODO", lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Include API routers
app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(lists.router)
app.include_router(todos.router)

# Page routes
@app.get("/")
async def index():
    return RedirectResponse(url="/login")

@app.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register")
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/dashboard")
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": None})

@app.get("/team/{team_id}")
async def team_page(request: Request, team_id: int):
    return templates.TemplateResponse("team.html", {"request": request, "user": None})

# Health check
@app.get("/health")
async def health():
    return {"status": "ok"}

# WebSocket endpoint
@app.websocket("/ws/teams/{team_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    team_id: int,
    token: str = Query(...)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        await websocket.close(code=4001)
        return

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
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, team_id, user_id, user.username)
        await manager.broadcast_offline(team_id, user_id, user.username)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
