from __future__ import annotations

from .config import BenchmarkConfig
from .dataset import TaskCase
from .examples import example_content
from .test_input import test_content


SYSTEM_PROMPT = (
    "You are solving 3D visual reasoning puzzles. "
    "Use the two solved examples to infer the rule, then answer the test. "
    "First provide a concise explanation of the inferred rule, your approach, "
    "and the key visual evidence supporting your choice. "
    "For multi-select tasks, include every selected letter in the array. "
    "End with a separate final line in this exact format: "
    "FINAL_ANSWER: {\"answer\":[\"A\"]}."
)


def view_order_text(config: BenchmarkConfig) -> str:
    selected_views = config.views if config.view_policy == "all" else ["face-nz"]
    views = ", ".join(f"{index}={view}" for index, view in enumerate(selected_views, start=1))
    return (
        "Image view order is fixed and must be interpreted exactly as follows: "
        f"{views}. Each image is also preceded by its own matching view label."
    )


def build_input(task: TaskCase, config: BenchmarkConfig) -> list[dict]:
    messages = [
        {
            "role": "system",
            "content": [
                {"type": "input_text", "text": SYSTEM_PROMPT},
                {"type": "input_text", "text": view_order_text(config)},
            ],
        }
    ]
    for example in task.examples:
        messages.append({"role": "user", "content": example_content(example, config.image_detail)})
    messages.append({"role": "user", "content": test_content(task.test, config.image_detail, config.view_policy)})
    messages.append(
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": (
                        "Choose from A, B, C, D, and E if visible. Explain your solution "
                        "concisely, then end with FINAL_ANSWER followed by the answer JSON."
                    ),
                }
            ],
        }
    )
    return messages
