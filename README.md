# Daughter of the Moon Wiki · V2.0 — The Living Atlas

**Public address:** https://daughterofthemoon.quest/  
**Existing GitHub backend:** `nickdosc/the-four-season-wiki` — intentionally **not renamed**, so article publishing, Git history, Pages and the custom domain continue working.  
**Public audience:** players in *The Daughter of the Moon*. **No DM-only repository content.**

## What's new in V2

- **75 linked entries** (original 33 + 42 new), including locations and people from the supplied Saga I recap.
- **19 editable journal entries:** the supplied **Saga I Sessions 1–17** condensed into player-facing recaps, plus two entries for **confirmed** Saga II events at Kestrel Ford and Thamor. These are summaries; the original DOCX has not been republished verbatim.
- **Three-region interactive atlas:** Sword Coast, Threskel & Thamor, and Shadowfell. **18 pins and 15 routes**. Click pins for wiki details, move them in edit mode, or manage coordinates and routes. This is a narrative schematic, **not an accurate geographical or travel-time map**.
- **Editable relationship constellation:** 37 hand-curated relationships; focus any article to see its neighbors, plus links discovered from article text. Add/remove labeled connections. The interface deliberately shows at most 12 immediate links at once to prevent clutter; select another focal article to keep exploring.
- **Initially empty quest board:** add your own quest title, contact, description, reward, status and image. Supports `[[wiki links]]`. Nothing is seeded or shown as an open quest until an editor posts one.
- **Portraits and galleries:** sample, replaceable, fantasy-themed artwork for the original four adventurers, cover images and galleries editable from any article. Art is illustrative, **not approved canonical player portraits**; replace as desired.
- Animated travel routes, pulsing pins, drifting constellations, hover polish and reduced-motion support. Responsive for phones and desktop.
- Browser draft storage and GitHub publisher continue from V1; **quests, pins, routes, galleries and connections now travel with `data/pages.json`** in one reviewed commit. A failed publication leaves local drafts intact.

## Edit from the browser

Open **Edit wiki** to publish after writing. Anyone can browse, but an editor needs a **fine-grained GitHub personal access token**, restricted to `nickdosc/the-four-season-wiki`, with **Contents: Read and write**. The editor token is kept only in memory and is never committed or saved in local storage. Do not paste it into an article or share it.

When you add/edit an article, quest, map pin, relationship or session, **Save draft** first. This changes **your current browser's local draft**, not other players' views. **Edit wiki → Publish to GitHub** sends the updated JSON and any new images. The publisher fetches the remote JSON and refuses to overwrite it if another editor changed it since your page loaded. If it refuses, export your backup, refresh, and reconcile before publishing.

Changes drafted on one device are **not visible on another device** until published. Use **Download complete backup** and **Restore backup** if moving unpublished work across devices. GIF images have tighter size limits; static uploads are converted and optimized to WebP. Article markdown supports headings, links, images, quotes and lists.

## Session-workflow suggestions

1. Open `https://daughterofthemoon.quest/#/quests` on the device you plan to edit from. Add a new quest and save a local draft as the party receives it.
2. Change the status as events unfold. To make the change visible to the players on their own devices, publish from **Edit wiki** using your restricted token.
3. After the session, open `#/journal`, select **New journal entry** and write a recap. The article editor's *Saga* and *Session number* fields determine its timeline position.
4. Use `#/atlas` for new places or routes, `#/connections` for newly revealed character relationships. Only enter details already known to the players.

## Linux Mint — safe V1.2 → V2 upgrade

Download the V2 ZIP. From Downloads, the package's folder is `daughter-of-the-moon-wiki-v2`. The upgrade expects the existing published project at `~/Development/the-four-season-wiki` and checks:

- Existing `main` branch and expected GitHub remote.
- Clean working tree, then fetches and checks **exact agreement with `origin/main`** before making any changes. If browser editing has changed GitHub since your local clone was last updated, the installer stops instead of overwriting it.
- Exact hashes of the V1.2 shipped theme/tools, refusing to overwrite a manually modified file.
- Current articles, extra entries, uploaded images, `CNAME`, and Git history.
- All new pages and image references before copying code, and full read-only verification afterward.

The installer saves a complete backup of affected files in `~/Downloads/daughter-wiki-before-v2-*`. **No commit, push, branch reset, force-push, or domain setting is performed.** On failure during installation, it restores all affected files.

Run from a verified extracted ZIP:

```bash
bash "${TEMP_FOLDER}/daughter-of-the-moon-wiki-v2/tools/install_upgrade_linux.sh"
```

After reviewing the upgrade report, publishing is separately authorized with:

```bash
cd "$HOME/Development/the-four-season-wiki"
./tools/publish_linux.sh --confirm-update --domain-owned
```

This intentionally retains the existing GitHub Pages/domain configuration; it does not reconfigure HTTPS if the custom domain is already present. No `--force` push is used.

### Inspect before publishing

```bash
cd "$HOME/Development/the-four-season-wiki"
./tools/verify_linux.sh
python3 tools/smoke_test.py # optional: Chromium + Python Playwright installed
python3 tools/check_content.py
git diff --stat
git status --short
```

Preview locally with `./tools/preview_linux.sh`, then visit `http://127.0.0.1:8765/`.

## Data model and maintenance

`data/pages.json` remains the **only** editable JSON database for the public wiki. It has `schema:1` (backward-compatible with old browser drafts) and the fields:

- `pages`: `{id,title,category,summary,aliases,facts,cover,gallery,body,session?}`. `session` is an optional `{saga,number}`.
- `atlas`: `{regions,pins,routes,connections}`. Pin coordinates use percentages from `0` to `100`; they are **editorial placement**, not geographic coordinates.
- `quests`: an initially empty array of `{id,title,status,giver,body,reward,image}`.

The legacy `tools/build_seed.py` intentionally **does not rewrite data** anymore. V2 content is live and editable; running an outdated seed generator could erase progress, so that action has been disabled.

The provided artwork was generated as illustrative campaign-themed art and may be replaced. It is not an official Dungeons & Dragons or Forgotten Realms asset. This is an unofficial fan campaign wiki, without game publisher affiliation.

## Spoiler safety

Private session planning, unintroduced characters, unrevealed character backstories, and future villains **must not be placed anywhere in this repository**. A hidden web tab, a CSS rule or an inaccessible link is not access control in a GitHub Pages project. If you need private DM records, store them separately in a **private repository** rather than this public site.
