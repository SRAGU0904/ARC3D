from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .config import BenchmarkConfig
from .evaluation import normalize_answer


@dataclass(frozen=True)
class PuzzleCase:
    name: str
    images: list[Path]
    answer: set[str] | None


@dataclass(frozen=True)
class TaskCase:
    task_id: str
    examples: list[PuzzleCase]
    test: PuzzleCase


def load_task(config: BenchmarkConfig) -> TaskCase:
    task_dir = config.image_root / config.task_id
    if not task_dir.exists():
        raise FileNotFoundError(f"Missing task image directory: {task_dir}")

    examples = [load_puzzle(task_dir, name, config, include_answer=True) for name in config.examples]
    test = load_puzzle(task_dir, config.test_name, config, include_answer=True)
    return TaskCase(task_id=config.task_id, examples=examples, test=test)


def load_puzzle(task_dir: Path, name: str, config: BenchmarkConfig, include_answer: bool) -> PuzzleCase:
    puzzle_dir = task_dir / name
    if not puzzle_dir.exists():
        raise FileNotFoundError(f"Missing puzzle directory: {puzzle_dir}")

    selected_views = select_views(config)
    images = [puzzle_dir / f"{view}.png" for view in selected_views]
    missing = [path for path in images if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Missing rendered images: {missing}")

    answer = None
    answer_path = puzzle_dir / "answer.txt"
    if include_answer and answer_path.exists():
        answer = normalize_answer(answer_path.read_text(encoding="utf-8"), config.candidate_labels)

    return PuzzleCase(name=name, images=images, answer=answer)


def select_views(config: BenchmarkConfig) -> list[str]:
    if config.view_policy == "all":
        return list(config.views)
    if config.view_policy == "neg-z-first":
        return ["face-nz"]
    raise ValueError(f"Unsupported view_policy: {config.view_policy}")
