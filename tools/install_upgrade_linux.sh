#!/usr/bin/env bash
# V2 guarded in-place upgrade. No implicit Git commit or push.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "$ROOT/tools/upgrade_v2.py"
