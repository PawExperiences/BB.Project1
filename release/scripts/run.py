#!/usr/bin/env python3
"""run.py — serves the game over localhost:8080 and opens it in the default browser.
Use when the browser blocks ES module imports from file:// URLs.
The game also opens directly from disk (no server needed) in most browsers.
"""
import http.server
import threading
import webbrowser
import os
import sys

PORT = 8080
HOST = "127.0.0.1"
URL  = f"http://{HOST}:{PORT}/index.html"

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.chdir(repo_root)

    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda *args: None  # suppress per-request noise

    with http.server.HTTPServer((HOST, PORT), handler) as httpd:
        print(f"Serving e2e Space Invaders at {URL}")
        print("Press Ctrl+C to stop.")
        threading.Timer(0.5, webbrowser.open, args=(URL,)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    main()
