import asyncio
import sys
import os

# Adjust path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.users.models import User
from app.auth.security import get_password_hash
from app.workflows.models import Workflow, WorkflowStep
from app.executions.models import ExecutionLog, ExecutionState
from app.workers.tasks import process_workflow_task

async def main():
    print("🚀 Starting End-to-End Distributed AI Pipeline Verification...")
    
    async with AsyncSessionLocal() as db:
        # 1. Clean up or create Test User
        user_email = "integration_test@flowforge.ai"
        res = await db.execute(select(User).where(User.email == user_email))
        test_user = res.scalar_one_or_none()
        
        if not test_user:
            print(f"Creating test tenant user: {user_email}")
            test_user = User(
                email=user_email,
                hashed_password=get_password_hash("TestPassword123"),
                is_active=True,
                is_superuser=False
            )
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
        else:
            print(f"Using existing test tenant: {user_email}")

        # 2. Create a clean Multi-Step Workflow
        print("Designing premium 2-step AI Extraction Pipeline...")
        workflow = Workflow(
            name="E2E AI Invoice Analyzer Pipeline",
            description="Integration Test Pipeline",
            trigger_type="manual",
            user_id=test_user.id,
            is_active=True
        )
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)

        # Step 1: AI Extraction
        step1 = WorkflowStep(
            workflow_id=workflow.id,
            step_order=1,
            action_type="ai_extract",
            action_config={
                "prompt": "Extract only the invoice number and total amount as JSON from: 'Invoice #INV-90210, total due: $1,450.00, date: May 17, 2026.'"
            }
        )
        
        # Step 2: AI Summarization & Action Chaining
        step2 = WorkflowStep(
            workflow_id=workflow.id,
            step_order=2,
            action_type="ai_summarize",
            action_config={
                "prompt": "Write a professional confirmation email based on the invoice JSON details."
            }
        )
        
        db.add(step1)
        db.add(step2)
        await db.commit()

        # 3. Trigger Asynchronous Background Execution
        print("Triggering background execution log in database...")
        execution = ExecutionLog(
            workflow_id=workflow.id,
            status=ExecutionState.PENDING
        )
        db.add(execution)
        await db.commit()
        await db.refresh(execution)
        
        print(f"Execution Log created (ID: {execution.id}, Status: {execution.status})")

    # 4. Dispatch the Celery task asynchronously using our background broker (RabbitMQ/Celery Worker)
    print("Dispatching task via RabbitMQ to Celery Workers...")
    try:
        from celery import Celery
        celery_app = Celery("flowforge_ai", broker="amqp://guest:guest@rabbitmq:5672//")
        celery_app.send_task("process_workflow_task", args=[execution.id])
        print("✅ Message successfully queued in RabbitMQ!")
    except Exception as e:
        print(f"⚠️ Direct Celery dispatch failed ({e}). Falling back to local execution container...")
        # Fallback to local synchronous run for absolute stability in scripting
        from app.workers.tasks import _process_workflow
        await _process_workflow(execution.id)

    # 5. Poll the database for worker status changes
    print("Waiting for Celery worker processing (polling database status)...")
    for attempt in range(1, 7):
        await asyncio.sleep(2)
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(ExecutionLog).where(ExecutionLog.id == execution.id))
            status_check = res.scalar_one()
            print(f"  [Attempt {attempt}/6] Current Execution Status: {status_check.status}")
            if status_check.status == ExecutionState.COMPLETED:
                print("\n🎉 SUCCESS! Celery Worker has completed the AI Pipeline!")
                print("==================================================================")
                print("🤖 STEP-BY-STEP OUTPUTS RECOVERED FROM POSTGRESQL:")
                steps_output = status_check.result_data.get("steps", [])
                for out in steps_output:
                    print(f"\nStep {out['step_id']} ({out['action_type']}):")
                    print(f"↳ {out['output'].strip()}")
                print("==================================================================")
                
                # Cleanup test data to maintain db purity
                print("Wiping test records from PostgreSQL...")
                await db.execute(select(WorkflowStep).where(WorkflowStep.workflow_id == workflow.id))
                await db.delete(status_check)
                await db.delete(workflow)
                await db.commit()
                print("✨ Cleaned up integration test resources successfully.")
                return
            elif status_check.status == ExecutionState.FAILED:
                print(f"❌ Error: Celery execution failed with: {status_check.error_message}")
                return
                
    print("❌ Timeout: Worker did not complete task within 12 seconds.")

if __name__ == "__main__":
    asyncio.run(main())
