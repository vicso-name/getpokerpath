# GetPokerPath — GitHub repository setup

The repository is intended to be **public**, owned by GitHub account `vicso-name`, and called `getpokerpath`. The GitHub connector available during preparation could not create a repository, so it must first be created using the authenticated GitHub CLI on your Mac or the GitHub website.

## Option A — GitHub CLI (preferred)

From a folder where you want the repository to appear:

```bash
gh auth status
gh repo create vicso-name/getpokerpath --public --description "GetPokerPath — interactive poker learning tools, trainers and calculators (Astro + React + TypeScript)" --clone
cd getpokerpath
```

If `gh` is not installed, install it using `brew install gh`, then authenticate with `gh auth login`. Do **not** paste tokens into the repo or chat.

Unzip the **contents** of the latest GetPokerPath Claude Code starter kit into this repository root (so `CLAUDE.md` and `.gitignore` sit next to `docs/`), then run:

```bash
git status --short
git check-ignore -v .env references/New_Poker_Project_Final_15_Tools_SEO_SERP_Blueprint_2026-10-30.xlsx
git add .
git diff --cached --name-only  # review what will be public
git commit -m "docs: bootstrap GetPokerPath project and guard secrets"
git push -u origin HEAD
```

Review `git diff --cached --name-only` before committing. `git add .` obeys the `.gitignore` but cannot protect files that were previously committed; in that case use `git rm --cached PATH` and rotate any exposed credentials.

## Option B — GitHub website

Open https://github.com/new, select owner `vicso-name`, name `getpokerpath`, set **Public**, create the repository (empty is fine). Clone its actual HTTPS URL and then follow the unzip/commit steps above.

## What goes public?

- **Track:** `CLAUDE.md`, `README_START_HERE.md`, `docs/`, `data/seo-pages.json`, app code and tests.
- **Keep local:** `references/*.xlsx`, private exports/CSV/ZIP, environment variables, API keys, local databases, `node_modules`, build output, temporary Claude settings.
- **Review manually:** `references/*.md` (they are not ignored by default). Delete sensitive notes before publishing.

The planned site origin is `https://getpokerpath.com`; this alone does not configure DNS or launch a website.
