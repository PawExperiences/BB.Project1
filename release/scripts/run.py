#!/usr/bin/env python3
"""Serve the built static site from dist/ for local review."""
import functools
import http.server
import os
import socketserver
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST_DIR = os.path.join(REPO_ROOT, "dist")
PORT = int(os.environ.get("PORT", "4321"))


def main():
    if not os.path.isdir(DIST_DIR):
        print("dist/ not found. Run release/scripts/release.py (or npm ci && npm run build) first.")
        sys.exit(1)

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), handler) as httpd:
        print("Serving {} at http://0.0.0.0:{}/".format(DIST_DIR, PORT))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Stopping server.")


if __name__ == "__main__":
    main()
