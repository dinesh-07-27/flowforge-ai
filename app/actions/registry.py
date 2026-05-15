from typing import Callable, Dict, Any
from app.ai.actions import run_classification_action, run_summarization_action
import httpx

class ActionRegistry:
    def __init__(self):
        self._actions: Dict[str, Callable] = {}

    def register(self, action_type: str, func: Callable):
        self._actions[action_type] = func

    def get_action(self, action_type: str) -> Callable:
        if action_type not in self._actions:
            raise ValueError(f"Action type '{action_type}' is not registered.")
        return self._actions[action_type]

# --- Define some actions ---
def http_request_action(config: Dict[str, Any], payload: Dict[str, Any]) -> dict:
    url = config.get("url")
    method = config.get("method", "POST")
    headers = config.get("headers", {})
    
    # In production, use async httpx, but Celery tasks run synchronously here
    with httpx.Client() as client:
        response = client.request(method, url, json=payload, headers=headers)
        response.raise_for_status()
        return {"status_code": response.status_code, "response_body": response.text}

def ai_summarization_action(config: Dict[str, Any], payload: Dict[str, Any]) -> dict:
    text = payload.get("text", "")
    return run_summarization_action(text)

def ai_classification_action(config: Dict[str, Any], payload: Dict[str, Any]) -> dict:
    text = payload.get("text", "")
    return run_classification_action(text)

# --- Register actions ---
registry = ActionRegistry()
registry.register("http_request", http_request_action)
registry.register("ai_summarize", ai_summarization_action)
registry.register("ai_classify", ai_classification_action)
