from celery.schedules import crontab
from app.workers.celery_app import celery_app

# Beat schedule — runs these tasks on a timer without any user trigger
celery_app.conf.beat_schedule = {
    # Example: Poll for any "scheduled" workflows every minute
    "run-scheduled-workflows-every-minute": {
        "task": "app.scheduler.tasks.run_scheduled_workflows",
        "schedule": crontab(minute="*"),  # Every minute
    },
}

celery_app.conf.timezone = "UTC"
