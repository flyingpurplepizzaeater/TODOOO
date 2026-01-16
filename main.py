from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from database import init_db
import models  # Import models to register them with Base.metadata
from routers import auth, teams, lists

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Collaborative TODO", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(lists.router)

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
