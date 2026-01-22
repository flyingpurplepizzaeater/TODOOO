import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).parent

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/todo.db")

# SECRET_KEY must be persistent across restarts to maintain user sessions
# Generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # Fallback for development only - warns user
    import warnings
    warnings.warn(
        "SECRET_KEY not set in environment! Using random key - sessions will be lost on restart. "
        "Set SECRET_KEY in .env file for production.",
        RuntimeWarning
    )
    SECRET_KEY = secrets.token_urlsafe(32)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

# MinIO Object Storage Configuration
# Used for canvas asset uploads (images, files)
MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_PUBLIC_URL = os.getenv("MINIO_PUBLIC_URL", "http://localhost:9000")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "canvas-assets")
