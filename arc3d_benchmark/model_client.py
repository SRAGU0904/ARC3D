from __future__ import annotations

import json
import http.client
import os
import time
import urllib.error
import urllib.request


def responses_url(endpoint: str) -> str:
    normalized = endpoint.rstrip("/")
    if "/openai/responses?" in normalized or normalized.endswith("/openai/responses"):
        return normalized
    if normalized.endswith("/openai/v1/responses"):
        return normalized
    if normalized.endswith("/openai/v1"):
        return f"{normalized}/responses"
    return f"{normalized}/openai/v1/responses"


def response_url(endpoint: str, response_id: str) -> str:
    url = responses_url(endpoint)
    base, separator, query = url.partition("?")
    result = f"{base.rstrip('/')}/{response_id}"
    return f"{result}?{query}" if separator else result


def read_json(request: urllib.request.Request, timeout: int) -> dict:
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Azure OpenAI API error {error.code}: {body}") from error


def call_azure_openai(
    endpoint: str,
    deployment: str,
    messages: list[dict],
    max_output_tokens: int,
    reasoning_effort: str,
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
        "reasoning": {"effort": reasoning_effort},
        "background": True,
        "store": True,
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

    result = read_json(request, timeout=180)
    response_id = result.get("id")
    status = result.get("status")
    if not response_id:
        raise RuntimeError(f"Azure background response has no id: {result}")

    print(f"background_response id={response_id} status={status}", flush=True)
    deadline = time.monotonic() + 3600
    last_reported_status = status

    while status in {"queued", "in_progress"}:
        if time.monotonic() >= deadline:
            raise RuntimeError(
                f"Azure background response {response_id} did not finish within 3600 seconds."
            )

        time.sleep(5)
        poll_request = urllib.request.Request(
            response_url(endpoint, response_id),
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
            },
            method="GET",
        )
        try:
            result = read_json(poll_request, timeout=60)
        except (urllib.error.URLError, http.client.RemoteDisconnected, TimeoutError) as error:
            print(f"background_response id={response_id} poll_retry={type(error).__name__}", flush=True)
            continue

        status = result.get("status")
        if status != last_reported_status:
            print(f"background_response id={response_id} status={status}", flush=True)
            last_reported_status = status

    if status == "completed":
        return result

    details = result.get("error") or result.get("incomplete_details") or "no details"
    raise RuntimeError(
        f"Azure background response {response_id} ended with status={status}: {details}"
    )


def output_text(response: dict) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"]

    chunks: list[str] = []
    for item in response.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                chunks.append(content["text"])
    return "\n".join(chunks).strip()
