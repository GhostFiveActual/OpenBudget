#!/usr/bin/env python3
"""Local-only fallback server for OpenBudget source builds."""
from __future__ import annotations

import argparse
import os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser

HOST = "127.0.0.1"
PORT = 8765


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve OpenBudget only on this computer.")
    parser.add_argument("--open", action="store_true", help="Open the local URL in the default browser.")
    args = parser.parse_args()
    os.chdir(Path(__file__).resolve().parent)
    try:
        server = ThreadingHTTPServer((HOST, PORT), SimpleHTTPRequestHandler)
    except OSError:
        print(f"OpenBudget could not start because local port {PORT} is already in use.")
        print("Close the other local server/application using that port, then try again.")
        return 1
    url = f"http://{HOST}:{PORT}"
    print(f"OpenBudget local-only mode: {url}", flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
