# FlowForge AI

> **Production-grade AI Workflow Automation Platform**  
> Built with FastAPI · PostgreSQL · RabbitMQ · Celery · Redis · MinIO · Next.js · Docker · AWS

---

## What Is FlowForge AI?

FlowForge AI is a distributed, AI-powered workflow automation backend — similar to Zapier or n8n but engineered from the ground up with production-grade backend principles.

Users define multi-step workflows composed of a **Trigger** and a chain of **Actions**:

```
Webhook Trigger
    ↓
AI Summarization (Groq / Llama-3)
    ↓
AI Classification (Structured JSON Output)
    ↓
HTTP Webhook Action (Send to Discord / Slack / etc.)
```

The platform executes all steps **asynchronously** via a distributed queue, tracks every execution through a full state machine, and streams live status updates to the frontend via WebSocket.

---

## Architecture

```
┌─────────────┐     POST /triggers/     ┌──────────────────┐
│   Next.js   │ ─────────────────────▶  │    FastAPI API    │
│  Dashboard  │ ◀─────────────────────  │  (async + auth)   │
└─────────────┘   WebSocket /ws/exec/   └────────┬─────────┘
                                                  │ dispatch()
                                        ┌─────────▼─────────┐
                                        │     RabbitMQ       │
                                        └─────────┬─────────┘
                                                  │ consume
                                        ┌─────────▼─────────┐
                                        │   Celery Workers   │
                                        │  AI Orchestration  │
                                        │  (Groq / Llama-3)  │
                                        └─────────┬─────────┘
                                                  │
                          ┌───────────────────────┼──────────────────────┐
                          │                       │                      │
                ┌─────────▼──────┐    ┌──────────▼──────┐    ┌─────────▼──────┐
                │   PostgreSQL   │    │     Redis        │    │   MinIO / S3   │
                │  (state store) │    │ (cache + limits) │    │  (documents)   │
                └────────────────┘    └─────────────────┘    └────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI, Pydantic v2, Python 3.11 |
| Database | PostgreSQL 15, SQLAlchemy 2.0 (async), Alembic |
| Queue | RabbitMQ, Celery 5 |
| Cache | Redis 7 |
| AI Layer | Groq API (Llama-3), Custom Abstraction, Structured JSON |
| Storage | MinIO (local) / AWS S3 (production) |
| Scheduler | Celery Beat (cron-based triggers) |
| Frontend | Next.js 15, TypeScript, TailwindCSS, Framer Motion |
| Observability | Prometheus, Custom Request Tracing Middleware |
| Security | JWT Auth, Redis Rate Limiting, Idempotency Keys, RBAC |
| Testing | Pytest, pytest-asyncio, In-memory SQLite fixtures |
| DevOps | Docker, Docker Compose, GitHub Actions CI/CD |
| Cloud | AWS EC2, RDS, S3 |

---

## Getting Started (Local)

### Prerequisites
- Docker Desktop installed and running
- A free [Groq API Key](https://console.groq.com)

### 1. Clone & Configure

```bash
git clone https://github.com/dinesh-07-27/flowforge-ai.git
cd flowforge-ai
cp .env.example .env
# Edit .env and add your GROQ_API_KEY and SECRET_KEY
```

### 2. Start All Services

```bash
make up
# or: docker-compose up -d --build
```

This starts: FastAPI · PostgreSQL · RabbitMQ · Redis · MinIO · Celery Worker · Celery Beat · Next.js · Nginx

### 3. Run Database Migrations

```bash
make migrate
# or: docker-compose exec api alembic upgrade head
```

### 4. Access the Platform

| Service | URL |
|---|---|
| **Dashboard (Frontend)** | http://localhost |
| **API Docs (Swagger)** | http://localhost/docs |
| **RabbitMQ Console** | http://localhost:15672 (guest/guest) |
| **MinIO Console** | http://localhost:9001 (minioadmin/minioadmin) |
| **Prometheus Metrics** | http://localhost:8000/metrics |

---

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/workflows/` | Create a multi-step AI workflow |
| `GET` | `/api/v1/workflows/` | List all workflows |
| `POST` | `/api/v1/triggers/document-upload/{id}` | Upload document & trigger workflow |
| `GET` | `/api/v1/executions/` | List all execution logs |
| `POST` | `/api/v1/executions/{id}/replay` | Replay a previous execution |
| `WS` | `/api/v1/ws/executions/{id}` | Live execution status stream |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/health` | Health check |

---

## Example Workflow

Create a workflow via the API:

```json
POST /api/v1/workflows/
{
  "name": "Invoice AI Processor",
  "trigger_type": "document_upload",
  "steps": [
    { "step_order": 1, "action_type": "ai_summarize", "action_config": {} },
    { "step_order": 2, "action_type": "ai_classify", "action_config": {} }
  ]
}
```

Then upload a document to trigger it:

```bash
curl -X POST http://localhost/api/v1/triggers/document-upload/1 \
  -F "file=@invoice.pdf"
```

Track execution in real-time via WebSocket or hit `GET /api/v1/executions/`.

---

## Running Tests

```bash
make test
# or: docker-compose exec api pytest -v
```

---

## CI/CD Pipeline

Every `git push` to `main`:
1. **GitHub Actions** runs the full `pytest` suite
2. If all tests pass, it SSHes into EC2 and runs `docker-compose up --build`
3. Database migrations run automatically via `alembic upgrade head`

---

## Project Structure

```
flowforge-ai/
├── app/
│   ├── ai/              # Custom Groq abstraction, prompts, schemas
│   ├── actions/         # Pluggable action registry
│   ├── auth/            # JWT + RBAC dependencies
│   ├── core/            # Config, DB session, base models
│   ├── executions/      # State machine, dispatcher, replay
│   ├── middleware/       # Rate limiting, idempotency, request tracing
│   ├── observability/   # Structured logging, Prometheus metrics
│   ├── scheduler/       # Celery Beat cron tasks
│   ├── storage/         # MinIO/S3 abstraction
│   ├── triggers/        # Webhook + document upload triggers
│   ├── users/           # User models
│   ├── workers/         # Celery app + task orchestrator
│   ├── workflows/       # Models, schemas, CRUD router
│   └── ws/              # WebSocket live updates
├── frontend/            # Next.js 15 TypeScript Dashboard
├── migrations/          # Alembic migration scripts
├── nginx/               # Nginx reverse proxy config
├── scripts/             # AWS infra bootstrap
├── tests/               # Pytest async test suite
├── .github/workflows/   # CI/CD pipelines
├── docker-compose.yml
└── Makefile
```

---

## License

MIT — Built by [K. Dinesh Reddy](https://github.com/dinesh-07-27)
