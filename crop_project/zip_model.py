import zipfile
import os

folder = r"C:\Users\SIMRAN\OneDrive\Desktop\best"
out_zip = r"C:\Users\SIMRAN\OneDrive\Desktop\best_v2.pt"

with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_STORED) as zf:
    for root, dirs, files in os.walk(folder):
        for file in files:
            file_path = os.path.join(root, file)
            # The path inside the zip should be `best/...`
            rel_path = os.path.relpath(file_path, folder)
            arcname = os.path.join("best", rel_path)
            zf.write(file_path, arcname)

print(f"Created {out_zip} successfully!")
