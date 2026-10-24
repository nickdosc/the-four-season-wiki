# Daughter of the Moon Wiki

**A living, player-safe campaign encyclopedia for _The Daughter of the Moon_.**

**Custom domain:** `https://daughterofthemoon.quest/` — becomes live only **after you buy the domain**, point DNS at GitHub Pages, enable Pages in the repository, and GitHub issues HTTPS certificates. Registration and DNS settings are managed by the domain owner, not by this ZIP. No domain ownership or online publication is implied by this package.

The original project folder and repository slug remain `the-four-season-wiki` to **preserve existing Git history, browser drafts, editor API paths and existing links**. This is a technical implementation detail; the public branding is **Daughter of the Moon Wiki**. "The Four Seasons" remains the *Party* article, with the original ID `the-four-seasons`, and links to it are unchanged.

## Features

- Player-safe adventure notes and **33 starter pages**, with wiki-to-wiki hyperlinks and automatic cross-links for recognizable article names.
- Text editor with live Markdown preview, `[[Article]]` references, manually labeled links, and complete new article creation.
- Upload character portraits, cover artwork, maps, and illustrations; local drafts and image storage, plus JSON backup/restore.
- Public wiki reading requires no account. Publishing from the site requires a short-lived fine-grained GitHub token limited to **only** the `nickdosc/the-four-season-wiki` repository with *Contents: Read and write* permission; token stays in memory during the page session.
- Dark moonlit medieval styling, extra stars, non-flickering hover states, accessible reduced-motion support, mobile layout.
- Static website using free GitHub Pages hosting. No subscription or custom backend required.

## Linux Mint: fresh install or guarded upgrade from previous wiki

1. Download **Daughter_Of_The_Moon_Wiki_v1_2_20261024.zip** to `~/Downloads/`.
2. Run the single terminal command in the ChatGPT conversation to unzip into a temporary location and invoke `tools/install_upgrade_linux.sh`.
3. This installs or upgrades `~/Development/the-four-season-wiki` without deleting articles, images, drafts, Git configuration, or other custom files. Any changed/unknown application files cause a **safe stop** rather than silent overwrite. It writes a backup under `~/Downloads` before an upgrade.
4. Verify and preview:

```bash
cd ~/Development/the-four-season-wiki
./tools/verify_linux.sh
./tools/preview_linux.sh
```

Preview at `http://127.0.0.1:8765/`. Press Ctrl+C to stop the server. Do not open index.html as `file://` because `data/pages.json` requires an HTTP load.

### Intentional GitHub publication

The repo backend stays `nickdosc/the-four-season-wiki`. Use one of these **only after** reviewing player-safe content:

```bash
# If no local .git exists and no repo is published online yet:
./tools/publish_linux.sh --confirm-public

# If this exact local repo has already been published to origin/main:
./tools/publish_linux.sh --confirm-update
```

The `--confirm-public` form creates the **public** GitHub repository, commits the packaged site, pushes, and activates GitHub Pages when possible. The update form checks the account, repository origin, current `main`, absence of unrelated local changes and exact remote-HEAD correspondence, then performs an ordinary non-force push. The scripts never publish unless you explicitly specify a confirmation flag. They refuse unrelated repositories or diverged branches. No action is performed on your computer until you run these commands locally.

After acquiring ownership of the custom domain, you may add `--domain-owned` to the appropriate publication command to add the `CNAME` file and request the Pages custom domain in GitHub (the domain flag is **not** an ownership verification service):

```bash
./tools/publish_linux.sh --confirm-public --domain-owned
# OR, if already published:
./tools/publish_linux.sh --confirm-update --domain-owned
```

Do not claim a domain before buying it. If GitHub rejects Pages automation, open **Repository Settings → Pages**, choose **Deploy from a branch → main → /(root)**, and set **Custom domain → daughterofthemoon.quest** after purchase.

## DNS setup for `daughterofthemoon.quest`

At your domain registrar's DNS manager, point the bare domain to the four official GitHub Pages **A** records. Enter four records, all with host `@`:

| Type | Host | Value |
|---|---|---|
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |

For the optional `www.daughterofthemoon.quest` alias, add one `CNAME` with host `www` and value **`nickdosc.github.io`** (without the `/the-four-season-wiki/` path). Don't use wildcard DNS. Remove conflicting registrar default/parking records where necessary; keep any TXT records used by ownership verification. `dig daughterofthemoon.quest +short A` can verify the four IP values after DNS propagates.

Then check **GitHub → repository Settings → Pages** for DNS verification and toggle **Enforce HTTPS** when available. GitHub's DNS/HTTPS provisioning can take time; having the ZIP and records alone does not mean the domain is live. You may also verify the domain under GitHub's **Settings → Pages → Verify domain** using the GitHub-provided TXT value (not included here because verification values are account-specific).

Official instructions: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Editing articles and artwork

Click **New entry** or **Edit this article**, write Markdown, add `[[Bramwell Elixor|Bramwell]]` links or insert images using the toolbar, and **Save draft**. Saving only changes browser-local state. Open **Edit wiki** → **Publish to GitHub** to send changes using a fine-grained PAT belonging to an authorized contributor with Contents read/write on the wiki repository. Do not paste any GitHub credential into this chat or into wiki articles.

Backup your work through the editor's export control regularly. When moving from a `github.io` origin to a custom domain, **the browser treats them as different sites** and local drafts will NOT move automatically: export on the old URL and restore from the JSON backup at the new URL. Previously published content is shared through GitHub and remains available without this migration.

The source file `data/pages.json` contains all public articles. **Never rerun `tools/build_seed.py`** over a customized site: it is an initial seed generator and would replace the content data. Uploaded image files live under `assets/uploads/`. Every article, image and commit in the PUBLIC repo can be inspected by anyone, including old Git history. Review spoilers, personal information and artwork rights before publication.

## Attributions

Unofficial Dungeons & Dragons / Forgotten Realms fan campaign encyclopedia, not affiliated with or endorsed by Wizards of the Coast. Only include content and original artwork you have permission to publish publicly.
