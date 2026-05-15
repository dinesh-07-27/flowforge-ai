from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.executions.dispatcher import dispatch_workflow
from app.storage.client import storage_client

router = APIRouter(prefix="/triggers", tags=["Triggers"])

@router.post("/document-upload/{workflow_id}")
async def upload_document_trigger(
    workflow_id: int, 
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Acts as a Workflow Trigger. Uploads a document to MinIO and dispatches the workflow.
    """
    if not file.filename.endswith(('.pdf', '.txt', '.csv')):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, and CSV files are allowed.")
        
    file_content = await file.read()
    
    # Upload to MinIO/S3
    s3_uri = storage_client.upload_file(
        file_content=file_content, 
        filename=file.filename,
        content_type=file.content_type
    )
    
    # The payload we send to the workflow execution engine
    trigger_payload = {
        "event_type": "document_upload",
        "file_name": file.filename,
        "s3_uri": s3_uri,
        "content_type": file.content_type,
        "text": "Extracted text would go here" # In a real app, an OCR worker step would extract this from the S3 URI
    }
    
    execution = await dispatch_workflow(
        workflow_id=workflow_id,
        trigger_payload=trigger_payload,
        db=db
    )
    
    return {
        "message": "Document uploaded and workflow triggered successfully",
        "execution_id": execution.id,
        "s3_uri": s3_uri
    }
