#!/usr/bin/env python3
"""run.py — local HTTP server for e2e Space Invaders.
Serves the repository root on http://localhost:8080 and opens index.html
in the default browser. Use this for HTTP-based testing; the game also
works via file:// without this server.
Run from the repository root."""
import http.server
import os
import sys
import threading
import webbrowser

PORT = 8080
URL = f"http://localhost:{PORT}/index.html"

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/../../")
    print(f"[run.py] Serving e2e Space Invaders at {URL}")
    print("[run.py] Press Ctrl+C to stop.")
    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda self, fmt, *args: None  # suppress noise
    server = http.server.HTTPServer(("", PORT), handler)
    # Open browser after a short delay to let server start
    threading.Timer(0.5, lambda: webbrowser.open(URL)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[run.py] Server stopped.")

if __name__ == "__main__":
    main()
