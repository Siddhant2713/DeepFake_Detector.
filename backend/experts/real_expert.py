import cv2
import numpy as np
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
from PIL import Image
from typing import List
import os

class RealExpert:
    def __init__(self):
        try:
            print("🚀 Starting RealExpert Initialization...")
            
            # 1. Load AI Model
            print("⬇️ Downloading/Loading Transformer Model...")
            self.model_name = "prithivMLmods/Deep-Fake-Detector-v2-Model"
            self.device = torch.device("cpu")
            
            self.processor = AutoImageProcessor.from_pretrained(self.model_name)
            self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            print("✅ Transformer Model Loaded.")

            # 2. Dynamic Label Mapping
            self.id2label = self.model.config.id2label
            self.fake_idx = 1
            self.real_idx = 0
            
            for idx, label in self.id2label.items():
                label_clean = label.lower()
                if "fake" in label_clean or "manipulated" in label_clean:
                    self.fake_idx = int(idx)
                elif "real" in label_clean or "original" in label_clean:
                    self.real_idx = int(idx)
            print(f"🏷️ Labels: Fake={self.fake_idx}, Real={self.real_idx}")

            # 3. Setup Face Detector
            print("👤 Loading Face Detector...")
            # Use explicit local path if system path fails
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            print(f"📂 Looking for cascade at: {cascade_path}")
            
            if not os.path.exists(cascade_path):
                print(f"❌ Cascade XML file NOT found at {cascade_path}")
                # Fallback: Don't crash, just disable face detection
                self.face_cascade = None
            else:
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                if self.face_cascade.empty():
                    print("❌ Failed to load CascadeClassifier (Empty).")
                    self.face_cascade = None
                else:
                    print("✅ Face Detector Loaded.")

        except Exception as e:
            print(f"🔥 CRITICAL ERROR in RealExpert.__init__: {e}")
            raise e # Re-raise to see it in logs

    def extract_face(self, image_path: str) -> Image.Image:
        try:
            if self.face_cascade is None:
                return Image.open(image_path).convert("RGB")

            # Load with PIL first (Safe)
            pil_img = Image.open(image_path).convert("RGB")
            # Convert to numpy (OpenCV format)
            cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)

            if len(faces) == 0:
                print(f"⚠️ No detected face. Using full frame.")
                return pil_img

            # Find largest face
            largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
            x, y, w, h = largest_face
            
            # Add a small margin
            margin = int(w * 0.1)
            x = max(0, x - margin)
            y = max(0, y - margin)
            w = min(cv_img.shape[1] - x, w + 2 * margin)
            h = min(cv_img.shape[0] - y, h + 2 * margin)

            # Crop
            face_img = cv_img[y:y+h, x:x+w]
            
            # Convert back to PIL
            return Image.fromarray(cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB))

        except Exception as e:
            print(f"⚠️ Face Logic Error: {e}. Fallback to full frame.")
            return Image.open(image_path).convert("RGB")

    def predict_image(self, image_path: str) -> float:
        """
        Predicts interaction for a single image file (JPG/PNG).
        Returns float: 0.0 (Real) to 1.0 (Fake)
        """
        try:
            # STEP 1: Crop Face
            pil_image = self.extract_face(image_path)

            # STEP 2: AI Prediction
            inputs = self.processor(images=pil_image, return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=1)
                
            fake_prob = probabilities[0][self.fake_idx].item()
            real_prob = probabilities[0][self.real_idx].item()
            
            print(f"🔍 Analysis: Fake={fake_prob:.4f}")
            return fake_prob
        except Exception as e:
            print(f"❌ Error predicting image {image_path}: {e}")
            return 0.5

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
