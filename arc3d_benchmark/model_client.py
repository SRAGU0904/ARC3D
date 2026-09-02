from __future__ import annotations

import json
import os
import urllib.error
import urllib.request


def responses_url(endpoint: str) -> str:
    normalized = endpoint.rstrip("/")
    if normalized.endswith("/openai/v1/responses"):
        return normalized
    if normalized.endswith("/openai/v1"):
        return f"{normalized}/responses"
    return f"{normalized}/openai/v1/responses"


def call_azure_openai(
    endpoint: str,
    deployment: str,
    messages: list[dict],
    max_output_tokens: int,
) -> dict:
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Set AZURE_OPENAI_API_KEY before running the benchmark.")
    if not endpoint:
        raise RuntimeError("Set AZURE_OPENAI_ENDPOINT or pass --azure-endpoint.")
    if not deployment:
        raise RuntimeError("Set AZURE_OPENAI_DEPLOYMENT or pass --model with the deployment name.")

    url = responses_url(endpoint)

    payload = {
        "model": deployment,
        "input": messages,
        "max_output_tokens": max_output_tokens,
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Azure OpenAI API error {error.code}: {body}") from error


def output_text(response: dict) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"]

    chunks: list[str] = []
    for item in response.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                chunks.append(content["text"])
    return "\n".join(chunks).strip()
