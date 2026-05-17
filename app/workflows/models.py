from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.core.database import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    trigger_type = Column(String, nullable=False)  # e.g., 'webhook', 'schedule'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    steps = relationship("WorkflowStep", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("ExecutionLog", back_populates="workflow")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    action_type = Column(String, nullable=False)  # e.g., 'ai_summarize', 'http_request'
    action_config = Column(JSON, nullable=False)  # e.g., {"prompt": "...", "url": "..."}

    workflow = relationship("Workflow", back_populates="steps")
