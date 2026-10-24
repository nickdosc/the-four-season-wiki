#!/usr/bin/env bash
# Does not close a parent interactive terminal; stops without overwriting custom source changes.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/tools/upgrade_safe.py"
