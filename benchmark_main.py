from __future__ import annotations

import argparse
import os
from pathlib import Path

from arc3d_benchmark.config import BenchmarkConfig
from arc3d_benchmark.runner import run_benchmark


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ARC3D image-choice benchmark.")
    parser.add_argument("--task", type=int, choices=[1, 2, 3], required=True, help="Task number to evaluate.")
    parser.add_argument(
        "--model",
        default=os.environ.get("AZURE_OPENAI_DEPLOYMENT", ""),
        help="Azure OpenAI deployment name (defaults to AZURE_OPENAI_DEPLOYMENT).",
    )
    parser.add_argument(
        "--azure-endpoint",
        default=os.environ.get("AZURE_OPENAI_ENDPOINT", ""),
        help="Azure resource endpoint (defaults to AZURE_OPENAI_ENDPOINT).",
    )
    parser.add_argument("--max-output-tokens", type=int, default=64, help="Maximum model output tokens.")
    parser.add_argument("--image-detail", choices=["low", "auto", "high"], default="auto")
    parser.add_argument("--view-policy", choices=["all", "neg-z-first"], default="all")
    parser.add_argument("--dry-run", action="store_true", help="Build the prompt without calling the model.")
    parser.add_argument("--output-dir", default="benchmark_results", help="Directory for JSON results.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent
    config = BenchmarkConfig(
        root=root,
        task_id=f"task{args.task}",
        model=args.model,
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
    print(f"task={result['task_id']} model={result['model']} correct={correct} accuracy={accuracy}")
    print(f"expected={result['expected']} predicted={result['predicted']}")
    print(f"saved={result['result_path']}")


if __name__ == "__main__":
    main()
