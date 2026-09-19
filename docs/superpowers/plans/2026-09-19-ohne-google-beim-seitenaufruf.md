# Schriften und Karte ohne Google beim Seitenaufruf — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Beim Öffnen einer Seite geht nichts mehr an Google Fonts, und die Google-Karte auf der Kontaktseite lädt erst nach einem Klick. Einzige Ausnahme bleibt reCAPTCHA im Kontaktformular.

**Architecture:** Die beiden Schriftdateien, die Google heute ausliefert, liegen als WOFF2 unter `src/assets/fonts/` und werden über `@font-face`-Regeln in `main.css` eingebunden, die Googles Deklarationen 1:1 nachbilden. Der Kartenbereich der Kontaktseite rendert statt des `<iframe>` einen Platzhalter mit Hinweis, Knopf und Karten-Link. Ein kleines Skript `src/javascript/map.js` setzt die Karte erst beim Klick ein. Knopf- und Hinweistext kommen aus den Einstellungen im CMS.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, Tailwind 4 (PostCSS), `node:test`, TinaCMS 3.14.0.

**Spec:** `docs/feature/0005-ohne-google-beim-seitenaufruf.md`. Begriffe: `CONTEXT.md`.

## Global Constraints

- **Branch `feat/ohne-google`, gestapelt auf `feat/klicks-und-verkaeufe` (f33c3e7).** Der Google-Absatz, den Task 3 kürzt, gibt es nur dort. Gemergt wird erst nach dem Release der Messung. Fällt die Messung weg, wird der Branch auf `main` umgesetzt und Task 3 neu gefasst.
- **reCAPTCHA bleibt unverändert** (Entscheidung Dan, 2026-09-19): Kontaktformular, Honeypot und das von Netlify eingesetzte reCAPTCHA werden nicht angefasst.
- **Erscheinungsbild identisch:** Fraunces 500 und 900 mit optischer Größe, Karla 400, 500 und 700, `font-display: swap`. Die Theme-Variablen `--font-sans` und `--font-display` bleiben, wie sie sind.
- **Nur der lateinische Teilsatz** (geprüft 2026-09-19: Die gebauten Seiten enthalten kein Zeichen außerhalb davon). Lizenzdateien (SIL OFL 1.1) liegen neben den Schriften.
- **Keine neuen npm-Abhängigkeiten.** Die Schriften sind Dateien im Repo.
- **Kein Speicher:** `map.js` liest und schreibt weder Cookies noch `localStorage`. Die Entscheidung gilt nur für den aktuellen Seitenaufruf.
- **Beschriftungen aus dem CMS:** Jeder neue Text steht in `global.json` unter `labels` **und** als Feld in der Gruppe „Shared labels" von `tina/collections/settings.ts`. Matthew pflegt nur im CMS.
- **Messung unberührt:** `analytics.js` und der Umami-Block in `base.njk` bleiben, wie sie sind.
- Jede Task endet grün: `npm test` und `npm run typecheck` ohne Fehler.
- Commit-Nachrichten Deutsch, `typ(bereich): …`, Abschluss `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Code-Kommentare Englisch.
- Dev-Server nur über `preview_start`, also nur durch den Controller. Tina läuft nur in Task 2, Schritt 9, und wird danach beendet (Port 4001 frei).
- `$SCRATCH` ist das Scratchpad-Verzeichnis der Sitzung, nie ein Pfad im Repo.

## Rulings aus der Planung

- **Adresse nicht doppelt.** Das Ticket nennt die Adresse im Platzhalter. Sie steht auf der Kontaktseite aber direkt darüber im selben Block. Der Platzhalter zeigt deshalb nur Hinweis, Knopf und Karten-Link. Das Ziel von User Story 5 (Adresse ohne Karte lesbar) erfüllt der vorhandene Adressblock.
- **Linktext wiederverwenden.** „In Google Maps öffnen" nutzt das vorhandene Label `directions` („Directions"), das Events- und Händlerseite schon für denselben Link verwenden. Neu sind nur `map_show` und `map_notice`.
- **Gleiche Gewichts-Deklaration wie Google.** Je Gewicht eine `@font-face`-Regel auf dieselbe variable Datei, kein Bereich `500 900`. Sonst würde ein Zwischengewicht wie `font-bold` (700) bei Fraunces anders aussehen als heute: Heute springt es auf 900.
- **Ohne API-Schlüssel bleibt der Block leer, wie im Ticket.** Auch der Karten-Link entfällt dann, wie bisher die Karte.
- **Die Embed-Adresse bleibt im HTML, aber nicht als Quelle.** Das Ticket prüft, dass keine Seite auf `google.com/maps/embed` verweist. Die Adresse steht weiterhin in `data-map-src`, denn das Skript braucht sie für den Klick. Geladen wird sie erst dann. Der Wächter-Test prüft deshalb, dass kein `<iframe src>` darauf zeigt, nicht das bloße Vorkommen.

---

## Task 0: Ausgangsstand festhalten (Controller, ohne Code)

**Files:** keine im Repo. Ausgabe nach `<scratchpad>/html-before-0005/`.

- [ ] **Schritt 1: Referenz-Build mit Karten-Schlüssel**

Ohne Schlüssel rendert der Kartenblock nicht. Der Vergleich in Task 4 braucht ihn in beiden Builds.

```bash
GMAPS_API_KEY=plan-test-key npm run build:site
rm -rf "$SCRATCH/html-before-0005" && mkdir -p "$SCRATCH/html-before-0005"
(cd dist && find . -name "*.html" -exec cp --parents {} "$SCRATCH/html-before-0005" \;)
find "$SCRATCH/html-before-0005" -name "*.html" | wc -l
```

Expected: `10`.

---

## Task 1: Schriften selbst hosten

**Files:**
- Create: `test/no-google-on-load.test.mjs`
- Create: `src/assets/fonts/fraunces-latin.woff2`, `src/assets/fonts/karla-latin.woff2`, `src/assets/fonts/OFL-Fraunces.txt`, `src/assets/fonts/OFL-Karla.txt`
- Modify: `src/styles/main.css` (neue `@font-face`-Regeln direkt nach `@import "tailwindcss";`)
- Modify: `src/views/_includes/layouts/base.njk:11-13` (drei Google-Zeilen raus, zwei Preloads rein)

**Interfaces:**
- Produces: `test/no-google-on-load.test.mjs` mit den Helfern `files(dir, ext)` und `sources()`. Task 2 hängt einen weiteren Test an diese Datei an. Schriftpfade `/assets/fonts/fraunces-latin.woff2` und `/assets/fonts/karla-latin.woff2`.

- [ ] **Schritt 1: Den Wächter-Test schreiben**

`test/no-google-on-load.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Guards "opening a page sends nothing to Google" (ticket 0005): the fonts
// ship with the site, and the contact page map loads only after a click.
// reCAPTCHA is the accepted exception; Netlify injects it into the contact
// form at deploy time, so it never appears in these files.
const ROOT = path.join(import.meta.dirname, "..");
const VIEWS = path.join(ROOT, "src", "views");
const STYLES = path.join(ROOT, "src", "styles");

function files(dir, ext) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return files(full, ext);
        return entry.name.endsWith(ext) ? [full] : [];
    });
}

const sources = () => [...files(VIEWS, ".njk"), ...files(VIEWS, ".md"), ...files(STYLES, ".css")];
const offendersOf = (pattern) =>
    sources()
        .filter((file) => pattern.test(fs.readFileSync(file, "utf8")))
        .map((file) => path.relative(ROOT, file));

test("no template or stylesheet loads Google Fonts", () => {
    assert.deepEqual(offendersOf(/fonts\.(googleapis|gstatic)\.com/), []);
});

test("every font the stylesheet declares ships with the site, next to its licence", () => {
    const css = fs.readFileSync(path.join(STYLES, "main.css"), "utf8");
    const urls = [...css.matchAll(/@font-face\s*\{[^}]*?url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
    assert.ok(urls.length >= 2, "expected @font-face rules for Fraunces and Karla");
    for (const url of urls) {
        assert.match(url, /^\/assets\/fonts\//);
        assert.ok(fs.existsSync(path.join(ROOT, "src", url)), `${url} is missing`);
    }
    for (const licence of ["OFL-Fraunces.txt", "OFL-Karla.txt"]) {
        assert.ok(fs.existsSync(path.join(ROOT, "src", "assets", "fonts", licence)), `${licence} is missing`);
    }
});
```

- [ ] **Schritt 2: Test laufen lassen, er muss scheitern**

Run: `node --test test/no-google-on-load.test.mjs`
Expected: Beide Tests scheitern. Der erste nennt `src/views/_includes/layouts/base.njk`, der zweite meldet „expected @font-face rules for Fraunces and Karla".

- [ ] **Schritt 3: Schriften und Lizenzen holen**

Das sind die Dateien, die Google am 2026-09-19 für genau die heutige Anfrage ausgeliefert hat: je Familie eine variable Datei für den lateinischen Teilsatz.

```bash
mkdir -p src/assets/fonts
curl -sSfo src/assets/fonts/fraunces-latin.woff2 "https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2"
curl -sSfo src/assets/fonts/karla-latin.woff2 "https://fonts.gstatic.com/s/karla/v33/qkB9XvYC6trAT55ZBi1ueQVIjQTD-JrIH2G7nytkHRyQ8p4wUje6bg.woff2"
curl -sSfo src/assets/fonts/OFL-Fraunces.txt "https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/OFL.txt"
curl -sSfo src/assets/fonts/OFL-Karla.txt "https://raw.githubusercontent.com/google/fonts/main/ofl/karla/OFL.txt"
for f in src/assets/fonts/*.woff2; do printf '%s %s %s\n' "$f" "$(head -c4 "$f")" "$(wc -c < "$f")"; done
grep -l "SIL OPEN FONT LICENSE" src/assets/fonts/OFL-*.txt
```

Expected: Beide WOFF2 beginnen mit `wOF2` und sind größer als 10 000 Bytes. Beide Lizenzdateien werden gefunden. Liefert eine Schrift-URL 404, weil Google eine neue Version hat, die aktuelle URL so holen und hier eintragen:

```bash
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36" "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,900&family=Karla:wght@400;500;700&display=swap" | awk '/\/\* latin \*\//{p=1} p&&/src:/{print; p=0}'
```

- [ ] **Schritt 4: `@font-face`-Regeln in `main.css`**

Direkt nach `@import "tailwindcss";` (Zeile 1), vor `@theme`:

```css
/* The fonts ship with the site instead of loading from Google Fonts
   (ticket 0005). These rules mirror what Google served on 2026-09-19: one
   variable file per family, declared once per weight the design uses, so a
   weight in between still snaps to the nearest declared one exactly as
   before. Latin subset only; the licences sit next to the files. */
@font-face {
    font-family: 'Fraunces';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url(/assets/fonts/fraunces-latin.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
    font-family: 'Fraunces';
    font-style: normal;
    font-weight: 900;
    font-display: swap;
    src: url(/assets/fonts/fraunces-latin.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
    font-family: 'Karla';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(/assets/fonts/karla-latin.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
    font-family: 'Karla';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url(/assets/fonts/karla-latin.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
    font-family: 'Karla';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(/assets/fonts/karla-latin.woff2) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

- [ ] **Schritt 5: Kopfbereich in `base.njk`**

Die drei Zeilen 11 bis 13 (zwei `preconnect` und das Google-Stylesheet) ersetzen durch:

```njk
    {# The fonts ship with the site (ticket 0005). Preloading the two files
       starts them alongside the stylesheet instead of after it; crossorigin
       is required for font preloads even on the same origin. #}
    <link rel="preload" href="/assets/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/assets/fonts/karla-latin.woff2" as="font" type="font/woff2" crossorigin>
```

- [ ] **Schritt 6: Tests und Stylesheet prüfen**

```bash
node --test test/no-google-on-load.test.mjs
npm test
npm run typecheck
npm run styles:dev && grep -c "@font-face" dist/styles/main.css && grep -c "/assets/fonts/" dist/styles/main.css
```

Expected: Alle Tests grün. Im gebauten Stylesheet stehen 5 `@font-face`-Regeln und 5 Verweise auf `/assets/fonts/`.

- [ ] **Schritt 7: Commit**

```bash
git add test/no-google-on-load.test.mjs src/assets/fonts src/styles/main.css src/views/_includes/layouts/base.njk
git commit -m "feat(schriften): Fraunces und Karla kommen von der eigenen Seite statt von Google Fonts"
```

(mit Co-Authored-By-Zeile, siehe Global Constraints)

---

## Task 2: Karte erst nach Klick, Beschriftungen aus dem CMS

**Files:**
- Modify: `test/no-google-on-load.test.mjs` (ein Test mehr)
- Create: `test/labels.test.mjs`
- Modify: `src/views/_includes/partials/contact-details.njk:37-48` (Kartenblock)
- Create: `src/javascript/map.js`
- Modify: `src/views/_data/global.json` (`labels`: zwei Schlüssel)
- Modify: `tina/collections/settings.ts:37-47` (Gruppe `labels`: zwei Felder)
- Modify: `tina/tina-lock.json` (von Tina neu geschrieben)

**Interfaces:**
- Consumes: `sources()` und `offendersOf()` aus `test/no-google-on-load.test.mjs` (Task 1).
- Produces: Labels `map_show` und `map_notice` (Settings → Shared labels). Element `#map` mit `data-map-src` und `data-map-title`, darin ein Knopf `[data-map-show]`. Skript `/js/map.js`.

- [ ] **Schritt 1: Test gegen die eingebettete Karte**

An `test/no-google-on-load.test.mjs` anhängen:

```js
test("no page embeds the Google map directly; it waits for a click", () => {
    assert.deepEqual(offendersOf(/<iframe[^>]*\ssrc="[^"]*google\.com\/maps\/embed/), []);
});
```

Run: `node --test test/no-google-on-load.test.mjs`
Expected: FAIL, nennt `src/views/_includes/partials/contact-details.njk`.

- [ ] **Schritt 2: Test, dass jedes benutzte Label im CMS steht**

`test/labels.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// A label a template uses but Settings lacks renders as an empty string,
// silently. And a label missing from the Tina schema cannot be edited in the
// CMS, which is the only place Matthew edits. This keeps templates, data and
// schema in step.
const ROOT = path.join(import.meta.dirname, "..");

function njkFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return njkFiles(full);
        return entry.name.endsWith(".njk") ? [full] : [];
    });
}

const used = new Set(
    njkFiles(path.join(ROOT, "src", "views")).flatMap((file) =>
        [...fs.readFileSync(file, "utf8").matchAll(/global\.labels\.([a-z_]+)/g)].map((m) => m[1])
    )
);

test("every label a template uses has a text in Settings", () => {
    const { labels } = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "global.json"), "utf8"));
    assert.deepEqual([...used].filter((key) => !labels[key]), []);
});

test("every label a template uses is a field in the CMS", () => {
    const schema = fs.readFileSync(path.join(ROOT, "tina", "collections", "settings.ts"), "utf8");
    const group = schema.slice(schema.indexOf('name: "labels"'));
    const fields = new Set([...group.slice(0, group.indexOf("],")).matchAll(/name: "([a-z_]+)"/g)].map((m) => m[1]));
    assert.deepEqual([...used].filter((key) => !fields.has(key)), []);
});
```

Run: `node --test test/labels.test.mjs`
Expected: PASS. Heute stehen alle benutzten Labels an beiden Stellen. Der Test schlägt in Schritt 4 an, sobald das Template die neuen Labels benutzt.

- [ ] **Schritt 3: Platzhalter statt Karte**

In `contact-details.njk` den Block ab dem Kommentar `{# The embed is built from the studio address …` bis zum letzten `{% endif %}` ersetzen durch:

```njk
{# The map loads from Google only after a click (ticket 0005), so opening
   the contact page sends nothing to Google Maps. The embed is built from
   the studio address in Settings, so moving studios only means editing that
   address. Without a key (local builds, or the variable missing on Netlify)
   the whole block is left out instead of showing Google's error tile. #}
{% if env.googleMapsKey %}
{% set mapQuery = ('Matthew Freed Pottery, ' ~ global.contact.address) | replace(r/\s*\n\s*/g, ', ') | trim %}
<div id="map" class="mt-6 overflow-hidden rounded-xl bg-tile"
     data-map-title="Map of the studio address"
     data-map-src="https://www.google.com/maps/embed/v1/place?key={{ env.googleMapsKey }}&q={{ mapQuery | urlencode }}">
    <div class="flex h-[236px] flex-col items-start justify-center gap-4 p-6">
        <p class="max-w-sm text-sm leading-relaxed text-muted">{{ global.labels.map_notice }}</p>
        {# Hidden until map.js runs: without JavaScript the button could do nothing. #}
        <button type="button" class="btn-outline" data-map-show hidden>{{ global.labels.map_show }}</button>
        <a href="https://www.google.com/maps/search/?api=1&query={{ mapQuery | urlencode }}" target="_blank" rel="noopener" class="link-underline text-sm">{{ global.labels.directions }}</a>
    </div>
</div>
<script defer src="/js/map.js"></script>
{% endif %}
```

Die Höhe 236 px entspricht der Karte, so springt beim Einblenden nichts. Das `hidden`-Attribut wirkt trotz `.btn-outline { display: inline-block }`, weil Tailwinds Preflight `[hidden]` mit `!important` ausblendet. Klicks auf den Karten-Link zählt `analytics.js` schon heute als `directions` (Muster `google.com/maps`), dort ist nichts zu ändern.

- [ ] **Schritt 4: Tests laufen lassen**

Run: `node --test test/no-google-on-load.test.mjs test/labels.test.mjs`
Expected: Der Karten-Test ist grün. Beide Label-Tests scheitern mit `[ 'map_notice', 'map_show' ]`, in beliebiger Reihenfolge.

- [ ] **Schritt 5: Texte in den Einstellungen**

In `src/views/_data/global.json` unter `labels`, nach `"sold_out"`:

```json
    "map_show": "Show map",
    "map_notice": "The map comes from Google Maps. Showing it sends your IP address to Google, which may also set cookies."
```

In `tina/collections/settings.ts` in der Gruppe `labels`, nach dem Feld `sold_out`:

```ts
        { type: "string", name: "map_show", label: "Contact page: button that shows the map" },
        { type: "string", name: "map_notice", label: "Contact page: note that the map comes from Google", ui: { component: "textarea" } },
```

Das vorhandene Feld `directions` („Map link text") gilt jetzt auch für den Link unter der Karte. Das Feld-Label bleibt.

- [ ] **Schritt 6: Das Skript**

`src/javascript/map.js`:

```js
// Contact page map (ticket 0005): Google Maps loads only when the visitor
// asks for it, so opening the page sends nothing to Google Maps. The choice
// holds for this page view only; nothing is stored, no cookie, no
// localStorage.
(function () {
    const map = document.getElementById("map");
    const button = map && map.querySelector("[data-map-show]");
    if (!button) return;
    button.hidden = false;
    button.addEventListener("click", () => {
        const iframe = document.createElement("iframe");
        iframe.title = map.dataset.mapTitle;
        iframe.src = map.dataset.mapSrc;
        iframe.className = "w-full";
        iframe.height = "236";
        iframe.style.border = "0";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.allowFullscreen = true;
        map.replaceChildren(iframe);
        // The button is gone; moving focus to the map keeps keyboard and
        // screen reader users where they were instead of back at the top.
        iframe.focus();
    });
})();
```

- [ ] **Schritt 7: Tests grün**

```bash
npm test
npm run typecheck
```

Expected: Alle Tests grün, `typecheck` ohne Fehler.

- [ ] **Schritt 8: Commit**

```bash
git add test/no-google-on-load.test.mjs test/labels.test.mjs src/views/_includes/partials/contact-details.njk src/javascript/map.js src/views/_data/global.json tina/collections/settings.ts
git commit -m "feat(kontakt): Google-Karte lädt erst nach Klick, Beschriftungen im CMS"
```

Der Implementer endet hier. Schritt 9 macht der Controller, weil er einen Dev-Server braucht.

- [ ] **Schritt 9 (Controller): Tina-Sperrdatei und Round-Trip**

`tina/tina-lock.json` schreibt nur `tinacms dev` neu. `preview_start` mit `pottery-dev` (`npm run dev`, startet Tina auf Port 4001), dann warten, bis die API antwortet:

```bash
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' -X POST -H "Content-Type: application/json" -d '{"query":"{__typename}"}' http://localhost:4001/graphql | grep -q 200 && break; sleep 5; done
grep -c map_notice tina/tina-lock.json
npm run tina:roundtrip -- settings global.json
```

Expected: `tina-lock.json` ist geändert und enthält `map_show` und `map_notice`. Der Round-Trip meldet `ROUND-TRIP OK: src/views/_data/global.json`. Fehlt ein Feld im Schema, würde Tina es beim Speichern verwerfen, und der Round-Trip bräche mit einem Diff ab.

Danach `preview_stop`. Hängt noch ein Prozess auf Port 4001 oder 8080, ihn beenden (PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 4001,8080 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

`git status` darf nur `tina/tina-lock.json` als geändert zeigen, keine Inhaltsdateien unter `src/views/`.

```bash
git add tina/tina-lock.json
git commit -m "chore(cms): Tina-Sperrdatei um die Kartenbeschriftungen ergänzt"
```

---

## Task 3: Datenschutzerklärung und Ticket nachziehen

**Files:**
- Modify: `src/views/privacy-statement.md` (Absatz „Three things on this website come from Google. …")
- Modify: `docs/feature/0005-ohne-google-beim-seitenaufruf.md:3` (Status)

- [ ] **Schritt 1: Google-Absatz ersetzen**

Den Absatz, der mit `Three things on this website come from Google.` beginnt und mit `Google's privacy policy applies to all three.` endet, ersetzen durch:

```markdown
Two things on the contact page come from Google. The contact form is protected against spam by Google reCAPTCHA, which loads with the page and may set Google's own cookies. The map comes from Google Maps and loads only if you choose to show it. Google's privacy policy applies to both.
```

Die übrigen Absätze bleiben Wort für Wort. Keine anderen Zeilen der Datei ändern (Vorspann, Leerzeilen, Zeilenenden).

- [ ] **Schritt 2: Status im Ticket**

Die Statuszeile (Zeile 3) von `docs/feature/0005-ohne-google-beim-seitenaufruf.md` ersetzen durch:

```markdown
> **Status: umgesetzt auf Branch `feat/ohne-google`** (Plan `docs/superpowers/plans/2026-09-19-ohne-google-beim-seitenaufruf.md`), gestapelt auf die Messung. Geht nach deren Release live. **reCAPTCHA bleibt** (Entscheidung Dan, 2026-09-19); dieses Ticket betrifft nur Schriften und Karte.
```

- [ ] **Schritt 3: Prüfen und Commit**

```bash
npm test
git diff --stat
git add src/views/privacy-statement.md docs/feature/0005-ohne-google-beim-seitenaufruf.md
git commit -m "docs(datenschutz): Google-Absatz auf reCAPTCHA und Karte auf Wunsch gekürzt"
```

Expected: Tests grün. `git diff --stat` vor dem Commit zeigt genau zwei Dateien mit je wenigen Zeilen.

---

## Task 4: Prüfung (Controller)

- [ ] **Schritt 1: Build-Vergleich**

```bash
GMAPS_API_KEY=plan-test-key npm run build:site
node scripts/compare-html.mjs "$SCRATCH/html-before-0005" dist
git diff --no-index --stat "$SCRATCH/html-before-0005" dist -- '*.html'
```

Expected: Alle 10 Seiten weichen ab, aber nur im Kopfbereich: drei Google-Zeilen weg, Kommentar und zwei Preload-Zeilen dazu. Die Kontaktseite weicht zusätzlich im Kartenblock ab, die Datenschutzseite im Google-Absatz. Das mit `git diff --no-index -U0` Seite für Seite durchsehen. Jede andere Abweichung ist ein Fehler.

- [ ] **Schritt 2: Push und Vorschau**

`git push -u origin feat/ohne-google`, dann warten, bis `https://feat-ohne-google--mf-pottery.netlify.app/build.txt` den HEAD-Commit zeigt.

- [ ] **Schritt 3: Netzwerk im Browser (Playwright, sichtbares Rendering)**

- Startseite: keine Anfrage an `fonts.googleapis.com`, `fonts.gstatic.com`, `maps.googleapis.com` oder `www.google.com`. Beide Schriften kommen von `/assets/fonts/` (`document.fonts` mit Status `loaded`).
- Kontaktseite: Google-Anfragen nur zu reCAPTCHA (`/recaptcha/`). Nach dem Klick auf „Show map" erscheint das `<iframe>`, und Anfragen an Google Maps folgen.
- Kontaktseite ohne JavaScript (`newContext({ javaScriptEnabled: false })`): Hinweis und Karten-Link sichtbar, Knopf nicht.
- Telefonbreite 375 px: Platzhalter ohne seitlichen Überlauf (`document.documentElement.scrollWidth <= 375`).

- [ ] **Schritt 4: Erscheinungsbild**

Startseite und Kontaktseite bei 1280 px und 375 px: Screenshots von `https://matthewfreed.ca` und der Vorschau nebeneinander. Überschriften (Fraunces 900, optische Größe) und Fließtext (Karla) müssen gleich aussehen. Zusätzlich `getComputedStyle` für eine `h1` und einen Absatz: gleiche `font-family`, `font-weight` und `font-size`.

- [ ] **Schritt 5: Kontaktformular**

Nur mit Dans ausdrücklichem OK eine Testnachricht auf der Vorschau abschicken, oder Dan schickt sie selbst. Erwartet: reCAPTCHA erscheint wie bisher, und die Nachricht kommt in Netlify an.
