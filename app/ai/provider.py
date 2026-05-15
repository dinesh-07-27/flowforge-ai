import json
from groq import Groq
from app.core.config import settings

# Initialize a synchronous client for Celery workers
client = Groq(api_key=settings.GROQ_API_KEY)

def generate_structured_json(system_prompt: str, user_prompt: str, model: str = "llama3-8b-8192") -> dict:
    """
    Calls the Groq API enforcing JSON mode output.
    Returns a dictionary parsed from the JSON response.
    """
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.1,  # Low temperature for deterministic output
    )
    
    result_str = response.choices[0].message.content
    try:
        return json.loads(result_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from AI response: {result_str}") from e
