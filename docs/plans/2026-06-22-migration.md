# Dependency-Modernisierung — Migrationsplan

- **Datum:** 2026-06-22
- **Repo:** `11ty-matthew-freed-pottery-web`
- **Ausgangs-Branch:** `decap`
- **Migrations-Branch (geplant):** `chore/deps-modernization`
- **Zielstack:** Node 22 LTS · Eleventy 3.1.6 · Tailwind 4.3.1 (CSS-first) · eleventy-img 6 · Luxon 3.7.2 · PWA-v2 · eingebauter 11ty-Dev-Server

> **Wichtig:** Das Projekt hat **keine automatisierten Tests**. Einzige Absicherung ist ein
> **visueller Vorher/Nachher-Vergleich** — deshalb wird in Phase 0 ein Baseline-Build gesichert.

---

## 1. Ausgangslage

Eleventy (11ty) Static-Site mit SCSS→PostCSS→Tailwind-Pipeline, Decap-CMS-Admin (`src/admin`),
`eleventy-img` für responsive Bilder. Build über `npm-run-all`, Dev-Server über `light-server`.

**Strukturelle Altlasten (versionsunabhängig):**

- `.nvmrc` pinnt **Node 14.15.4** (EOL) — Eleventy 3 + eleventy-img 6 brauchen **Node ≥ 18**.
- `package-lock.json` ist **lockfileVersion 1** (npm-6-Ära) → wird beim Neu-Install auf v3 angehoben.
- `package.json` heißt noch `"eleventy-sample"` (Starter-Template-Rest).
- `uuid` ist deklariert, wird aber **nirgends importiert** (`.eleventy.js` nutzt eine eigene `uuidv4()`).
- `moment` wird **nur zur Build-Zeit** in 6 Datumsfiltern genutzt (kein Client-Bundle).

## 2. Getroffene Entscheidungen

| Thema | Entscheidung |
|---|---|
| Tailwind | **v4 (neueste)** — CSS-first `@theme`, `@tailwindcss/postcss`, kein `purge` mehr |
| Datums-Lib | **moment → Luxon** (11ty-empfohlen, 6 Filter umschreiben) |
| PWA / SEO | **PWA → `eleventy-plugin-pwa-v2`**; `eleventy-plugin-seo` mit Eleventy 3 testen, sonst durch Partial ersetzen |
| Eleventy-Config | **CJS belassen** (`module.exports`) — kein erzwungener ESM-Umbau, geringeres Risiko |

## 3. Dependency-Status (Registry-Stand 2026-06-22)

| Paket | aktuell | neueste | Sprung | Aufwand |
|---|---|---|---|---|
| `@11ty/eleventy` | ^0.12.1 | 3.1.6 | 0.12 → 3 | 🔴 Hoch (Major, Config/Plugin-API) |
| `tailwindcss` | ^2.2.17 | 4.3.1 | 2 → 4 | 🔴 Höchster (CSS-first Rewrite) |
| `@11ty/eleventy-img` | ^0.3.0 | 6.0.4 | 0.3 → 6 | 🟠 Mittel (Shortcode-API neu) |
| `moment` | ^2.29.1 | 2.30.1 | → Luxon | 🟠 Mittel (6 Filter) |
| `eleventy-plugin-pwa` | ^1.0.8 | aufgegeben | → `-v2` 1.0.2 | 🟠 Ersetzen |
| `eleventy-plugin-seo` | ^0.5.2 | eingefroren | prüfen | 🟡 Prüfen/ersetzen |
| `light-server` | ^2.9.1 | aufgegeben | entfernen | 🟢 11ty `--serve` |
| `npm-run-all` | ^4.1.5 | aufgegeben | → `npm-run-all2` 9.0.2 | 🟢 drop-in |
| `@11ty/eleventy-navigation` | ^0.1.6 | 1.0.5 | 0.1 → 1 | 🟢 Niedrig |
| `autoprefixer` | ^9.8.8 | 10.5.0 | 9 → 10 | 🟢 ggf. entfällt (v4) |
| `cssnano` | ^4.1.11 | 8.0.2 | 4 → 8 | 🟢 Niedrig |
| `postcss-cli` | ^8.3.1 | 11.0.1 | 8 → 11 | 🟢 Niedrig |
| `postcss` | ^8.3.11 | 8.5.15 | minor | 🟢 Niedrig |
| `sass` | ^1.43.3 | 1.101.0 | minor | 🟢 Deprecation-Warnungen |
| `uuid` | ^8.3.2 | 14.0.1 | **unused** | 🟢 Entfernen |

---

## 4. Phasenplan

Reihenfolge-Logik: erst harmloses Tooling → Eleventy-Core als Fundament → inhaltsbezogene Umbauten
(img, Datum) → Tailwind (riskantester isolierter Schritt) → Plugins. Jede Phase ist einzeln
baubar/committbar, damit man sauber zurückrollen kann.

### Phase 0 — Vorbereitung & Sicherheit
- [x] Offene Änderung an `src/admin/config.yml` committen/stashen (Working Tree sauber)
- [x] Migrations-Branch `chore/deps-modernization` von `decap` abzweigen
- [x] **Baseline sichern:** aktuellen `dist/` (alter Stack) als Referenz wegkopieren
- [x] `node_modules` + `package-lock.json` löschen (sauberer Neustart, Lockfile v1 → v3)
- [x] `.nvmrc` → `22`; `package.json`-Name `eleventy-sample` → projektgerecht umbenennen

### Phase 1 — Niedrigrisiko / mechanisch 🟢
- [x] `uuid` entfernen (unbenutzt)
- [x] `npm-run-all` → `npm-run-all2` (drop-in, Scripts unverändert)
- [x] `light-server` raus → Dev-Server auf `eleventy --serve`; `.lightserverrc` löschen; `serve`/`dev`-Scripts anpassen
- [x] Bumps: `postcss` 8.5, `postcss-cli` 11, `autoprefixer` 10, `cssnano` 8, `sass` 1.101, `@11ty/eleventy-navigation` 1.0.5
- [x] **Checkpoint:** Stack installiert, alter Build läuft noch

### Phase 2 — Eleventy 0.12 → 3 (Core) 🔴
- [x] `@11ty/eleventy` 3.1.6 installieren
- [x] Config CJS belassen (optional Umbenennung zu `eleventy.config.js`)
- [x] Veraltetes `passthroughFileCopy: true` aus dem Return-Objekt entfernen (in v3 no-op)
- [x] Plugin-Kompatibilität prüfen (navigation ok; pwa/seo folgen in Phase 6)
- [x] **Checkpoint:** `npx eleventy` baut die Seiten (Bilder/Tailwind noch alt)

### Phase 3 — eleventy-img 0.3 → 6 🟠
- [x] `@11ty/eleventy-img` 6.0.4 installieren
- [x] `img`-Async-Shortcode in `.eleventy.js` auf v6-API umschreiben (`Image()` + `Image.generateHTML()`, Formate webp/jpg/avif)
- [x] **Checkpoint:** `<picture>`-Markup im `dist/` identisch/besser als Baseline

### Phase 4 — moment → Luxon 🟠
- [x] `luxon` 3.7.2 hinzufügen, `moment` entfernen
- [x] 6 Filter in `.eleventy.js` umschreiben: `date`, `sortByDate`, `filterFuture`, `filterPast`, `filterFeatured`
- [x] **Achtung Format-Tokens:** moment `'MM-DD-YYYY'` → Luxon `'MM-dd-yyyy'`
- [x] Filter-Signaturen bleiben gleich → keine `.njk`-Änderungen nötig
- [x] **Checkpoint:** Event-Daten/Sortierung in den 6 betroffenen Partials korrekt
      (`events-layout.njk`, `home-events.njk`, `card-sm-events.njk`, `card.njk`, `card-sm-events-upcoming.njk`, `card-sm.njk`)

### Phase 5 — Tailwind 2 → 4 🔴 (größter Brocken)
- [x] `tailwindcss` 4.3.1 + `@tailwindcss/postcss` 4.3.1
- [x] `postcss.config.js`: `tailwindcss({purge,theme})` → `@tailwindcss/postcss`; `autoprefixer` kann entfallen (v4 prefixt selbst); `cssnano` für Minify bleibt
- [x] CSS-Entrypoint: `@tailwind base/components/utilities` → `@import "tailwindcss";`
- [x] Custom-Theme nach CSS `@theme` portieren: Farben (`brand`, `blue.*`, `highlight`, `gray.*`), Fonts (`sans`, `display`), Breakpoints (`sm/md/lg`)
- [x] `purge`/`content` entfällt (v4 auto-detektiert; ggf. `@source`)
- [x] Templates auf veraltete v2-Utilities prüfen (Default-Border-Farbe, Ring-/Shadow-Defaults, Preflight ändern sich in v4)
- [x] **Checkpoint:** Seiten visuell gegen Baseline abgleichen

### Phase 6 — PWA & SEO 🟠
- [x] `eleventy-plugin-pwa` → `eleventy-plugin-pwa-v2` 1.0.2 (Workbox); Konfig + `swDest` anpassen (`manifest.json` existiert in `src/assets`)
- [x] `eleventy-plugin-seo` mit Eleventy 3 testen; bei Bruch durch kleines Meta-Partial ersetzen
- [x] **Checkpoint:** Service-Worker + SEO-Meta-Tags im Output vorhanden

### Phase 7 — Verifikation
- [x] `npm run build` läuft fehlerfrei durch
- [x] `dist/` gegen Baseline diffen (alle Seiten, Bilder, CSS vorhanden?)
- [x] `npm run dev` → Seiten durchklicken, PWA/Manifest, SEO-Meta prüfen
- [x] Optional: Lighthouse

---

## 5. Aufwand

Phasen 1 + 4 je klein; Phase 2 mittel; Phasen 3, 5, 6 sind die Zeitfresser. Insgesamt realistisch
ein fokussierter Arbeitstag, dominiert vom Tailwind-v4-Rewrite und der visuellen Regressionsarbeit.
