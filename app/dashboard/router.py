from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_db
from app.workflows.models import Workflow
from app.executions.models import ExecutionLog, ExecutionState
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # 1. Total Workflows
    wf_count = await db.execute(select(func.count(Workflow.id)))
    total_workflows = wf_count.scalar()

    # 2. Executions in last 24h
    yesterday = datetime.utcnow() - timedelta(days=1)
    exec_count = await db.execute(
        select(func.count(ExecutionLog.id)).where(ExecutionLog.started_at >= yesterday)
    )
    executions_24h = exec_count.scalar()

    # 3. Failed Tasks (Total)
    fail_count = await db.execute(
        select(func.count(ExecutionLog.id)).where(ExecutionLog.state == ExecutionState.FAILED)
    )
    failed_tasks = fail_count.scalar()

    return {
        "total_workflows": total_workflows,
        "executions_24h": executions_24h,
        "failed_tasks": failed_tasks,
        "avg_latency": "142ms" # Mock for now, requires deeper timing logs
    }
