"""
Krishi Kavach - Model Verification Script
Tests: YOLO, EfficientNet, MobileNet, and ViT (via live API health endpoint)
"""
import os
import sys
import json
import requests
import torch
import torch.nn as nn
import torchvision.models as models
from PIL import Image, ImageDraw
import io

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_SERVER = "http://localhost:8000"

YOLO_PATH       = os.path.join(BASE_DIR, "runs", "detect", "train", "weights", "best.pt")
EFFICIENTNET_PATH = os.path.join(BASE_DIR, "pretrained_models", "efficientnet_plant.pth", "efficientnet_plant")
MOBILENET_PATH    = os.path.join(BASE_DIR, "pretrained_models", "mobilenetv2_plant.pth", "mobilenetv2_plant")
CLASS_NAMES_PATH  = os.path.join(BASE_DIR, "pretrained_models", "class_names.json")

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):  print(f"  {GREEN}✅ {msg}{RESET}")
def fail(msg): print(f"  {RED}❌ {msg}{RESET}")
def warn(msg): print(f"  {YELLOW}⚠️  {msg}{RESET}")
def info(msg): print(f"  {CYAN}ℹ️  {msg}{RESET}")

def section(title):
    print(f"\n{BOLD}{'='*55}{RESET}")
    print(f"{BOLD}  {title}{RESET}")
    print(f"{BOLD}{'='*55}{RESET}")

# ─────────────────────────────────────────────────────────────
# 1. FILE CHECK
# ─────────────────────────────────────────────────────────────

def check_files():
    section("1. MODEL FILES ON DISK")
    checks = {
        "YOLO best.pt":       YOLO_PATH,
        "EfficientNet dir":   EFFICIENTNET_PATH,
        "MobileNet dir":      MOBILENET_PATH,
        "class_names.json":   CLASS_NAMES_PATH,
    }
    all_ok = True
    for name, path in checks.items():
        exists = os.path.exists(path)
        if exists:
            if os.path.isdir(path):
                files = os.listdir(path)
                size_info = f"dir, {len(files)} files: {files}"
            else:
                size_mb = os.path.getsize(path) / 1024 / 1024
                size_info = f"{size_mb:.1f} MB"
            ok(f"{name}: {size_info}")
        else:
            fail(f"{name}: NOT FOUND at {path}")
            all_ok = False
    return all_ok

# ─────────────────────────────────────────────────────────────
# 2. CLASS NAMES
# ─────────────────────────────────────────────────────────────

def check_class_names():
    section("2. CLASS NAMES")
    if not os.path.exists(CLASS_NAMES_PATH):
        fail("class_names.json not found")
        return []
    with open(CLASS_NAMES_PATH) as f:
        classes = json.load(f)
    ok(f"Loaded {len(classes)} classes")
    info(f"First 5: {classes[:5]}")
    info(f"Last  5: {classes[-5:]}")
    return classes

# ─────────────────────────────────────────────────────────────
# 3. YOLO MODEL
# ─────────────────────────────────────────────────────────────

def check_yolo():
    section("3. YOLO MODEL")
    if not os.path.exists(YOLO_PATH):
        fail(f"YOLO best.pt not found at: {YOLO_PATH}")
        return False
    try:
        from ultralytics import YOLO
        model = YOLO(YOLO_PATH)
        ok(f"YOLO loaded successfully")
        ok(f"YOLO classes ({len(model.names)}): {list(model.names.values())}")

        # Run inference on a synthetic green image (simulates a leaf)
        img = Image.new("RGB", (640, 640), color=(34, 139, 34))
        draw = ImageDraw.Draw(img)
        draw.ellipse([150, 150, 490, 490], fill=(0, 100, 0))
        results = model(img, verbose=False)
        detected = len(results[0].boxes) if results else 0
        ok(f"YOLO inference ran successfully (detected {detected} objects on synthetic image)")
        return True
    except Exception as e:
        fail(f"YOLO failed: {e}")
        return False

# ─────────────────────────────────────────────────────────────
# 4. EFFICIENTNET MODEL
# ─────────────────────────────────────────────────────────────

import zipfile, tempfile, shutil

def load_directory_model(dir_path):
    if not os.path.isdir(dir_path):
        return torch.load(dir_path, map_location="cpu", weights_only=False)
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        parent_dir_name = os.path.basename(dir_path)
        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_STORED) as z:
            for root, dirs, files in os.walk(dir_path):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, dir_path)
                    z.write(full_path, os.path.join(parent_dir_name, rel_path))
        return torch.load(tmp_path, map_location="cpu", weights_only=False)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

def check_efficientnet(classes):
    section("4. EFFICIENTNET MODEL")
    if not os.path.exists(EFFICIENTNET_PATH):
        fail(f"EfficientNet directory not found: {EFFICIENTNET_PATH}")
        return False
    try:
        num_classes = len(classes) if classes else 38
        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Sequential(
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(in_features, num_classes)
        )
        state_dict = load_directory_model(EFFICIENTNET_PATH)
        if isinstance(state_dict, torch.nn.Module):
            m = state_dict
        else:
            # Handle nested dicts
            if isinstance(state_dict, dict):
                if "model_state_dict" in state_dict:
                    state_dict = state_dict["model_state_dict"]
                elif "state_dict" in state_dict:
                    state_dict = state_dict["state_dict"]
            model.load_state_dict(state_dict, strict=False)
            m = model
        m.eval()
        ok(f"EfficientNet loaded successfully")

        # Dummy inference
        import torchvision.transforms as T
        transform = T.Compose([T.Resize(256), T.CenterCrop(224), T.ToTensor(),
                                T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
        img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        tensor = transform(img).unsqueeze(0)
        with torch.no_grad():
            out = m(tensor)
        _, idx = torch.max(out, 1)
        predicted = classes[idx.item()] if classes else f"Class_{idx.item()}"
        ok(f"EfficientNet inference OK → predicted: '{predicted}'")
        ok(f"Output shape: {out.shape} ({out.shape[1]} classes)")
        return True
    except Exception as e:
        fail(f"EfficientNet failed: {type(e).__name__}: {e}")
        return False

# ─────────────────────────────────────────────────────────────
# 5. MOBILENET MODEL
# ─────────────────────────────────────────────────────────────

def check_mobilenet(classes):
    section("5. MOBILENETV2 MODEL")
    if not os.path.exists(MOBILENET_PATH):
        fail(f"MobileNet directory not found: {MOBILENET_PATH}")
        return False
    try:
        num_classes = len(classes) if classes else 38
        model = models.mobilenet_v2(weights=None)
        model.classifier[1] = nn.Sequential(
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(model.last_channel, num_classes)
        )
        state_dict = load_directory_model(MOBILENET_PATH)
        if isinstance(state_dict, torch.nn.Module):
            m = state_dict
        else:
            if isinstance(state_dict, dict):
                if "model_state_dict" in state_dict:
                    state_dict = state_dict["model_state_dict"]
                elif "state_dict" in state_dict:
                    state_dict = state_dict["state_dict"]
            model.load_state_dict(state_dict, strict=False)
            m = model
        m.eval()
        ok(f"MobileNetV2 loaded successfully")

        # Dummy inference
        import torchvision.transforms as T
        transform = T.Compose([T.Resize(256), T.CenterCrop(224), T.ToTensor(),
                                T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
        img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        tensor = transform(img).unsqueeze(0)
        with torch.no_grad():
            out = m(tensor)
        _, idx = torch.max(out, 1)
        predicted = classes[idx.item()] if classes else f"Class_{idx.item()}"
        ok(f"MobileNetV2 inference OK → predicted: '{predicted}'")
        ok(f"Output shape: {out.shape} ({out.shape[1]} classes)")
        return True
    except Exception as e:
        fail(f"MobileNetV2 failed: {type(e).__name__}: {e}")
        return False

# ─────────────────────────────────────────────────────────────
# 6. LIVE API HEALTH CHECK
# ─────────────────────────────────────────────────────────────

def check_live_api():
    section("6. LIVE ML SERVER API (localhost:8000)")
    try:
        r = requests.get(f"{ML_SERVER}/health", timeout=5)
        data = r.json()
        ok(f"Server status: {data['status']}")
        if data.get("yolo_active"):
            ok(f"YOLO: ACTIVE ({len(data['yolo_classes'])} classes)")
        else:
            fail("YOLO: INACTIVE on server")
        if data.get("classifier_active"):
            ok(f"Classifier: ACTIVE ({len(data['classifier_classes'])} classes)")
        else:
            warn("Classifier (EfficientNet/MobileNet): INACTIVE on server — see Section 4 & 5 above")

        # Send a synthetic leaf image to the /predict endpoint
        print(f"\n  {CYAN}Testing /predict endpoint with synthetic leaf image...{RESET}")
        img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)

        for crop in ["banana", "tomato"]:
            try:
                resp = requests.post(
                    f"{ML_SERVER}/predict",
                    files={"file": (f"test_{crop}.jpg", buf, "image/jpeg")},
                    data={"crop": crop, "mode": "auto"},
                    timeout=30
                )
                buf.seek(0)
                pred = resp.json()
                method = pred.get("method", "unknown")
                cls    = pred.get("predicted_class", "?")
                conf   = pred.get("confidence", 0)
                ok(f"/predict [{crop}] → '{cls}' ({conf}%) via [{method}]")
            except Exception as e:
                fail(f"/predict [{crop}] failed: {e}")
        return True
    except requests.ConnectionError:
        fail(f"Cannot connect to {ML_SERVER} — is python app.py running?")
        return False
    except Exception as e:
        fail(f"API check failed: {e}")
        return False

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────

def main():
    print(f"\n{BOLD}{CYAN}  KRISHI KAVACH — MODEL VERIFICATION REPORT{RESET}")
    print(f"{CYAN}  {'='*51}{RESET}")

    files_ok   = check_files()
    classes    = check_class_names()
    yolo_ok    = check_yolo()
    eff_ok     = check_efficientnet(classes)
    mob_ok     = check_mobilenet(classes)
    api_ok     = check_live_api()

    section("SUMMARY")
    results = {
        "Files on disk":       files_ok,
        "YOLO":                yolo_ok,
        "EfficientNet":        eff_ok,
        "MobileNetV2":         mob_ok,
        "Live API (port 8000)": api_ok,
    }
    for name, status in results.items():
        if status:
            ok(f"{name}")
        else:
            fail(f"{name}")

    passed = sum(results.values())
    total  = len(results)
    print(f"\n  {BOLD}Result: {passed}/{total} checks passed{RESET}\n")

if __name__ == "__main__":
    main()
