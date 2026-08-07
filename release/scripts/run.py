#!/usr/bin/env python3
"""run.py — serve the project over HTTP and open index.html in the browser.
Use when file:// ES module loading is restricted. Serves on http://localhost:8080."""
import http.server
import threading
import webbrowser
import os
import sys

PORT = 8080
URL = f"http://localhost:{PORT}/index.html"

# Change to repo root (parent of release/scripts)
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(repo_root)
print(f"[run] Serving '{repo_root}' at {URL}")
print("[run] Press Ctrl+C to stop.")

handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(('', PORT), handler)

t = threading.Timer(0.5, lambda: webbrowser.open(URL))
t.daemon = True
t.start()

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\n[run] Server stopped.")
    httpd.server_close()
    sys.exit(0)
