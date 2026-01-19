from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from config import SECRET_KEY, ALGORITHM
from database import init_db, async_session
from sqlalchemy import select
from models import User, TeamMember
from websocket import manager
from routers import auth, teams, lists, todos
from rate_limit import limiter
from canvas import BoardPersistence, RoomManager, handle_canvas_websocket

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Initialize canvas room manager
    persistence = BoardPersistence(debounce_seconds=5.0)
    room_manager = RoomManager(persistence)
    await room_manager.start()
    app.state.room_manager = room_manager
    yield
    # Cleanup on shutdown
    await room_manager.stop()

app = FastAPI(title="Collaborative TODO", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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


@app.websocket("/ws/canvas/{board_id}")
async def canvas_websocket_endpoint(
    websocket: WebSocket,
    board_id: str,
    token: str = Query(...)
):
    """
    WebSocket endpoint for canvas CRDT synchronization.

    Implements Yjs sync protocol for real-time collaborative editing.
    Requires JWT token and board access permission.

    SYNC-05 compliance: Every connection receives full current state,
    enabling seamless reconnection after network issues.
    """
    await handle_canvas_websocket(
        websocket,
        board_id,
        token,
        websocket.app.state.room_manager
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
