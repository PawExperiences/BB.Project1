#!/usr/bin/env python3
"""Serve the built static game (index.html, game.js, etc.) over HTTP for local testing."""
import http.server
import os
import socketserver

PORT = int(os.environ.get("PORT", "8000"))


def main():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if not os.path.exists(os.path.join(root, "index.html")):
        root = os.getcwd()
    os.chdir(root)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        print("serving %s at http://127.0.0.1:%d/index.html (Ctrl+C to stop)" % (root, PORT))
        print("the game also runs directly via file://%s/index.html" % root)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("stopping server")


if __name__ == "__main__":
    main()
