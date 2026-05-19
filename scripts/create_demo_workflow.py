import asyncio
import sys
import os

# Adjust path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.users.models import User
from app.workflows.models import Workflow, WorkflowStep
from app.executions.models import ExecutionLog, ExecutionState

async def main():
    print("🚀 Auto-provisioning a permanent interactive workflow in your dashboard...")
    
    async with AsyncSessionLocal() as db:
        # 1. Fetch user dineshreddykondur@gmail.com
        res = await db.execute(select(User).where(User.email == "dineshreddykondur@gmail.com"))
        user = res.scalar_one_or_none()
        
        if not user:
            print("❌ Error: User dineshreddykondur@gmail.com not found in database. Please register first!")
            return
            
        print(f"Found active Admin user account (ID: {user.id})")

        # 2. Check if the demo workflow already exists to prevent duplication
        wf_name = "Bulk Invoice Processing & AI Email Dispatcher"
        wf_res = await db.execute(
            select(Workflow).where(Workflow.user_id == user.id, Workflow.name == wf_name)
        )
        existing_wf = wf_res.scalar_one_or_none()
        
        if existing_wf:
            print("💡 Demo workflow already exists in your dashboard! Skipping creation.")
            return

        # 3. Create the Premium Multi-Step Workflow
        workflow = Workflow(
            name=wf_name,
            description="Enterprise AI automation that extracts billing records and automatically drafts client emails.",
            trigger_type="manual",
            user_id=user.id,
            is_active=True
        )
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)
        print(f"✅ Workflow created successfully (ID: {workflow.id})")

        # 4. Create the 2 AI processing steps
        step1 = WorkflowStep(
            workflow_id=workflow.id,
            step_order=1,
            action_type="ai_extract",
            action_config={
                "prompt": "Extract the billing details (Invoice #, Due Date, Total Amount) from: 'Invoice #INV-2026-0988, Total Due: $1,450.00, Date: May 17, 2026.'"
            }
        )
        
        step2 = WorkflowStep(
            workflow_id=workflow.id,
            step_order=2,
            action_type="ai_summarize",
            action_config={
                "prompt": "Write a highly professional thank-you email confirming receipt of the invoice."
            }
        )
        db.add(step1)
        db.add(step2)
        
        # 5. Pre-seed a clean completed execution so they instantly see charts on the Dashboard!
        execution = ExecutionLog(
            workflow_id=workflow.id,
            status=ExecutionState.COMPLETED,
            result_data={
                "steps": [
                    {
                        "step_id": 1,
                        "action_type": "ai_extract",
                        "status": "success",
                        "output": '{"invoice_number": "INV-2026-0988", "total_amount": 1450.00}'
                    },
                    {
                        "step_id": 2,
                        "action_type": "ai_summarize",
                        "status": "success",
                        "output": "Dear Client,\n\nWe have received your payment for Invoice INV-2026-0988 ($1,450.00). Thank you!\n\nBest regards,\nAccounting"
                    }
                ],
                "total_steps": 2,
                "system_node": "Celery-Worker-Main"
            }
        )
        db.add(execution)
        
        await db.commit()
        print("✅ Multi-step steps and completed execution logs seeded successfully!")
        print("\n🎉 Refresh your dashboard! You can now edit, run, and view this workflow in the browser.")

if __name__ == "__main__":
    asyncio.run(main())
