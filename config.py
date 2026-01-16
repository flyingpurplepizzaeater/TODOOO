import secrets
from pathlib import Path

BASE_DIR = Path(__file__).parent

DATABASE_URL = f"sqlite+aiosqlite:///{BASE_DIR}/todo.db"

SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
