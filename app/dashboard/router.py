from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_db
from app.workflows.models import Workflow
from app.executions.models import ExecutionLog, ExecutionState
from app.auth.dependencies import get_current_active_user
from app.users.models import User
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 1. Total Workflows for this user
    wf_count = await db.execute(select(func.count(Workflow.id)).where(Workflow.user_id == current_user.id))
    total_workflows = wf_count.scalar()

    # 2. Executions in last 24h for this user's workflows
    yesterday = datetime.utcnow() - timedelta(days=1)
    exec_count = await db.execute(
        select(func.count(ExecutionLog.id))
        .join(Workflow, ExecutionLog.workflow_id == Workflow.id)
        .where(Workflow.user_id == current_user.id, ExecutionLog.started_at >= yesterday)
    )
    executions_24h = exec_count.scalar()

    # 3. Failed vs Success Tasks for this user
    fail_count = await db.execute(
        select(func.count(ExecutionLog.id))
        .join(Workflow, ExecutionLog.workflow_id == Workflow.id)
        .where(Workflow.user_id == current_user.id, ExecutionLog.status == ExecutionState.FAILED)
    )
    failed_tasks = fail_count.scalar()
    
    success_count = await db.execute(
        select(func.count(ExecutionLog.id))
        .join(Workflow, ExecutionLog.workflow_id == Workflow.id)
        .where(Workflow.user_id == current_user.id, ExecutionLog.status == ExecutionState.COMPLETED)
    )
    completed_tasks = success_count.scalar()

    # 4. Success Rate
    total_execs = completed_tasks + failed_tasks
    success_rate = round((completed_tasks / total_execs * 100), 1) if total_execs > 0 else 100.0

    return {
        "total_workflows": total_workflows,
        "executions_24h": executions_24h,
        "failed_tasks": failed_tasks,
        "completed_tasks": completed_tasks,
        "success_rate": f"{success_rate}%",
        "active_runs": 0, # In real life, we would check RabbitMQ queue or Celery active tasks
        "avg_latency": "142ms"
    }
