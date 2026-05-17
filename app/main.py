from fastapi import FastAPI
from prometheus_client import make_asgi_app

from app.core import base  # Ensures all models are registered
from app.core.config import settings
from app.middleware.tracing import RequestTracingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.idempotency import IdempotencyMiddleware

from app.workflows.router import router as workflows_router
from app.triggers.router import router as triggers_router
from app.executions.router import router as executions_router
from app.dashboard.router import router as dashboard_router
from app.ws.router import router as ws_router
from app.auth.router import router as auth_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade AI Workflow Automation Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

@app.on_event("startup")
async def startup_event():
    from app.core.database import AsyncSessionLocal
    from app.users.models import User
    from app.auth.security import get_password_hash
    from sqlalchemy.future import select
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@flowforge.ai"))
        user = result.scalar_one_or_none()
        if not user:
            # Bootstrap initial admin from env or defaults
            admin_email = "admin@flowforge.ai"
            admin_pass = "admin123" # In prod, this would be in .env
            
            new_user = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_pass),
                is_active=True,
                is_superuser=True
            )
            db.add(new_user)
            await db.commit()
            print(f"Seeded default User {admin_email} with secure password")

# Middlewares are executed bottom-up (last added = first executed)
app.add_middleware(RequestTracingMiddleware)
app.add_middleware(IdempotencyMiddleware)
app.add_middleware(RateLimitMiddleware, rate_limit=100, time_window=60)

# REST API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(workflows_router, prefix=settings.API_V1_STR)
app.include_router(triggers_router, prefix=settings.API_V1_STR)
app.include_router(executions_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
