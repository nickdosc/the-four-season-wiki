#!/usr/bin/env bash
# GitHub Pages publication for Daughter of the Moon Wiki.
# Never overwrites an unrelated repository, force-pushes, or alters local Git history without consent.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OWNER=nickdosc
REPO=the-four-season-wiki  # The established backend name, intentionally preserved for upgrades and editor API compatibility.
DOMAIN=daughterofthemoon.quest
args=" $* "
echo '=== DAUGHTER OF THE MOON WIKI — GUARDED GITHUB PUBLICATION ==='
if [[ "$#" -gt 2 ]] || { [[ "$#" -eq 2 ]] && [[ "${1:-}" == "${2:-}" ]]; }; then echo 'STOP: Unexpected arguments';exit 1;fi
for a in "$@";do
 case "$a" in --confirm-public|--confirm-update|--domain-owned) ;; *) echo "STOP: Unknown argument $a";exit 1;; esac
done
if [[ "$args" == *' --confirm-public '* && "$args" == *' --confirm-update '* ]];then echo 'STOP: Choose first publication OR update';exit 1;fi
if [[ "$args" == *' --domain-owned '* ]];then
 echo "Domain ownership explicitly confirmed for $DOMAIN."
else echo 'Domain ownership NOT confirmed; this script will not add/claim the custom domain.';fi
./tools/verify_linux.sh
for program in git gh python3;do command -v "$program" >/dev/null || { echo "STOP: $program is missing";exit 1;};done
LOGIN="$(gh api user --jq .login)"
[[ "$LOGIN" == "$OWNER" ]] || { echo "STOP: GitHub login $LOGIN, expected $OWNER";exit 1; }
[[ -n "$(git config user.name || true)" && -n "$(git config user.email || true)" ]] || { echo 'STOP: Set Git author name and email';exit 1; }
if [[ "$args" != *' --confirm-public '* && "$args" != *' --confirm-update '* ]];then
 echo 'DRY RUN ONLY. Use --confirm-public to create a new public repository, or --confirm-update to publish an existing repo.'
 echo 'Add --domain-owned only after you have purchased the domain and checked ownership.'
 exit 0
fi
if [[ -f CNAME ]] && [[ "$(cat CNAME)" != "$DOMAIN" ]];then
 echo "STOP: CNAME already points at a different domain: $(cat CNAME)"; exit 1
fi
if [[ -d .git ]];then
 [[ "$args" == *' --confirm-update '* ]] || { echo 'STOP: Existing Git history found; use --confirm-update for a guarded existing-repo publish.';exit 1; }
 [[ "$(git branch --show-current)" == main ]] || { echo 'STOP: Not on the main branch';exit 1; }
 REMOTE="$(git remote get-url origin || true)"
 case "$REMOTE" in
  "https://github.com/$OWNER/$REPO"|"https://github.com/$OWNER/$REPO.git"|"git@github.com:$OWNER/$REPO"|"git@github.com:$OWNER/$REPO.git") ;;
  *) echo "STOP: Unexpected origin remote: $REMOTE";exit 1;;
 esac
 git diff --cached --quiet || { echo 'STOP: Staged changes exist; refusing to include unrelated changes';exit 1; }
 gh repo view "$OWNER/$REPO" --json name >/dev/null || { echo 'STOP: Expected remote repo cannot be accessed';exit 1; }
 git fetch origin main
 [[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || { echo 'STOP: Local main and origin/main differ. No changes pushed; reconcile Git history manually.';exit 1; }
 python3 - <<'PY'
import subprocess,sys
allowed={'index.html','assets/app.js','assets/style.css','assets/favicon.svg','README.md','data/pages.json','.nojekyll','.gitignore','CNAME',
 'tools/preview_linux.sh','tools/publish_linux.sh','tools/verify_linux.sh','tools/install_upgrade_linux.sh','tools/upgrade_safe.py','tools/build_seed.py','tools/check_content.py','tools/smoke_test.py'}
items=subprocess.check_output(['git','status','--porcelain','-z','--untracked-files=all']).decode().split('\0')
for row in items:
 if not row:continue
 path=row[3:]
 if path not in allowed and not path.startswith('assets/uploads/'):
  print('STOP: Unrecognized Git change:',path);sys.exit(1)
print('PASS: Only wiki files are changed in the existing Git working tree')
PY
else
 [[ "$args" == *' --confirm-public '* ]] || { echo 'STOP: New repo publication requires --confirm-public';exit 1; }
 if gh repo view "$OWNER/$REPO" --json name >/dev/null 2>&1;then echo 'STOP: Expected repo exists online; first-publication script will not take it over.';exit 1;fi
fi
if [[ "$args" == *' --domain-owned '* && ! -e CNAME ]];then printf '%s\n' "$DOMAIN" > CNAME;fi
# CNAME is deliberately opt-in; GitHub Pages can be used without a purchased domain.
python3 tools/check_content.py
if [[ ! -d .git ]];then
 git init -b main
 git add -A
 git commit -m 'feat: publish Daughter of the Moon Wiki'
 gh repo create "$OWNER/$REPO" --public --source=. --remote=origin --push --description 'Player-safe Daughter of the Moon D&D campaign encyclopedia'
else
 files=(index.html assets/app.js assets/style.css assets/favicon.svg README.md data/pages.json .nojekyll .gitignore
  tools/preview_linux.sh tools/publish_linux.sh tools/verify_linux.sh tools/install_upgrade_linux.sh tools/upgrade_safe.py tools/build_seed.py tools/check_content.py tools/smoke_test.py)
 if [[ -f CNAME ]];then files+=(CNAME);fi
 git add -- "${files[@]}"
 if [[ -d assets/uploads ]];then git add -- assets/uploads;fi
 if git diff --cached --quiet; then echo 'PASS: Existing repository already has the current wiki files.'
 else
  git diff --cached --stat
  git commit -m 'feat: rebrand to Daughter of the Moon Wiki'
  git push origin main
 fi
fi
if gh api "repos/$OWNER/$REPO/pages" >/dev/null 2>&1;then
 echo 'PASS: GitHub Pages already enabled.'
else
 if gh api "repos/$OWNER/$REPO/pages" --method POST --input - <<'JSON'
{"source":{"branch":"main","path":"/"}}
JSON
 then echo 'PASS: GitHub Pages enabled.'
 else echo 'NOTICE: Enable Pages manually: Repository Settings > Pages > Deploy from a branch > main / (root).';fi
fi
if [[ "$args" == *' --domain-owned '* ]];then
 if gh api "repos/$OWNER/$REPO/pages" --method PUT -f cname="$DOMAIN" >/dev/null;then
  echo "PASS: GitHub Pages custom domain requested: $DOMAIN"
 else echo 'NOTICE: Set the custom domain manually in Settings > Pages once the domain is owned and DNS is ready.';fi
fi
echo "REPOSITORY: https://github.com/$OWNER/$REPO"
echo "GITHUB PAGES FALLBACK: https://$OWNER.github.io/$REPO/"
echo "CUSTOM DOMAIN TARGET: https://$DOMAIN/ (only after DNS + certificate verification)"
echo 'No force push or branch reset was used.'
