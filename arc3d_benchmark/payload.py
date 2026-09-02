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


def labeled_image_parts(paths: list[Path], detail: str) -> list[dict]:
    content: list[dict] = []
    total = len(paths)
    for index, path in enumerate(paths, start=1):
        content.append(
            {
                "type": "input_text",
                "text": f"View {index}/{total}: {path.stem}",
            }
        )
        content.append(image_part(path, detail))
    return content
