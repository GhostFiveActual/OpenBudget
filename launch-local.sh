#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  echo "OpenBudget local mode requires Python 3. Use the desktop installer for normal use."
  exit 1
fi
exec python3 ./local_server.py --open
