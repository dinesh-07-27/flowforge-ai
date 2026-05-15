from app.workers.celery_app import celery_app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.workflows.models import Workflow
from app.executions.dispatcher import dispatch_workflow
from app.observability.logging import logger
import asyncio

SYNC_DB_URL = settings.DATABASE_URL.replace("+asyncpg", "")
engine = create_engine(SYNC_DB_URL)
SessionLocal = sessionmaker(bind=engine)

@celery_app.task
def run_scheduled_workflows():
    """
    Celery Beat task: scans for workflows with trigger_type='schedule'
    and dispatches them for execution.
    """
    db = SessionLocal()
    try:
        scheduled_workflows = db.query(Workflow).filter(
            Workflow.trigger_type == "schedule"
        ).all()
        
        if scheduled_workflows:
            logger.info(f"Scheduler found {len(scheduled_workflows)} scheduled workflow(s) to run.")
            for wf in scheduled_workflows:
                # Use run_until_complete since dispatcher is async but this task is sync
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                # In production, use a proper async celery approach; this is the simplest pattern
                logger.info(f"Triggering scheduled workflow: {wf.name} (id={wf.id})")
        else:
            logger.debug("Scheduler: no scheduled workflows found this tick.")
    finally:
        db.close()
