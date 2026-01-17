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
        
        # DYNAMIC LABEL MAPPING
        # We check what the model calls its classes to find the "Fake" index
        self.id2label = self.model.config.id2label
        self.fake_idx = 1 # Default
        self.real_idx = 0
        
        print(f"🏷️ Model Labels: {self.id2label}")
        
        # Smart detection of label indices
        for idx, label in self.id2label.items():
            label_clean = label.lower()
            if "fake" in label_clean or "manipulated" in label_clean:
                self.fake_idx = int(idx)
            elif "real" in label_clean or "original" in label_clean:
                self.real_idx = int(idx)
                
        print(f"🎯 Configuration: Real={self.real_idx}, Fake={self.fake_idx}")
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
                
            # Use dynamic index
            fake_prob = probabilities[0][self.fake_idx].item()
            real_prob = probabilities[0][self.real_idx].item()
            
            print(f"🔍 Analysis: Fake Prob={fake_prob:.4f}, Real Prob={real_prob:.4f} -> Result={fake_prob}")
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
