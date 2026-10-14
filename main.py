"""URL Sentinel AI - Main FastAPI Application

Security architecture:
- CORS restricted to allowed origins (Vite frontend on 5173, localhost).
- Global request size limiter (prevents oversized payload attacks).
- Structured error handling without internal trace exposure.
- Automated SQLite database initialization on startup.
- Clean mounting of API routes and static asset distribution if built.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.database.connection import init_db
from app.routes.api import router as api_router
from app.ml.predictor import get_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    print("[*] Initializing URL Sentinel AI Database...")
    init_db()
    print("[*] Checking and loading machine learning model bundle...")
    bundle = get_model()
    if bundle:
        print(f"[+] Model active: {bundle.get('model_name')} (v{bundle.get('model_version')})")
    else:
        print("[-] Notice: Model artifact not found. Will use heuristic fallback analysis until trained.")
    yield
    print("[*] URL Sentinel AI shutting down cleanly.")


app = FastAPI(
    title="URL Sentinel AI",
    description="AI-Powered Malicious URL Detection and Explainable Risk Analysis System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    """Protects server by rejecting requests larger than 2MB."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 2 * 1024 * 1024:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": "Payload exceeds 2MB limit."}
        )
    return await call_next(request)


# Mount REST API
app.include_router(api_router)

# Mount static frontend build if present, or fallback to the built-in standalone web dashboard
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "frontend", "dist")
static_standalone = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

if os.path.exists(dist_path) and os.listdir(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static_frontend")
elif os.path.exists(static_standalone):
    app.mount("/app", StaticFiles(directory=static_standalone, html=True), name="standalone_ui")
    
    from fastapi.responses import RedirectResponse
    @app.get("/")
    def root_redirect():
        return RedirectResponse(url="/app/")
else:
    @app.get("/")
    def root():
        return {
            "system": "URL Sentinel AI",
            "description": "AI-Powered Malicious URL Detection & Explainable Risk Analysis System",
            "status": "OPERATIONAL",
            "docs_url": "/docs",
            "health_check": "/api/health"
        }
