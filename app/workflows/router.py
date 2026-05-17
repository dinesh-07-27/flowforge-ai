from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete
from typing import List
from app.core.database import get_db
from app.workflows.models import Workflow, WorkflowStep
from app.workflows.schemas import WorkflowCreate, WorkflowResponse

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow_in: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    user_id = 1 
    db_workflow = Workflow(
        user_id=user_id,
        name=workflow_in.name,
        description=workflow_in.description,
        trigger_type=workflow_in.trigger_type
    )
    db.add(db_workflow)
    await db.commit()
    await db.refresh(db_workflow)

    for step in workflow_in.steps:
        db_step = WorkflowStep(
            workflow_id=db_workflow.id,
            step_order=step.step_order,
            action_type=step.action_type,
            action_config=step.action_config
        )
        db.add(db_step)
    
    await db.commit()
    result = await db.execute(
        select(Workflow).where(Workflow.id == db_workflow.id).options(selectinload(Workflow.steps))
    )
    return result.scalar_one()

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).options(selectinload(Workflow.steps)).order_by(Workflow.created_at.desc()))
    return result.scalars().all()

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id).options(selectinload(Workflow.steps))
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    # Idempotent delete: if it's already gone, we don't care
    await db.execute(delete(WorkflowStep).where(WorkflowStep.workflow_id == workflow_id))
    await db.execute(delete(Workflow).where(Workflow.id == workflow_id))
    await db.commit()
    return None

@router.patch("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: int, workflow_in: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id).options(selectinload(Workflow.steps))
    )
    db_workflow = result.scalar_one_or_none()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    for key, value in workflow_in.items():
        if hasattr(db_workflow, key):
            setattr(db_workflow, key, value)
    
    await db.commit()
    await db.refresh(db_workflow)
    return db_workflow

@router.post("/{workflow_id}/run", status_code=status.HTTP_202_ACCEPTED)
async def run_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    db_workflow = result.scalar_one_or_none()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Auto-activate the workflow if it was paused
    db_workflow.is_active = True
    
    # Create the execution log entry first (PENDING state)
    from app.executions.models import ExecutionLog, ExecutionState
    import datetime
    from app.workers.tasks import process_workflow_task
    
    log = ExecutionLog(
        workflow_id=workflow_id,
        status=ExecutionState.PENDING,
        started_at=datetime.datetime.utcnow(),
        trigger_payload={"source": "UI_MANUAL_TRIGGER"}
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    
    # Dispatch to Celery worker
    process_workflow_task.delay(log.id)
    
    return {"status": "triggered", "execution_id": log.id}
