from app.workers.celery_app import celery_app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.executions.models import ExecutionLog, ExecutionState
from app.workflows.models import WorkflowStep
from app.actions.registry import registry

SYNC_DB_URL = settings.DATABASE_URL.replace("+asyncpg", "")
engine = create_engine(SYNC_DB_URL)
SessionLocal = sessionmaker(bind=engine)

@celery_app.task(bind=True, max_retries=3)
def execute_workflow_task(self, execution_id: int):
    """
    Dynamically executes all steps in a workflow using the Action Registry.
    """
    db = SessionLocal()
    try:
        execution = db.query(ExecutionLog).filter(ExecutionLog.id == execution_id).first()
        if not execution:
            return
            
        execution.status = ExecutionState.RUNNING
        db.commit()
        
        # Payload accumulates state across steps
        current_payload = execution.trigger_payload or {}
        
        # Fetch workflow steps in order
        steps = db.query(WorkflowStep).filter(
            WorkflowStep.workflow_id == execution.workflow_id
        ).order_by(WorkflowStep.step_order).all()
        
        executed_steps = []
        
        for step in steps:
            # Get the action function from our registry
            action_func = registry.get_action(step.action_type)
            
            # Execute the action
            step_result = action_func(config=step.action_config, payload=current_payload)
            
            # Merge result into payload for the next step
            current_payload.update({f"step_{step.step_order}_result": step_result})
            executed_steps.append(step.action_type)
        
        execution.status = ExecutionState.COMPLETED
        execution.result_data = {
            "final_payload": current_payload,
            "steps_executed": executed_steps
        }
        db.commit()
        
    except Exception as exc:
        execution = db.query(ExecutionLog).filter(ExecutionLog.id == execution_id).first()
        if execution:
            execution.status = ExecutionState.FAILED
            execution.error_message = str(exc)
            db.commit()
            
        # Exponential backoff retry
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
        
    finally:
        db.close()
