from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


class NoCacheRequestHandler(SimpleHTTPRequestHandler):
    """Serve project files without letting the browser reuse stale copies."""

    project_root: Path

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
        if not requested.is_dir():
            requested = self.project_root

        files = [
            path
            for path in requested.iterdir()
            if path.is_file() and path.suffix in {".html", ".js", ".css"}
        ]
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
    server = ThreadingHTTPServer(("", args.port), handler)

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
