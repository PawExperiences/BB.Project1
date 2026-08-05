#!/usr/bin/env python3
"""run.py – Serve e2e Space Invaders locally and open it in the browser.

Run from the repository root.
Starts Python's built-in HTTP server on port 8080 and opens
http://localhost:8080/index.html in the default browser.
Press Ctrl+C to stop.
"""
import http.server
import os
import threading
import webbrowser

PORT = 8080
URL = f"http://localhost:{PORT}/index.html"


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/../..")
    handler = http.server.SimpleHTTPRequestHandler
    # Suppress request logs to keep output clean
    handler.log_message = lambda *a: None

    with http.server.HTTPServer(("", PORT), handler) as httpd:
        print(f"[run] Serving at {URL}")
        print("[run] Press Ctrl+C to stop.")
        # Open browser after a short delay
        timer = threading.Timer(0.5, webbrowser.open, [URL])
        timer.start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            timer.cancel()
            print("\n[run] Server stopped.")


if __name__ == "__main__":
    main()
