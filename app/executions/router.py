from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from app.core.database import get_db
from app.executions.models import ExecutionLog, ExecutionState
from app.executions.dispatcher import dispatch_workflow
from app.auth.dependencies import get_current_active_user
from app.users.models import User
from app.workflows.models import Workflow

router = APIRouter(prefix="/executions", tags=["Executions"])

@router.get("/")
async def list_executions(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """List execution logs for the current user's workflows only."""
    result = await db.execute(
        select(ExecutionLog)
        .join(Workflow, ExecutionLog.workflow_id == Workflow.id)
        .where(Workflow.user_id == current_user.id)
        .order_by(ExecutionLog.started_at.desc())
    )
    executions = result.scalars().all()
    return executions

@router.get("/{execution_id}")
async def get_execution(execution_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Get details of a single execution, scoped to the current user."""
    result = await db.execute(
        select(ExecutionLog)
        .join(Workflow, ExecutionLog.workflow_id == Workflow.id)
        .where(ExecutionLog.id == execution_id, Workflow.user_id == current_user.id)
    )
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution

@router.post("/{execution_id}/replay")
async def replay_execution(execution_id: int, db: AsyncSession = Depends(get_db)):
    """
    EXECUTION REPLAY: Re-runs a previously failed or completed workflow
    using the exact same trigger payload that started it the first time.
    This is a senior-level reliability feature.
    """
    result = await db.execute(
        select(ExecutionLog).where(ExecutionLog.id == execution_id)
    )
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Original execution not found")
    
    # Dispatch a fresh execution with the same payload
    new_execution = await dispatch_workflow(
        workflow_id=original.workflow_id,
        trigger_payload=original.trigger_payload or {},
        db=db
    )
    
    return {
        "message": "Execution replayed successfully",
        "original_execution_id": execution_id,
        "new_execution_id": new_execution.id
    }
