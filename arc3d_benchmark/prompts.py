from __future__ import annotations

from .config import BenchmarkConfig
from .dataset import TaskCase
from .examples import example_content
from .test_input import test_content


SYSTEM_PROMPT = (
    "You are solving 3D visual reasoning puzzles. "
    "Use the two solved examples to infer the rule, then answer the test. "
    "Return only JSON in this exact shape: {\"answer\":[\"A\"]}. "
    "For multi-select tasks, include every selected letter in the array. "
    "Do not include explanation."
)


def build_input(task: TaskCase, config: BenchmarkConfig) -> list[dict]:
    messages = [{"role": "system", "content": [{"type": "input_text", "text": SYSTEM_PROMPT}]}]
    for example in task.examples:
        messages.append({"role": "user", "content": example_content(example, config.image_detail)})
    messages.append({"role": "user", "content": test_content(task.test, config.image_detail, config.view_policy)})
    messages.append(
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "Choose from A, B, C, D, and E if visible. Output JSON only.",
                }
            ],
        }
    )
    return messages
