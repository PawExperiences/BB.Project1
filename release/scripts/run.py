#!/usr/bin/env python3
"""run.py — Serves the Space Invaders game on http://localhost:8080 and opens it in the browser.
Use this when you want to test via http:// (e.g. to avoid any browser file:// ES-module restrictions).
The game is also designed to work directly from file:// without a server."""
import os
import sys
import threading
import webbrowser
import http.server
import socketserver

PORT = 8080
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(SCRIPT_DIR, "..", ".."))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress per-request noise

def main():
    os.chdir(REPO_ROOT)
    url = f"http://localhost:{PORT}/index.html"
    print(f"Serving e2e space invaders from {REPO_ROOT}")
    print(f"Opening {url} ...")
    print("Press Ctrl+C to stop.")
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    with socketserver.TCPServer(("localhost", PORT), QuietHandler) as httpd:
        httpd.allow_reuse_address = True
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    main()
