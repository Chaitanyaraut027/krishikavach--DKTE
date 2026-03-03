"""
Krishi Kavach – Local ML Inference Server
Crops supported: Banana, Chilli, Radish, Groundnut, Cauliflower
Run: python app.py   (starts on http://localhost:8000)
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io, os, uvicorn

# ── Model path ────────────────────────────────────────────────────────────────
# ── Model path ────────────────────────────────────────────────────────────────
MODEL_PATH = r"C:\Users\SIMRAN\OneDrive\Desktop\best_v2.pt"

if not os.path.exists(MODEL_PATH):
    FALLBACK_MODEL = os.path.join(os.path.dirname(__file__), "yolov8s.pt")
    print(f"Warning: Custom weights not found. Falling back to {FALLBACK_MODEL}")
    MODEL_PATH = FALLBACK_MODEL

app = FastAPI(title="Krishi Kavach ML Server", version="2.0")

# Allow requests from the Node backend (localhost:5000) and Vite dev (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model once at startup ─────────────────────────────────────────────────
print(f"Loading YOLO model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)
CLASS_NAMES = model.names          # {0: 'class_name', ...}
print(f"Model loaded. Classes: {CLASS_NAMES}")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "running",
        "model": "best.pt (Krishi Kavach v2)",
        "supported_crops": ["Banana", "Chilli", "Radish", "Groundnut", "Cauliflower"],
        "classes": CLASS_NAMES,
    }


# ── Prediction endpoint ───────────────────────────────────────────────────────
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    crop: str = Form(default="")
):
    # Read image bytes
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    # Run YOLO inference
    results = model(image, verbose=False)

    if not results or len(results) == 0:
        return {
            "predicted_class": "Healthy",
            "confidence": 0.0,
            "crop": crop,
            "detections": [],
        }

    result = results[0]  # first image result

    # ── No detections → plant is likely healthy ───────────────────────────────
    if result.boxes is None or len(result.boxes) == 0:
        return {
            "predicted_class": "Healthy",
            "confidence": 100.0,
            "crop": crop,
            "detections": [],
        }

    # ── Pick the detection with highest confidence ────────────────────────────
    boxes      = result.boxes
    confs      = boxes.conf.tolist()
    class_ids  = boxes.cls.tolist()

    best_idx   = confs.index(max(confs))
    best_conf  = round(confs[best_idx] * 100, 2)
    best_class = CLASS_NAMES[int(class_ids[best_idx])]

    # All detections (for debugging)
    detections = [
        {
            "class":      CLASS_NAMES[int(class_ids[i])],
            "confidence": round(confs[i] * 100, 2),
        }
        for i in range(len(confs))
    ]

    return {
        "predicted_class": best_class,
        "confidence":      best_conf,
        "crop":            crop,
        "detections":      detections,
    }


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
