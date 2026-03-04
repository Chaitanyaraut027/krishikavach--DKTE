from ultralytics import YOLO
import torch

def train_model():
    print("Torch Version:", torch.__version__)
    print("CUDA Available:", torch.cuda.is_available())

    if torch.cuda.is_available():
        print("GPU:", torch.cuda.get_device_name(0))
        print("VRAM (GB):", round(torch.cuda.get_device_properties(0).total_memory / 1e9, 2))

    model = YOLO("yolov8s.pt")

    model.train(
        data="D:/crop_dataset/data.yaml",
        epochs=50,
        imgsz=640,
        batch=16,
        device=0,
        workers=4
    )

if __name__ == "__main__":
    train_model()
