# Decap → Sveltia CMS Migration Plan

> **For agentic workers:** This project has **no automated test suite** — verification is
> functional (CMS login + test edit) and a byte-diff of generated content against a baseline.
> Steps use checkbox (`- [ ]`) syntax. Execute phase-by-phase; each phase ends in a checkpoint
> that must pass before continuing. Several steps are **manual external actions** (GitHub /
> Netlify dashboards) that cannot be scripted — follow the exact click-paths given.

**Goal:** Replace Decap CMS with Sveltia CMS on the Eleventy site, swapping the deprecated
git-gateway + Netlify Identity auth for GitHub OAuth via Netlify's OAuth provider, while keeping
the existing content model and generated output unchanged.

**Architecture:** The CMS is a static SPA passthrough-copied from `src/admin` to `/admin` by
Eleventy. We swap one `<script>` tag (Decap → Sveltia), change the `backend` block in
`config.yml` from `git-gateway` to `github`, and stand up a GitHub OAuth app registered with
Netlify so editors log in with a GitHub account. Content lives in the repo on branch `decap` and
is unchanged.

**Tech Stack:** Eleventy 3 · Sveltia CMS (CDN bundle) · GitHub backend · Netlify (host + OAuth
provider).

## Global Constraints

- **Repo:** `g41nxe/11ty-matthew-freed-pottery-web` (GitHub, SSH remote already configured).
- **CMS branch:** `decap` — must match the branch Netlify deploys from. **Confirm in Phase 0.**
- **Editor:** non-technical (potter). Login must be a single "Log in with GitHub" click — no PAT,
  no multi-step setup. Editor needs one free GitHub account added as a repo collaborator.
- **Content model is frozen:** do not change any collection/field in `config.yml` except the
  `backend`/`local_backend`/`omit_empty_optional_fields` keys called out below. The 700-line
  schema must keep producing identical `src/views/**/*.md` and `src/views/_data/*.json` output.
- **Date storage format is load-bearing:** `.eleventy.js` parses dates with Luxon
  `'MM-dd-yyyy'`. The CMS must continue writing `MM-DD-YYYY` strings to `events.json` / `news.json`.
- **No editorial workflow, no nested collections, no custom widgets** are in use today, so none of
  Sveltia's unsupported-feature gaps affect this site.

---

## 1. Starting Point

| Item | Current value |
|---|---|
| CMS | Decap 3.14.0, CDN bundle in `src/admin/index.html` |
| Backend | `git-gateway`, `branch: decap`, `local_backend: true` |
| Auth | Netlify Identity (passwordless email) — **deprecated** |
| Admin route | `/admin` (Eleventy passthrough `src/admin` → `admin` in `.eleventy.js`) |
| Collections | All **file/singleton** collections (no folder collections) |
| Custom widgets | `src/admin/custom-widgets.js` — **never loaded** (not referenced in `index.html`) and **never referenced** in `config.yml`. Dead code. |
| Local dev | `npm run dev:cms` → `decap-server` proxy (added in commit `e7bf65e`) |
| Netlify config | `src/netlify.toml` sets only `PYTHON_VERSION`; build cmd + publish dir + branch live in the Netlify dashboard |
| `docs/` | gitignored — this plan is local-only, like the prior migration plan |

## 2. Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Target CMS | **Sveltia CMS** | Reads existing `config.yml` near-verbatim; lowest migration cost |
| Backend | `github` | git-gateway unsupported by Sveltia + deprecated by Netlify |
| Auth provider | **Netlify as OAuth provider** | Zero extra infra; default Sveltia auth flow; site already on Netlify |
| Local dev | **Sveltia local mode** (browser File System Access API) | Replaces `decap-server`: repoint `npm run cms` at the dev server; drop the now-redundant `dev:cms` |
| Output shape | add `omit_empty_optional_fields: true` | Sveltia keeps empty optional fields by default; this restores Decap's output so templates and diffs stay stable |
| Custom widgets | **delete** `custom-widgets.js` | Dead code; `registerWidget` unsupported by Sveltia anyway |
| Branch model | keep `decap` as CMS + deploy branch | No change to current deploy flow |

## 3. Unsupported-feature audit (all clear)

Sveltia will not implement: git-gateway, Netlify Identity widget, editorial workflow, open
authoring, nested collections, `registerWidget`, `registerPreviewTemplate`, Bitbucket/Azure
backends. **None are used by this site** — confirmed by reading `config.yml` and `index.html`.

---

## 4. Phased Plan

### Phase 0 — Prep & safety

- [ ] **Confirm the Netlify production branch.** In Netlify → Site configuration → Build & deploy
  → Continuous deployment, read "Production branch". It must equal the `branch` in `config.yml`
  (expected: `decap`). If it differs, use that value everywhere `decap` appears below.

```bash
# Confirm remote + current branch locally
cd 11ty-matthew-freed-pottery-web
git remote -v          # expect git@github.com:g41nxe/11ty-matthew-freed-pottery-web.git
git branch --show-current   # expect decap
git status --short     # expect clean working tree
```

- [ ] **Create the migration branch** off `decap`:

```bash
git checkout decap
git pull --ff-only
git checkout -b feat/sveltia-cms
```

- [ ] **Capture an output baseline** (used later to prove content output is unchanged). Build the
  current Decap-era site and stash a copy of the generated content-bearing files:

```bash
npm run build
cp -r dist /tmp/baseline-dist
# Also snapshot the source data files the CMS writes to:
cp src/views/_data/events.json src/views/_data/news.json src/views/_data/seo.json /tmp/baseline-src 2>/dev/null || (mkdir -p /tmp/baseline-src && cp src/views/_data/events.json src/views/_data/news.json src/views/_data/seo.json /tmp/baseline-src)
```

- [ ] **Checkpoint:** On branch `feat/sveltia-cms`, clean tree, baseline saved, production branch
  name confirmed.

---

### Phase 1 — GitHub OAuth app + Netlify OAuth provider (replaces git-gateway auth)

> External/manual. This is the only genuinely new infrastructure. Do it before swapping the
> bundle so login works the moment the new CMS deploys.

- [ ] **Register a GitHub OAuth App.** GitHub → Settings → Developer settings → OAuth Apps →
  **New OAuth App**:
  - Application name: `Matthew Freed Pottery CMS`
  - Homepage URL: `https://matthewfreed.ca`
  - **Authorization callback URL:** `https://api.netlify.com/auth/done`
  - Click **Register application**, then **Generate a new client secret**. Copy the **Client ID**
    and **Client Secret**.

- [ ] **Install the provider in Netlify.** Netlify → Site configuration → Access & security →
  **OAuth** → Authentication providers → **Install provider** → **GitHub** → paste the Client ID
  and Client Secret → **Install**.

- [ ] **Grant the editor access.** GitHub → repo → Settings → Collaborators → add the editor's
  GitHub username with **Write** access. (They accept the email invite once.)

- [ ] **Checkpoint:** GitHub OAuth app exists with the Netlify callback URL; Netlify shows GitHub
  under installed OAuth providers; editor invited. (Login is verified in Phase 3 once the new
  bundle is deployed.)

---

### Phase 2 — Swap the CMS bundle + config

- [ ] **Swap the script tag** in `src/admin/index.html`. Replace the Decap line:

```html
<!-- before -->
<script src="https://unpkg.com/decap-cms@^3.14.0/dist/decap-cms.js"></script>
<!-- after -->
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
```

- [ ] **Rewrite the `backend` block** at the top of `src/admin/config.yml`. Replace lines 1–5:

```yaml
# before
backend:
  name: git-gateway
  branch: decap

local_backend: true
```

```yaml
# after
backend:
  name: github
  repo: g41nxe/11ty-matthew-freed-pottery-web
  branch: decap

omit_empty_optional_fields: true
```

Notes:
- `local_backend: true` is removed — Sveltia's local mode needs no proxy server.
- `omit_empty_optional_fields: true` restores Decap's "drop empty optional fields" output so the
  generated JSON/front-matter stays byte-stable. If a byte-diff in Phase 3 still shows new empty
  keys, confirm the exact key name against the Sveltia config docs and adjust.
- Leave `site_url`, `locale`, `media_folder`, `public_folder`, `editor.preview`, and every
  collection untouched.

- [ ] **Delete the dead custom-widgets file:**

```bash
git rm src/admin/custom-widgets.js
```

(No `<script>` reference to remove — `index.html` never loaded it.)

- [ ] **Update the local-CMS scripts** in `package.json`. The `cms`/`dev:cms` scripts added in
  commit `e7bf65e` drove Decap's `decap-server` proxy, which Sveltia ignores (it uses the
  browser's File System Access API instead). Repoint `cms` at the dev server so `npm run cms`
  still launches what an editor opens at `/admin`, and drop `dev:cms` (now identical to `dev`):

```jsonc
// before
"cms": "npx decap-server",
"dev": "npm-run-all clean styles:dev eleventy:default --parallel styles:watch eleventy:watch eleventy:serve --print-label",
"dev:cms": "npm-run-all --parallel cms dev --print-label",
```

```jsonc
// after — `cms` now just starts the dev server; open http://localhost:8080/admin
// and click "Work with Local Repository" (Chromium-based browser required)
"cms": "npm-run-all clean styles:dev eleventy:default --parallel styles:watch eleventy:watch eleventy:serve --print-label",
"dev": "npm-run-all clean styles:dev eleventy:default --parallel styles:watch eleventy:watch eleventy:serve --print-label",
```

`cms` and `dev` are now the same pipeline; `cms` is kept as the editor-facing alias. Leave
`build` unchanged.

- [ ] **Build locally to confirm the admin still passes through and the site compiles:**

```bash
npm run build
```

Expected: build completes with no errors; `dist/admin/index.html` contains the `@sveltia/cms`
script tag; `dist/admin/config.yml` shows the `github` backend.

- [ ] **Diff generated content against baseline** (proves the bundle/config swap changed no site
  output — at this point no CMS edits have happened, so it must be identical):

```bash
diff -r /tmp/baseline-dist/images dist/images && echo "images OK"
# Spot-check a rendered page or two for unintended diffs:
diff /tmp/baseline-dist/index.html dist/index.html || echo "review any diff above"
```

Expected: no differences (admin bundle aside).

- [ ] **Commit:**

```bash
git add src/admin/index.html src/admin/config.yml package.json
git commit -m "feat: migrate CMS from Decap to Sveltia (GitHub backend)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Checkpoint:** Local build green, admin bundle is Sveltia, site output identical to baseline.

---

### Phase 3 — Auth + functional verification (deploy preview)

- [ ] **Push the branch and open a Netlify Deploy Preview** (or a branch deploy) so the CMS runs
  on a real `*.netlify.app` URL — OAuth via Netlify requires a hosted origin, it will not complete
  from `file://` or a bare localhost without the proxy:

```bash
git push -u origin feat/sveltia-cms
```

Open the PR/branch deploy URL, then visit `<deploy-url>/admin`.

- [ ] **Log in with GitHub.** Click "Log in with GitHub" → authorize → confirm you land in the
  Sveltia dashboard with all collections listed (Pages, News & Events, Global Settings, FAQ).

- [ ] **Verify existing content loads.** Open 3 representative entries and confirm fields are
  populated, not blank:
  - `Pages → Home` (deeply nested objects/lists)
  - `News & Events → Events` (datetime + boolean list)
  - `Global Settings → SEO Settings` (image widget)

- [ ] **Low-risk write test.** In `Global Settings → SEO Settings`, make a trivial edit (e.g.,
  append a space to Description, then remove it) and **Save/Publish**. Confirm a commit appears on
  branch `decap`'s history on GitHub authored via the OAuth flow.

- [ ] **DateTime regression test (highest risk).** Edit an entry in `News & Events → Events`
  (change nothing meaningful, just re-save), then pull and inspect the stored format:

```bash
git fetch origin decap
git show origin/decap:src/views/_data/events.json | grep -i '"date"'
```

Expected: dates still in `MM-DD-YYYY` form (e.g., `"date": "07-15-2026"`). If Sveltia rewrote them
to ISO or another format, **stop** — either set the field's `date_format`/`picker_utc` explicitly
to force `MM-DD-YYYY`, or update the three Luxon parse calls in `.eleventy.js` accordingly. Do not
proceed until the build renders event dates correctly.

- [ ] **Output-shape diff.** After the test saves, byte-diff the changed data file against the
  baseline to confirm `omit_empty_optional_fields` is keeping output stable:

```bash
git show origin/decap:src/views/_data/seo.json > /tmp/after-seo.json
diff /tmp/baseline-src/seo.json /tmp/after-seo.json || echo "review: unexpected empty/extra keys?"
```

Expected: only your intentional edit differs; no spray of new empty `""`/`{}` keys.

- [ ] **Checkpoint:** Editor can log in via GitHub, all collections load, a save commits to
  `decap`, date format preserved, no output drift.

---

### Phase 4 — Cleanup & cutover

- [ ] **Merge to the deploy branch.** Open and merge the PR `feat/sveltia-cms → decap` (squash or
  merge per repo norm). Netlify auto-deploys `decap`.

- [ ] **Verify production `/admin`.** Visit `https://matthewfreed.ca/admin`, log in with GitHub,
  do one real-but-trivial save, confirm the site rebuilds and the change is live.

- [ ] **Disable Netlify Identity** (no longer used). Netlify → Site configuration → Identity →
  **Disable Identity**. Also remove the **Git Gateway** entry under Identity → Services if present.
  This prevents confusion and closes the deprecated auth path.

- [ ] **Update docs.** In `README.md`, replace Decap setup/run instructions with Sveltia:
  - Login is now "Log in with GitHub" (editor must be a repo collaborator).
  - Local editing: run `npm run cms`, open `http://localhost:8080/admin`, choose **"Work with
    Local Repository"** (Chromium-based browser required — Sveltia uses the File System Access API;
    no `decap-server` proxy anymore).

```bash
git add README.md
git commit -m "docs: update CMS instructions for Sveltia

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push
```

- [ ] **Final checkpoint:** Production `/admin` logs in via GitHub, a real edit round-trips and
  deploys, Netlify Identity disabled, README updated.

---

## 5. Rollback

Low-risk and fast at any point before Phase 4's Identity removal:

```bash
git revert <bundle-swap-commit>   # restores Decap index.html + git-gateway config
```

git-gateway/Identity remain configured in Netlify until Phase 4, so reverting the bundle swap
returns the site to the working Decap setup with no dashboard changes needed. After Identity is
disabled (Phase 4), rollback additionally requires re-enabling Identity + Git Gateway in Netlify.

## 6. Effort

Phase 1 (OAuth wiring) and Phase 3 (verification) dominate; the actual code change is ~4 lines
across two files plus one deletion. Realistically a focused half-day, most of it spent on the
GitHub/Netlify dashboard wiring and the date-format verification.
