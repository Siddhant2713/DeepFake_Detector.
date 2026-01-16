from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas import DeepfakeResponse, HealthResponse, Segment

app = FastAPI(title="DeepFake Detector API")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}

@app.post("/api/analyze", response_model=DeepfakeResponse)
async def analyze_video(file: UploadFile = File(...)):
    # Mock response for now to satisfy TC-2.3 later
    return {
        "input_type": "video",
        "video_is_fake": False,
        "overall_confidence": 0.0,
        "manipulated_segments": []
    }
