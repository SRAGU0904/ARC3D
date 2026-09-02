from __future__ import annotations

import json
import re


def normalize_answer(text: str, labels: tuple[str, ...] = ("A", "B", "C", "D", "E")) -> set[str]:
    allowed = set(labels)
    stripped = text.strip()

    try:
        parsed = json.loads(stripped)
    except json.JSONDecodeError:
        parsed = None

    if isinstance(parsed, dict):
        value = parsed.get("answer", parsed.get("choice", parsed.get("repairs", [])))
        return normalize_value(value, allowed)
    return normalize_value(stripped, allowed)


def normalize_value(value: object, allowed: set[str]) -> set[str]:
    if isinstance(value, str):
        return {letter for letter in re.findall(r"\b[A-Z]\b", value.upper()) if letter in allowed}
    if isinstance(value, list):
        return {str(item).strip().upper() for item in value if str(item).strip().upper() in allowed}
    return set()


def evaluate(prediction_text: str, expected: set[str], labels: tuple[str, ...]) -> dict:
    predicted = normalize_answer(prediction_text, labels)
    correct = predicted == expected
    return {
        "predicted": sorted(predicted),
        "expected": sorted(expected),
        "correct": correct,
        "accuracy": 1.0 if correct else 0.0,
    }
