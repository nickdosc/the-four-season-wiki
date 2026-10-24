#!/usr/bin/env bash
# Read-only preflight: no Git modifications or publishing.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
echo '=== DAUGHTER OF THE MOON WIKI — PREFLIGHT ==='
for program in python3 git;do command -v "$program" >/dev/null || { echo "FAIL: Missing $program";exit 1;};done
for file in index.html assets/app.js assets/style.css assets/favicon.svg data/pages.json .nojekyll;do
 [[ -f "$file" ]] || { echo "FAIL: Missing $file";exit 1; }
done
python3 tools/check_content.py
python3 - <<'PY'
from pathlib import Path
import json
root=Path('.')
html=(root/'index.html').read_text(encoding='utf-8')
js=(root/'assets/app.js').read_text(encoding='utf-8')
data=json.loads((root/'data/pages.json').read_text(encoding='utf-8'))
assert '<title>Daughter of the Moon Wiki' in html, 'Wrong HTML title'
assert 'DAUGHTER OF THE MOON' in html, 'Wrong header'
assert "document.createTextNode('Daughter of the')" in js, 'Wrong homepage hero'
assert data.get('siteName')=='Daughter of the Moon Wiki', 'Wrong data siteName'
party=next(p for p in data['pages'] if p['id']=='the-four-seasons')
assert party['title']=='The Four Seasons' and party['category']=='Party', 'Missing Four Seasons party entry'
print('PASS: Correct wiki identity and preserved The Four Seasons party entry')
if (root/'CNAME').exists():
 assert (root/'CNAME').read_text().strip()=='daughterofthemoon.quest', 'Unexpected CNAME'
 print('DOMAIN: daughterofthemoon.quest configured in working directory')
else:
 print('DOMAIN: Not activated in this directory yet; requires confirmed ownership')
PY
if command -v node >/dev/null;then node --check assets/app.js && echo 'PASS: JavaScript syntax';fi
if command -v gh >/dev/null;then
 login="$(gh api user --jq .login 2>/dev/null || true)"
 echo "GitHub: ${login:-not connected}"
else echo 'NOTE: GitHub CLI missing, required only to publish';fi
if [[ -d .git ]];then echo '--- Git status ---';git status --short;git branch --show-current;else echo 'No local Git repository yet.';fi
echo 'PASS: Preflight complete. No files modified.'
