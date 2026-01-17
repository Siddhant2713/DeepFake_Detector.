from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
from PIL import Image
from typing import List
import os

class RealExpert:
    def __init__(self):
        print("🔄 Initializing RealExpert: Downloading/Loading Model...")
        self.model_name = "prithivMLmods/Deep-Fake-Detector-v2-Model"
        
        # CPU-friendly loading
        self.device = torch.device("cpu")
        
        # correct architecture usage
        self.processor = AutoImageProcessor.from_pretrained(self.model_name)
        self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        print("✅ Model Loaded Successfully!")

    def predict_image(self, image_path: str) -> float:
        """
        Predicts interaction for a single image file (JPG/PNG).
        Returns float: 0.0 (Real) to 1.0 (Fake)
        """
        try:
            image = Image.open(image_path).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=1)
                
            # Assuming class 1 is "Fake" and class 0 is "Real" (Check model card usually)
            # For this specific model, we need to verify label mapping. 
            # Most generic detectors: 0=Real, 1=Fake.
            fake_prob = probabilities[0][1].item()
            return fake_prob
        except Exception as e:
            print(f"❌ Error predicting image {image_path}: {e}")
            return 0.5 # Fail safe

    def predict_frames(self, frame_paths: List[str]) -> List[float]:
        """
        Batch prediction for a list of video frames.
        """
        scores = []
        # Process one by one for CPU safety (Batching on CPU can freeze Docker)
        for path in frame_paths:
            score = self.predict_image(path)
            scores.append(score)
        return scores
