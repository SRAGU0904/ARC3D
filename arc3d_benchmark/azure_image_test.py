from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from .model_client import call_azure_openai, output_text
from .payload import image_part


DEFAULT_IMAGE = Path("rendered_puzzle_images/task1/test/face-nz.png")
DEFAULT_PROMPT = (
    "Describe exactly what you can see in this ARC3D puzzle image. "
    "Mention the voxel structure, colors, visible labels, and spatial arrangement."
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Send one local image to Azure OpenAI and report token usage."
    )
    parser.add_argument(
        "--image",
        type=Path,
        default=DEFAULT_IMAGE,
        help=f"Image to send (default: {DEFAULT_IMAGE}).",
    )
    parser.add_argument("--prompt", default=DEFAULT_PROMPT, help="Question to ask about the image.")
    parser.add_argument(
        "--image-detail",
        choices=["low", "auto", "high"],
        default="auto",
        help="Vision detail level sent to the API.",
    )
    parser.add_argument(
        "--max-output-tokens",
        type=int,
        default=300,
        help="Maximum output tokens, including reasoning tokens.",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("AZURE_OPENAI_DEPLOYMENT", ""),
        help="Azure deployment name (defaults to AZURE_OPENAI_DEPLOYMENT).",
    )
    parser.add_argument(
        "--azure-endpoint",
        default=os.environ.get("AZURE_OPENAI_ENDPOINT", ""),
        help="Azure endpoint (defaults to AZURE_OPENAI_ENDPOINT).",
    )
    parser.add_argument(
        "--save-response",
        type=Path,
        help="Optional path for saving the complete JSON response.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    image_path = args.image.expanduser().resolve()
    if not image_path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": f"Image view: {image_path.stem}. {args.prompt}",
                },
                image_part(image_path, args.image_detail),
            ],
        }
    ]
    response = call_azure_openai(
        args.azure_endpoint,
        args.model,
        messages,
        args.max_output_tokens,
    )

    usage = response.get("usage") or {}
    print(f"image: {image_path}")
    print(f"deployment: {args.model}")
    print(f"image_detail: {args.image_detail}")
    print("\nmodel_response:")
    print(output_text(response) or "[No output text returned]")
    print("\ntoken_usage:")
    print(f"  input_tokens:  {usage.get('input_tokens', 'unavailable')}")
    print(f"  output_tokens: {usage.get('output_tokens', 'unavailable')}")
    print(f"  total_tokens:  {usage.get('total_tokens', 'unavailable')}")

    input_details = usage.get("input_tokens_details")
    output_details = usage.get("output_tokens_details")
    if input_details:
        print(f"  input_details: {json.dumps(input_details, ensure_ascii=False)}")
    if output_details:
        print(f"  output_details: {json.dumps(output_details, ensure_ascii=False)}")

    if args.save_response:
        save_path = args.save_response.expanduser().resolve()
        save_path.parent.mkdir(parents=True, exist_ok=True)
        save_path.write_text(json.dumps(response, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nraw_response_saved: {save_path}")


if __name__ == "__main__":
    main()
