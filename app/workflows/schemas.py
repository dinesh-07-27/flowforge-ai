from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class WorkflowStepBase(BaseModel):
    step_order: int
    action_type: str
    action_config: Dict[str, Any]

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: str
    is_active: Optional[bool] = True

class WorkflowCreate(WorkflowBase):
    steps: List[WorkflowStepBase]

class WorkflowStepResponse(WorkflowStepBase):
    id: int

    class Config:
        from_attributes = True

class WorkflowResponse(WorkflowBase):
    id: int
    user_id: int
    created_at: datetime
    steps: List[WorkflowStepResponse]

    class Config:
        from_attributes = True
