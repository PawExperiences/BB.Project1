#!/usr/bin/env python3
"""run.py — serve e2e Space Invaders on localhost:8080 and open in browser.
Usage: python release/scripts/run.py [--port 8080]"""
import argparse
import http.server
import os
import threading
import webbrowser

def main():
    parser = argparse.ArgumentParser(description="Serve Space Invaders locally")
    parser.add_argument("--port", type=int, default=8080, help="TCP port (default 8080)")
    args = parser.parse_args()

    # Resolve repo root (two levels up from release/scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root  = os.path.abspath(os.path.join(script_dir, "..", ".."))
    os.chdir(repo_root)
    print(f"Serving {repo_root} on http://localhost:{args.port}")

    handler = http.server.SimpleHTTPRequestHandler
    server  = http.server.HTTPServer(("", args.port), handler)

    url = f"http://localhost:{args.port}/index.html"
    print(f"Opening {url} ...")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        print("Press Ctrl+C to stop.")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    main()
