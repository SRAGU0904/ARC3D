from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


class NoCacheRequestHandler(SimpleHTTPRequestHandler):
    """Serve project files without letting the browser reuse stale copies."""

    project_root: Path

    def log_request(self, code: int | str = "-", size: int | str = "-") -> None:
        if urlsplit(self.path).path == "/__arc3d_version":
            return
        super().log_request(code, size)

    def do_GET(self) -> None:
        request_url = urlsplit(self.path)
        if request_url.path == "/__arc3d_version":
            scope = parse_qs(request_url.query).get("scope", ["/"])[0]
            payload = self.source_version(scope).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def source_version(self, scope: str) -> str:
        requested = (self.project_root / scope.lstrip("/")).resolve()
        try:
            requested.relative_to(self.project_root)
        except ValueError:
            requested = self.project_root

        requested_page = requested.name if requested.is_file() else None
        if requested.is_file():
            requested = requested.parent
        elif not requested.is_dir():
            requested = self.project_root

        scan_roots = [requested]
        structured_task = self.project_root / "tasks" / requested.name
        if structured_task.is_dir() and structured_task != requested:
            scan_roots.append(structured_task)
        elif requested == self.project_root and requested_page == "documentation.html":
            scan_roots.append(self.project_root / "tasks")

        files = []
        for scan_root in scan_roots:
            candidates = scan_root.rglob("*") if scan_root != self.project_root else scan_root.iterdir()
            files.extend(
                path
                for path in candidates
                if path.is_file() and path.suffix in {".html", ".js", ".css"}
            )
        timestamps = []
        for path in files:
            try:
                timestamps.append(path.stat().st_mtime_ns)
            except FileNotFoundError:
                continue
        return f"{len(timestamps)}:{max(timestamps, default=0)}"

    def end_headers(self) -> None:
        self.send_header(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, max-age=0",
        )
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the ARC3D development website with browser caching disabled."
    )
    parser.add_argument("--port", type=int, default=4181)
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent
    NoCacheRequestHandler.project_root = project_root
    handler = partial(NoCacheRequestHandler, directory=str(project_root))
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)

    print(f"Serving ARC3D at http://localhost:{args.port}/")
    print("Browser caching is disabled and saved web files reload automatically.")
    print("Press Control-C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
