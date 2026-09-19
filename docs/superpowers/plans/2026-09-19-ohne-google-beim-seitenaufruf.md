# Schriften und Karte ohne Google beim Seitenaufruf — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Beim Öffnen einer Seite geht nichts mehr an Google Fonts oder Google Maps. Einzige Ausnahme bleibt reCAPTCHA im Kontaktformular.

**Architecture:** Die beiden Schriftdateien, die Google heute ausliefert, liegen als WOFF2 unter `src/assets/fonts/`. `@font-face`-Regeln in `main.css` bilden Googles Deklarationen 1:1 nach. Auf der Kontaktseite ersetzt ein Kartenbild aus OpenStreetMap die eingebettete Google-Karte. Das Skript `scripts/map-preview.mjs` erzeugt es einmal von Hand. Bild und Textlink führen zu Google Maps. Der Google-Maps-API-Schlüssel wird nicht mehr gelesen.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, Tailwind 4 (PostCSS), `node:test`, sharp 0.35 (schon direkte Abhängigkeit), OpenStreetMap-Kacheln und Nominatim (nur im Skript).

**Spec:** `docs/feature/0005-ohne-google-beim-seitenaufruf.md`. Begriffe: `CONTEXT.md`.

## Global Constraints

- **Branch `feat/ohne-google`, gestapelt auf `feat/klicks-und-verkaeufe` (f33c3e7).** Den Google-Absatz, den Task 4 kürzt, gibt es nur dort. Gemergt wird erst nach dem Release der Messung. Fällt die Messung weg, wird der Branch auf `main` umgesetzt und Task 4 neu gefasst.
- **reCAPTCHA bleibt unverändert** (Entscheidung Dan, 2026-09-19): Kontaktformular, Honeypot und das von Netlify eingesetzte reCAPTCHA werden nicht angefasst.
- **Keine eingebettete Karte, kein Kartendienst beim Aufruf** (Entscheidung Dan, 2026-09-19). Google Maps ist nur ein Link. Das Kartenbild liegt auf dem eigenen Server. Kein Skript auf der Kontaktseite.
- **Erscheinungsbild identisch:** Fraunces 500 und 900 mit optischer Größe, Karla 400, 500 und 700, `font-display: swap`. Die Theme-Variablen `--font-sans` und `--font-display` bleiben, wie sie sind.
- **Nur der lateinische Teilsatz** (geprüft 2026-09-19: Die gebauten Seiten enthalten kein Zeichen außerhalb davon). Lizenzdateien (SIL OFL 1.1) liegen neben den Schriften.
- **OpenStreetMap fair nutzen:** Das Kartenbild entsteht nur von Hand per `npm run map:preview`, nie im Build. Anfragen einzeln nacheinander, mit User-Agent `matthewfreed.ca map preview script (+https://matthewfreed.ca)`, keine persönlichen Daten darin. Auf dem Bild steht sichtbar „© OpenStreetMap contributors" mit Link auf `https://www.openstreetmap.org/copyright`.
- **Kein Google-Kartenbild speichern:** Googles Nutzungsbedingungen verbieten es.
- **Keine neuen npm-Abhängigkeiten.**
- **Texte aus dem CMS:** Der Linktext nutzt das vorhandene Label `directions` („Directions"). Neue Texte gibt es nicht, außer der gesetzlich festen OSM-Quellenangabe.
- **Messung unberührt:** `analytics.js` und der Umami-Block in `base.njk` bleiben, wie sie sind.
- Jede Task endet grün: `npm test` und `npm run typecheck` ohne Fehler.
- Commit-Nachrichten Deutsch, `typ(bereich): …`, Abschluss `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Code-Kommentare Englisch.
- Dev-Server nur über `preview_start`, also nur durch den Controller. Diese Tasks brauchen keinen.
- `$SCRATCH` ist das Scratchpad-Verzeichnis der Sitzung, nie ein Pfad im Repo.

## Rulings aus der Planung

- **Gleiche Gewichts-Deklaration wie Google.** Je Gewicht eine `@font-face`-Regel auf dieselbe variable Datei, kein Bereich `500 900`. Sonst würde ein Zwischengewicht wie `font-bold` (700) bei Fraunces anders aussehen als heute: Heute springt es auf 900.
- **Nie ein Bild vom alten Ort.** Das Skript schreibt neben das Bild `src/views/_data/mapPreview.json` mit der Adresse, für die es entstand. Das Template zeigt das Bild nur, solange sie mit `global.contact.address` übereinstimmt. Der Link zu Google Maps entsteht immer aus der aktuellen Adresse. Ein Test meldet die Abweichung als Erinnerung für Dan.
- **Ein Link für Tastatur und Screenreader.** Das Bild ist klickbar, aber `aria-hidden` und aus der Tab-Reihenfolge genommen. Der Textlink „Directions" darunter ist der zugängliche Weg zum selben Ziel. Die Adresse steht als Text direkt darüber.
- **Scharf genug ohne Retina-Kacheln.** OSM liefert nur Kacheln in einfacher Auflösung. Das Skript schneidet 720 × 304 px bei Zoom 16 aus und vergrößert auf 1440 × 608 px (lanczos3). Die Schrift auf der Karte bleibt so lesbar groß, und `{% img %}` bekommt Breiten bis 1280 px.
- **Farbe:** Sättigung auf 25 % (`modulate({ saturation: 0.25 })`), Markierung in `#1F3A52` mit Papierrand `#F8F5EE`. Wirkt es in Task 5 auf dem Screenshot zu blass oder zu bunt, darf der Controller den einen Wert anpassen und das Bild neu erzeugen.

---

## Task 0: Ausgangsstand festhalten (Controller, ohne Code)

**Files:** keine im Repo. Ausgabe nach `$SCRATCH/html-before-0005/`.

- [ ] **Schritt 1: Referenz-Build mit Karten-Schlüssel**

Ohne Schlüssel rendert die heutige Karte nicht. Der Vergleich in Task 5 soll ihren Wegfall zeigen.

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
- Produces: `test/no-google-on-load.test.mjs` mit den Helfern `files(dir, ext)`, `sources()` und `offendersOf(pattern)`. Task 3 hängt einen weiteren Test an diese Datei an. Schriftpfade `/assets/fonts/fraunces-latin.woff2` und `/assets/fonts/karla-latin.woff2`.

- [ ] **Schritt 1: Den Wächter-Test schreiben**

`test/no-google-on-load.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Guards "opening a page sends nothing to Google" (ticket 0005): the fonts
// ship with the site, and Google Maps is a link, not an embed. reCAPTCHA is
// the accepted exception; Netlify injects it into the contact form at
// deploy time, so it never appears in these files.
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

## Task 2: Kartenbild aus OpenStreetMap erzeugen

**Files:**
- Create: `test/map-preview.test.mjs`
- Create: `scripts/map-preview.mjs`
- Modify: `package.json` (Skript `map:preview`)
- Create (Ausgabe des Skripts, eingecheckt): `src/images/site/studio-map.png`, `src/views/_data/mapPreview.json`

**Interfaces:**
- Produces: `worldPixel(lat, lon, zoom) → { x, y }` und `tileWindow(center, width, height, pinY) → { x0, y0, x1, y1, offsetX, offsetY }`, exportiert aus `scripts/map-preview.mjs`. Globale Daten `mapPreview` mit `{ address, lat, lon, zoom, made }`. Bild `/images/site/studio-map.png` (1440 × 608 px, Studio genau in der Mitte). Task 3 liest `mapPreview.address` und das Bild.

- [ ] **Schritt 1: Tests schreiben**

`test/map-preview.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { worldPixel, tileWindow } from "../scripts/map-preview.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const near = (actual, expected) => Math.abs(actual - expected) < 1e-6;

test("worldPixel puts latitude 0, longitude 0 in the middle of the world map", () => {
    assert.deepEqual(worldPixel(0, 0, 0), { x: 128, y: 128 });
    assert.deepEqual(worldPixel(0, 0, 1), { x: 256, y: 256 });
});

test("worldPixel reaches the corners at the edges of Web Mercator", () => {
    const topLeft = worldPixel(85.0511287798, -180, 2);
    const bottomRight = worldPixel(-85.0511287798, 180, 2);
    assert.ok(near(topLeft.x, 0) && near(topLeft.y, 0), JSON.stringify(topLeft));
    assert.ok(near(bottomRight.x, 1024) && near(bottomRight.y, 1024), JSON.stringify(bottomRight));
});

test("tileWindow finds the tiles around the pin and where the picture starts in them", () => {
    assert.deepEqual(tileWindow({ x: 1000, y: 1000 }, 720, 304, 0.5), {
        x0: 2, y0: 3, x1: 5, y1: 4, offsetX: 128, offsetY: 80,
    });
});

// Not a code check: a reminder. The contact page hides the picture once the
// address in Settings changes; this tells Dan to make a new one.
test("the map picture was made for the current studio address (else: npm run map:preview)", () => {
    const preview = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "mapPreview.json"), "utf8"));
    const { contact } = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "global.json"), "utf8"));
    assert.equal(preview.address, contact.address);
    assert.ok(fs.existsSync(path.join(ROOT, "src", "images", "site", "studio-map.png")));
});
```

- [ ] **Schritt 2: Tests laufen lassen, sie müssen scheitern**

Run: `node --test test/map-preview.test.mjs`
Expected: FAIL. Das Modul `../scripts/map-preview.mjs` fehlt (`ERR_MODULE_NOT_FOUND`).

- [ ] **Schritt 3: Das Skript**

`scripts/map-preview.mjs`:

```js
// Makes the map picture on the contact page (ticket 0005). It comes from
// OpenStreetMap and is stored with the site, so opening the page contacts
// no map service; Google Maps is only a link. Run it again after the studio
// moves (the contact page hides the old picture until then):
//
//   npm run map:preview
//   npm run map:preview -- --lat=49.2799298 --lon=-123.0863028
//
// The second form skips the address search, for when it finds nothing.
// OpenStreetMap asks scripts to identify themselves and to download little:
// one address search and a handful of tiles per run, one at a time, and
// never during a build.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const USER_AGENT = "matthewfreed.ca map preview script (+https://matthewfreed.ca)";
const TILE = 256;
const ZOOM = 16;
// Cut at the tiles' own resolution, then doubled: OpenStreetMap has no
// high-density tiles, and doubling keeps the street names readable.
const WIDTH = 720;
const HEIGHT = 304;
const SCALE = 2;
const PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="16" fill="#1F3A52" stroke="#F8F5EE" stroke-width="6"/></svg>`;
const OUT_IMAGE = path.join(ROOT, "src", "images", "site", "studio-map.png");
const OUT_DATA = path.join(ROOT, "src", "views", "_data", "mapPreview.json");

// Web Mercator: where a coordinate lies, in pixels of the whole world map
// at this zoom level.
export function worldPixel(lat, lon, zoom) {
    const size = TILE * 2 ** zoom;
    const sin = Math.sin((lat * Math.PI) / 180);
    return {
        x: ((lon + 180) / 360) * size,
        y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
    };
}

// The tiles a picture of width × height needs when its pin, at half the
// width and pinY of the height, lands on the given world pixel; and where
// the picture starts inside the first tile.
export function tileWindow(center, width, height, pinY) {
    const left = Math.round(center.x - width / 2);
    const top = Math.round(center.y - height * pinY);
    const x0 = Math.floor(left / TILE);
    const y0 = Math.floor(top / TILE);
    return {
        x0,
        y0,
        x1: Math.floor((left + width - 1) / TILE),
        y1: Math.floor((top + height - 1) / TILE),
        offsetX: left - x0 * TILE,
        offsetY: top - y0 * TILE,
    };
}

async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${res.status} for ${url}`);
    return res;
}

async function geocode(address) {
    const query = address.split("\n").map((line) => line.trim()).filter(Boolean).join(", ");
    const res = await get(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
    const [hit] = await res.json();
    if (!hit) throw new Error(`No match for "${query}". Pass --lat= and --lon= instead.`);
    return { lat: Number(hit.lat), lon: Number(hit.lon) };
}

async function main() {
    const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
    const global = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "views", "_data", "global.json"), "utf8"));
    const address = global.contact.address;
    const { lat, lon } = args.lat && args.lon ? { lat: Number(args.lat), lon: Number(args.lon) } : await geocode(address);

    const win = tileWindow(worldPixel(lat, lon, ZOOM), WIDTH, HEIGHT, 0.5);
    const tiles = [];
    for (let y = win.y0; y <= win.y1; y++) {
        for (let x = win.x0; x <= win.x1; x++) {
            const res = await get(`https://tile.openstreetmap.org/${ZOOM}/${x}/${y}.png`);
            tiles.push({ input: Buffer.from(await res.arrayBuffer()), left: (x - win.x0) * TILE, top: (y - win.y0) * TILE });
        }
    }
    const mosaic = await sharp({
        create: { width: (win.x1 - win.x0 + 1) * TILE, height: (win.y1 - win.y0 + 1) * TILE, channels: 3, background: "#ffffff" },
    }).composite(tiles).png().toBuffer();

    const picture = await sharp(mosaic)
        .extract({ left: win.offsetX, top: win.offsetY, width: WIDTH, height: HEIGHT })
        .resize(WIDTH * SCALE, HEIGHT * SCALE, { kernel: "lanczos3" })
        // Quiet the map into the site's paper palette; the pin keeps its colour.
        .modulate({ saturation: 0.25 })
        .composite([{ input: Buffer.from(PIN), left: (WIDTH * SCALE) / 2 - 24, top: (HEIGHT * SCALE) / 2 - 24 }])
        .png()
        .toBuffer();

    fs.writeFileSync(OUT_IMAGE, picture);
    const made = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(OUT_DATA, JSON.stringify({ address, lat, lon, zoom: ZOOM, made }, null, 2) + "\n");
    console.log(`Map picture for ${lat}, ${lon} written (${tiles.length} tiles).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
```

In `package.json` unter `scripts`, nach `"go-live"`:

```json
    "map:preview": "node scripts/map-preview.mjs",
```

- [ ] **Schritt 4: Rechen-Tests grün**

Run: `node --test test/map-preview.test.mjs`
Expected: Die drei Rechen-Tests sind grün. Der Adress-Test scheitert noch, weil `mapPreview.json` fehlt.

- [ ] **Schritt 5: Bild erzeugen**

```bash
npm run map:preview
```

Expected: `Map picture for 49.27…, -123.08… written (8 tiles).` Findet die Adresssuche nichts, mit den Koordinaten des Gebäudes 838 East Pender Street aus OpenStreetMap (abgefragt 2026-09-19) erneut starten:

```bash
npm run map:preview -- --lat=49.2799298 --lon=-123.0863028
```

Prüfen: Das Bild ansehen (Read-Tool auf `src/images/site/studio-map.png`). Es muss 1440 × 608 px groß sein, East Pender Street zeigen und die Markierung genau in der Mitte haben. `mapPreview.json` enthält die Adresse Zeichen für Zeichen wie in `global.json`, samt Leerzeichen und `\n`.

- [ ] **Schritt 6: Alles grün, Commit**

```bash
npm test
npm run typecheck
git add test/map-preview.test.mjs scripts/map-preview.mjs package.json src/images/site/studio-map.png src/views/_data/mapPreview.json
git commit -m "feat(kontakt): Kartenbild des Studios aus OpenStreetMap, per Skript erzeugt"
```

---

## Task 3: Kontaktseite mit Kartenbild und Link statt eingebetteter Karte

**Files:**
- Modify: `test/no-google-on-load.test.mjs` (ein Test mehr)
- Modify: `src/views/_includes/partials/contact-details.njk:37-48` (Kartenblock)
- Modify: `src/views/_data/env.js:5` (Zeile `googleMapsKey` entfällt)

**Interfaces:**
- Consumes: `offendersOf()` aus Task 1. `mapPreview.address` und `/images/site/studio-map.png` aus Task 2. Label `global.labels.directions`.

- [ ] **Schritt 1: Test gegen eingebettete Google-Karten**

An `test/no-google-on-load.test.mjs` anhängen:

```js
test("no page embeds Google Maps; the contact page links to it instead", () => {
    assert.deepEqual(offendersOf(/google\.com\/maps\/embed|maps\.googleapis\.com/), []);
});
```

Run: `node --test test/no-google-on-load.test.mjs`
Expected: FAIL, nennt `src/views/_includes/partials/contact-details.njk`.

- [ ] **Schritt 2: Kartenblock ersetzen**

In `contact-details.njk` den Block ab dem Kommentar `{# The embed is built from the studio address …` bis zum letzten `{% endif %}` ersetzen durch:

```njk
{# The map is a picture stored with the site, made from OpenStreetMap by
   scripts/map-preview.mjs, so opening this page contacts no map service
   (ticket 0005). Google Maps is only a link, built from the studio address
   in Settings like the links on the events and retail pages. The picture
   shows only while it was made for the current address, so after a move
   the page never shows the old place. #}
{% set mapQuery = ('Matthew Freed Pottery, ' ~ global.contact.address) | replace(r/\s*\n\s*/g, ', ') | trim %}
{% set mapsUrl = "https://www.google.com/maps/search/?api=1&query=" ~ (mapQuery | urlencode) %}
{% if mapPreview.address == global.contact.address %}
<div class="relative mt-6 overflow-hidden rounded-xl bg-tile">
    {# The text link below is the one for keyboards and screen readers; this
       one only makes the picture clickable. #}
    <a href="{{ mapsUrl }}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
        {% img "/images/site/studio-map.png", "Street map around the studio", "(min-width: 768px) 50vw, 100vw", "block h-[236px] w-full object-cover" %}
    </a>
    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" class="absolute bottom-1 right-2 bg-paper/80 px-1 text-[10px] text-muted">© OpenStreetMap contributors</a>
</div>
{% endif %}
<a href="{{ mapsUrl }}" target="_blank" rel="noopener" class="link-underline mt-3 inline-block text-sm">{{ global.labels.directions }}</a>
```

Klicks auf beide Google-Links zählt `analytics.js` schon heute als `directions` (Muster `google.com` + `/maps`). Dort ist nichts zu ändern.

- [ ] **Schritt 3: Schlüssel nicht mehr lesen**

In `src/views/_data/env.js` die Zeile `googleMapsKey: process.env.GMAPS_API_KEY || "",` löschen. Danach:

```bash
git grep -n "googleMapsKey\|GMAPS_API_KEY" -- src
```

Expected: keine Treffer.

- [ ] **Schritt 4: Tests grün**

```bash
npm test
npm run typecheck
```

Expected: Alle Tests grün.

- [ ] **Schritt 5: Kontaktseite einzeln bauen und ansehen**

```bash
npx eleventy --input=src/views/contact.md --output="$SCRATCH/contact-0005" --quiet
grep -o '<img[^>]*studio-map[^>]*>' "$SCRATCH/contact-0005/contact.html" | head -1
grep -c 'openstreetmap.org/copyright' "$SCRATCH/contact-0005/contact.html"
grep -o 'href="https://www.google.com/maps/search/[^"]*"' "$SCRATCH/contact-0005/contact.html"
grep -c '<iframe' "$SCRATCH/contact-0005/contact.html"
```

Expected: ein `<img>` mit `studio-map` und `alt="Street map around the studio"`, 1 OSM-Link, zweimal derselbe Google-Maps-Link (Bild und Text), `0` iframes. Die Ausgabe liegt im Scratchpad, nicht in `dist/`.

- [ ] **Schritt 6: Commit**

```bash
git add test/no-google-on-load.test.mjs src/views/_includes/partials/contact-details.njk src/views/_data/env.js
git commit -m "feat(kontakt): Kartenbild und Link zu Google Maps statt eingebetteter Karte"
```

---

## Task 4: Datenschutzerklärung und Ticket nachziehen

**Files:**
- Modify: `src/views/privacy-statement.md` (Absatz „Three things on this website come from Google. …")
- Modify: `docs/feature/0005-ohne-google-beim-seitenaufruf.md:3` (Status)

- [ ] **Schritt 1: Google-Absatz ersetzen**

Den Absatz, der mit `Three things on this website come from Google.` beginnt und mit `Google's privacy policy applies to all three.` endet, ersetzen durch:

```markdown
On the contact page, the form is protected against spam by Google reCAPTCHA, which loads with the page and may set Google's own cookies; Google's privacy policy applies. The map on that page is a picture stored on this website, made from OpenStreetMap data. Google Maps only opens if you follow the link to it.
```

Die übrigen Absätze bleiben Wort für Wort. Keine anderen Zeilen der Datei ändern (Vorspann, Leerzeilen, Zeilenenden).

- [ ] **Schritt 2: Status im Ticket**

Die Statuszeile (Zeile 3) von `docs/feature/0005-ohne-google-beim-seitenaufruf.md` beginnt mit `> **Status: geplant**`. Nur diesen Anfang ersetzen durch `> **Status: umgesetzt auf Branch `feat/ohne-google`**`. Der Rest der Zeile bleibt.

- [ ] **Schritt 3: Prüfen und Commit**

```bash
npm test
git diff --stat
git add src/views/privacy-statement.md docs/feature/0005-ohne-google-beim-seitenaufruf.md
git commit -m "docs(datenschutz): Google-Absatz auf reCAPTCHA gekürzt, Karte als Bild erklärt"
```

Expected: Tests grün. `git diff --stat` vor dem Commit zeigt genau zwei Dateien mit je wenigen Zeilen.

---

## Task 5: Prüfung (Controller)

- [ ] **Schritt 1: Build-Vergleich**

```bash
GMAPS_API_KEY=plan-test-key npm run build:site
node scripts/compare-html.mjs "$SCRATCH/html-before-0005" dist
git diff --no-index --stat "$SCRATCH/html-before-0005" dist -- '*.html'
```

Expected: Alle 10 Seiten weichen ab, aber nur im Kopfbereich: drei Google-Zeilen weg, Kommentar und zwei Preload-Zeilen dazu. Zusätzlich weicht die Kontaktseite im Kartenblock ab (iframe weg, Bild und Links dazu) und die Datenschutzseite im Google-Absatz. Mit `git diff --no-index -U0` Seite für Seite durchsehen. Jede andere Abweichung ist ein Fehler.

- [ ] **Schritt 2: Push und Vorschau**

`git push -u origin feat/ohne-google`, dann warten, bis `https://feat-ohne-google--mf-pottery.netlify.app/build.txt` den HEAD-Commit zeigt.

- [ ] **Schritt 3: Netzwerk im Browser (Playwright, sichtbares Rendering)**

- Startseite: keine Anfrage an `fonts.googleapis.com`, `fonts.gstatic.com`, `maps.googleapis.com` oder `www.google.com`. Beide Schriften kommen von `/assets/fonts/` (`document.fonts` mit Status `loaded`).
- Kontaktseite: Google-Anfragen nur zu reCAPTCHA (`/recaptcha/`), keine zu Google Maps. Das Kartenbild kommt von `/images/`. Bild-Link und „Directions" zeigen auf `https://www.google.com/maps/search/?api=1&query=…`.
- Telefonbreite 375 px: kein seitlicher Überlauf (`document.documentElement.scrollWidth <= 375`), Markierung sichtbar.

- [ ] **Schritt 4: Erscheinungsbild**

Startseite und Kontaktseite bei 1280 px und 375 px: Screenshots von `https://matthewfreed.ca` und der Vorschau nebeneinander. Überschriften (Fraunces 900, optische Größe) und Fließtext (Karla) müssen gleich aussehen. Zusätzlich `getComputedStyle` für eine `h1` und einen Absatz: gleiche `font-family`, `font-weight` und `font-size`. Das Kartenbild muss zum Papierton passen (siehe Ruling „Farbe").

- [ ] **Schritt 5: Kontaktformular**

Nur mit Dans ausdrücklichem OK eine Testnachricht auf der Vorschau abschicken, oder Dan schickt sie selbst. Erwartet: reCAPTCHA erscheint wie bisher, und die Nachricht kommt in Netlify an.

- [ ] **Schritt 6: Für Dan nach dem Release**

`GMAPS_API_KEY` in Netlify löschen und den Schlüssel in der Google Cloud Console deaktivieren. Die Website liest ihn nicht mehr.
