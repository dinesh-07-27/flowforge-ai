import asyncio
import datetime
from celery import shared_task
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal, engine
from app.users.models import User, SystemSetting
from app.workflows.models import Workflow, WorkflowStep
from app.executions.models import ExecutionLog, ExecutionState
from app.workers.celery_app import celery_app

async def _process_workflow(execution_id: int):
    # Dispose inherited database connection pool to prevent asyncpg fork corruption
    await engine.dispose()
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
            
            # Retrieve dynamic API key if configured
            groq_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "groq_api_key"))
            groq_setting = groq_res.scalar_one_or_none()
            db_api_key = groq_setting.value if (groq_setting and groq_setting.value.strip()) else None

            # 2. Process each step
            for step in sorted(workflow.steps, key=lambda x: x.step_order):
                # Build a dynamic prompt based on step configuration
                prompt = step.action_config.get("prompt", f"Perform {step.action_type} for: ")
                
                # Dynamic Variable Substitution: Replace {{trigger.key}} with actual payload values
                if execution.trigger_payload and isinstance(execution.trigger_payload, dict):
                    for k, v in execution.trigger_payload.items():
                        placeholder = f"{{{{trigger.{k}}}}}"
                        if placeholder in prompt:
                            prompt = prompt.replace(placeholder, str(v))
                
                if step.action_type == "email_dispatch":
                    import uuid
                    import smtplib
                    import os
                    from email.mime.text import MIMEText
                    from email.mime.multipart import MIMEMultipart

                    recipient = "customer@example.com"
                    if execution.trigger_payload and isinstance(execution.trigger_payload, dict):
                        recipient = execution.trigger_payload.get("customer_email", 
                                    execution.trigger_payload.get("email", 
                                    execution.trigger_payload.get("customer", "customer@example.com")))
                    
                    email_body = results[-1]['output'] if results else "Standard confirmation content."
                    tx_id = f"tx_mail_{uuid.uuid4().hex[:12]}"
                    
                    # 1. Fetch secure SMTP settings from DB settings or process environment
                    smtp_host_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "smtp_host"))
                    smtp_host_s = smtp_host_res.scalar_one_or_none()
                    smtp_host = smtp_host_s.value if smtp_host_s else os.getenv("SMTP_HOST")

                    smtp_port_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "smtp_port"))
                    smtp_port_s = smtp_port_res.scalar_one_or_none()
                    smtp_port = int(smtp_port_s.value) if smtp_port_s else int(os.getenv("SMTP_PORT", "587"))

                    smtp_user_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "smtp_user"))
                    smtp_user_s = smtp_user_res.scalar_one_or_none()
                    smtp_user = smtp_user_s.value if smtp_user_s else os.getenv("SMTP_USER")

                    smtp_pass_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "smtp_password"))
                    smtp_pass_s = smtp_pass_res.scalar_one_or_none()
                    smtp_pass = smtp_pass_s.value if smtp_pass_s else os.getenv("SMTP_PASSWORD")

                    smtp_sender = smtp_user or "noreply@flowforge.ai"
                    real_dispatch_status = "Mock Relay Active"
                    
                    # 2. If SMTP details exist, dispatch real email
                    if smtp_host and smtp_user and smtp_pass:
                        try:
                            msg = MIMEMultipart()
                            msg['From'] = smtp_sender
                            msg['To'] = recipient
                            msg['Subject'] = "FlowForge AI Support Resolution"
                            msg.attach(MIMEText(email_body, 'plain'))

                            # Authenticate and send
                            server = smtplib.SMTP(smtp_host, smtp_port)
                            server.starttls()
                            server.login(smtp_user, smtp_pass)
                            server.sendmail(smtp_sender, recipient, msg.as_string())
                            server.quit()
                            real_dispatch_status = "250 OK - Dispatched to live customer SMTP mailbox!"
                        except Exception as smtp_err:
                            real_dispatch_status = f"SMTP ERROR - Fallback to mock: {str(smtp_err)}"

                    simulated_output = f"""[EMAIL DISPATCH ACTION]
To: {recipient}
Subject: FlowForge Automated Resolution Notice
Transaction ID: {tx_id}
Gateway Status: {real_dispatch_status}
Timestamp: {datetime.datetime.utcnow().isoformat()}

Message Body:
----------------------------------------
{email_body}
----------------------------------------"""
                    
                    step_result = {
                        "step_id": step.id,
                        "action_type": step.action_type,
                        "status": "success",
                        "output": simulated_output,
                        "timestamp": datetime.datetime.utcnow().isoformat()
                    }
                else:
                    # If there was a previous step, we can pass its output (Simple context chaining)
                    if results:
                        prompt += f"\nContext from previous step: {results[-1]['output']}"
                    
                    model = step.action_config.get("model", "llama-3.3-70b-versatile")
                    
                    # REAL AI CALL
                    ai_output = await ai_engine.generate_completion(prompt, model=model, api_key=db_api_key)
                    
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
    # asyncio.run() is the correct pattern for Python 3.10+
    # It creates a fresh event loop each time, preventing "event loop is closed" errors
    asyncio.run(_process_workflow(execution_id))
