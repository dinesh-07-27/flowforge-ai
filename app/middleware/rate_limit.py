from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as redis
from app.core.config import settings

# Initialize Redis client for async rate limiting
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_limit: int = 100, time_window: int = 60):
        super().__init__(app)
        self.rate_limit = rate_limit  # Max requests
        self.time_window = time_window # Per X seconds

    async def dispatch(self, request: Request, call_next):
        # We use the client's IP address as the identifier for rate limiting
        client_ip = request.client.host if request.client else "unknown"
        
        # Don't rate limit health checks or metrics
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        key = f"rate_limit:{client_ip}"
        
        try:
            # Increment the request count
            requests = await redis_client.incr(key)
            
            # If it's the first request, set the expiration window
            if requests == 1:
                await redis_client.expire(key, self.time_window)
                
            if requests > self.rate_limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests. Rate limit exceeded."}
                )
                
        except Exception as e:
            # If Redis fails, we should fail open so we don't block legitimate traffic
            pass

        return await call_next(request)
