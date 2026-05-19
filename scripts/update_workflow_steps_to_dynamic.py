import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.workflows.models import Workflow, WorkflowStep
# Import execution models to prevent SQLAlchemy clsregistry key errors
from app.executions.models import ExecutionLog

async def main():
    print("🔄 Updating seeded workflows to be premium 3-step dynamic pipelines...")
    async with AsyncSessionLocal() as db:
        # Fetch target workflow
        wf_res = await db.execute(
            select(Workflow).where(Workflow.name == "Bulk Invoice Processing & AI Email Dispatcher")
        )
        workflows = wf_res.scalars().all()
        
        if not workflows:
            print("❌ No seeded demo workflows found to update.")
            return

        for wf in workflows:
            print(f"Found workflow: {wf.name} (ID: {wf.id})")
            
            # Fetch or Create Step 1
            step1_res = await db.execute(
                select(WorkflowStep).where(WorkflowStep.workflow_id == wf.id, WorkflowStep.step_order == 1)
            )
            step1 = step1_res.scalar_one_or_none()
            if step1:
                step1.action_type = "ai_extract"
                step1.action_config = {
                    "prompt": "Extract the customer name, order/invoice number, and main issue/complaint from this raw document:\n\n{{trigger.content}}"
                }
                db.add(step1)
                print(f"  ✅ Step 1 updated (AI Extraction).")
                
            # Fetch or Create Step 2
            step2_res = await db.execute(
                select(WorkflowStep).where(WorkflowStep.workflow_id == wf.id, WorkflowStep.step_order == 2)
            )
            step2 = step2_res.scalar_one_or_none()
            if step2:
                step2.action_type = "ai_summarize"
                step2.action_config = {
                    "prompt": "Write a highly professional, empathetic support email addressing the customer name and order number. Propose a mock solution and confirm we are resolving it immediately. Sign off the email professionally as 'The FlowForge Automation Team' on behalf of FlowForge AI, with no generic bracket placeholders like [Your Name] or [Company Name] at the bottom."
                }
                db.add(step2)
                print(f"  ✅ Step 2 updated (AI Draft Support Email).")

            # Fetch or Create Step 3
            step3_res = await db.execute(
                select(WorkflowStep).where(WorkflowStep.workflow_id == wf.id, WorkflowStep.step_order == 3)
            )
            step3 = step3_res.scalar_one_or_none()
            if not step3:
                step3 = WorkflowStep(
                    workflow_id=wf.id,
                    step_order=3,
                    action_type="email_dispatch",
                    action_config={}
                )
                db.add(step3)
                print(f"  ✅ Step 3 created (Simulated Transaction Dispatch).")
            else:
                step3.action_type = "email_dispatch"
                step3.action_config = {}
                db.add(step3)
                print(f"  ✅ Step 3 updated (Simulated Transaction Dispatch).")

        await db.commit()
        print("✨ Database successfully migrated to fully interactive 3-step pipelines!")

if __name__ == "__main__":
    asyncio.run(main())
