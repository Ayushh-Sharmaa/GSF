import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import credits, sessions, ventures

load_dotenv()

app = FastAPI(title="GSF Python Backend", version="1.0.0")

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Read allowed origins from env — supports comma-separated list for staging/prod
_raw_origins = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
# Each router declares its own prefix (e.g. /api/sessions) — do NOT add another
# prefix here or routes will be double-prefixed (/api/v1/api/sessions/ = broken).
app.include_router(sessions.router)
app.include_router(credits.router)
app.include_router(ventures.router)


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


# ─── Global error handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Never expose stack traces to client in production
    is_dev = os.getenv("ENV", "production") == "development"
    detail = str(exc) if is_dev else "Internal server error"
    return JSONResponse(status_code=500, content={"error": detail})
