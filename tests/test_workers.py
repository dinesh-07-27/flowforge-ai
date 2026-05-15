import pytest
from unittest.mock import patch, MagicMock
from app.workers.tasks import execute_workflow_task

def test_celery_worker_dispatch():
    """
    Test that the Celery worker function can be called.
    We mock the database session to avoid needing a real DB connection for worker unit tests.
    """
    with patch("app.workers.tasks.SessionLocal") as mock_session_local:
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db
        
        # Mock the execution query to return None (no execution found)
        mock_db.query().filter().first.return_value = None
        
        # Execute the task
        execute_workflow_task(execution_id=999)
        
        # Verify the database was queried
        mock_db.query.assert_called()
