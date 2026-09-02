from __future__ import annotations

import json
from datetime import datetime, timezone

from .config import BenchmarkConfig
from .dataset import load_task
from .evaluation import evaluate
from .model_client import call_openai, output_text
from .prompts import build_input


def run_benchmark(config: BenchmarkConfig) -> dict:
    task = load_task(config)
    messages = build_input(task, config)
    if task.test.answer is None:
        raise ValueError(f"{config.task_id}/{config.test_name} is missing answer.txt")

    if config.dry_run:
        raw_text = ""
        raw_response = {"dry_run": True, "message_count": len(messages)}
        metrics = {
            "predicted": [],
            "expected": sorted(task.test.answer),
            "correct": None,
            "accuracy": None,
            "evaluation_skipped": True,
        }
    else:
        raw_response = call_openai(config.model, messages, config.max_output_tokens)
        raw_text = output_text(raw_response)
        metrics = evaluate(raw_text, task.test.answer, config.candidate_labels)
        metrics["evaluation_skipped"] = False
    result = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "task_id": config.task_id,
        "model": config.model,
        "max_output_tokens": config.max_output_tokens,
        "view_policy": config.view_policy,
        "image_detail": config.image_detail,
        "examples": [case.name for case in task.examples],
        "test": task.test.name,
        "raw_output": raw_text,
        "api_response": raw_response,
        **metrics,
    }

    config.output_dir.mkdir(parents=True, exist_ok=True)
    result_path = config.output_dir / f"{config.task_id}_{config.model}_{timestamp_slug()}.json"
    result["result_path"] = str(result_path)
    result_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def timestamp_slug() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
