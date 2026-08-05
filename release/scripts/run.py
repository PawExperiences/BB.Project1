#!/usr/bin/env python3
"""run.py -- serves the game locally on http://localhost:8080 and opens it.
Run from the repository root. Ctrl-C to stop."""
import http.server
import threading
import webbrowser
import os
import sys

PORT = 8080
URL  = f"http://localhost:{PORT}/index.html"

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/../..")
    handler = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(("", PORT), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    print(f"Serving on {URL}  (Ctrl-C to stop)")
    webbrowser.open(URL)
    try:
        t.join()
    except KeyboardInterrupt:
        print("\nStopped.")
        httpd.shutdown()

if __name__ == "__main__":
    main()
