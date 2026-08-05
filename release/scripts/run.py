#!/usr/bin/env python3
"""run.py — Serve the game locally on http://localhost:8080 and open it in the browser.
Use when file:// ES module loading is blocked by browser security policy.
Run from the repository root.
"""
import http.server
import socketserver
import threading
import webbrowser
import os
import sys

PORT = 8080
HOST = "localhost"
URL = f"http://{HOST}:{PORT}/index.html"

class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress per-request logs for cleaner output

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/../..")
    print(f"[run.py] Serving e2e Space Invaders at {URL}")
    print("  Press Ctrl+C to stop.")
    with socketserver.TCPServer((HOST, PORT), SilentHandler) as httpd:
        httpd.allow_reuse_address = True
        threading.Timer(0.5, lambda: webbrowser.open(URL)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[run.py] Server stopped.")

if __name__ == "__main__":
    main()
