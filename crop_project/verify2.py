"""Simple ASCII model verification for Krishi Kavach"""
import os, sys, json, zipfile, tempfile, io
import torch, torch.nn as nn
import torchvision.models as models
from PIL import Image
import requests

BASE = os.path.dirname(os.path.abspath(__file__))
YOLO_PATH = os.path.join(BASE, "runs", "detect", "train", "weights", "best.pt")
EFF_PATH  = os.path.join(BASE, "pretrained_models", "efficientnet_plant.pth", "efficientnet_plant")
MOB_PATH  = os.path.join(BASE, "pretrained_models", "mobilenetv2_plant.pth", "mobilenetv2_plant")
CN_PATH   = os.path.join(BASE, "pretrained_models", "class_names.json")

def sep(title): print(f"\n{'='*60}\n  {title}\n{'='*60}")
def OK(m):   print(f"  [PASS] {m}")
def FAIL(m): print(f"  [FAIL] {m}")
def INFO(m): print(f"  [INFO] {m}")

def load_dir_model(path):
    if not os.path.isdir(path):
        return torch.load(path, map_location='cpu', weights_only=False)
    pname = os.path.basename(path)
    tmp = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
    tmp.close()
    with zipfile.ZipFile(tmp.name, 'w', zipfile.ZIP_STORED) as z:
        for root, dirs, files in os.walk(path):
            for f in files:
                fp = os.path.join(root, f)
                z.write(fp, os.path.join(pname, os.path.relpath(fp, path)))
    sd = torch.load(tmp.name, map_location='cpu', weights_only=False)
    os.remove(tmp.name)
    return sd

# ── 1. Files ──────────────────────────────────────────────────
sep("1. FILES ON DISK")
for label, path in [("YOLO best.pt", YOLO_PATH), ("EfficientNet dir", EFF_PATH),
                     ("MobileNet dir", MOB_PATH), ("class_names.json", CN_PATH)]:
    if os.path.exists(path):
        if os.path.isdir(path):
            files = os.listdir(path)
            OK(f"{label}: dir with {len(files)} file(s) -> {files}")
        else:
            OK(f"{label}: {os.path.getsize(path)/1024/1024:.1f} MB")
    else:
        FAIL(f"{label}: NOT FOUND at {path}")

# ── 2. Class Names ─────────────────────────────────────────────
sep("2. CLASS NAMES")
classes = []
if os.path.exists(CN_PATH):
    with open(CN_PATH) as f:
        classes = json.load(f)
    OK(f"Loaded {len(classes)} classes")
    INFO(f"Sample: {classes[:3]} ... {classes[-3:]}")
else:
    FAIL("class_names.json missing")

# ── 3. YOLO ────────────────────────────────────────────────────
sep("3. YOLO MODEL")
try:
    from ultralytics import YOLO
    yolo = YOLO(YOLO_PATH)
    OK(f"YOLO loaded | {len(yolo.names)} classes")
    INFO(str(list(yolo.names.values())))
    img = Image.new("RGB", (640,640), (34,139,34))
    res = yolo(img, verbose=False)
    OK(f"YOLO inference OK | detected {len(res[0].boxes)} objects on dummy image")
    yolo_ok = True
except Exception as e:
    FAIL(f"YOLO error: {e}")
    yolo_ok = False

# ── 4. EfficientNet ────────────────────────────────────────────
sep("4. EFFICIENTNET MODEL")
eff_ok = False
try:
    nc = len(classes) if classes else 38
    m = models.efficientnet_b0(weights=None)
    inf = m.classifier[1].in_features
    m.classifier[1] = nn.Sequential(nn.Dropout(0.2,True), nn.Linear(inf, nc))
    sd = load_dir_model(EFF_PATH)
    INFO(f"Loaded object type: {type(sd)}")
    if isinstance(sd, dict):
        keys = list(sd.keys())[:5]
        INFO(f"Dict keys sample: {keys}")
        if "model_state_dict" in sd: sd = sd["model_state_dict"]
        elif "state_dict" in sd:     sd = sd["state_dict"]
        res = m.load_state_dict(sd, strict=False)
        INFO(f"Missing keys: {len(res.missing_keys)} | Unexpected: {len(res.unexpected_keys)}")
        m.eval()
        model = m
    elif isinstance(sd, nn.Module):
        model = sd
        model.eval()
    else:
        raise ValueError(f"Unknown type: {type(sd)}")
    import torchvision.transforms as T
    tf = T.Compose([T.Resize(256),T.CenterCrop(224),T.ToTensor(),
                    T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
    img = Image.new("RGB",(224,224),(34,139,34))
    t = tf(img).unsqueeze(0)
    with torch.no_grad():
        out = model(t)
    _, idx = torch.max(out,1)
    pred = classes[idx.item()] if classes else f"class_{idx.item()}"
    OK(f"EfficientNet inference OK | output shape: {tuple(out.shape)} | predicted: '{pred}'")
    eff_ok = True
except Exception as e:
    FAIL(f"EfficientNet error: {type(e).__name__}: {e}")

# ── 5. MobileNetV2 ─────────────────────────────────────────────
sep("5. MOBILENETV2 MODEL")
mob_ok = False
try:
    nc = len(classes) if classes else 38
    m = models.mobilenet_v2(weights=None)
    m.classifier[1] = nn.Sequential(nn.Dropout(0.2,True), nn.Linear(m.last_channel, nc))
    sd = load_dir_model(MOB_PATH)
    INFO(f"Loaded object type: {type(sd)}")
    if isinstance(sd, dict):
        keys = list(sd.keys())[:5]
        INFO(f"Dict keys sample: {keys}")
        if "model_state_dict" in sd: sd = sd["model_state_dict"]
        elif "state_dict" in sd:     sd = sd["state_dict"]
        res = m.load_state_dict(sd, strict=False)
        INFO(f"Missing keys: {len(res.missing_keys)} | Unexpected: {len(res.unexpected_keys)}")
        m.eval()
        model = m
    elif isinstance(sd, nn.Module):
        model = sd
        model.eval()
    else:
        raise ValueError(f"Unknown type: {type(sd)}")
    import torchvision.transforms as T
    tf = T.Compose([T.Resize(256),T.CenterCrop(224),T.ToTensor(),
                    T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
    img = Image.new("RGB",(224,224),(34,139,34))
    t = tf(img).unsqueeze(0)
    with torch.no_grad():
        out = model(t)
    _, idx = torch.max(out,1)
    pred = classes[idx.item()] if classes else f"class_{idx.item()}"
    OK(f"MobileNetV2 inference OK | output shape: {tuple(out.shape)} | predicted: '{pred}'")
    mob_ok = True
except Exception as e:
    FAIL(f"MobileNetV2 error: {type(e).__name__}: {e}")

# ── 6. Live API ────────────────────────────────────────────────
sep("6. LIVE API - localhost:8000")
api_ok = False
try:
    r = requests.get("http://localhost:8000/health", timeout=5)
    h = r.json()
    OK(f"Server online | yolo_active={h['yolo_active']} | classifier_active={h['classifier_active']}")
    INFO(f"classifier_classes count: {len(h.get('classifier_classes', []))}")
    # test predict
    img = Image.new("RGB",(224,224),(34,139,34))
    buf = io.BytesIO(); img.save(buf,"JPEG"); buf.seek(0)
    for crop in ["banana","tomato"]:
        r2 = requests.post("http://localhost:8000/predict",
            files={"file":(f"{crop}.jpg", buf, "image/jpeg")},
            data={"crop":crop,"mode":"auto"}, timeout=30)
        buf.seek(0)
        p = r2.json()
        OK(f"/predict [{crop}] -> '{p.get('predicted_class','?')}' ({p.get('confidence',0):.1f}%) via [{p.get('method','?')}]")
    api_ok = True
except Exception as e:
    FAIL(f"API error: {e}")

# ── Summary ────────────────────────────────────────────────────
sep("SUMMARY")
for label, status in [("YOLO", yolo_ok), ("EfficientNet", eff_ok),
                       ("MobileNetV2", mob_ok), ("Live API", api_ok)]:
    print(f"  {'[PASS]' if status else '[FAIL]'} {label}")
passed = sum([yolo_ok, eff_ok, mob_ok, api_ok])
print(f"\n  Result: {passed}/4 checks passed\n")
