from sqlalchemy.ext.asyncio import AsyncSession
from app.workflows.models import Workflow
from app.executions.models import ExecutionLog, ExecutionState
from app.workers.tasks import execute_workflow_task

async def dispatch_workflow(workflow_id: int, trigger_payload: dict, db: AsyncSession) -> ExecutionLog:
    """
    Creates an ExecutionLog in PENDING state and pushes a message to RabbitMQ/Celery
    """
    execution = ExecutionLog(
        workflow_id=workflow_id,
        status=ExecutionState.PENDING,
        trigger_payload=trigger_payload
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    # Dispatch to Celery
    execute_workflow_task.delay(execution.id)

    return execution
