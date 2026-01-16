from pydantic import BaseModel
from typing import List, Literal, Optional

class Segment(BaseModel):
    start_time: str
    end_time: str
    confidence: float

class DeepfakeResponse(BaseModel):
    input_type: Literal["video", "image"]
    video_is_fake: bool
    overall_confidence: float
    manipulated_segments: List[Segment]

class HealthResponse(BaseModel):
    status: str
