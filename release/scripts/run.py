#!/usr/bin/env python3
"""Serve the built e2e quote page (dist/) locally for a smoke check.

Run this after `npm run build` (or release/scripts/release.py) to view
the shipped static site at http://127.0.0.1:4173 (or $PORT).
"""
import http.server
import os
import socketserver
import subprocess
import sys


def main():
    repo_root = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    dist_dir = os.path.join(repo_root, "dist")
    port = int(os.environ.get("PORT", "4173"))

    if not os.path.exists(os.path.join(dist_dir, "index.html")):
        print("ERROR: " + dist_dir + "/index.html not found. Run 'npm ci && npm run build' first.")
        sys.exit(1)

    os.chdir(dist_dir)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
        print("Serving " + dist_dir + " at http://127.0.0.1:" + str(port) + " (Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
