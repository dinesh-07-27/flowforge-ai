from prometheus_client import Counter, Histogram

# Track total HTTP requests
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"]
)

# Track API Latency
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)

# Track Workflow Executions
WORKFLOW_EXECUTIONS_TOTAL = Counter(
    "workflow_executions_total",
    "Total number of workflow executions",
    ["status"] # COMPLETED, FAILED, etc.
)
