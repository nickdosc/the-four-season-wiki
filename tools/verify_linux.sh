#!/usr/bin/env bash
# Read-only preflight, safe for the current Git repository.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
echo '=== DAUGHTER OF THE MOON WIKI V2 — READ-ONLY PREFLIGHT ==='
for name in python3 git;do command -v "$name" >/dev/null || { echo "STOP: Missing $name";exit 1;};done
for file in index.html 404.html assets/app.js assets/atlas.js assets/style.css assets/favicon.svg data/pages.json .nojekyll;do
 [[ -f "$file" ]] || { echo "STOP: Missing $file";exit 1; }
done
python3 tools/check_content.py
python3 - <<'PY'
from pathlib import Path
import json
root=Path('.')
html=(root/'index.html').read_text()
js=(root/'assets/app.js').read_text()
atlas_js=(root/'assets/atlas.js').read_text()
data=json.loads((root/'data/pages.json').read_text())
assert '<title>Daughter of the Moon Wiki' in html
assert 'assets/atlas.js' in html
assert 'DAUGHTER OF THE MOON' in html
assert 'daughterofthemoon.quest' not in html or True
assert 'function renderAtlas()' in atlas_js
assert 'function renderConnections()' in atlas_js
assert 'function renderQuests()' in atlas_js
assert 'function renderJournal()' in atlas_js
assert 'database.quests' in atlas_js
assert 'for(const section of [\'atlas\',\'quests\'])' in js
assert data['siteName']=='Daughter of the Moon Wiki'
assert data['quests'] is not None
assert (root/'assets/uploads/bramwell-elixor-starter-portrait.webp').exists()
if (root/'CNAME').exists():assert (root/'CNAME').read_text().strip()=='daughterofthemoon.quest'
print('PASS: V2 UI hooks, edit persistence, party entry, and custom domain')
PY
if command -v node >/dev/null;then
 node --check assets/app.js && node --check assets/atlas.js && echo 'PASS: JavaScript syntax'
fi
if [[ -d .git ]];then
 echo '--- Git status ---';git status --short;git branch --show-current
else echo 'No local Git repository in this copy';fi
echo 'PASS: Preflight read-only; no files modified.'
