# TinaCMS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `11ty-matthew-freed-pottery-web` from Decap CMS (deprecated git-gateway) to self-hosted TinaCMS on Netlify Functions, keeping all content as git-committed markdown/JSON.

**Architecture:** A Netlify Function runs Tina's GraphQL backend against MongoDB Atlas (index/cache) + Auth.js + GitHub git provider. The public 11ty build reads files directly and never touches Tina. Content lists move to folder collections consumed via `_data/*.js` shims so templates and date filters stay unchanged. Tina schema is **modularized** — one file per collection under `tina/collections/` — so parallel agents never edit the same file.

**Tech Stack:** Eleventy 3, Node 22, TinaCMS (self-hosted), `@tinacms/datalayer`, `tinacms-authjs`, `tinacms-gitprovider-github`, `mongodb-level`, Express + `serverless-http`, MongoDB Atlas, Netlify Functions.

**Design spec:** `docs/superpowers/specs/2026-07-19-tinacms-migration-design.md` (read it first — it holds the rationale and the locked decisions this plan implements).

## Global Constraints

- Node version: **22** (`.nvmrc`); Netlify build command stays `npm run build`, publish dir `dist`, functions dir `netlify/functions` (already configured in Netlify UI).
- Content must remain git-committed markdown/JSON; the **public build must never depend on Mongo/Tina**.
- `GITHUB_BRANCH` = `feat/tinacms-migration` for the entire migration; flip to the production branch only at the final cutover task.
- Tina admin builds to **`/admin-tina`** until cutover; Decap admin at `/admin` stays untouched until cutover.
- Dates in content stay `MM-DD-YYYY` for existing items; new items may be ISO — the `parseDate` helper (Task 1.4) tolerates both. Never hard-code a single date format in a filter again.
- Media: single root — `media.tina = { publicFolder: "src", mediaRoot: "images" }`. No per-field upload folders.
- Do **not** model purely-structural frontmatter (`layout`, `permalink`, `tags`, `eleventyNavigation`) — Tina's `resolveLegacyValues` preserves top-level keys. Model a field hidden only when we must set/normalize its value, and then with the correct `type`.
- Every promoted folder-collection item that previously relied on array order gets an explicit integer `order` field; shims sort by it.
- Windows dev host: never rely on bash-style `VAR=... $PORT` inline env; use `cross-env` / `netlify dev`.

---

## Parallelization Guide (read before assigning agents)

Work runs in **four waves**. Within a wave, tasks are independent (disjoint files) and can be handed to separate agents simultaneously. Between waves there are hard dependencies.

```
WAVE 0  Data cleanup (parallel: 0.1–0.5)  ─┐
                                            ├─► WAVE 2  Fan-out (parallel: 2.1–2.17)
WAVE 1  Foundation (mostly sequential)   ──┘        (each = one collection slice)
        └─► GATE: Task 1.9 spike must pass before Wave 2
                                                         │
                                                         ▼
                                            WAVE 3  Integration + verify + cutover (sequential)
```

- **Wave 0 (cleanup)** and **Wave 1 (foundation)** touch disjoint files (Wave 0 = content + templates; Wave 1 = `tina/`, `netlify/`, `package.json`, `.eleventy.js`) and can run concurrently. **Both must finish before Wave 2.**
- **Task 1.9 (backend spike) is a GATE.** Do not start Wave 2 until one collection round-trips end-to-end on a deploy preview. If the spike fails, stop and reassess (per the spec, Tina's whole value is unproven until this passes).
- **Wave 2 is the big parallel wave.** Foundation scaffolds a stub file for every collection and a barrel (`tina/collections/index.ts`) that already imports them all, so each Wave-2 agent owns exactly one collection file (+ its content dir + its shim) with **zero shared-file edits**. Run every 2.x task in its own git worktree (via `superpowers:using-git-worktrees`) and merge as each completes.
- **Wave 3 is sequential** and single-agent — it wires the barrel is already done, runs full verification, and performs cutover.

**Collision map (what each wave's tasks touch):**
| File | Touched by |
|------|-----------|
| `tina/config.ts` | Wave 1 only (skeleton); never in Wave 2 |
| `tina/collections/index.ts` | Wave 1 only (barrel imports all stubs); never in Wave 2 |
| `tina/collections/<name>.ts` | exactly one Wave-2 task each |
| `src/content/<name>/*` | exactly one Wave-2 task each |
| `src/_data/<name>.js` | exactly one Wave-2 task each |
| `.eleventy.js` | Wave 1 (parseDate) only |
| `about-layout.njk` | Wave 0 (paragraphs) only |
| `home.md` + home partials | Wave 0 (flatten single-field objects) only |

---

## File Structure

**New (Tina backend + schema):**
- `tina/config.ts` — `defineConfig`: media, build (`outputFolder: "admin-tina"`), `contentApiUrlOverride`, and `schema.collections` spread from the barrel.
- `tina/collections/index.ts` — barrel; imports every collection module and exports the array.
- `tina/collections/<name>.ts` — one `Collection` export per collection (17 files).
- `tina/database.ts` — `createLocalDatabase()` vs `createDatabase({ GitHubProvider, MongodbLevel })`.
- `tina/util/hidden.ts` — shared helper for hidden fields.
- `netlify/functions/tina.ts` — Express + `serverless-http` backend handler.
- `netlify.toml` (repo root, NEW) — `[functions] node_bundler = "esbuild"` + `/api/tina/*` redirect.
- `content/users/index.json` — seed users (owner-dev + Matthew).

**New (content split + shims):**
- `src/content/events/*.md`, `src/content/news/*.md`, `src/content/gallery/*.md`, `src/content/features/*.md`, `src/content/faq/*.md` — one file per item (outside 11ty input `src/views`).
- `src/_data/events.js`, `news.js`, `showcase.js`, `faq.js` — shims globbing the above into the existing data shapes.

**Modified:**
- `package.json` — build/dev scripts.
- `.eleventy.js` — `parseDate` helper; route all 8 date filters through it.
- `src/views/_includes/layouts/about-layout.njk` — render one markdown body instead of `paragraphs` list.
- `src/views/home.md` + home partials — flattened single-field objects.
- All page `.md` files — delete dead SEO fields; delete dead `label`.
- `src/views/_data/events.json`, `news.json`, `showcase.json`, `faq.json` — **deleted** at Wave 2 (replaced by `src/content/*` + shims). `global.json`, `seo.json` stay.

**Removed at cutover:** `src/admin/` (Decap), `src/admin/config.yml`.

---

## WAVE 0 — Data cleanup (parallel: Tasks 0.1–0.5)

Runs against the current Decap-built site; site keeps building green throughout. Each task is one commit.

### Task 0.1: Delete dead SEO placeholder fields

**Files:** Modify every page in `src/views/*.md` (`home.md`, `about.md`, `pottery.md`, `process.md`, `contact.md`, `collections.md`, `retail-stores.md`, `privacy-statement.md`, `events.md`, `faq.md`).

**Interfaces:** Produces cleaned frontmatter (no consumers depend on the removed keys — verified: they appear only in frontmatter and old `config.yml`).

- [ ] **Step 1: Remove the fields.** In each page's frontmatter delete these keys where present: `custom_seo_settings`, `ogtype`, `excerpt`, `author`, and the page-level empty `image` (the SEO placeholder, e.g. `image: ""` — NOT a real content image like retail's `image:`). Leave `title`, `permalink`, `layout`, `eleventyNavigation`, `tags` intact.
- [ ] **Step 2: Verify the build.** Run: `npm run build`. Expected: build succeeds, no template errors (these fields were unused).
- [ ] **Step 3: Verify SEO output unchanged.** Run: `npx serve dist` (or open `dist/index.html`) and confirm `<title>`/`<meta name="description">` still render from `seo.json` via `{% seo "" %}`. Expected: identical `<head>` SEO tags.
- [ ] **Step 4: Commit.** `git add src/views/*.md && git commit -m "chore: remove dead SEO placeholder fields from pages"`

### Task 0.2: Delete dead `label` field in section lists

**Files:** Modify `src/views/about.md`, `src/views/pottery.md`, `src/views/process.md`.

**Interfaces:** Produces `sections[]` items without `label`. Consumer `about-layout.njk` never reads `label` (verified — it loops `image`/`paragraphs` only).

- [ ] **Step 1: Remove `label`.** In each file, delete the `label:` line from every item under `sections:`.
- [ ] **Step 2: Verify.** Run: `npm run build`. Expected: success; about/process/pottery pages render identically (open `dist/about/index.html`).
- [ ] **Step 3: Commit.** `git add src/views/about.md src/views/pottery.md src/views/process.md && git commit -m "chore: drop unused section label field"`

### Task 0.3: Collapse `paragraphs[]` → single markdown body (about/process/pottery)

**Files:**
- Modify: `src/views/_includes/layouts/about-layout.njk:16-20`
- Modify: `src/views/about.md`, `src/views/pottery.md`, `src/views/process.md` (data shape of `sections[].paragraphs`)

**Interfaces:** Produces `sections[].body` (a markdown string) replacing `sections[].paragraphs` (string list). Layout renders `body` through the markdown filter.

- [ ] **Step 1: Change the data.** In each of the three `.md` files, for every `sections[]` item, replace the `paragraphs:` list with a single `body:` string whose value is the paragraphs joined by a blank line. Example transform:
  ```yaml
  # before
  - image: {url: "/images/x.jpg", alt: "…"}
    paragraphs:
      - First paragraph.
      - Second paragraph.
  # after
  - image: {url: "/images/x.jpg", alt: "…"}
    body: |
      First paragraph.

      Second paragraph.
  ```
- [ ] **Step 2: Add a markdown filter** (if not already present) in `.eleventy.js`:
  ```js
  const markdownIt = require("markdown-it");
  const md = markdownIt({ html: true });
  eleventyConfig.addNunjucksFilter("markdownify", (s) => (s ? md.render(s) : ""));
  ```
  Run: `npm install markdown-it`.
- [ ] **Step 3: Update the layout.** In `about-layout.njk`, replace:
  ```njk
  {% for p in section.paragraphs %}
  <p class="mb-4 text-base leading-relaxed text-muted">{{ p | safe }}</p>
  {% endfor %}
  ```
  with:
  ```njk
  <div class="prose-paragraphs">{{ section.body | markdownify | safe }}</div>
  ```
  (Match the existing paragraph styling by styling `.prose-paragraphs p` in `main.css`, or wrap each rendered `<p>` — verify visual parity.)
- [ ] **Step 4: Verify visual parity.** Run: `npm run build` then open `dist/about/index.html`, `dist/about/process/index.html`, `dist/about/pottery/index.html`. Expected: same paragraphs, same spacing.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "refactor: sections use one markdown body instead of paragraph list"`

### Task 0.4: Flatten single-field wrapper objects

**Files:**
- Modify: `src/views/home.md` (`hero.cta_primary`), `src/views/_data/global.json` (`gmaps`, `newsletter`)
- Modify consumers: `src/views/_includes/partials/hero.njk`, `newsletter.njk`, and any `global.gmaps.key` / `global.newsletter.title` references.

**Interfaces:** Produces `hero.cta_primary` (string), `gmaps_key` (string), `newsletter_title` (string) replacing single-field objects.

- [ ] **Step 1: Find consumers.** Run: `git grep -n "cta_primary\|gmaps\.key\|newsletter\.title\|gmaps:\|newsletter:"` and note each `.label`/`.key`/`.title` access.
- [ ] **Step 2: Change data.** In `home.md`: `cta_primary: { label: "Shop the collections" }` → `cta_primary: "Shop the collections"`. In `global.json`: `"gmaps": { "key": "…" }` → `"gmaps_key": "…"`; `"newsletter": { "title": "…" }` → `"newsletter_title": "…"`.
- [ ] **Step 3: Update templates.** Replace `hero.cta_primary.label` → `hero.cta_primary`, `global.gmaps.key` → `global.gmaps_key`, `global.newsletter.title` → `global.newsletter_title` at every site found in Step 1.
- [ ] **Step 4: Verify.** Run: `npm run build`; open the home page and confirm the primary CTA label, the map, and the newsletter title all render.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "refactor: flatten single-field wrapper objects to scalars"`

### Task 0.5: Add `order` fields to list items that lose array order

**Files:** Modify `src/views/_data/showcase.json` (each `gallery[]` and `features[]` item), `src/views/_data/faq.json` (each `sections[]` item and each `questions[]` item).

**Interfaces:** Produces an integer `order` on each item, matching current array position (0-based). Shims (Wave 2) sort by it.

- [ ] **Step 1: Add `order`.** For `showcase.json` `gallery[]`, `showcase.json` `features[]`, `faq.json` `sections[]`, and each `questions[]` inside a section, add `"order": N` where N is the item's current index.
- [ ] **Step 2: Verify.** Run: `npm run build`. Expected: unchanged output (order fields are inert until the shims read them).
- [ ] **Step 3: Commit.** `git add src/views/_data/showcase.json src/views/_data/faq.json && git commit -m "chore: add explicit order fields ahead of folder-collection split"`

---

## WAVE 1 — Foundation (Tasks 1.1–1.9; mostly sequential)

Establishes every interface Wave 2 consumes, and scaffolds all collection stubs so Wave 2 is collision-free. Do these in order; 1.1–1.8 are one agent, 1.9 is the gate.

### Task 1.1: Install dependencies

- [ ] **Step 1:** Run:
  ```bash
  npm install tinacms @tinacms/cli @tinacms/datalayer tinacms-authjs tinacms-gitprovider-github mongodb-level express serverless-http cookie-parser cors dotenv
  npm install --save-dev @types/node
  ```
- [ ] **Step 2: Commit.** `git add package.json package-lock.json && git commit -m "chore: add TinaCMS self-hosted dependencies"`

### Task 1.2: Tina config skeleton

**Files:** Create `tina/config.ts`, `tina/collections/index.ts`, `tina/util/hidden.ts`.

**Interfaces:** Produces `defineConfig` wiring. `tina/collections/index.ts` exports `collections: Collection[]`. `hidden(field)` helper returns a field with `ui.component = 'hidden'`.

- [ ] **Step 1: hidden helper** — `tina/util/hidden.ts`:
  ```ts
  import type { TinaField } from "tinacms";
  /** Keep a field's value in the file but hide it from the editor UI. */
  export const hidden = (f: TinaField): TinaField => ({
    ...f,
    ui: { ...(f as any).ui, component: "hidden" },
  });
  ```
- [ ] **Step 2: barrel** — `tina/collections/index.ts` (imports added incrementally by Task 1.8 scaffolding; start empty):
  ```ts
  import type { Collection } from "tinacms";
  export const collections: Collection[] = [];
  ```
- [ ] **Step 3: config** — `tina/config.ts`:
  ```ts
  import { defineConfig } from "tinacms";
  import { collections } from "./collections";

  const branch = process.env.GITHUB_BRANCH || "feat/tinacms-migration";

  export default defineConfig({
    branch,
    clientId: null,
    token: null,
    contentApiUrlOverride: "/api/tina/gql",
    build: { outputFolder: "admin-tina", publicFolder: "dist" },
    media: { tina: { publicFolder: "src", mediaRoot: "images" } },
    schema: { collections },
  });
  ```
- [ ] **Step 4:** Run: `npx tinacms build --local` (or `TINA_PUBLIC_IS_LOCAL=true npx tinacms build`) via `cross-env`. Expected: schema compiles (empty collections is allowed) and generates `tina/__generated__/`.
- [ ] **Step 5: Commit.** `git add tina/ && git commit -m "feat(tina): config skeleton, barrel, hidden helper"`

### Task 1.3: Database module

**Files:** Create `tina/database.ts`.

**Interfaces:** Produces `default` export consumed by the backend handler via `tina/__generated__/databaseClient`.

- [ ] **Step 1:** `tina/database.ts`:
  ```ts
  import { createDatabase, createLocalDatabase } from "@tinacms/datalayer";
  import { MongodbLevel } from "mongodb-level";
  import { GitHubProvider } from "tinacms-gitprovider-github";

  const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
  const branch = process.env.GITHUB_BRANCH || "feat/tinacms-migration";

  export default isLocal
    ? createLocalDatabase()
    : createDatabase({
        gitProvider: new GitHubProvider({
          branch,
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
        }),
        databaseAdapter: new MongodbLevel<string, Record<string, any>>({
          collectionName: branch,
          dbName: "tinacms-pottery",
          mongoUri: process.env.MONGODB_URI!,
        }),
      });
  ```
- [ ] **Step 2: Commit.** `git add tina/database.ts && git commit -m "feat(tina): mongodb + github self-hosted database"`

### Task 1.4: `parseDate` helper + route all date filters

**Files:** Modify `.eleventy.js`.

**Interfaces:** Produces `parseDate(s) → DateTime`. All eight filters call it instead of `DateTime.fromFormat(x, 'MM-dd-yyyy')`.

- [ ] **Step 1: Add helper** near the top of the module function in `.eleventy.js`:
  ```js
  function parseDate(s) {
    if (!s) return DateTime.invalid("empty");
    const iso = DateTime.fromISO(s);
    return iso.isValid ? iso : DateTime.fromFormat(s, "MM-dd-yyyy");
  }
  ```
- [ ] **Step 2: Replace usages.** In `sortByDate`, `date`, `filterFuture`, `filterPast`, `specialEvents`, `groupByVenue`, `nextUp`, `filterFeatured`, replace every `DateTime.fromFormat(<x>, 'MM-dd-yyyy')` with `parseDate(<x>)`. (The `date` filter becomes `parseDate(date).toFormat(format)`.)
- [ ] **Step 3: Verify existing MM-DD-YYYY still works.** Run: `npm run build`; open `dist/events.html` and confirm event dates/sorting render exactly as before.
- [ ] **Step 4: Verify ISO tolerance.** Temporarily add a news item with `date: "2026-08-01"` (ISO) to `news.json`, rebuild, confirm it sorts/renders correctly, then revert.
- [ ] **Step 5: Commit.** `git add .eleventy.js && git commit -m "feat: tolerant parseDate (ISO + MM-dd-yyyy) across date filters"`

### Task 1.5: Backend function

**Files:** Create `netlify/functions/tina.ts`.

**Interfaces:** Produces the `/api/tina/*` handler. Consumes `tina/__generated__/databaseClient` (from Task 1.2 build).

- [ ] **Step 1:** `netlify/functions/tina.ts`:
  ```ts
  import express from "express";
  import cookieParser from "cookie-parser";
  import ServerlessHttp from "serverless-http";
  import cors from "cors";
  import { TinaNodeBackend, LocalBackendAuthProvider } from "@tinacms/datalayer";
  import { AuthJsBackendAuthProvider, TinaAuthJSOptions } from "tinacms-authjs";
  import databaseClient from "../../tina/__generated__/databaseClient";

  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
  const tinaBackend = TinaNodeBackend({
    authProvider: isLocal
      ? LocalBackendAuthProvider()
      : AuthJsBackendAuthProvider({
          authOptions: TinaAuthJSOptions({
            databaseClient,
            secret: process.env.NEXTAUTH_SECRET!,
          }),
        }),
    databaseClient,
  });

  app.all("/api/tina/*", async (req, res) => tinaBackend(req, res));
  export const handler = ServerlessHttp(app);
  ```
- [ ] **Step 2: Commit.** `git add netlify/functions/tina.ts && git commit -m "feat(tina): netlify function backend handler"`

### Task 1.6: Netlify config + redirect + build/dev scripts

**Files:** Create `netlify.toml` (repo root); modify `package.json`; modify `src/_redirects` (append) OR use netlify.toml redirect.

**Interfaces:** Produces `/api/tina/*` routing and a build that runs `tinacms build`.

- [ ] **Step 1: `netlify.toml`** (repo root):
  ```toml
  [functions]
    node_bundler = "esbuild"

  [[redirects]]
    from = "/api/tina/*"
    to = "/.netlify/functions/tina"
    status = 200
    force = true
  ```
- [ ] **Step 2: `package.json` scripts.** Change `build` and add Tina dev:
  ```json
  "build": "npm-run-all clean styles:prod tina:build eleventy:default --print-label",
  "tina:build": "cross-env tinacms build",
  "dev": "cross-env TINA_PUBLIC_IS_LOCAL=true tinacms dev -c \"npm-run-all --parallel styles:watch eleventy:serve\""
  ```
  (Order in `build`: `clean` wipes `dist`, `tina:build` emits `dist/admin-tina` + generated client, then `eleventy` fills `dist`. Eleventy does not re-clean, so `admin-tina` survives.)
- [ ] **Step 3: Verify local build.** Run: `cross-env TINA_PUBLIC_IS_LOCAL=true npm run build`. Expected: `dist/admin-tina/index.html` exists and `dist/` has the normal pages.
- [ ] **Step 4: Commit.** `git add netlify.toml package.json package-lock.json && git commit -m "feat(tina): netlify functions config, redirect, build/dev scripts"`

### Task 1.7: Seed users + env template

**Files:** Create `content/users/index.json`, `.env.sample`; modify `.gitignore` (add `.env`).

**Interfaces:** Produces the seed for the `User` collection (Task 1.8 defines the collection). Two users.

- [ ] **Step 1: `content/users/index.json`:**
  ```json
  { "users": [
    { "name": "Dan", "email": "g41nxe@gmail.com", "username": "dan",
      "password": { "value": "CHANGE_ME_ON_FIRST_LOGIN", "passwordChangeRequired": true } },
    { "name": "Matthew Freed", "email": "mfreed74@gmail.com", "username": "matthew",
      "password": { "value": "CHANGE_ME_ON_FIRST_LOGIN", "passwordChangeRequired": true } }
  ] }
  ```
- [ ] **Step 2: `.env.sample`:**
  ```
  TINA_PUBLIC_IS_LOCAL=true
  MONGODB_URI=
  NEXTAUTH_SECRET=
  GITHUB_OWNER=g41nxe
  GITHUB_REPO=11ty-matthew-freed-pottery-web
  GITHUB_BRANCH=feat/tinacms-migration
  GITHUB_PERSONAL_ACCESS_TOKEN=
  ```
- [ ] **Step 3:** Add `.env` to `.gitignore`.
- [ ] **Step 4: Commit.** `git add content/users/index.json .env.sample .gitignore && git commit -m "feat(tina): seed users and env template"`

### Task 1.8: Scaffold all collection stubs + barrel (collision-avoidance for Wave 2)

**Files:** Create a **stub** `tina/collections/<name>.ts` for all 17 collections; fill `tina/collections/index.ts` to import them all; add the `User` collection.

**Interfaces:** Produces one importable, compiling stub per collection so Wave-2 agents each edit exactly one file. Barrel imports all; no Wave-2 agent touches the barrel or config.

- [ ] **Step 1: Stub template.** For each collection name in the list below, create `tina/collections/<name>.ts`:
  ```ts
  import type { Collection } from "tinacms";
  export const <camelName>: Collection = {
    name: "<name>", label: "<Label>", path: "<path>", format: "<md|json>",
    ui: { allowedActions: { create: false, delete: false } }, // singletons; folder collections override
    fields: [ { type: "string", name: "__placeholder", label: "placeholder" } ],
  };
  ```
  Collections (name → path → format → kind):
  - Pages (single-file, `ui.router` off, create/delete false): `home`→`src/views/home.md`, `about`→`src/views/about.md`, `pottery`→`src/views/pottery.md`, `process`→`src/views/process.md`, `contact`→`src/views/contact.md`, `collectionsPage`→`src/views/collections.md`, `retail`→`src/views/retail-stores.md`, `privacy`→`src/views/privacy-statement.md`, `eventsPage`→`src/views/events.md`, `faqPage`→`src/views/faq.md` — all `format: "md"`.
  - Config singletons (`format: "json"`): `global`→`src/views/_data/global.json`, `seo`→`src/views/_data/seo.json`.
  - Folder collections (`create/delete: true`, `path` = content dir): `events`→`src/content/events`, `news`→`src/content/news`, `gallery`→`src/content/gallery`, `features`→`src/content/features`, `faqSections`→`src/content/faq` — `format: "md"`.
  - Auth: `User` via `import { TinaUserCollection } from "tinacms-authjs"` re-exported in the barrel.
- [ ] **Step 2: Barrel** — `tina/collections/index.ts`:
  ```ts
  import type { Collection } from "tinacms";
  import { TinaUserCollection } from "tinacms-authjs";
  import { home } from "./home"; import { about } from "./about"; /* …all 17… */
  export const collections: Collection[] = [
    home, about, pottery, process_, contact, collectionsPage, retail, privacy, eventsPage, faqPage,
    global, seo, events, news, gallery, features, faqSections,
    TinaUserCollection as unknown as Collection,
  ];
  ```
  (Note: `process` is a reserved-ish name; export as `process_`.)
- [ ] **Step 3: Verify compile.** Run: `cross-env TINA_PUBLIC_IS_LOCAL=true npx tinacms build`. Expected: compiles with placeholder fields.
- [ ] **Step 4: Commit.** `git add tina/collections && git commit -m "feat(tina): scaffold all collection stubs + barrel"`

### Task 1.9: BACKEND SPIKE (GATE — must pass before Wave 2)

**Files:** Implement ONE real collection (`seo` — smallest, no lists) fully; provision Mongo + env; deploy preview.

**Interfaces:** Proves login + round-trip commit to `feat/tinacms-migration`.

- [ ] **Step 1: Provision MongoDB Atlas M0**, get `MONGODB_URI`. Generate `NEXTAUTH_SECRET` (`openssl rand -base64 32`). Create the fine-grained PAT (repo Contents R/W). Put all in Netlify env vars for the branch deploy context, with `TINA_PUBLIC_IS_LOCAL=false`.
- [ ] **Step 2: Implement `tina/collections/seo.ts`** for `seo.json` fields (`title`, `description`, `url`, `author`, `image {url,alt}`, `options {titleDivider}`). Set `format: "json"`, single file.
- [ ] **Step 3: Local round-trip.** Run `netlify dev`; open `http://localhost:8888/admin-tina/index.html`; log in (local provider); edit an SEO field; confirm it writes to `seo.json` on disk.
- [ ] **Step 4: Deploy-preview round-trip.** Push branch; on the Netlify deploy preview open `/admin-tina`; log in as `dan` (forced password change); edit an SEO field; **confirm a commit lands on `feat/tinacms-migration`** with exactly that change.
- [ ] **Step 5: Frontmatter fidelity check.** Edit `home.md`'s hero via a temporary minimal `home` schema (title only) and confirm `layout`/`permalink`/`eleventyNavigation` **survive** untouched (validates `resolveLegacyValues`). Record any formatting churn.
- [ ] **Step 6: GATE DECISION.** If login + round-trip + field preservation all pass → proceed to Wave 2. If not → stop; reassess per spec §7.
- [ ] **Step 7: Commit.** `git add tina/collections/seo.ts && git commit -m "feat(tina): seo collection + verified backend spike"`

---

## WAVE 2 — Collection fan-out (parallel: Tasks 2.1–2.17)

Each task = one collection slice = one `tina/collections/<name>.ts` (+ its `src/content/<name>/*` split + `src/_data/<name>.js` shim for promoted ones). **Disjoint files → run each in its own worktree, merge on completion.** Every task follows one of three exemplars below.

**Common verification for every 2.x task:**
- [ ] Build compiles: `cross-env TINA_PUBLIC_IS_LOCAL=true npx tinacms build`.
- [ ] `netlify dev` → `/admin-tina` → open the collection → edit one field → confirm the committed file diff is exactly the intended change (no field loss; acceptable YAML churn).
- [ ] For promoted collections: `npm run build` renders the affected page identically to pre-migration (compare against a saved baseline screenshot/HTML).
- [ ] Commit: `git add <the collection's files> && git commit -m "feat(tina): <name> collection"`.

### EXEMPLAR A — Page collection (single file, hidden structurals): `home`

`tina/collections/home.ts`:
```ts
import type { Collection } from "tinacms";
export const home: Collection = {
  name: "home", label: "Home", path: "src/views", format: "md",
  match: { include: "home" },
  ui: { allowedActions: { create: false, delete: false }, router: () => "/" },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "object", name: "hero", label: "Hero", fields: [
      { type: "string", name: "eyebrow", label: "Eyebrow" },
      { type: "string", name: "title", label: "Title" },
      { type: "string", name: "highlight", label: "Highlight word", required: false },
      { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
      { type: "string", name: "cta_primary", label: "Primary button label" }, // flattened in Task 0.4
      { type: "object", name: "cta_secondary", label: "Secondary link", fields: [
        { type: "string", name: "label" }, { type: "string", name: "url" } ] },
      { type: "object", name: "image", label: "Image", fields: [
        { type: "image", name: "url", label: "Image" }, { type: "string", name: "alt" } ] },
    ] },
    { type: "string", name: "trust", label: "Trust ribbon", list: true },
    { type: "object", name: "featured_piece", label: "Featured piece", fields: [
      { type: "string", name: "title" }, { type: "string", name: "caption" },
      { type: "string", name: "text", ui: { component: "textarea" } },
      { type: "string", name: "price", required: false },
      { type: "object", name: "image", fields: [
        { type: "image", name: "url" }, { type: "string", name: "alt" } ] },
      { type: "object", name: "cta", fields: [
        { type: "string", name: "label" }, { type: "string", name: "url" } ] },
    ] },
    // collections_teaser, products, events_band, story_teaser: same object pattern (fields per config.yml)
  ],
  // Do NOT model layout/permalink/eleventyNavigation/newsletter_flush — preserved as legacy top-level values.
};
```
Notes for other page collections: `contact`, `collectionsPage`, `eventsPage`, `faqPage`, `privacy`, `retail` follow this shape with their own fields (see config.yml). `privacy` adds a body field `{ type: "rich-text", name: "body", label: "Body", isBody: true }`. `retail` adds `stores` as `{ type: "object", name: "stores", list: true, fields: [name,url,address,city], ui:{ itemProps: (i)=>({label: i?.name}) } }` and a `body` rich-text. `about`/`pottery`/`process` add `sections` as `{ type: "object", name: "sections", list: true, fields: [ {type:"object",name:"image",fields:[image,alt]}, {type:"rich-text",name:"body"} ], ui:{ itemProps:(i)=>({label: i?.image?.alt || "Section"}) } }` (paragraphs already collapsed to `body` in Task 0.3).

### EXEMPLAR B — Promoted folder collection (split + shim): `events`

**Content split** — for each item in `events.json`, create `src/content/events/<slug>.md` (slug from name+date). Frontmatter carries: `date`, `end_date`, `time`, `name`, `location`, `gmaps`, `featured`, `atStudio`, `multi_day_event`, and a `content` object `{title, body}`. Then **delete** `src/views/_data/events.json`.

`tina/collections/events.ts`:
```ts
import type { Collection } from "tinacms";
export const events: Collection = {
  name: "events", label: "Events", path: "src/content/events", format: "md",
  fields: [
    { type: "datetime", name: "date", label: "Date", ui: { dateFormat: "MM-DD-YYYY" } },
    { type: "datetime", name: "end_date", label: "End date", required: false, ui: { dateFormat: "MM-DD-YYYY" } },
    { type: "string", name: "time", label: "Time" },
    { type: "string", name: "name", label: "Name" },
    { type: "string", name: "location", label: "Location" },
    { type: "string", name: "gmaps", label: "Google Maps URL" },
    { type: "boolean", name: "featured", label: "Featured" },
    { type: "boolean", name: "atStudio", label: "At my studio" },
    { type: "boolean", name: "multi_day_event", label: "Multi-day" },
    { type: "object", name: "content", label: "Content", fields: [
      { type: "string", name: "title" }, { type: "string", name: "body", ui: { component: "textarea" } } ] },
  ],
};
```

**Shim** — `src/_data/events.js` (reproduces the exact `{events: [...]}` shape templates use via `events.events`):
```js
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
module.exports = () => {
  const dir = path.join(__dirname, "../content/events");
  if (!fs.existsSync(dir)) return { events: [] };
  const events = fs.readdirSync(dir).filter(f => f.endsWith(".md")).map(f => {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    return data; // date stays as stored (MM-DD-YYYY or ISO); parseDate handles both
  });
  return { events };
};
```
(No `order` needed — filters sort by date. `gray-matter` is already a dependency.)

`news` follows Exemplar B exactly: content dir `src/content/news`, fields `date`, `name`, `content{title,body}`, `image{url,alt}`; shim `src/_data/news.js` returns `{news: [...]}`; delete `news.json`.

### EXEMPLAR C — Promoted collection needing `order` + reconstructed multi-key shape: `gallery`/`features` (`showcase`)

`showcase.json` feeds **two** consumers (`showcase.gallery`, `showcase.features`). Split into two content dirs and one shim.

**Content split:** each `gallery[]` item → `src/content/gallery/<slug>.md` (fields: `image{url,alt}`, `title`, `text`, `slug`, `swatch`, `filterGroups[]`, `cta{label,url}`, `style`, `order`). Each `features[]` item → `src/content/features/<slug>.md` (fields: `title`, `price`, `overlay{text}`, `cta{label,url}`, `image{url,alt}`, `hide`, `order`). Then **delete** `showcase.json`.

`tina/collections/gallery.ts` (features analogous):
```ts
import type { Collection } from "tinacms";
export const gallery: Collection = {
  name: "gallery", label: "Home Gallery", path: "src/content/gallery", format: "md",
  fields: [
    { type: "number", name: "order", label: "Order" },
    { type: "object", name: "image", fields: [ { type: "image", name: "url" }, { type: "string", name: "alt" } ] },
    { type: "string", name: "title" }, { type: "string", name: "text", ui: { component: "textarea" } },
    { type: "string", name: "slug", label: "Shop collection slug" },
    { type: "string", name: "swatch", label: "Swatch hex",
      ui: { validate: (v) => (v && !/^#[0-9A-Fa-f]{6}$/.test(v) ? "Must be a hex colour like #1F3A52" : undefined) } },
    { type: "string", name: "filterGroups", list: true, options: ["Blues", "Charcoals", "Patterned"] },
    { type: "object", name: "cta", fields: [ { type: "string", name: "label" }, { type: "string", name: "url" } ] },
    { type: "string", name: "style" },
  ],
};
```

**Shim** — `src/_data/showcase.js` (rebuilds `{gallery, features}` sorted by `order`):
```js
const fs = require("fs"); const path = require("path"); const matter = require("gray-matter");
const read = (sub) => {
  const dir = path.join(__dirname, "../content", sub);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".md"))
    .map(f => matter(fs.readFileSync(path.join(dir, f), "utf8")).data)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};
module.exports = () => ({ gallery: read("gallery"), features: read("features") });
```

### Task 2.1–2.17 assignment (each an independent agent)

| Task | Collection | Exemplar | Extra files |
|------|-----------|----------|-------------|
| 2.1 | `home` | A | — |
| 2.2 | `about` | A (sections→body) | — |
| 2.3 | `pottery` | A | — |
| 2.4 | `process` | A | — |
| 2.5 | `contact` | A | — |
| 2.6 | `collectionsPage` | A | — |
| 2.7 | `retail` | A (+stores list, +body) | — |
| 2.8 | `privacy` | A (+rich-text body) | — |
| 2.9 | `eventsPage` | A | — |
| 2.10 | `faqPage` | A | — |
| 2.11 | `global` | A (json singleton; deep nested socialmedia) | — |
| 2.12 | `events` | B | `src/content/events/*`, `src/_data/events.js`, delete `events.json` |
| 2.13 | `news` | B | `src/content/news/*`, `src/_data/news.js`, delete `news.json` |
| 2.14 | `gallery` | C | `src/content/gallery/*`, part of `src/_data/showcase.js` |
| 2.15 | `features` | C | `src/content/features/*`, part of `src/_data/showcase.js` |
| 2.16 | `faqSections` | B+order | `src/content/faq/*` (one per section, nested `questions` list with `order`), `src/_data/faq.js` returns `{sections:[...]}` |
| 2.17 | `seo` | (done in 1.9) | — |

> **Shared-file exception:** Tasks 2.14 and 2.15 both write `src/_data/showcase.js`. Assign them to the **same** agent (do them as one combined task), or have 2.14 create the shim and 2.15 only add its content dir. Everything else is fully disjoint.

`tina/collections/faqSections.ts` models `title` + a nested `questions` object-list (`{title, body, order}`) + section `order`; the `src/_data/faq.js` shim sorts sections by `order` and each section's `questions` by `order`, returning `{ sections: [...] }`.

---

## WAVE 3 — Integration, verification, cutover (sequential, single agent)

### Task 3.1: Full round-trip verification on deploy preview

- [ ] **Step 1:** Merge all Wave-2 branches into `feat/tinacms-migration`. Run `npm run build` locally — expect a clean site build identical to the Decap baseline.
- [ ] **Step 2:** Push; on the Netlify deploy preview, log in to `/admin-tina` as both `dan` and `matthew` (each completes forced password change).
- [ ] **Step 3:** For each collection, edit one field and confirm the committed diff is exactly intended (no field loss). Record any collections needing schema fixes; fix and repeat.
- [ ] **Step 4:** Upload one image via the media manager; confirm it commits to `src/images/` and the deploy rebuild renders it through `{% img %}` (validates the media↔eleventy-img mapping).
- [ ] **Step 5:** UX check (the premise): edit the deepest nesting (home hero, an about section, an FAQ section) and confirm Tina's sub-window editor is materially better than Decap. If not, escalate before cutover.

### Task 3.2: Cutover

- [ ] **Step 1: Content freeze.** Tell Matthew to stop editing via Decap; reconcile any last Decap edits on the production branch into the migration branch.
- [ ] **Step 2: Confirm production branch** (expected `main`); set Netlify production env `GITHUB_BRANCH` to it and `TINA_PUBLIC_IS_LOCAL=false`. Re-seed/index users for that branch's Mongo collection.
- [ ] **Step 3: Swap admin path.** Change `tina/config.ts` `build.outputFolder` from `admin-tina` to `admin`; delete `src/admin/` (Decap) and its passthrough copy in `.eleventy.js`; remove the Decap `src/admin/config.yml`.
- [ ] **Step 4:** Merge `feat/tinacms-migration` → production branch; deploy; verify `/admin` is Tina and a live edit round-trips.
- [ ] **Step 5:** Disable Netlify Identity/Git Gateway in the Netlify dashboard (owner-only). Commit removal.

### Task 3.3: Docs + cleanup

- [ ] Update `README.md` for the Tina workflow (env vars, `netlify dev`, user management, indexing-on-build). Commit.

---

## Self-Review

- **Spec coverage:** hosting/DB/auth/git (Wave 1), dates (1.4), hidden fields (1.2 + preservation, spike 1.9 step 5), media (1.2 config + 3.1 step 4), privacy body (2.8), six data files → folder collections (2.12–2.16), FAQ per-section (2.16), shim/data-shape parity (Exemplars B/C, verified against `events.events`/`news.news`/`showcase.gallery`/`showcase.features`/`faq.sections`), ordering (0.5 + shims), data cleanup 1–5 (Wave 0), branch/coexistence/cutover (Global Constraints + 3.2). #6/#7 correctly excluded.
- **Placeholder scan:** stub fields in 1.8 are intentional scaffolding, replaced in Wave 2; no other placeholders.
- **Type consistency:** shims return the exact keys templates read (`events.events`, `news.news`, `showcase.gallery`/`.features`, `faq.sections`); `parseDate` signature consistent across filters.
- **Known spikes carried as gated steps:** backend end-to-end (1.9), frontmatter fidelity (1.9 step 5), eleventy-img↔media (3.1 step 4), `tinacms build` DB-unreachable behavior (validate during 1.9). The Tina-improves-editing premise is an explicit gate in 3.1 step 5.
