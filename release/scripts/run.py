#!/usr/bin/env python3
"""run.py — starts a local HTTP server on port 8080 serving the repo root.
Use when testing over http:// (e.g. DevTools profiling); file:// still works without this."""
import os
import http.server
import socketserver

PORT = 8080

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(root, "..", ".."))
    os.chdir(repo_root)
    print(f"Serving e2e space invaders from: {repo_root}")
    print(f"Open http://localhost:{PORT}/index.html in your browser.")
    print("Press Ctrl+C to stop.")
    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda self, fmt, *args: None  # suppress request noise
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    main()
