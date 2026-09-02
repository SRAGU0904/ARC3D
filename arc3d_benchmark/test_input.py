from __future__ import annotations

from .dataset import PuzzleCase
from .payload import image_part


def test_content(test: PuzzleCase, detail: str, view_policy: str) -> list[dict]:
    policy_note = (
        "All views are provided at once."
        if view_policy == "all"
        else "Only the initial -z view is provided; future versions may request more views by action."
    )
    content: list[dict] = [
        {
            "type": "input_text",
            "text": (
                f"{test.name}: rendered views of the held-out puzzle. {policy_note} "
                "Do not assume the answer is shown. Infer the correct choice from the examples."
            ),
        }
    ]
    content.extend(image_part(path, detail) for path in test.images)
    return content
