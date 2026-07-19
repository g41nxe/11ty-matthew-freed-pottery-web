# TinaCMS Migration — Design Spec

- **Date:** 2026-07-19
- **Status:** Design approved (grilled); pending spec review → implementation plan
- **Work branch:** `feat/tinacms-migration` (to be cut from `feat/site-redesign-v2`)
- **Supersedes:** the shelved `feat/sveltia-cms-migration` effort (kept, not deleted)

## 1. Context & goal

`11ty-matthew-freed-pottery-web` is an Eleventy site on Netlify, currently edited via **Decap CMS 3.14** with the **`git-gateway`** backend. Netlify Identity is no longer deprecated (Feb 2026 reversal), but **Git Gateway remains deprecated** (no functionality fixes), so moving off the current backend is justified.

The site owner's core pain is Decap's **nested-object editing UX**. After evaluating Sveltia, Keystatic, and TinaCMS, the decision is to migrate to **self-hosted TinaCMS**, chosen for its drill-in sub-window editor for nested content. This spec assumes **self-hosted** (not TinaCloud) and **porting the data model largely as-is**, with a targeted data-cleanup pass first.

**Non-negotiable:** content stays git-committed markdown/JSON in the repo; the public 11ty build must keep working unchanged.

## 2. Reference implementation

Tina publishes an official self-hosted demo built on **11ty + Netlify Functions + MongoDB + Auth.js + GitHub** — [`tinacms/tina-self-hosted-ssg-demo`](https://github.com/tinacms/tina-self-hosted-ssg-demo). This is essentially our stack; we graft its wiring rather than invent it.

Key architecture property (verified against the demo): the **public 11ty build never queries Tina/Mongo** — Eleventy reads markdown/JSON from disk directly. The Tina backend + database serve **only** the `/admin` editing UI. Therefore if Mongo or the Tina function is down, **the live site is unaffected**; only editing is. This meaningfully shrinks the risk surface.

## 3. Locked decisions

| # | Decision |
|---|----------|
| Hosting | Self-hosted Tina backend on Netlify Functions (not TinaCloud) |
| Database | MongoDB Atlas M0 (free), `mongodb-level` adapter |
| Auth | Auth.js (`tinacms-authjs`), stateless **JWT** sessions (no extra DB tables) |
| Users | Two users (owner-dev + Matthew). **No roles exist** in self-hosted Auth.js — both get identical full access |
| Git provider | GitHub via **fine-grained PAT**, scoped to this repo, Contents read/write; owner-dev owns rotation |
| Branch | `feat/tinacms-migration` off `feat/site-redesign-v2`; `GITHUB_BRANCH` = feature branch during dev, flipped to production branch **last** at cutover |
| Admin coexistence | Decap stays at `/admin`; Tina builds to **`/admin-tina`** until proven; cutover swaps Tina→`/admin` and deletes `src/admin` in one commit |
| Dates | Tolerant `parseDate` helper; Tina uses a real `datetime` picker; **no data migration** |
| Structural fields | **Do not model** `layout`/`permalink`/`tags`/`eleventyNavigation` — Tina preserves top-level frontmatter (`resolveLegacyValues`). Model-as-hidden only where we need to set a value |
| Media | Single global root: `publicFolder: "src"`, `mediaRoot: "images"` → stores `/images/…` (matches existing convention). Per-field folders dropped |
| Markdown body | Privacy statement body as Tina `rich-text` (`isBody: true`); accept one-time normalization diff |
| Six `_data` list files | Promoted to **folder collections** (one file per item); `global.json`/`seo.json` stay single-file config collections at current paths |
| FAQ granularity | One file **per section**, each holding a nested `questions` list |
| Template consumption | **Compatibility shim** — per-item files live in `src/content/*` (outside 11ty input); thin `_data/*.js` globs rebuild the existing array shapes → templates + date filters unchanged |
| Pages | Single-file collections; in-page lists (about/process/pottery `sections`, retail `stores`) kept as nested list fields |

## 4. Data cleanup workstream (runs BEFORE schema authoring)

Sequenced first so Tina is configured against the cleaned shape; re-index once, clean. Site keeps building on Decap throughout this phase.

1. **Delete dead SEO placeholder fields** from all pages: `custom_seo_settings`, `ogtype`, `excerpt`, per-page `author`, per-page `image`. Verified unused — they appear only in frontmatter and the old `config.yml`; the base layout calls `{% seo "" %}` (eleventy-plugin-seo reads `seo.json`). Removing empties also reduces null-vs-absent edge cases.
2. **Delete dead `label` field** in about/process/pottery `sections` (never rendered; was a Decap list summary). Tina derives the list-item label from real content via `ui.itemProps`.
3. **Don't model structural fields** — rely on Tina's top-level frontmatter preservation instead of hidden dummies.
4. **Collapse `paragraphs: [string]` → a single markdown body** in about/process/pottery sections. Layout changes from `{% for p in section.paragraphs %}` to rendering one markdown field; data transform joins paragraphs with blank lines.
5. **Flatten single-field wrapper objects** to scalars: `hero.cta_primary:{label}` → `hero.cta_primary`, `gmaps:{key}` → `gmaps_key`, `newsletter:{title}` → `newsletter_title`.

**Deferred (out of scope):** moving events/news `content.body` into the file body (#6); flattening the pervasive `image:{url,alt}` objects (#7).

## 5. Data-model specifics

### Dates
All eight Luxon filters in `.eleventy.js` (`sortByDate`, `date`, `filterFuture`, `filterPast`, `specialEvents`, `groupByVenue`, `nextUp`, `filterFeatured`) route through:

```js
function parseDate(s) {
  return DateTime.fromISO(s).isValid ? DateTime.fromISO(s)
       : DateTime.fromFormat(s, 'MM-dd-yyyy');
}
```

Format-tolerant, so existing `MM-DD-YYYY` items and new Tina-written ISO items coexist. Every template date already routes through the `date` filter (no raw `{{ date }}` rendering), so there is no ISO-string-leak failure mode.

### Ordering (critical)
Splitting the `_data` lists into one-file-per-item **loses array-position ordering**. Add an explicit `order` field to **gallery items, featured items, FAQ sections, and FAQ questions**, and sort by it in the `_data/*.js` shims. Events/news are exempt (they sort by date).

### Media / images
`publicFolder: "src"` + `mediaRoot: "images"` → Tina writes `/images/<file>` and commits the file to `src/images/<file>`, matching today's convention. The `{% img %}` shortcode already prepends `src/`, so stored `/images/…` values resolve. New uploads land in the single `src/images/` root (per-field subfolders dropped); existing subfolder images keep resolving unchanged.

### Hidden field typing (when we do model one)
Use built-in `ui: { component: 'hidden' }` (real but undocumented) or a custom `() => null`. Type must match the data (`type: 'boolean'`, `type: 'object'` with **all** subfields declared) — a type mismatch causes silent coercion/loss, and nested undeclared keys inside a modeled object are **not** preserved (only top-level legacy preservation exists).

## 6. Infrastructure

### Backend function
`netlify/functions/tina.ts` — Express app wrapped in `serverless-http`, mounting `TinaNodeBackend({ authProvider, databaseClient })`, handling GET/POST on `/api/tina/*`. `tina/database.ts` selects `createLocalDatabase()` when `TINA_PUBLIC_IS_LOCAL=true`, else `createDatabase({ gitProvider: GitHubProvider, databaseAdapter: MongodbLevel })`.

### Auth
`AuthJsBackendAuthProvider` + `TinaAuthJSOptions` (JWT strategy). First users seeded via a committed `content/users/index.json` (plaintext password + `passwordChangeRequired: true`, hashed into Mongo on first index; file not authoritative afterward). Password reset = admin toggles `passwordChangeRequired` (no email flow).

### Env vars
`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_PERSONAL_ACCESS_TOKEN` (fine-grained), `MONGODB_URI`, `NEXTAUTH_SECRET`, `TINA_PUBLIC_IS_LOCAL`. Note: `GITHUB_BRANCH` sets both the commit target **and** the Mongo collection namespace, so each branch has its own index.

### Netlify (current settings confirmed)
Build command `npm run build`, publish `dist`, functions dir `netlify/functions` (already set), base `/`. Changes:
- Modify `package.json` `build` to run Tina first: `clean → tinacms build → styles:prod → eleventy` (Tina emits admin SPA + generated client after clean; eleventy fills the rest).
- Add a **root `netlify.toml`** with `[functions] node_bundler = "esbuild"` and the `/api/tina/*` → `/.netlify/functions/tina` redirect (or put the redirect in `_redirects`).
- The existing `src/netlify.toml` (copied to `dist/`) is an ignored no-op; leave or delete.

Tina admin output is targeted to `/admin-tina` during the migration (via Tina `build.outputFolder`), swapped to `/admin` at cutover.

### Dev workflow
Canonical command: `netlify dev` (runs `tinacms dev -c "eleventy --serve"` + the function). Local dev uses `LocalBackendAuthProvider` + `createLocalDatabase` → **no Mongo needed locally**. Postcss watch runs as a separate parallel process. **Windows caveat:** the demo's bash-style env-prefix/`$PORT` dev script won't run in PowerShell — route through `netlify dev` / `cross-env` (already a dependency).

### Indexing
Self-hosted indexes **only at build time**, inside `tinacms build`. Edits made through Tina update the index immediately; edits made outside Tina (hand-edits, initial import) are stale until the next build. Initial import = run a build.

## 7. Front-loaded spikes (validate before bulk work)

1. **Backend round-trip end-to-end** on Netlify — function + Mongo + Auth.js login + one save committing to the feature branch.
2. **Frontmatter edge fidelity** — `false` vs absent, `null` vs omitted, nested-object subfield preservation, and YAML re-serialization diff noise, tested against real files.
3. **eleventy-img resolves a fresh Tina-uploaded image** path end-to-end.
4. **`tinacms build` failure mode** if Mongo is unreachable at build; whether `--skip-search-indexing` helps.
5. **The premise itself** — does Tina's sub-window editor materially improve editing the deepest nesting (home / about sections / FAQ)? If it merely matches Decap, reconsider before completing the migration.

## 8. Phased plan (high level; detailed steps in the implementation plan)

0. **Data cleanup** (§4) on the branch; commit; site still builds on Decap.
1. **Backend spike** (§7.1) — prove the plumbing.
2. **Schema + content** — author `tina/config.ts` collection-by-collection; split the six `_data` files into `src/content/*`; add `_data/*.js` shims (+ `order` sorting); `parseDate` refactor. Validate round-trip per collection.
3. **Pipeline wiring** — `package.json` build, root `netlify.toml`, dev command, env vars, seed `content/users/index.json`.
4. **Deploy-preview verification** (§9) — both users log in via `/admin-tina`; round-trip per collection type; deepest-nesting UX check.
5. **Cutover** — content freeze/reconcile; flip `GITHUB_BRANCH` to production; Tina → `/admin`; delete `src/admin`; merge.

## 9. Verification

Per-collection **round-trip diff test**: edit in Tina → confirm the committed file diff is exactly the intended change (no field loss, acceptable formatting churn). Public build stays green throughout (DB-independent). Both users confirmed able to log in and save.

## 10. Rollback & cutover risk

- **Before cutover:** trivial — Decap at `/admin` is untouched; reverting the Tina wiring restores the prior state.
- **After cutover:** **lossy** — the `_data` restructure is effectively one-way. A branch revert restores the old structure, but any edits made in the new structure are lost. Mitigation: a **content-freeze window** at cutover (Matthew pauses editing while we flip), and do the cutover promptly after preview verification.

## 11. Open ownership items (not blockers)

- Account that issues the fine-grained PAT (personal vs a dedicated bot collaborator) and its rotation reminder.
- MongoDB Atlas account owner.
- Production branch confirmation at cutover (expected `main`).
