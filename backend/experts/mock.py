import random
from typing import List

class MockExpert:
    def predict_frames(self, frame_paths: List[str]) -> List[float]:
        """
        Returns a mock score for each frame.
        Simulating a fake segment in the middle.
        """
        scores = []
        total = len(frame_paths)
        for i in range(total):
            # Fake segment between 40% and 60% of video
            if 0.4 * total < i < 0.6 * total:
                scores.append(random.uniform(0.8, 0.99)) # FAKE
            else:
                scores.append(random.uniform(0.0, 0.2)) # REAL
        return scores
