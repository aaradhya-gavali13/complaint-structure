import os
import sys
from pathlib import Path

# Ensure root directory is on sys.path and PYTHONPATH for reloaders
root_dir = str(Path(__file__).resolve().parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
os.environ["PYTHONPATH"] = root_dir + os.pathsep + os.environ.get("PYTHONPATH", "")

from backend.app.main import app
from backend.app.classifier import (
    classify_complaint,
    SYSTEM_PROMPT,
    ALLOWED_DEPARTMENTS,
    ALLOWED_PRIORITIES,
)
from backend.app.schemas import (
    ClassifyRequest as ComplaintRequest,
    ClassifyResponse as ComplaintResponse,
    ComplaintCreateRequest,
    ComplaintCreateResponse,
    ComplaintTrackResponse,
)

__all__ = [
    "app",
    "classify_complaint",
    "ComplaintRequest",
    "ComplaintResponse",
    "ComplaintCreateRequest",
    "ComplaintCreateResponse",
    "ComplaintTrackResponse",
    "SYSTEM_PROMPT",
    "ALLOWED_DEPARTMENTS",
    "ALLOWED_PRIORITIES",
]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("complaint:app", host="0.0.0.0", port=8000, reload=True)