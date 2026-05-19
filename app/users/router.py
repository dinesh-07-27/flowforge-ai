from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel

from app.core.database import get_db
from app.auth.dependencies import get_current_active_user, get_current_superuser
from app.auth.security import get_password_hash
from app.users.models import User, SystemSetting
from app.workflows.models import Workflow, WorkflowStep
from app.executions.models import ExecutionLog

router = APIRouter(prefix="/users", tags=["Users"])

class ChangePasswordRequest(BaseModel):
    new_password: str

class ConfigUpdateRequest(BaseModel):
    groq_api_key: str
    global_rate_limit: int

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the currently logged in user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser
    }

@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Securely update the password of the currently logged-in user."""
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
    current_user.hashed_password = get_password_hash(req.new_password)
    db.add(current_user)
    await db.commit()
    return {"message": "Password updated successfully"}

@router.delete("/me")
async def delete_my_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    GDPR-compliant self-service deletion. Cleanly purges all user's
    workflows, steps, executions, and the user profile itself.
    """
    # 1. Fetch all user workflows
    result = await db.execute(select(Workflow).where(Workflow.user_id == current_user.id))
    workflows = result.scalars().all()
    
    for wf in workflows:
        # Purge executions
        await db.execute(select(ExecutionLog).where(ExecutionLog.workflow_id == wf.id))
        # Purge steps
        await db.execute(select(WorkflowStep).where(WorkflowStep.workflow_id == wf.id))
        
        # SQLAlchemy cascading or direct deletes to prevent Foreign Key errors
        await db.delete(wf)
        
    # 2. Delete user
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account and all associated data permanently deleted"}

@router.get("/")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_superuser)
):
    """
    Admin-only endpoint to list all users and their workflow counts.
    """
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    response = []
    for u in users:
        wf_count = await db.execute(select(func.count(Workflow.id)).where(Workflow.user_id == u.id))
        response.append({
            "id": u.id,
            "email": u.email,
            "is_active": u.is_active,
            "is_superuser": u.is_superuser,
            "workflows_count": wf_count.scalar()
        })
        
    return response

@router.get("/config")
async def get_system_config(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_superuser)
):
    """Admin-only: fetch the global platform configurations."""
    # Retrieve Groq API Key
    groq_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "groq_api_key"))
    groq_setting = groq_res.scalar_one_or_none()
    
    # Retrieve Rate Limit
    limit_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "global_rate_limit"))
    limit_setting = limit_res.scalar_one_or_none()
    
    return {
        "groq_api_key": groq_setting.value if groq_setting else "",
        "global_rate_limit": int(limit_setting.value) if limit_setting else 100
    }

@router.post("/config")
async def update_system_config(
    req: ConfigUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_superuser)
):
    """Admin-only: update the global platform configurations in the database."""
    # Upsert Groq API Key
    groq_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "groq_api_key"))
    groq_setting = groq_res.scalar_one_or_none()
    if not groq_setting:
        groq_setting = SystemSetting(key="groq_api_key", value=req.groq_api_key)
    else:
        groq_setting.value = req.groq_api_key
    db.add(groq_setting)
    
    # Upsert Rate Limit
    limit_res = await db.execute(select(SystemSetting).where(SystemSetting.key == "global_rate_limit"))
    limit_setting = limit_res.scalar_one_or_none()
    if not limit_setting:
        limit_setting = SystemSetting(key="global_rate_limit", value=str(req.global_rate_limit))
    else:
        limit_setting.value = str(req.global_rate_limit)
    db.add(limit_setting)
    
    await db.commit()
    return {"message": "System configuration updated successfully"}

@router.delete("/{user_id}")
async def admin_delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_superuser)
):
    """
    Admin-only: Cleanly purges a target user and all of their workflows, steps, and execution logs.
    """
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account from the user dashboard")

    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    wf_result = await db.execute(select(Workflow).where(Workflow.user_id == target_user.id))
    workflows = wf_result.scalars().all()
    
    for wf in workflows:
        await db.execute(select(ExecutionLog).where(ExecutionLog.workflow_id == wf.id))
        await db.execute(select(WorkflowStep).where(WorkflowStep.workflow_id == wf.id))
        await db.delete(wf)
        
    await db.delete(target_user)
    await db.commit()
    return {"message": f"User {target_user.email} and all associated data permanently deleted"}
