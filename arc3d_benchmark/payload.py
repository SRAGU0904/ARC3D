from __future__ import annotations

import base64
from pathlib import Path


def image_part(path: Path, detail: str) -> dict:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return {
        "type": "input_image",
        "image_url": f"data:image/png;base64,{encoded}",
        "detail": detail,
    }
