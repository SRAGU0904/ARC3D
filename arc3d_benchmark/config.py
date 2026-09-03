from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


DEFAULT_AZURE_RESPONSES_URL = (
    "https://ch-interns-gpt4.openai.azure.com"
    "/openai/responses?api-version=2025-04-01-preview"
)
DEFAULT_AZURE_DEPLOYMENT = "gpt-5.6-sol"
DEFAULT_MAX_OUTPUT_TOKENS = 30_000


DEFAULT_VIEWS = [
    "face-px",
    "face-nx",
    "face-py",
    "face-ny",
    "face-pz",
    "face-nz",
    "corner-nx-py-pz",
    "corner-px-py-pz",
    "corner-nx-ny-pz",
    "corner-px-ny-pz",
    "corner-nx-py-nz",
    "corner-px-py-nz",
    "corner-nx-ny-nz",
    "corner-px-ny-nz",
]


@dataclass(frozen=True)
class BenchmarkConfig:
    root: Path
    task_id: str
    model: str = DEFAULT_AZURE_DEPLOYMENT
    azure_endpoint: str = DEFAULT_AZURE_RESPONSES_URL
    max_output_tokens: int = DEFAULT_MAX_OUTPUT_TOKENS
    image_detail: str = "auto"
    view_policy: str = "all"
    output_dir: Path = Path("benchmark_results")
    image_root_name: str = "rendered_puzzle_images"
    examples: tuple[str, ...] = ("example1", "example2")
    test_name: str = "test"
    candidate_labels: tuple[str, ...] = ("A", "B", "C", "D", "E")
    views: list[str] = field(default_factory=lambda: list(DEFAULT_VIEWS))
    dry_run: bool = False

    @property
    def image_root(self) -> Path:
        return self.root / self.image_root_name
