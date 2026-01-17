import cv2
import numpy as np
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
from PIL import Image
from typing import List
import os

class RealExpert:
    def __init__(self):
        # 1. Load AI Model
        print("🔄 Initializing RealExpert: Downloading/Loading Model...")
        self.model_name = "prithivMLmods/Deep-Fake-Detector-v2-Model"
        self.device = torch.device("cpu")
        
        self.processor = AutoImageProcessor.from_pretrained(self.model_name)
        self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        
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

        # 3. Setup Face Detector (Haar Cascade)
        # We use the built-in OpenCV path or a local file if needed.
        # cv2.data.haarcascades acts as a finder for the xml files.
        try:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            if self.face_cascade.empty():
                raise IOError("Failed to load Haar Cascade XML")
            print("👤 Face Detector Loaded Successfully!")
        except Exception as e:
            print(f"⚠️ Warning: Face detector failed to load ({e}). Using full frame.")
            self.face_cascade = None

        print("✅ RealExpert Ready!")

    def extract_face(self, image_path: str) -> Image.Image:
        """
        Detects and crops the largest face from the image.
        Returns the cropped PIL Image. 
        If no face found, returns the original image (fallback).
        """
        try:
            if self.face_cascade is None:
                return Image.open(image_path).convert("RGB")

            # Read with OpenCV for detection
            cv_img = cv2.imread(image_path)
            if cv_img is None:
                return Image.open(image_path).convert("RGB")
            
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)

            if len(faces) == 0:
                print(f"⚠️ No face detected in {os.path.basename(image_path)}, using full frame.")
                return Image.open(image_path).convert("RGB")

            # Find largest face
            largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
            x, y, w, h = largest_face
            
            # Add a small margin (padding)
            margin = int(w * 0.1)
            x = max(0, x - margin)
            y = max(0, y - margin)
            w = min(cv_img.shape[1] - x, w + 2 * margin)
            h = min(cv_img.shape[0] - y, h + 2 * margin)

            # Crop
            face_img = cv_img[y:y+h, x:x+w]
            
            # Convert back to PIL for Transformers
            face_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            return Image.fromarray(face_rgb)

        except Exception as e:
            print(f"⚠️ Face extraction error: {e}")
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
