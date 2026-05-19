import pytest
from unittest.mock import patch, MagicMock
from app.workers.tasks import process_workflow_task

def test_celery_worker_dispatch():
    """
    Test that the Celery worker function can be called.
    We mock asyncio.run to avoid running real database queries in the test.
    """
    with patch("app.workers.tasks.asyncio.run") as mock_run:
        # Execute the Celery task entry point
        process_workflow_task(execution_id=999)
        
        # Verify that it attempted to run the async process function
        mock_run.assert_called_once()
