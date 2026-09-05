from __future__ import annotations

import argparse
import json
from pathlib import Path

from .config import (
    DEFAULT_AZURE_DEPLOYMENT,
    DEFAULT_AZURE_RESPONSES_URL,
    DEFAULT_MAX_OUTPUT_TOKENS,
    DEFAULT_REASONING_EFFORT,
    BenchmarkConfig,
)
from .runner import run_benchmark


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ARC3D image-choice benchmark.")
    parser.add_argument("--task", type=int, choices=[1, 2, 3], required=True, help="Task number to evaluate.")
    parser.add_argument(
        "--model",
        default=DEFAULT_AZURE_DEPLOYMENT,
        help=f"Azure OpenAI deployment name (default: {DEFAULT_AZURE_DEPLOYMENT}).",
    )
    parser.add_argument(
        "--reasoning-effort",
        choices=["none", "low", "medium", "high", "xhigh", "max"],
        default=DEFAULT_REASONING_EFFORT,
        help=f"Reasoning effort (default: {DEFAULT_REASONING_EFFORT}).",
    )
    parser.add_argument(
        "--azure-endpoint",
        default=DEFAULT_AZURE_RESPONSES_URL,
        help="Complete Azure Responses API URL.",
    )
    parser.add_argument(
        "--max-output-tokens",
        type=int,
        default=DEFAULT_MAX_OUTPUT_TOKENS,
        help=f"Maximum model output tokens (default: {DEFAULT_MAX_OUTPUT_TOKENS}).",
    )
    parser.add_argument("--image-detail", choices=["low", "auto", "high"], default="auto")
    parser.add_argument("--view-policy", choices=["all", "neg-z-first"], default="all")
    parser.add_argument("--dry-run", action="store_true", help="Build the prompt without calling the model.")
    parser.add_argument("--output-dir", default="benchmark_results", help="Directory for JSON results.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent.parent
    config = BenchmarkConfig(
        root=root,
        task_id=f"task{args.task}",
        model=args.model,
        reasoning_effort=args.reasoning_effort,
        azure_endpoint=args.azure_endpoint,
        max_output_tokens=args.max_output_tokens,
        image_detail=args.image_detail,
        view_policy=args.view_policy,
        output_dir=root / args.output_dir,
        dry_run=args.dry_run,
    )
    result = run_benchmark(config)
    accuracy = "skipped" if result["accuracy"] is None else f"{result['accuracy']:.3f}"
    correct = "skipped" if result["correct"] is None else str(result["correct"])
    print(
        f"task={result['task_id']} model={result['model']} "
        f"effort={result['reasoning_effort']} correct={correct} accuracy={accuracy}"
    )
    print(f"expected={result['expected']} predicted={result['predicted']}")
    print("\nmodel_response:")
    print(result["raw_output"] or "[No output text returned]")
    usage = result.get("usage") or {}
    print("\ntoken_usage:")
    print(f"  input_tokens:  {usage.get('input_tokens', 'unavailable')}")
    print(f"  output_tokens: {usage.get('output_tokens', 'unavailable')}")
    print(f"  total_tokens:  {usage.get('total_tokens', 'unavailable')}")
    if usage.get("input_tokens_details"):
        print(f"  input_details: {json.dumps(usage['input_tokens_details'], ensure_ascii=False)}")
    if usage.get("output_tokens_details"):
        print(f"  output_details: {json.dumps(usage['output_tokens_details'], ensure_ascii=False)}")
    print(f"saved={result['result_path']}")


if __name__ == "__main__":
    main()
