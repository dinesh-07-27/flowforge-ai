import asyncio
import datetime
from celery import shared_task
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.users.models import User
from app.workflows.models import Workflow, WorkflowStep
from app.executions.models import ExecutionLog, ExecutionState
from app.workers.celery_app import celery_app

async def _process_workflow(execution_id: int):
    async with AsyncSessionLocal() as db:
        # 1. Fetch execution log and workflow
        result = await db.execute(
            select(ExecutionLog)
            .where(ExecutionLog.id == execution_id)
            .options(selectinload(ExecutionLog.workflow).selectinload(Workflow.steps))
        )
        execution = result.scalar_one_or_none()
        if not execution:
            return

        execution.status = ExecutionState.RUNNING
        await db.commit()

        workflow = execution.workflow
        results = []
        
        try:
            from app.core.ai import ai_engine
            
            # 2. Process each step
            for step in sorted(workflow.steps, key=lambda x: x.step_order):
                # Build a dynamic prompt based on step configuration
                prompt = step.action_config.get("prompt", f"Perform {step.action_type} for: ")
                # If there was a previous step, we can pass its output (Simple context chaining)
                if results:
                    prompt += f"\nContext from previous step: {results[-1]['output']}"
                
                model = step.action_config.get("model", "llama-3.3-70b-versatile")
                
                # REAL AI CALL
                ai_output = await ai_engine.generate_completion(prompt, model=model)
                
                step_result = {
                    "step_id": step.id,
                    "action_type": step.action_type,
                    "status": "success",
                    "output": ai_output,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
                results.append(step_result)

            # 3. Finalize execution
            execution.status = ExecutionState.COMPLETED
            execution.result_data = {
                "steps": results,
                "total_steps": len(results),
                "system_node": "Groq-Llama-Worker-01"
            }
            execution.completed_at = datetime.datetime.utcnow()
            
        except Exception as e:
            execution.status = ExecutionState.FAILED
            execution.error_message = str(e)
            
        await db.commit()

@celery_app.task(name="process_workflow_task")
def process_workflow_task(execution_id: int):
    # Celery is synchronous, so we run our async logic using asyncio
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_process_workflow(execution_id))
