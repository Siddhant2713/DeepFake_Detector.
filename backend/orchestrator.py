from typing import List, Dict
import os
from backend.processing.frames import FrameExtractor
from backend.processing.temporal import TemporalAggregator
from backend.experts.real_expert import RealExpert
from backend.schemas import DeepfakeResponse, Segment

class Orchestrator:
    def __init__(self):
        self.frame_extractor = FrameExtractor(fps=5)
        self.aggregator = TemporalAggregator(fps=5, threshold=0.5)
        self.expert = RealExpert()

    def process_video(self, video_path: str) -> DeepfakeResponse:
        """
        Full pipeline: Video -> Frames -> Scores -> Segments -> Response
        """
        # 1. Extract Frames
        frame_paths = self.frame_extractor.extract(video_path)
        
        # 2. Expert Analysis (Sliding Window / Batch)
        scores = self.expert.predict_frames(frame_paths)
        
        # 3. Temporal Aggregation
        segments = self.aggregator.aggregate(scores)
        
        # 4. Calculate Overall Confidence
        # Simple logic: If any segment is > 0.8 conf, the video is fake.
        max_conf = 0.0
        for seg in segments:
            if seg.confidence > max_conf:
                max_conf = seg.confidence
        
        is_fake = max_conf > 0.5
        
        return DeepfakeResponse(
            input_type="video",
            video_is_fake=is_fake,
            overall_confidence=max_conf,
            manipulated_segments=segments
        )

    def process_image(self, image_path: str) -> DeepfakeResponse:
        """
        Simple pipeline for single image.
        """
        # Expert Prediction
        score = self.expert.predict_image(image_path)
        is_fake = score > 0.5
        
        return DeepfakeResponse(
            input_type="image",
            video_is_fake=is_fake,
            overall_confidence=score,
            manipulated_segments=[] # No time segments for an image
        )
