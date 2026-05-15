from app.ai.provider import generate_structured_json
from app.ai.prompts import CLASSIFICATION_SYSTEM_PROMPT, SUMMARIZATION_SYSTEM_PROMPT
from app.ai.schemas import ClassificationResult, SummarizationResult

def run_classification_action(text: str) -> dict:
    """
    Runs classification and validates the output using Pydantic.
    """
    raw_json = generate_structured_json(
        system_prompt=CLASSIFICATION_SYSTEM_PROMPT,
        user_prompt=text
    )
    
    # Validate the raw JSON against our Pydantic schema
    validated_data = ClassificationResult.model_validate(raw_json)
    return validated_data.model_dump()

def run_summarization_action(text: str) -> dict:
    """
    Runs summarization and validates the output using Pydantic.
    """
    raw_json = generate_structured_json(
        system_prompt=SUMMARIZATION_SYSTEM_PROMPT,
        user_prompt=text
    )
    
    validated_data = SummarizationResult.model_validate(raw_json)
    return validated_data.model_dump()
