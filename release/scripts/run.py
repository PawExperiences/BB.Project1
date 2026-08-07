#!/usr/bin/env python3
"""run.py — serve the Space Invaders game over a local HTTP server and open it in the browser.

Use when the browser blocks ES module imports from file:// URLs.
Usage: python3 release/scripts/run.py [--port 8080]
"""
import http.server
import os
import sys
import threading
import webbrowser

def get_port():
    args = sys.argv
    if '--port' in args:
        try:
            return int(args[args.index('--port') + 1])
        except (IndexError, ValueError):
            pass
    return 8080

def main():
    port = get_port()
    # Change to repo root (two levels up from release/scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
    os.chdir(repo_root)
    print(f"Serving {repo_root} on http://localhost:{port}/")
    print("Press Ctrl+C to stop.")

    handler = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(('', port), handler)

    url = f"http://localhost:{port}/index.html"
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    print(f"Opening {url} in your default browser ...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == '__main__':
    main()
