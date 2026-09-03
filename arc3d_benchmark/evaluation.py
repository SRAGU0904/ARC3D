from __future__ import annotations

import json
import re


def normalize_answer(text: str, labels: tuple[str, ...] = ("A", "B", "C", "D", "E")) -> set[str]:
    allowed = set(labels)
    stripped = text.strip()

    parsed = parse_answer_object(stripped)
    if parsed is not None:
        return answer_from_object(parsed, allowed)

    final_section = stripped.rsplit("FINAL_ANSWER:", maxsplit=1)[-1]
    last_line = next((line.strip() for line in reversed(final_section.splitlines()) if line.strip()), "")
    return normalize_value(last_line, allowed)


def parse_answer_object(text: str) -> dict | None:
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = None

    if is_answer_object(parsed):
        return parsed

    search_text = text.rsplit("FINAL_ANSWER:", maxsplit=1)[-1]
    decoder = json.JSONDecoder()
    matches: list[dict] = []
    for index, character in enumerate(search_text):
        if character != "{":
            continue
        try:
            candidate, _ = decoder.raw_decode(search_text[index:])
        except json.JSONDecodeError:
            continue
        if is_answer_object(candidate):
            matches.append(candidate)
    return matches[-1] if matches else None


def is_answer_object(value: object) -> bool:
    return isinstance(value, dict) and any(key in value for key in ("answer", "choice", "repairs"))


def answer_from_object(parsed: dict, allowed: set[str]) -> set[str]:
    value = parsed.get("answer", parsed.get("choice", parsed.get("repairs", [])))
    return normalize_value(value, allowed)


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
