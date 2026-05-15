import uuid
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.observability.logging import logger
from app.observability.metrics import HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS

class RequestTracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        
        start_time = time.time()
        
        logger.info(f"Incoming request {request.method} {request.url.path} [ID: {request_id}]")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        logger.info(f"Completed request {request.method} {request.url.path} [ID: {request_id}] in {process_time:.4f}s with status {response.status_code}")
        
        # Prometheus Metrics
        HTTP_REQUESTS_TOTAL.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code
        ).inc()
        
        HTTP_REQUEST_DURATION_SECONDS.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(process_time)
        
        return response
