from fastapi import FastAPI
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.middleware.tracing import RequestTracingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.idempotency import IdempotencyMiddleware

from app.workflows.router import router as workflows_router
from app.triggers.router import router as triggers_router
from app.executions.router import router as executions_router
from app.ws.router import router as ws_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI Workflow Automation Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Middlewares are executed bottom-up (last added = first executed)
app.add_middleware(RequestTracingMiddleware)
app.add_middleware(IdempotencyMiddleware)
app.add_middleware(RateLimitMiddleware, rate_limit=100, time_window=60)

# REST API routers
app.include_router(workflows_router, prefix=settings.API_V1_STR)
app.include_router(triggers_router, prefix=settings.API_V1_STR)
app.include_router(executions_router, prefix=settings.API_V1_STR)

# WebSocket router (no prefix — WS routes use their own path)
app.include_router(ws_router, prefix=settings.API_V1_STR)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
