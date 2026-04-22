import os
import cloudinary
import cloudinary.uploader
from pathlib import Path

# Configure Cloudinary
cloudinary.config(
    cloud_name="dvzt8pnwz",
    api_key="847466454541682",
    api_secret="9qL4S28vAcc6ZNYPbxhsRHeT-_k",
    secure=True
)

def upload_folder(folder_path, prefix="media"):
    folder = Path(folder_path)
    for file_path in folder.rglob("*"):
        if file_path.is_file():
            relative_path = file_path.relative_to(folder.parent)
            # Cloudinary usually expects the public_id WITHOUT the extension
            public_id = str(relative_path.with_suffix('')).replace("\\", "/")
            print(f"Uploading {file_path} as {public_id}...")
            cloudinary.uploader.upload(
                str(file_path),
                public_id=public_id,
                overwrite=True,
                resource_type="auto"
            )

if __name__ == "__main__":
    media_dir = Path("a:/burhani hardware and machinery/BURHANI/media")
    upload_folder(media_dir)
    print("Upload complete!")
