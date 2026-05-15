"""
WebSocket Live Execution Updates

How it works:
1. Frontend connects to ws://server/api/v1/ws/executions/{execution_id}
2. The server polls the execution status every second
3. When the status changes, it pushes the update to the browser in real-time
4. When execution reaches COMPLETED or FAILED, the connection closes cleanly
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.executions.models import ExecutionLog, ExecutionState
import asyncio
import json

router = APIRouter(prefix="/ws", tags=["WebSockets"])

@router.websocket("/executions/{execution_id}")
async def execution_live_updates(websocket: WebSocket, execution_id: int, db: AsyncSession = Depends(get_db)):
    """
    Live WebSocket stream for execution status.
    Client connects and receives real-time state changes without polling the REST API.
    """
    await websocket.accept()
    
    try:
        last_status = None
        while True:
            result = await db.execute(
                select(ExecutionLog).where(ExecutionLog.id == execution_id)
            )
            execution = result.scalar_one_or_none()
            
            if not execution:
                await websocket.send_json({"error": "Execution not found"})
                break
            
            current_status = execution.status.value
            
            # Only send update if status changed (avoid unnecessary traffic)
            if current_status != last_status:
                payload = {
                    "execution_id": execution_id,
                    "status": current_status,
                    "result_data": execution.result_data,
                    "error_message": execution.error_message,
                }
                await websocket.send_json(payload)
                last_status = current_status
                
            # Stop streaming once execution reaches a terminal state
            if current_status in [ExecutionState.COMPLETED.value, ExecutionState.FAILED.value]:
                break
                
            # Poll every second
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        pass  # Client disconnected cleanly
    finally:
        await websocket.close()
