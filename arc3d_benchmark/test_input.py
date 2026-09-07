from __future__ import annotations

from .dataset import PuzzleCase
from .payload import labeled_image_parts


def test_content(
    test: PuzzleCase,
    detail: str,
    view_policy: str,
    *,
    has_examples: bool = True,
) -> list[dict]:
    policy_note = (
        "All views are provided at once."
        if view_policy == "all"
        else "Only the initial -z view is provided; future versions may request more views by action."
    )
    inference_note = (
        "Do not assume the answer is shown. Infer the correct choice from the examples."
        if has_examples
        else "No solved examples are provided. Infer both the task and the correct choice from this puzzle alone."
    )
    content: list[dict] = [
        {
            "type": "input_text",
            "text": (
                f"{test.name}: rendered views of the held-out puzzle. {policy_note} "
                f"{inference_note}"
            ),
        }
    ]
    content.extend(labeled_image_parts(test.images, detail))
    return content
