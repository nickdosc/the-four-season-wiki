#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
echo '=== DAUGHTER OF THE MOON WIKI — LOCAL PREVIEW ==='
echo 'Open http://127.0.0.1:8765/ in your browser.'
echo 'Press Ctrl+C to stop the preview. Nothing will be published.'
python3 -m http.server 8765 --bind 127.0.0.1
