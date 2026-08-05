#!/usr/bin/env python3
"""run.py — Serves the Space Invaders game on http://localhost:8080.
Useful for browsers that restrict ES module imports over file://.
NOTE: The game is also fully playable by opening index.html directly
from the filesystem (file:// URL) — no server is required."""
import http.server
import os
import sys
import webbrowser

PORT = 8080
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        print(f"[run] {self.address_string()} - {fmt % args}")


def main():
    os.chdir(ROOT)
    print(f"[run] Serving '{ROOT}' at http://localhost:{PORT}")
    print(f"[run] Open http://localhost:{PORT}/index.html in your browser.")
    print("[run] Press Ctrl+C to stop.")
    url = f"http://localhost:{PORT}/index.html"
    try:
        webbrowser.open(url)
    except Exception:
        pass
    with http.server.HTTPServer(("localhost", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[run] Server stopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()
