#!/usr/bin/env python3
"""Serve the Space Invaders game locally and open it in a browser.

WHAT IT DOES
  Starts a read-only static file server (Python's standard-library http.server)
  rooted at the repository root, so index.html and every ES module are fetched
  over http:// - the transport browsers require for <script type="module">,
  because Chrome and Edge refuse module imports from a file:// origin (the
  origin is null and the CORS check fails).  Then it opens
  http://localhost:<port>/index.html.

WHEN TO RUN IT
  Whenever you want to play or smoke-test the game: the manual verification step
  of the release runbook, or after downloading and unzipping the release
  artifact.  Ctrl-C stops the server.

It writes nothing and serves only.  Idempotent: if something already answers on
the port it reports that and exits rather than starting a second server.

Standard library only.  Python 3.7+.
"""

import argparse
import functools
import os
import socket
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

DEFAULT_PORT = 8080


def say(message):
    print("[run] " + message)


def port_is_busy(port):
    probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    probe.settimeout(0.5)
    try:
        return probe.connect_ex(("127.0.0.1", port)) == 0
    except socket.error:
        return False
    finally:
        probe.close()


def main():
    parser = argparse.ArgumentParser(description="Serve the Space Invaders game locally.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT,
                        help="port to serve on (default: %d)" % DEFAULT_PORT)
    parser.add_argument("--root", default=None,
                        help="directory to serve (default: the repository root)")
    parser.add_argument("--no-browser", action="store_true",
                        help="do not open a browser window")
    args = parser.parse_args()

    here = os.path.dirname(os.path.abspath(__file__))
    if args.root:
        root = os.path.abspath(args.root)
    else:
        root = os.path.abspath(os.path.join(here, "..", ".."))

    if not os.path.isfile(os.path.join(root, "index.html")):
        say("index.html was not found in " + root)
        say("run this from the repository (release/scripts/run.py) or pass --root <dir>")
        return 1

    url = "http://localhost:%d/index.html" % args.port

    if port_is_busy(args.port):
        say("port %d is already serving - not starting a second server" % args.port)
        say("open " + url)
        return 0

    say("serving %s at %s" % (root, url))
    say("controls: ENTER starts and restarts, Left/Right or A/D move, Space fires")
    say("press Ctrl-C here to stop the server")

    handler = functools.partial(SimpleHTTPRequestHandler, directory=root)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        say("stopped")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
