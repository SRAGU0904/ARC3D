from __future__ import annotations

from .dataset import PuzzleCase
from .payload import labeled_image_parts


def example_content(example: PuzzleCase, detail: str) -> list[dict]:
    if example.answer is None:
        raise ValueError(f"Example {example.name} is missing answer.txt")

    content: list[dict] = [
        {
            "type": "input_text",
            "text": (
                f"{example.name}: all rendered views of one solved training puzzle. "
                f"Correct answer: {format_answer(example.answer)}."
            ),
        }
    ]
    content.extend(labeled_image_parts(example.images, detail))
    return content


def format_answer(answer: set[str]) -> str:
    return ",".join(sorted(answer))
