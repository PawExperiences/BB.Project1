#!/usr/bin/env python3
"""run.py — serve the game locally on http://localhost:8080. Run from repo root."""
import http.server
import os
import sys
import webbrowser
import threading

PORT = 8080
DIR = os.path.dirname(os.path.abspath(__file__))
# Serve from repo root (two levels up from release/scripts/)
REPO_ROOT = os.path.abspath(os.path.join(DIR, "..", ".."))

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} - {fmt % args}")

def main():
    os.chdir(REPO_ROOT)
    url = f"http://localhost:{PORT}/index.html"
    print(f"Serving e2e Space Invaders from: {REPO_ROOT}")
    print(f"Open: {url}")
    print("Press Ctrl+C to stop.")
    # Open browser after short delay
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    with http.server.HTTPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    main()
