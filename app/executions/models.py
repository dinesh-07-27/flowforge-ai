from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
import datetime
import enum
from app.core.database import Base

class ExecutionState(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    RETRYING = "RETRYING"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    status = Column(Enum(ExecutionState), default=ExecutionState.PENDING)
    trigger_payload = Column(JSON, nullable=True)  # The webhook body or file metadata that started this
    result_data = Column(JSON, nullable=True)      # Final output from AI/Actions
    error_message = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    workflow = relationship("Workflow", back_populates="executions")
