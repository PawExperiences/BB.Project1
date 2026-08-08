#!/usr/bin/env python3
"""run.py — Serve the game locally and open it in the default browser.
Run from the repository root. Opens http://localhost:8080/index.html.
This is optional: the game also works directly via a file:// URL.
"""
import http.server
import os
import sys
import threading
import webbrowser

PORT = 8080
URL = f"http://localhost:{PORT}/index.html"


def serve():
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda self, fmt, *args: None  # silence request log
    with http.server.HTTPServer(("", PORT), handler) as httpd:
        print(f"[run] Serving on {URL}  (Ctrl+C to stop)")
        httpd.serve_forever()


if __name__ == "__main__":
    t = threading.Thread(target=serve, daemon=True)
    t.start()
    print(f"[run] Opening {URL} in your default browser...")
    webbrowser.open(URL)
    try:
        t.join()
    except KeyboardInterrupt:
        print("\n[run] Server stopped.")
