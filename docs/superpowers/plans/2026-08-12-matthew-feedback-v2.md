# Matthew's v2 Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two photo-independent points from Matthew's v2 review (wordmark, newsletter→Instagram), land the bandwidth half of the third, and clear three pieces of dead weight found alongside them.

**Architecture:** All changes are Eleventy templates, page front matter, `global.json` and the Decap config. No build tooling, dependencies or JS changes. Every user-visible string added here must exist in both the content file and `src/admin/config.yml`, or Matthew gets a field he cannot edit — or worse, one that silently drops on save.

**Tech Stack:** Eleventy 3.1.6 + Nunjucks, Tailwind (via PostCSS), Decap CMS 3.x, Netlify.

## Global Constraints

- Branch: `feat/site-redesign-v2`. Land directly on it — this is feedback on v2.
- **Photo sourcing is out of scope.** Matthew has been asked for images; the nine 400×300 feature photos, the Tofino glaze card and the clipped Tree of Life tea set stay untouched until they arrive. See the Tabled section of `docs/superpowers/specs/2026-07-21-matthew-feedback-v2-design.md`.
- **This repo has no unit test framework.** `npm test` is a stub that exits 1. Verification is: `npm run build` exits 0, plus a rendered-HTML diff against the previous commit, plus a targeted browser check. Do not invent a test runner.
- **Nunjucks' `default` filter only fires on `undefined`, not `""`.** Any `| default(x)` added here MUST pass `true` as the third argument: `| default(x, true)`. A cleared Decap field saves as an empty string and would otherwise render nothing.
- Every new content key needs a matching `name:` in `src/admin/config.yml`. Fields whose emptiness is never valid must NOT carry `required: false`.
- Design tokens: Paper `#F8F5EE`, Ink `#2A2822`, Squamish blue `#1F3A52`, Sand `#C8A876`. Single accent — do not introduce new colours.
- Type: Fraunces Black (900) for display, Karla for body/UI. **No italics anywhere** — the user rejected them explicitly.
- Shop URLs always come from `global.shop.base` + `global.shop.collectionsPath`. Never hardcode a myshopify or shop URL.
- Decap is still the live CMS. TinaCMS migration is unfinished and behind an unverified auth gate; do not assume it.

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `src/views/_includes/partials/nav.njk` | Header wordmark lockup | 1 |
| `src/assets/manifest.json` | PWA description typo | 1 |
| `src/views/_includes/partials/social.njk` | **New** — replaces `newsletter.njk`; site-wide follow band | 2 |
| `src/views/_includes/partials/newsletter.njk` | **Deleted** | 2 |
| `src/views/_includes/partials/footer.njk` | Include swapped to the new partial | 2 |
| `src/views/_data/global.json` | `social` block added, dead `newsletter` block removed | 2 |
| `src/admin/config.yml` | Social fields in, newsletter + dead `notification` out | 2, 5 |
| `src/views/home.md` | `newsletter_flush` → `social_flush`; newsletter copy string | 2, 3 |
| `src/views/events.md` | Two newsletter copy strings | 3 |
| 8 template files with `{% img %}` calls | `sizes` pinned above the container cap | 4 |
| `src/views/_data/seo.json` | Trailing slash removed from the site URL | 6 |

---

### Task 1: Wordmark shows the full brand name on mobile

Matthew's point 1. Every rendered brand string already says "Matthew Freed Pottery" except the header below 640px.

**Files:**
- Modify: `src/views/_includes/partials/nav.njk:10`
- Modify: `src/assets/manifest.json:5`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks depend on.

**Why a two-line lockup and not a smaller font.** The spec proposed shrinking the type and said to measure rather than guess. Measured against the live header, the wordmark's available width is `viewport − 48px padding − 129px (Shop button + hamburger) − 12px margin`:

| Viewport | Available | `text-lg` 18px | `text-base` 16px | `+tracking-tight` | `text-sm` 14px | `text-xs` 12px |
|---|---|---|---|---|---|---|
| 320 | 131px | 214 ✗ | 190 ✗ | 182 ✗ | 167 ✗ | 143 ✗ |
| 360 | 171px | 214 ✗ | 190 ✗ | 182 ✗ | **167 ✓** (+4) | 143 ✓ |
| 375 | 186px | 214 ✗ | 190 ✗ | **182 ✓** (+4) | 167 ✓ | 143 ✓ |
| 390 | 201px | 214 ✗ | 190 ✓ | 182 ✓ | 167 ✓ | 143 ✓ |

No single-line size fits at 320px — even `text-xs` overflows. `text-sm` clears the very common 360px width by only 4px, which is inside the margin of error for font loading. **The single-line shrink is not robust, so the spec's stated fallback becomes the primary fix.**

Two-line lockup at the current `text-lg`: widest line is "Matthew Freed" at 139px, which clears 360/375/390 comfortably. At 320px it still exceeds 131px — but that width is **already broken today** (the current single-line "Matthew Freed" is the same 139px with `whitespace-nowrap`, so it overflows now). Dropping `whitespace-nowrap` on mobile makes 320px wrap to three lines instead of overflowing the header, which is a strict improvement.

- [ ] **Step 1: Replace the wordmark markup**

In `src/views/_includes/partials/nav.njk`, replace line 10:

```njk
        <a href="/" class="mr-3 whitespace-nowrap font-display text-lg font-black text-blue sm:text-xl"><span class="sm:hidden">Matthew Freed</span><span class="hidden sm:inline">Matthew Freed Pottery</span></a>
```

with:

```njk
        <a href="/" class="mr-3 font-display text-lg font-black leading-[0.95] text-blue sm:whitespace-nowrap sm:text-xl sm:leading-normal">
            <span class="block sm:inline">Matthew Freed</span>
            <span class="block sm:inline">Pottery</span>
        </a>
```

Both spans are `block` below 640px (stacked lockup, tight leading) and `inline` at `sm` and above. The newline between the two spans in the source collapses to a single space when they are inline, which is what puts "Matthew Freed Pottery" on one line at desktop — do not join the spans onto one source line or the space disappears.

- [ ] **Step 2: Fix the manifest description typo**

In `src/assets/manifest.json`, line 5 currently reads:

```json
    "description": "Matthew Freeds - Pottery from Vancouver",
```

Change to:

```json
    "description": "Matthew Freed - Pottery from Vancouver",
```

Leave `src/views/_data/seo.json:5` (`author: "Matthew Freed"`) alone — it is a person field consumed as the Open Graph author, not a brand string.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Verify the header at four widths**

Start the dev server (`pottery-site` in `.claude/launch.json`, port 8080), then at each of 320, 360, 375 and 390px confirm: the full name "Matthew Freed Pottery" is readable, the header does not scroll horizontally, and the Shop button and hamburger are still on the first row.

Run this in the page console at each width:

```js
const wm = document.querySelector('header a[href="/"]');
JSON.stringify({
  text: wm.innerText.replace(/\s+/g,' ').trim(),
  wordmarkWidth: Math.ceil(wm.getBoundingClientRect().width),
  bodyOverflows: document.body.scrollWidth > window.innerWidth
});
```

Expected at every width: `text` is `"Matthew Freed Pottery"`, and `bodyOverflows` is `false`.

- [ ] **Step 5: Commit**

```bash
git add src/views/_includes/partials/nav.njk src/assets/manifest.json
git commit -m "fix: show the full wordmark on mobile"
```

---

### Task 2: Newsletter band becomes a social band

Matthew's point 2 — he has never sent a newsletter and does not expect to start.

**Files:**
- Create: `src/views/_includes/partials/social.njk`
- Delete: `src/views/_includes/partials/newsletter.njk`
- Modify: `src/views/_includes/partials/footer.njk:1`
- Modify: `src/views/_data/global.json` (add `social`, remove `newsletter`)
- Modify: `src/admin/config.yml:644-651` (the `Newsletter` object)
- Modify: `src/views/home.md:5`

**Interfaces:**
- Consumes: `global.socialmedia.services.instagram.url` and `.facebook.url`, which already exist in `global.json` — do not duplicate them.
- Produces: `global.social.{title,text,instagram_label,facebook_label}` and the page flag `social_flush`. Task 3 rewrites copy that refers to this band.

The band renders on **every page** via `footer.njk:1`. Keep the position, the paper background and the split-row composition; swap the form for two buttons, Instagram first as `btn-primary`, Facebook as `btn-outline`. Both classes already exist in `src/styles/main.css:25` and `:28`.

**Do not embed a live Instagram feed.** It needs an access token that expires every 60 days and must be refreshed programmatically; on a static site whose owner has just said he does not keep up with recurring chores, a component that silently goes blank after two months is the wrong trade.

**Keep the flush flag.** `home.md` carries it because `story-teaser.njk` is the last section before the footer on the home page and is navy — a paper band butting against it needs its top hairline stripped. Rename it to match what it now controls.

- [ ] **Step 1: Create the social partial**

Create `src/views/_includes/partials/social.njk`:

```njk
<section class="bg-paper{% if not social_flush %} border-t border-hairline{% endif %}" aria-label="Follow Matthew">
    <div class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-20 md:flex-row md:items-center">
        <div>
            <h2 class="font-display text-2xl font-black text-ink">{{ global.social.title }}</h2>
            <p class="mt-1 text-sm text-soft">{{ global.social.text }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
            <a href="{{ global.socialmedia.services.instagram.url }}" target="_blank" rel="noopener" class="btn-primary whitespace-nowrap">{{ global.social.instagram_label }}</a>
            <a href="{{ global.socialmedia.services.facebook.url }}" target="_blank" rel="noopener" class="btn-outline whitespace-nowrap">{{ global.social.facebook_label }}</a>
        </div>
    </div>
</section>
```

- [ ] **Step 2: Point the footer at it and delete the old partial**

In `src/views/_includes/partials/footer.njk`, line 1:

```njk
{% include "newsletter.njk" %}
```

becomes:

```njk
{% include "social.njk" %}
```

Then: `git rm src/views/_includes/partials/newsletter.njk`

This takes the Netlify form `name="newsletter"` out of the built site. That is intended — Dan is handling the existing signups separately. Netlify retains prior submissions.

- [ ] **Step 3: Add the `social` block to global.json and delete the dead `newsletter` block**

In `src/views/_data/global.json`, remove lines 13–15:

```json
  "newsletter": {
    "title": "Sign up to my Newsletter"
  },
```

and add, immediately after the `"hero"` block:

```json
  "social": {
    "title": "Follow along on Instagram",
    "text": "New pieces, firings and market dates go up there first.",
    "instagram_label": "Follow on Instagram",
    "facebook_label": "Facebook"
  },
```

The `newsletter.title` field was already orphaned — nothing read it. That is exactly the fork this task avoids recreating.

- [ ] **Step 4: Swap the Decap fields**

In `src/admin/config.yml`, replace the `Newsletter` object (currently at lines 644–651, inside the `global` collection's `global` file):

```yaml
          - label: "Newsletter"
            name: "newsletter"
            widget: "object"
            minimize_collapsed: true
            collapsed: true
            fields:
              - {label: "Title", name: "title", widget: "string"}
```

with:

```yaml
          - label: "Follow band (shown at the bottom of every page)"
            name: "social"
            widget: "object"
            minimize_collapsed: true
            collapsed: true
            fields:
              - {label: "Heading", name: "title", widget: "string"}
              - {label: "Text under the heading", name: "text", widget: "string"}
              - {label: "Instagram button text", name: "instagram_label", widget: "string"}
              - {label: "Facebook button text", name: "facebook_label", widget: "string"}
```

No `required: false` on any of them — an empty heading or a button with no label is never a valid state.

- [ ] **Step 5: Rename the flush flag**

In `src/views/home.md`, line 5:

```yaml
newsletter_flush: true
```

becomes:

```yaml
social_flush: true
```

`newsletter_flush` appears in exactly two places — this line and the partial (already handled in Step 1). It is not a Decap field, so `config.yml` needs no change for it.

- [ ] **Step 6: Build and confirm no newsletter remnants**

Run: `npm run build`
Expected: exits 0.

Then:

```bash
grep -rln "newsletter" src/ dist/ --include=*.njk --include=*.json --include=*.md --include=*.html
```

Expected at this point: **only** `src/views/home.md`, `src/views/events.md`, and the built `dist/*.html` pages that render their copy. Those three copy strings are Task 3's job. A match in any `.njk` or in `global.json` or `config.yml` means this task is incomplete — the partial, the include, the data block or the Decap field was missed.

- [ ] **Step 7: Verify the band renders everywhere**

```bash
find dist -name '*.html' | while read -r f; do
  printf "%-34s %s\n" "$f" "$(grep -c 'aria-label="Follow Matthew"' "$f")"
done
```

Expected: `1` for every one of the 10 built HTML pages, including the three under `dist/about/`. A `0` anywhere means that page's layout does not reach `footer.njk`.

Then load the home page in the browser and confirm there is **no hairline** between the navy story-teaser section and the band, and that both buttons resolve to Matthew's real Instagram and Facebook URLs.

- [ ] **Step 8: Commit**

```bash
git add -A src/views/_includes/partials src/views/_data/global.json src/admin/config.yml src/views/home.md
git commit -m "feat: replace the newsletter band with a follow band"
```

---

### Task 3: Rewrite copy that references the newsletter

Three strings promise a newsletter that will no longer exist.

**Files:**
- Modify: `src/views/events.md:23` and `src/views/events.md:28`
- Modify: `src/views/home.md:51`

**Interfaces:**
- Consumes: the band from Task 2 (these strings point readers at it).
- Produces: nothing later tasks depend on.

All three render **without** `| safe`, so they are plain-text escaped. They stay plain text — making them clickable would mean adding `| safe` to CMS-editable fields, opening an HTML-injection surface for three links. The band itself carries the real link.

- [ ] **Step 1: Rewrite the events studio footnote**

`src/views/events.md:23`, inside the `studio` object:

```yaml
  footnote: Can't make it? The newsletter announces every market and firing.
```

becomes:

```yaml
  footnote: Can't make it? Every market and firing gets announced on Instagram.
```

- [ ] **Step 2: Rewrite the events empty state**

`src/views/events.md:28`:

```yaml
no_events: Nothing on the calendar right now — the newsletter is the first to know when that changes.
```

becomes:

```yaml
no_events: Nothing on the calendar right now — new dates go up on Instagram first.
```

This one is rewritten rather than word-swapped: "the newsletter is the first to know" was always slightly off, and substituting "Instagram" would inherit the awkwardness.

- [ ] **Step 3: Rewrite the home events-band empty state**

`src/views/home.md:51`, inside `events_band`:

```yaml
  no_events: Nothing on the calendar right now — join the newsletter below and you'll hear about the next market first.
```

becomes:

```yaml
  no_events: Nothing on the calendar right now — follow along on Instagram and you'll hear about the next market first.
```

`src/views/privacy-statement.md` needs **no change** — its only related clause covers forms collecting "name, e-mail address, mailing address", which stays accurate because the contact form is unaffected.

- [ ] **Step 4: Build and confirm the word is gone**

```bash
npm run build && grep -rn "newsletter" src/ dist/ --include=*.njk --include=*.json --include=*.md --include=*.html
```

Expected: `npm run build` exits 0 and grep returns **no matches at all**.

- [ ] **Step 5: Confirm the strings render as plain text**

```bash
grep -o "Every market and firing gets announced on Instagram." dist/events.html
```

Expected: exactly that string, with no surrounding tags injected.

- [ ] **Step 6: Commit**

```bash
git add src/views/events.md src/views/home.md
git commit -m "copy: point readers at Instagram instead of the newsletter"
```

---

### Task 4: Pin `sizes` above the container cap

The bandwidth half of Matthew's point 3. Every `{% img %}` declares `sizes` in viewport units, but every container is capped by `max-w-6xl` (1152px), so above that width the browser fetches variants 25–53% larger than it displays.

**Files:**
- Modify: `src/views/_includes/partials/hero.njk:13`
- Modify: `src/views/_includes/partials/current-firing.njk:9` and `:23`
- Modify: `src/views/_includes/partials/collections-teaser.njk:10`
- Modify: `src/views/_includes/partials/story-teaser.njk:4`
- Modify: `src/views/_includes/layouts/collections-layout.njk:22`
- Modify: `src/views/_includes/layouts/events-layout.njk:71`
- Modify: `src/views/_includes/layouts/about-layout.njk:14`
- Modify: `src/views/_includes/layouts/retail-layout.njk:12`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. This is a pure bandwidth change with no visual effect.

Add a `(min-width: 1152px) <measured>px` clause to the **front** of each existing `sizes` string, leaving the existing clauses untouched. Widths below 1152px are close enough to the declaration that the remaining waste is small; the capped desktop case is where the entire 25–53% lives. Measured rendered widths come from the spec's table.

**Do not touch** `src/views/_includes/layouts/general-layout.njk:10`. Its only consumer is `privacy-statement.md`, which has no `image` key, so the shortcode never renders. Adding a pin there would be dead code.

**Do not touch** `src/views/_includes/layouts/events-layout.njk:77` (the signature image) — it already declares a fixed `"144px"`.

- [ ] **Step 1: Apply all eight edits**

Each row: find the existing `sizes` argument (the third argument to `{% img %}`) and prepend the new clause.

| File:line | Current `sizes` | New `sizes` |
|---|---|---|
| `partials/hero.njk:13` | `"(min-width: 768px) 50vw, 100vw"` | `"(min-width: 1152px) 532px, (min-width: 768px) 50vw, 100vw"` |
| `partials/current-firing.njk:9` | `"(min-width: 768px) 50vw, 100vw"` | `"(min-width: 1152px) 528px, (min-width: 768px) 50vw, 100vw"` |
| `partials/current-firing.njk:23` | `"(min-width: 768px) 25vw, 50vw"` | `"(min-width: 1152px) 254px, (min-width: 768px) 25vw, 50vw"` |
| `partials/collections-teaser.njk:10` | `"(min-width: 768px) 31vw, 86vw"` | `"(min-width: 1152px) 342px, (min-width: 768px) 31vw, 86vw"` |
| `partials/story-teaser.njk:4` | `"(min-width: 768px) 50vw, 100vw"` | `"(min-width: 1152px) 576px, (min-width: 768px) 50vw, 100vw"` |
| `layouts/collections-layout.njk:22` | `"(min-width: 768px) 33vw, 50vw"` | `"(min-width: 1152px) 350px, (min-width: 768px) 33vw, 50vw"` |
| `layouts/events-layout.njk:71` | `"(min-width: 1024px) 30vw, 100vw"` | `"(min-width: 1152px) 445px, (min-width: 1024px) 30vw, 100vw"` |
| `layouts/about-layout.njk:14` | `"(min-width: 768px) 50vw, 100vw"` | `"(min-width: 1152px) 472px, (min-width: 768px) 50vw, 100vw"` |
| `layouts/retail-layout.njk:12` | `"(min-width: 768px) 48rem, 100vw"` | `"(min-width: 1152px) 720px, (min-width: 768px) 48rem, 100vw"` |

Note the events news card is the one case that was **under**-declared (432px declared against 445px rendered), so its pin slightly increases the requested size — that is a correctness fix, not a regression.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 3: Confirm the markup changed and nothing else did**

```bash
git diff --stat
```

Expected: 8 files changed, and the per-file line counts should be 1–2 changed lines each. Any file with a larger diff means something was edited by accident.

- [ ] **Step 4: Verify the browser picks smaller variants and nothing renders soft**

Load the home page at 1440px wide and run in the console:

```js
JSON.stringify(Array.from(document.querySelectorAll('img')).map(i => ({
  src: i.currentSrc.split('/').pop(),
  rendered: Math.round(i.getBoundingClientRect().width),
  natural: i.naturalWidth,
  ratio: +(i.naturalWidth / i.getBoundingClientRect().width).toFixed(2)
})), null, 1);
```

Expected: every `ratio` is between 1.0 and 2.0. Below 1.0 means the image is now too small and will render soft — revert that row's pin. Above 2.0 means the pin did not take effect for that image.

- [ ] **Step 5: Commit**

```bash
git add src/views/_includes
git commit -m "perf: pin image sizes above the container cap"
```

---

### Task 5: Clear three pieces of dead weight

Found while verifying the CMS; none are Matthew-facing feedback, all are cheap.

**Files:**
- Modify: `src/admin/config.yml:186-198` (the `notification` object in the `contact` file)
- Delete: `src/admin/config.yml.asd`
- Delete: `docs/superpowers/plans/2026-07-18-integrate-main-content.md`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Delete the dead `notification` field group**

`src/admin/config.yml` declares a `notification` object in the Contact entry, but no template under `src/views/` reads `notification`, and `contact.md` has no such key. Matthew currently sees an empty field group that does nothing.

Confirm it is dead before deleting:

```bash
grep -rn "notification" src/views/
```

Expected: no output. If anything matches, stop and re-scope — the field is live.

Then remove these lines from `src/admin/config.yml`:

```yaml
          - label: "notification"
            name: "notification"
            widget: "object"
            collapsed: true
            fields:
              - {label: "title", name: "title", widget: "string"}
              - {label: "subtitle", name: "subtitle", widget: "string"}
              - label: "cta"
                name: "cta"
                widget: "object"
                fields: 
                  - {label: "label", name: "label", widget: "string"}
                  - {label: "url", name: "url", widget: "string"}
```

- [ ] **Step 2: Delete the stale CMS config backup**

`src/admin/config.yml.asd` is a 1.3KB backup dated May 2025 that Eleventy's passthrough copy publishes to the live site at `/admin/config.yml.asd`.

```bash
git rm src/admin/config.yml.asd 2>/dev/null || rm src/admin/config.yml.asd
```

- [ ] **Step 3: Delete the stale plan doc**

`docs/superpowers/plans/2026-07-18-integrate-main-content.md` shows 0 of 6 steps ticked, but the work is done: `origin/main` is fully merged into this branch and `contact.md`'s map iframe already points at 838 Pender Street East. The document only misleads.

Verify before deleting:

```bash
git log --oneline origin/main ^feat/site-redesign-v2 | wc -l   # expect 0
grep -c "838%20Pender" src/views/contact.md                    # expect 1
```

Then: `rm docs/superpowers/plans/2026-07-18-integrate-main-content.md`

- [ ] **Step 4: Build and confirm the CMS still loads**

Run: `npm run build`
Expected: exits 0.

Then validate the config parses and the stray file is gone:

```bash
node -e "const y=require('js-yaml'),fs=require('fs');const d=y.load(fs.readFileSync('src/admin/config.yml','utf8'));console.log('collections:',d.collections.length)"
ls dist/admin/
```

Expected: `collections: 4`, and `dist/admin/` lists only `config.yml`, `custom-widgets.js` and `index.html`.

Then start both `pottery-decap` (8081) and `pottery-site` (8080) from `.claude/launch.json`, open `http://localhost:8080/admin/`, log in to the local repo, and confirm the Contact entry no longer shows a `notification` group.

- [ ] **Step 5: Commit**

```bash
git add -A src/admin docs/superpowers/plans
git commit -m "chore: drop a dead CMS field, a stale config backup and a finished plan"
```

---

### Task 6: Fix the doubled slash in every absolute URL

Not from Matthew — found while verifying the build. **This is one line, not a sitemap fix.**

**Files:**
- Modify: `src/views/_data/seo.json:4`
- Modify: `src/admin/config.yml` (the `seo.json` entry — URL field hint, and the `image` field type)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

**Root cause.** `seo.json:4` is `"url": "https://matthewfreed.ca/"` — with a trailing slash — while every consumer supplies its own leading slash. `.eleventy.js:28` passes this file straight into `eleventy-plugin-seo`, so the damage is wider than the sitemap:

| Output | Current | Consumer |
|---|---|---|
| `<link rel="canonical">` | `https://matthewfreed.ca//` | eleventy-plugin-seo |
| `<meta property="og:url">` | `https://matthewfreed.ca//` | eleventy-plugin-seo |
| `sitemap.xml` (10 `<loc>`) | `https://matthewfreed.ca//about/` | `src/views/sitemap.njk:9` |
| `robots.txt` | `https://matthewfreed.ca//sitemap.xml` | `src/views/robots.njk:5` |

The canonical tag is the consequential one — a self-referencing canonical pointing at a URL that isn't the page's real address, on every page. Removing the trailing slash from the data fixes all four at once. Do **not** patch `sitemap.njk`: it would fix one symptom and leave canonical, `og:url` and `robots.txt` wrong, and the plugin's output cannot be patched from a template at all.

- [ ] **Step 1: Capture the before state**

```bash
grep -o 'matthewfreed\.ca//[^"<]*' dist/index.html dist/sitemap.xml dist/robots.txt | sort -u
```

Expected: several matches showing the doubled slash. Keep this output to compare against Step 4.

- [ ] **Step 2: Remove the trailing slash**

In `src/views/_data/seo.json`, line 4:

```json
  "url": "https://matthewfreed.ca/",
```

becomes:

```json
  "url": "https://matthewfreed.ca",
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Verify all four outputs**

```bash
echo "--- doubled slashes remaining (expect none) ---"
grep -rn 'matthewfreed\.ca//' dist/ || echo "none"
echo "--- canonical + og:url ---"
grep -o '<link rel="canonical"[^>]*>' dist/index.html
grep -o '<meta property="og:url"[^>]*>' dist/index.html
echo "--- a nested page (must keep its single slash) ---"
grep -o '<link rel="canonical"[^>]*>' dist/about/process.html
echo "--- sitemap + robots ---"
grep -o '<loc>[^<]*</loc>' dist/sitemap.xml | head -3
cat dist/robots.txt
```

Expected: `none` for doubled slashes; home canonical is `https://matthewfreed.ca/`; `about/process.html` canonical is `https://matthewfreed.ca/about/process.html`; sitemap `<loc>`s have exactly one slash after the domain; robots reads `Sitemap: https://matthewfreed.ca/sitemap.xml`.

Watch for the opposite failure: if the home page canonical comes out as `https://matthewfreed.ca` with **no** trailing slash at all, that is acceptable to search engines but note it in the commit message.

- [ ] **Step 5: Stop the CMS from reintroducing it**

`url` is CMS-editable, so Matthew can paste a trailing slash back and silently rebreak all four outputs. In `src/admin/config.yml`, in the `seo.json` entry, replace:

```yaml
          - {label: "URL", name: "url", widget: "string"}
```

with:

```yaml
          - {label: "Site URL (no trailing slash)", name: "url", widget: "string", pattern: ["^https?://[^/]+$", "Enter the site URL with no trailing slash, e.g. https://matthewfreed.ca"]}
```

- [ ] **Step 6: Fix the SEO image field type mismatch**

Separate latent bug in the same entry. `seo.json:6` holds a **string** (`"image": "/assets/blue-arrangement.jpg"`), but `config.yml` declares `image` as an **object** with `url` and `alt` sub-fields. Decap shows an empty object group; saving the SEO entry would rewrite the string as an object and break the plugin's `og:image`.

Replace:

```yaml
          - label: "Image"
            name: "image"
            widget: "object"
            fields:
              - {label: "URL", name: "url", widget: "image", choose_url: false}
              - {label: "Alt Text", name: "alt", widget: "string"}
```

with:

```yaml
          - {label: "Social share image", name: "image", widget: "image", choose_url: false}
```

Decap's `image` widget stores a plain string path, which matches what the file and the plugin both expect.

- [ ] **Step 7: Confirm the CMS still loads and og:image survives**

```bash
npm run build
node -e "const y=require('js-yaml'),fs=require('fs');console.log('collections:',y.load(fs.readFileSync('src/admin/config.yml','utf8')).collections.length)"
grep -o '<meta property="og:image"[^>]*>' dist/index.html
```

Expected: build exits 0, `collections: 4`, and `og:image` still points at `/assets/blue-arrangement.jpg`.

Then open `http://localhost:8080/admin/`, log in to the local repo, open the SEO entry, and confirm the URL field shows its new label and the image field shows the existing path rather than an empty group. **Do not save** — the check is that it displays correctly.

- [ ] **Step 8: Commit**

```bash
git add src/views/_data/seo.json src/admin/config.yml
git commit -m "fix: drop the trailing slash that doubled every absolute URL"
```

---

## Final verification

After all five tasks:

- [ ] `npm run build` exits 0.
- [ ] `grep -rn "newsletter" src/ dist/` returns nothing.
- [ ] Header shows "Matthew Freed Pottery" with no horizontal overflow at 320, 360, 375 and 390px.
- [ ] The follow band appears once on all 10 built HTML pages, with no hairline above it on the home page.
- [ ] Decap loads and the Contact, Home, Events, About and Global entries all populate.
- [ ] Every `img` on the home page at 1440px has a natural/rendered ratio between 1.0 and 2.0.
- [ ] `grep -rn 'matthewfreed\.ca//' dist/` returns nothing.

## Still open after this plan

- **Photography.** The nine 400×300 feature tiles (bar: ~640–800px), the Tofino glaze card framing, and the clipped Tree of Life tea set. Blocked on Matthew.
- **Merging** `feat/site-redesign-v2` into `feat/tinacms-migration` so Wave 2's collection authoring targets the final data shape — the `social` block from Task 2 changes it.
- **Pushing.** The branch is several commits ahead of origin and has not been pushed.
