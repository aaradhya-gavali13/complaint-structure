import os
import sys
from pathlib import Path

# Ensure root directory is on sys.path and PYTHONPATH
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
os.environ["PYTHONPATH"] = root_dir + os.pathsep + os.environ.get("PYTHONPATH", "")

import uvicorn

if __name__ == "__main__":
    uvicorn.run("complaint:app", host="0.0.0.0", port=8000, reload=True)
