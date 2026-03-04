import zipfile
import os

source_dir = r'C:\Users\hp\Desktop\best.pt'
output_pt  = r'C:\Users\hp\Desktop\krishikavach--DKTE\crop_project\runs\detect\train\weights\best.pt'

# Remove empty/broken file if exists
if os.path.isfile(output_pt):
    os.remove(output_pt)

with zipfile.ZipFile(output_pt, 'w', compression=zipfile.ZIP_STORED) as zf:
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname   = os.path.relpath(file_path, source_dir)
            zf.write(file_path, arcname)
            print(f"  Added: {arcname}")

size = os.path.getsize(output_pt)
print(f'\nDone! Repacked best.pt -> {output_pt}')
print(f'File size: {size / (1024*1024):.2f} MB')
