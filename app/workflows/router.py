from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.workflows.models import Workflow, WorkflowStep
from app.workflows.schemas import WorkflowCreate, WorkflowResponse

router = APIRouter(prefix="/workflows", tags=["Workflows"])

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow_in: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    # Note: In a real app, user_id comes from the JWT token via Depends(get_current_user)
    # Hardcoding to 1 for this MVP Phase 2 setup
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
    
    # Reload workflow with steps
    result = await db.execute(
        select(Workflow).where(Workflow.id == db_workflow.id).options(selectinload(Workflow.steps))
    )
    return result.scalar_one()

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).options(selectinload(Workflow.steps)))
    return result.scalars().all()
