from __future__ import annotations

from dataclasses import dataclass, field
import os
from pathlib import Path


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
    model: str = field(default_factory=lambda: os.environ.get("AZURE_OPENAI_DEPLOYMENT", ""))
    azure_endpoint: str = field(default_factory=lambda: os.environ.get("AZURE_OPENAI_ENDPOINT", ""))
    max_output_tokens: int = 64
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
