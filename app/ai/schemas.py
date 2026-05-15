from pydantic import BaseModel, Field
from typing import Optional, List

class ClassificationResult(BaseModel):
    category: str = Field(description="The primary category of the text")
    confidence_score: float = Field(description="Confidence score between 0.0 and 1.0")
    urgency: str = Field(description="Urgency level: HIGH, MEDIUM, or LOW")

class SummarizationResult(BaseModel):
    summary: str = Field(description="A concise summary of the text")
    key_points: List[str] = Field(description="A list of 3-5 key points extracted from the text")
