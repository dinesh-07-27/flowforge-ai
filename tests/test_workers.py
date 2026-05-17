import pytest
from unittest.mock import patch, MagicMock
from app.workers.tasks import process_workflow_task

def test_celery_worker_dispatch():
    """
    Test that the Celery worker function can be called.
    We mock the asyncio event loop to avoid running real database queries in the test.
    """
    with patch("app.workers.tasks.asyncio.get_event_loop") as mock_get_loop:
        mock_loop = MagicMock()
        mock_get_loop.return_value = mock_loop
        
        # Execute the Celery task entry point
        process_workflow_task(execution_id=999)
        
        # Verify that it attempted to run the async process function
        mock_loop.run_until_complete.assert_called_once()
