"""
DataSense — Agentic EDA Pipeline
FastAPI Backend — Main Entry Point
"""

import os
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.upload import router as upload_router
from routes.analyze import router as analyze_router
from routes.export import router as export_router

# Load environment variables
load_dotenv()

# Initialize Sentry (crash monitoring)
sentry_dsn = os.getenv("SENTRY_DSN_BACKEND", "")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# Initialize FastAPI app
app = FastAPI(
    title="DataSense API",
    description="Agentic EDA Pipeline — Turn raw data into analyst-grade insights",
    version="1.0.0",
)

# Configure CORS
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router, prefix="/api")
app.include_router(analyze_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "DataSense API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
