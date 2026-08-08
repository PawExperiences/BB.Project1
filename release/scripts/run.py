#!/usr/bin/env python3
"""run.py -- Serve the game locally on http://localhost:8080 and open it.
Run from the repository root. Requires Python 3 stdlib only.
Use only when file:// is insufficient; the game works without a server.
"""
import http.server
import threading
import webbrowser
import os
import sys

PORT = 8080
URL = f"http://localhost:{PORT}/index.html"

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    # Serve from repo root (two levels up from release/scripts/)
    repo_root = os.path.join(root, '..', '..')
    repo_root = os.path.realpath(repo_root)
    os.chdir(repo_root)
    print(f"Serving {repo_root} on {URL}")

    handler = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(('localhost', PORT), handler)

    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    print(f"Opening {URL} in default browser...")
    webbrowser.open(URL)
    print("Press Ctrl+C to stop.")
    try:
        thread.join()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.shutdown()

if __name__ == '__main__':
    main()
