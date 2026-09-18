# TinaCloud-Durchstich Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nachweisen, dass TinaCloud mit diesem Stack trägt: Events und About sind in Tina bearbeitbar, lokal und auf einer Netlify-Deploy-Vorschau, und Dan entscheidet am Tor, ob die übrigen Collections folgen.

**Architecture:** Tina liegt neben Decap. `tina/config.ts` beschreibt zwei Collections über bestehende Dateien (`src/views/_data/events.json`, `src/views/about.md`), ohne die Datenform zu ändern. `tinacms build` legt das Admin nach `dist/admin-tina/`, Eleventy baut die Seite wie bisher. Lokal läuft Tina ohne Login gegen die Platte, auf Netlify gegen TinaCloud.

**Tech Stack:** Eleventy 3.1.6, Node 22, TinaCMS 3.14 (`tinacms`, `@tinacms/cli`), TinaCloud (kostenlos), Netlify, Luxon, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`

## Global Constraints

- Branch: `feat/tinacloud-migration`. Nie direkt auf `main` arbeiten.
- Das Token steht nie im Repo, in keinem Commit und in keiner Chat-Ausgabe. Nur `TINA_TOKEN` in Netlify und optional in `.env` (ist in `.gitignore`).
- Client-ID in `tina/config.ts`: `70c9fe54-ade8-4e7d-b8de-e44bc1d0f0bb`, überschreibbar durch `NEXT_PUBLIC_TINA_CLIENT_ID`.
- Tina-Admin nach `/admin-tina/`. `src/admin/` (Decap) bleibt unverändert.
- Keine Ordner-Collections, keine Datenbrücken, keine Änderung an Templates außer der in Task 3 Variante A beschriebenen.
- `layout`, `permalink`, `tags`, `eleventyNavigation` nicht modellieren.
- Jeder Schlüssel in Listen und verschachtelten Objekten wird modelliert oder vorher bewusst gelöscht.
- Collection-Namen nur `[A-Za-z0-9_]`, kein Feldname mit `__`-Präfix. Einzeldateien über `path` = Ordner plus `match.include`.
- Dev-Server nur über das Browser-Pane-Tool `preview_start` mit Namen aus `.claude/launch.json` starten, nie per Bash.
- Keine Passwörter oder Tokens eingeben. Den TinaCloud-Login auf der Vorschau macht Dan selbst.
- Nach außen wirkende Schritte (Push, Pull Request) erst nach Dans Bestätigung im Chat.
- Commit-Nachrichten auf Deutsch im Stil `typ(bereich): …`, abgeschlossen mit `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Befunde landen sofort in Abschnitt 9 des Specs, im Commit der jeweiligen Task.

- Nicht in diesem Plan, sondern in späteren Plänen laut Spec Abschnitt 7: News-Umzug nach `events.md`, Trennung von `showcase.json`, die übrigen Collections, die Umstellung und das Aufräumen der alten CMS-Reste. `news.json` und `src/admin/` hier nicht anfassen.

---

## Dateien

| Datei | Aufgabe |
|---|---|
| `package.json` | Tina-Abhängigkeiten, Skripte `typecheck`, `tina:build`, `tina:dev`, `build:site`, geänderte `dev` und `build` |
| `tsconfig.json` (neu) | Typprüfung für `tina/**/*.ts` |
| `tina/config.ts` (neu) | Branch, Client-ID, Token, Build-Ziel, Medien, Collections |
| `tina/collections/events.ts` (neu) | Schema für `events.json` |
| `tina/collections/about.ts` (neu) | Schema für `about.md` |
| `tina/tina-lock.json` (neu, generiert) | Schema-Stand für TinaCloud, wird committet |
| `src/views/_data/events.json` | Tote Schlüssel entfernen, danach Tina-Formatierung |
| `src/utils/dates.js` (neu, nur Variante A) | `parseDate` für beide Datumsformate |
| `test/dates.test.js` (neu, nur Variante A) | Tests für `parseDate` |
| `.eleventy.js` (nur Variante A) | Alle Datumsfilter über `parseDate` |
| `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md` | Abschnitt 9 „Befunde aus dem Durchstich" |

---

### Task 1: Tote Schlüssel aus den Events entfernen

**Files:**
- Modify: `src/views/_data/events.json`
- Modify: `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`

**Interfaces:**
- Consumes: nichts
- Produces: HTML-Referenz unter `$TMP/tina-durchstich/html-baseline/`, die Task 3 und Task 4 wiederverwenden. `events.json` ohne `featured` und `image` in den Events.

- [ ] **Step 1: Beweisen, dass beide Schlüssel ungenutzt sind**

Run (Git Bash):
```bash
grep -rn "featured" .eleventy.js src/views/_includes src/javascript | grep -v featured_piece
grep -rn "event\.image\|e\.image\|first\.image" src/views/_includes src/javascript
awk '/file: "src\/views\/_data\/events.json"/,/name: "global"/' src/admin/config.yml | grep -n "featured\|name: image"
```
Expected: alle drei Befehle ohne Treffer. Gibt es einen Treffer, abbrechen und Dan fragen.

- [ ] **Step 2: HTML-Referenz bauen**

Run:
```bash
npm run build
BASE="$TMP/tina-durchstich/html-baseline"; rm -rf "$BASE"; mkdir -p "$BASE"
(cd dist && find . -name '*.html' -exec cp --parents {} "$BASE" \;)
find "$BASE" -name '*.html' | wc -l
```
Expected: Build endet mit Exit-Code 0, die Zahl der HTML-Dateien ist größer als 10.

- [ ] **Step 3: Schlüssel entfernen**

Run:
```bash
node -e "
const fs = require('fs');
const file = 'src/views/_data/events.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const e of data.events) { delete e.featured; delete e.image; }
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
"
git diff --stat src/views/_data/events.json
node -e "const e=require('./src/views/_data/events.json').events; console.log(e.length, e.some(x=>'featured' in x||'image' in x))"
```
Expected: `23 false`. Der Diff enthält nur gelöschte Zeilen, weil die Datei bereits exakt `JSON.stringify(data, null, 2) + '\n'` entspricht (geprüft am 2026-09-14). Prüfen mit `git diff src/views/_data/events.json | grep '^+' | grep -v '^+++'`, erwartet: keine Ausgabe.

- [ ] **Step 4: Seite neu bauen und gegen die Referenz vergleichen**

Run:
```bash
npm run build
AFTER="$TMP/tina-durchstich/html-after"; rm -rf "$AFTER"; mkdir -p "$AFTER"
(cd dist && find . -name '*.html' -exec cp --parents {} "$AFTER" \;)
diff -r "$TMP/tina-durchstich/html-baseline" "$AFTER" && echo IDENTISCH
```
Expected: `IDENTISCH`. Liegt Mitternacht zwischen beiden Builds, kann `filterUpcoming` abweichen. Dann Step 2 und 4 am selben Tag wiederholen.

- [ ] **Step 5: Befund im Spec festhalten**

Am Ende des Specs anhängen:
```markdown
## 9. Befunde aus dem Durchstich

- **Task 1:** `featured` und `image` aus `events.json` entfernt. Kein Template liest sie, das gebaute HTML ist vorher und nachher identisch.
```

- [ ] **Step 6: Commit**

```bash
git add src/views/_data/events.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "chore(content): ungenutzte Event-Schluessel vor der Tina-Migration entfernen

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Tina-Grundgerüst mit Events-Collection, lokal

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`
- Create: `tina/config.ts`
- Create: `tina/collections/events.ts`
- Create (generiert): `tina/tina-lock.json`
- Modify: `src/views/_data/events.json` (nur Tina-Formatierung)
- Modify: `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`

**Interfaces:**
- Consumes: bereinigte `events.json` aus Task 1
- Produces: `tina/config.ts` exportiert `defineConfig(...)` mit `schema.collections = [events]`. `tina/collections/events.ts` exportiert `events: Collection` und die Hilfsfunktion `dayLabel(value?: string): string`. Skripte `npm run dev` (Tina lokal auf Port 8080, Admin unter `/admin-tina/index.html`), `npm run build:site`, `npm run typecheck`.

- [ ] **Step 1: Abhängigkeiten installieren**

Run:
```bash
npm install tinacms@3.14.0 @tinacms/cli@3.0.0
npm install --save-dev typescript @types/node
npm ls tinacms @tinacms/cli react react-dom
```
Expected: alle vier Pakete aufgelöst, ohne `UNMET PEER DEPENDENCY`. Fehlen `react` oder `react-dom`, die Version installieren, die `npm view tinacms@3.14.0 peerDependencies` nennt.

- [ ] **Step 2: Skripte in `package.json` setzen**

Den Block `"scripts"` so ändern, dass er genau diese Einträge enthält (bestehende `test`, `clean`, `eleventy:*`, `styles:*`, `cms`, `dev:cms` bleiben):
```json
    "typecheck": "tsc --noEmit",
    "tina:build": "cross-env NODE_OPTIONS=--max-old-space-size=4096 tinacms build",
    "tina:dev": "tinacms dev -c \"npm run eleventy:serve\"",
    "dev": "npm-run-all clean styles:dev --parallel styles:watch tina:dev --print-label",
    "build": "npm-run-all clean styles:prod tina:build eleventy:default --print-label",
    "build:site": "npm-run-all clean styles:prod eleventy:default --print-label"
```

- [ ] **Step 3: `tsconfig.json` anlegen**

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["tina/**/*.ts"],
  "exclude": ["node_modules", "tina/__generated__"]
}
```

- [ ] **Step 4: `tina/collections/events.ts` anlegen**

```ts
import type { Collection } from "tinacms";

// Dates stay "MM-DD-YYYY", the format every date filter in .eleventy.js
// reads. Task 3 of the Durchstich decides whether a date picker replaces
// this text field.
const usDate = (value?: string) =>
  value && !/^\d{2}-\d{2}-\d{4}$/.test(value)
    ? "Use MM-DD-YYYY, for example 10-04-2026"
    : undefined;

// The list label Matthew scans for. Parsed in the editor's browser, so it
// shows his calendar day for both "MM-DD-YYYY" and ISO values.
export const dayLabel = (value?: string): string => {
  if (!value) return "";
  const day = new Date(value);
  return isNaN(day.getTime())
    ? value
    : day.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};

export const events: Collection = {
  name: "events",
  label: "Events",
  path: "src/views/_data",
  format: "json",
  match: { include: "events" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object",
      name: "events",
      label: "Event list",
      list: true,
      ui: {
        itemProps: (item) => ({
          label: [dayLabel(item?.date), item?.name].filter(Boolean).join(" · ") || "New event",
        }),
        defaultItem: { multi_day_event: false, atStudio: false },
      },
      fields: [
        { type: "boolean", name: "multi_day_event", label: "Is it a multi day event?" },
        { type: "string", name: "date", label: "Date", required: true, description: "MM-DD-YYYY", ui: { validate: usDate } },
        { type: "string", name: "end_date", label: "End date", description: "MM-DD-YYYY, only for multi day events", ui: { validate: usDate } },
        { type: "string", name: "time", label: "Time" },
        { type: "string", name: "name", label: "Name", required: true },
        { type: "string", name: "location", label: "Location" },
        {
          type: "object",
          name: "content",
          label: "Content",
          fields: [
            { type: "string", name: "title", label: "Title (not shown on the website)" },
            { type: "string", name: "body", label: "Description", ui: { component: "textarea" } },
          ],
        },
        { type: "string", name: "gmaps", label: "Location on Google Maps" },
        { type: "boolean", name: "atStudio", label: "Takes place at my studio" },
      ],
    },
  ],
};
```

- [ ] **Step 5: Schlüsselabdeckung prüfen**

Run:
```bash
node -e "
const e = require('./src/views/_data/events.json').events;
const keys = new Set(); e.forEach(x => Object.keys(x).forEach(k => keys.add(k)));
const content = new Set(); e.forEach(x => x.content && Object.keys(x.content).forEach(k => content.add(k)));
console.log([...keys].sort().join(','), '|', [...content].sort().join(','));
"
```
Expected: `atStudio,content,date,end_date,gmaps,location,multi_day_event,name,time | body,title`. Jeder dieser Schlüssel steht als Feld in `events.ts`. Taucht ein weiterer auf, erst im Schema ergänzen.

- [ ] **Step 6: `tina/config.ts` anlegen**

```ts
import { defineConfig } from "tinacms";
import { events } from "./collections/events";

export default defineConfig({
  // Netlify sets HEAD to the branch being built, so a deploy preview edits
  // its own branch and production edits main.
  branch: process.env.GITHUB_BRANCH || process.env.HEAD || "main",
  // The client ID is public: it ships inside the admin bundle anyway.
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "70c9fe54-ade8-4e7d-b8de-e44bc1d0f0bb",
  // Never commit the token. Netlify provides it; locally `tinacms dev`
  // works without it.
  token: process.env.TINA_TOKEN || null,
  // Decap still owns /admin until the cutover.
  build: { outputFolder: "admin-tina", publicFolder: "dist" },
  media: { tina: { publicFolder: "src", mediaRoot: "images" } },
  schema: { collections: [events] },
});
```

- [ ] **Step 7: Typen prüfen**

Run: `npm run typecheck`
Expected: Exit-Code 0, keine Ausgabe. Meldet TypeScript einen Fehler bei `itemProps` oder `validate`, die Parameter so typisieren, wie die Meldung es verlangt (etwa `(item: Record<string, any>)`), nie mit `any` auf die ganze Collection ausweichen.

- [ ] **Step 8: Dev-Server starten**

`preview_start` mit `name: "pottery-dev"`. Dann `preview_logs` mit `lines: 80` lesen.
Expected: Tina meldet den GraphQL-Server auf Port 4001, Eleventy meldet `http://localhost:8080`, keine Zeile mit `Error`. `tina/tina-lock.json` und `tina/__generated__/` existieren (`ls tina`).

- [ ] **Step 9: Admin öffnen und Liste prüfen**

Im Browser-Pane `http://localhost:8080/admin-tina/index.html` öffnen. Kein Login erwartet. In der Seitenleiste „Events" öffnen, dann das Dokument `events`. Mit `read_page` prüfen:
Expected: 23 Listeneinträge, der erste beschriftet etwa als `Aug 7, 2026 · Harmony Arts Festival` (die genaue Schreibweise des Datums hängt vom Browser ab).

- [ ] **Step 10: Semantischen Round-Trip prüfen**

Im Admin beim ersten Eintrag das Feld „Time" um ` TEST` ergänzen und speichern. Dann:
```bash
git show HEAD:src/views/_data/events.json > "$TMP/tina-durchstich/events-before.json"
node -e "
const assert = require('assert');
const before = require(process.env.TMP + '/tina-durchstich/events-before.json');
const after = JSON.parse(require('fs').readFileSync('src/views/_data/events.json', 'utf8'));
assert.ok(after.events[0].time.endsWith(' TEST'), 'Aenderung fehlt');
after.events[0].time = after.events[0].time.replace(/ TEST$/, '');
assert.deepStrictEqual(after, before);
console.log('NUR DIE GEWOLLTE AENDERUNG');
"
git diff --stat src/views/_data/events.json
```
Expected: `NUR DIE GEWOLLTE AENDERUNG`. Die Zahl der geänderten Zeilen notieren: Sie zeigt, wie viel Formatierungsrauschen Tina erzeugt.

Scheitert `deepStrictEqual`, die Meldung genau lesen und nicht wegdrücken. Fügt Tina leere Schlüssel hinzu (etwa `"end_date": ""` oder `null` bei Events ohne Enddatum) oder entfernt es welche, ist das ein Befund. Dan im Chat zeigen, welche Schlüssel betroffen sind, und fragen, ob das hinnehmbar ist. Erst dann weiter, und den Befund in Step 13 mit aufnehmen. Die Vergleiche in Step 12 entsprechend auf die hingenommenen Unterschiede anpassen.

- [ ] **Step 11: Anlegen und Löschen prüfen**

Im Admin einen Eintrag hinzufügen: Date `12-31-2026`, Name `Tina Test`. Speichern. Dann:
```bash
node -e "const e=require('./src/views/_data/events.json').events; const t=e.find(x=>x.name==='Tina Test'); console.log(e.length, JSON.stringify(t))"
```
Expected: `24`. Das Objekt enthält `date":"12-31-2026"`, `multi_day_event":false`, `atStudio":false`. Danach „Tina Test" im Admin löschen, speichern und die Zahl erneut prüfen: Sie ist wieder um eins kleiner.

Ein ungültiges Datum eingeben, etwa `2026-12-31`. Expected: Der Admin zeigt „Use MM-DD-YYYY, for example 10-04-2026" und speichert nicht.

- [ ] **Step 12: Seite mit Tina-Formatierung bauen**

Im Admin ` TEST` aus Step 10 wieder entfernen und speichern. Dann:
```bash
node -e "
const assert = require('assert');
const before = require(process.env.TMP + '/tina-durchstich/events-before.json');
assert.deepStrictEqual(JSON.parse(require('fs').readFileSync('src/views/_data/events.json','utf8')), before);
console.log('INHALT UNVERAENDERT');
"
```
Expected: `INHALT UNVERAENDERT`. Den Dev-Server mit `preview_stop` beenden, dann `npm run build:site`. Expected: Exit-Code 0.

- [ ] **Step 13: Befund festhalten**

In Abschnitt 9 des Specs ergänzen:
```markdown
- **Task 2:** Events lokal in Tina bearbeitbar. Anlegen, Ändern, Löschen und die Datumsprüfung funktionieren. Erstes Speichern ändert <N> Zeilen Formatierung ohne inhaltliche Änderung (geprüft mit `assert.deepStrictEqual`).
```
`<N>` durch den Wert aus Step 10 ersetzen.

- [ ] **Step 14: Commit**

```bash
git status --short
git add package.json package-lock.json tsconfig.json tina/config.ts tina/collections/events.ts tina/tina-lock.json src/views/_data/events.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(cms): Tina-Grundgeruest mit Events-Collection neben Decap

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
Expected: `git status --short` vor dem Commit zeigt kein `tina/__generated__` und keine `.env`.

---

### Task 3: Datumsauswahl messen und entscheiden

**Files:**
- Modify (vorübergehend): `tina/collections/events.ts`
- Nur Variante A: Create `src/utils/dates.js`, Create `test/dates.test.js`, Modify `.eleventy.js`, Modify `package.json`
- Modify: `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`

**Interfaces:**
- Consumes: `events.ts` und `npm run dev` aus Task 2, HTML-Referenz aus Task 1
- Produces (nur A): `parseDate(value: string): DateTime` aus `src/utils/dates.js`, liefert Luxon-`DateTime` um 00:00 in der Zone des Builds oder `DateTime.invalid`. `npm test` führt `node --test` aus.

- [ ] **Step 1: Datumsfelder vorübergehend auf `datetime` stellen**

In `tina/collections/events.ts` die Felder `date` und `end_date` ersetzen durch:
```ts
        { type: "datetime", name: "date", label: "Date", required: true, ui: { dateFormat: "MM-DD-YYYY" } },
        { type: "datetime", name: "end_date", label: "End date", description: "Only for multi day events", ui: { dateFormat: "MM-DD-YYYY" } },
```
`preview_start` mit `name: "pottery-dev"`.

- [ ] **Step 2: Messen in `Europe/Berlin`**

Mit dem Playwright-MCP: `browser_navigate` auf `http://localhost:8080/admin-tina/index.html`, dann `browser_run_code_unsafe` mit:
```js
async (page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "Europe/Berlin" });
  await page.reload();
  return page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
}
```
Expected: `Europe/Berlin`. Dann per `browser_snapshot` und `browser_click`:

1. Ersten Eintrag öffnen. Prüfen, welcher Tag im Datumsfeld angezeigt wird. Erwartet ist der Tag aus der Datei.
2. Im Datumsfeld den 10. des angezeigten Monats wählen und speichern.
3. Neuen Eintrag anlegen, Name `TZ Berlin`, im leeren Datumsfeld den 10. wählen und speichern.

Nach jedem Speichern:
```bash
node -e "const e=require('./src/views/_data/events.json').events; console.log(JSON.stringify(e[0].date), JSON.stringify((e.find(x=>x.name==='TZ Berlin')||{}).date), e.filter(x=>/T/.test(x.date||'')).length)"
```
Alle drei Werte notieren: gespeicherter Wert beim Ändern, beim Neuanlegen, und wie viele andere Events jetzt ISO-Werte haben.

- [ ] **Step 3: Messen in `America/Vancouver`**

`git checkout src/views/_data/events.json`, Admin neu laden, Step 2 mit `timezoneId: "America/Vancouver"` und Name `TZ Vancouver` wiederholen. Werte notieren.

- [ ] **Step 4: Entscheiden**

**Variante A gilt**, wenn alle vier gewählten Werte auf 00:00 Ortszeit des Browsers stehen:
- Berlin, Sommerzeit: `…-09T22:00:00.000Z`
- Vancouver, Sommerzeit: `…-10T07:00:00.000Z`

Beim Winterzeit-Monat entsprechend `…-09T23:00:00.000Z` und `…-10T08:00:00.000Z`.

**Sonst gilt Variante B**, zum Beispiel wenn beim Neuanlegen die aktuelle Uhrzeit mitgespeichert wird.

Dan das Messergebnis und die Variante im Chat zeigen und seine Bestätigung abwarten. Danach `git checkout src/views/_data/events.json` und Dev-Server mit `preview_stop` beenden.

- [ ] **Step 5B (nur Variante B): Textfelder zurückstellen**

```bash
git checkout tina/collections/events.ts
```
In Abschnitt 9 des Specs ergänzen:
```markdown
- **Task 3:** Datumsauswahl gemessen. Berlin ändern: `<Wert>`, neu: `<Wert>`. Vancouver ändern: `<Wert>`, neu: `<Wert>`. Andere Events umgeschrieben: `<ja/nein>`. Entscheidung: Variante B, Datum bleibt Textfeld mit `MM-DD-YYYY`.
```
Weiter mit Step 12.

- [ ] **Step 5A (nur Variante A): Failing Test schreiben**

`test/dates.test.js`:
```js
const test = require("node:test");
const assert = require("node:assert");
const { parseDate } = require("../src/utils/dates");

const day = (value) => parseDate(value).toFormat("yyyy-MM-dd");

test("reads the MM-DD-YYYY dates Decap wrote", () => {
    assert.strictEqual(day("10-04-2026"), "2026-10-04");
});

test("recovers the day picked at local midnight in Vancouver", () => {
    assert.strictEqual(day("2026-10-04T07:00:00.000Z"), "2026-10-04"); // PDT
    assert.strictEqual(day("2026-01-15T08:00:00.000Z"), "2026-01-15"); // PST
});

test("recovers the day picked at local midnight in Germany", () => {
    assert.strictEqual(day("2026-10-03T22:00:00.000Z"), "2026-10-04"); // CEST
    assert.strictEqual(day("2026-01-14T23:00:00.000Z"), "2026-01-15"); // CET
});

test("returns an invalid date for empty or unreadable input", () => {
    assert.strictEqual(parseDate("").isValid, false);
    assert.strictEqual(parseDate("next friday").isValid, false);
});

test("returns midnight in the build's zone, like the old fromFormat", () => {
    const parsed = parseDate("2026-10-03T22:00:00.000Z");
    assert.strictEqual(parsed.hour, 0);
    assert.strictEqual(parsed.zoneName, parseDate("10-04-2026").zoneName);
});
```
In `package.json` `"test"` ersetzen durch `"test": "node --test"`.

- [ ] **Step 6A: Test scheitern sehen**

Run: `npm test`
Expected: FAIL mit `Cannot find module '../src/utils/dates'`.

- [ ] **Step 7A: `parseDate` schreiben**

`src/utils/dates.js`:
```js
const { DateTime } = require("luxon");

// Event dates arrive in two shapes. Decap wrote "MM-DD-YYYY". Tina's date
// picker stores the picked day as the editor's local midnight converted to
// UTC, so a day picked in Vancouver arrives as 07:00Z and the same day
// picked in Germany as 22:00Z the evening before. Rounding to the nearest
// UTC midnight recovers the calendar day for any editor between UTC-11 and
// UTC+11. The result is midnight in the build's zone, which is what
// DateTime.fromFormat returned before, so the filters compare as they did.
function parseDate(value) {
    if (!value) return DateTime.invalid("empty");
    const legacy = DateTime.fromFormat(value, "MM-dd-yyyy");
    if (legacy.isValid) return legacy;
    const picked = DateTime.fromISO(value, { zone: "utc" });
    if (!picked.isValid) return picked;
    const day = picked.plus({ hours: 12 }).startOf("day");
    return DateTime.local(day.year, day.month, day.day);
}

module.exports = { parseDate };
```

- [ ] **Step 8A: Tests bestehen**

Run: `npm test`
Expected: `# pass 5`, `# fail 0`.

- [ ] **Step 9A: Filter umstellen**

In `.eleventy.js` unter `const { DateTime } = require("luxon");` einfügen:
```js
const { parseDate } = require("./src/utils/dates");
```
Jedes `DateTime.fromFormat(<x>, 'MM-dd-yyyy')` durch `parseDate(<x>)` ersetzen. Das betrifft `sortByDate`, `date`, `lastDay`, `specialEvents`, `groupByVenue`, `byDateAsc` und `nextUp`. Der `date`-Filter lautet danach:
```js
    eleventyConfig.addNunjucksFilter("date", function (date, format) {
        if (!date) return "";
        return parseDate(date).toFormat(format);
    });
```
Run:
```bash
grep -c "fromFormat" .eleventy.js
grep -c "parseDate(" .eleventy.js
```
Expected: `0` und `13` (je zwei in `sortByDate`, `lastDay`, `specialEvents`, `groupByVenue`, `byDateAsc`, `nextUp`, einer in `date`).

- [ ] **Step 10A: Gegen die Referenz bauen**

Run:
```bash
npm run build:site
AFTER="$TMP/tina-durchstich/html-after"; rm -rf "$AFTER"; mkdir -p "$AFTER"
(cd dist && find . -name '*.html' -exec cp --parents {} "$AFTER" \;)
diff -r "$TMP/tina-durchstich/html-baseline" "$AFTER" && echo IDENTISCH
```
Expected: `IDENTISCH`. Liegt ein Tag zwischen Referenz und Build, zuerst Task 1 Step 2 neu ausführen.

Dann einen ISO-Wert prüfen:
```bash
cp src/views/_data/events.json "$TMP/tina-durchstich/events-keep.json"
node -e "
const fs=require('fs'); const f='src/views/_data/events.json'; const d=JSON.parse(fs.readFileSync(f,'utf8'));
d.events.push({name:'ISO Probe', date:'2026-12-30T23:00:00.000Z', time:'', location:'', multi_day_event:false, atStudio:false});
fs.writeFileSync(f, JSON.stringify(d,null,2));
"
npm run build:site
grep -c "ISO Probe" dist/events.html
grep -o 'data-date="2026-12-31"' dist/events.html | wc -l
grep -o '"startDate": "2026-12-31"' dist/events.html | wc -l
cp "$TMP/tina-durchstich/events-keep.json" src/views/_data/events.json
git diff --quiet src/views/_data/events.json && echo ZURUECK
```
Expected: die ersten drei Zahlen jeweils mindestens `1`, dann `ZURUECK`. Die Probe steht am 31. Dezember, nicht am 30., weil 23:00Z die Mitternacht in Deutschland zur Winterzeit ist.

- [ ] **Step 11A: Befund festhalten**

In Abschnitt 9 des Specs ergänzen:
```markdown
- **Task 3:** Datumsauswahl gemessen. Berlin ändern: `<Wert>`, neu: `<Wert>`. Vancouver ändern: `<Wert>`, neu: `<Wert>`. Andere Events umgeschrieben: `<ja/nein>`. Entscheidung: Variante A, `datetime` mit `parseDate` (`src/utils/dates.js`), gebautes HTML unverändert.
```

- [ ] **Step 12: Commit**

Variante A:
```bash
npm run typecheck
git add tina/collections/events.ts src/utils/dates.js test/dates.test.js .eleventy.js package.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(events): Datumsauswahl in Tina, Filter lesen beide Datumsformate

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
Variante B:
```bash
git add docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "docs(cms): Datumsauswahl in Tina gemessen, Datum bleibt Textfeld

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: About-Collection mit Medien und Rich-Text-Probe

**Files:**
- Create: `tina/collections/about.ts`
- Modify: `tina/config.ts`
- Modify: `tina/tina-lock.json` (generiert)
- Modify: `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`

**Interfaces:**
- Consumes: `tina/config.ts` aus Task 2
- Produces: `about: Collection` aus `tina/collections/about.ts`, in `schema.collections` nach `events`.

- [ ] **Step 1: Schlüsselabdeckung ermitteln**

Run:
```bash
node -e "
const matter = require('gray-matter');
const d = matter(require('fs').readFileSync('src/views/about.md','utf8')).data;
console.log(Object.keys(d).join(','));
console.log(Object.keys(d.medal).join(','), '|', [...new Set(d.sections.flatMap(s=>Object.keys(s)))].join(','), '|', Object.keys(d.sections[0].image).join(','));
console.log(JSON.stringify(matter(require('fs').readFileSync('src/views/about.md','utf8')).content));
"
```
Expected: `layout,title,tags,permalink,eleventyNavigation,eyebrow,medal,headline,intro,sections,quote`, dann `text,link_label | image,body | url,alt`, dann ein leerer oder nur aus Zeilenumbrüchen bestehender Body. Weicht etwas ab, das Schema in Step 2 entsprechend ergänzen.

- [ ] **Step 2: `tina/collections/about.ts` anlegen**

```ts
import type { Collection } from "tinacms";

// layout, tags, permalink and eleventyNavigation stay in the file untouched:
// Tina keeps top-level frontmatter it has no field for.
export const about: Collection = {
  name: "about",
  label: "About",
  path: "src/views",
  format: "md",
  match: { include: "about" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Eyebrow" },
    {
      type: "object",
      name: "medal",
      label: "Award note (leave the text empty to hide the whole block)",
      fields: [
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "link_label", label: "Shop link text" },
      ],
    },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    { type: "string", name: "quote", label: "Pull quote (shown after the first section)", ui: { component: "textarea" } },
    {
      type: "object",
      name: "sections",
      label: "Sections",
      list: true,
      ui: { itemProps: (item) => ({ label: item?.image?.alt || "Section" }) },
      fields: [
        {
          type: "object",
          name: "image",
          label: "Image",
          fields: [
            { type: "image", name: "url", label: "Image" },
            { type: "string", name: "alt", label: "Alt text" },
          ],
        },
        // Markdown source, rendered by the markdownify filter. Task 4 Step 6
        // checks whether Tina's rich-text editor can replace this.
        { type: "string", name: "body", label: "Text (Markdown)", ui: { component: "textarea" } },
      ],
    },
  ],
};
```

- [ ] **Step 3: In der Config registrieren**

In `tina/config.ts`:
```ts
import { about } from "./collections/about";
```
unter dem Events-Import einfügen und `schema: { collections: [events, about] },` setzen. Run: `npm run typecheck`. Expected: Exit-Code 0.

- [ ] **Step 4: Round-Trip mit Umsortieren**

`preview_start` mit `name: "pottery-dev"`. Im Browser-Pane Admin öffnen, „About" öffnen. Prüfen, dass die beiden Abschnitte als „Matthew throwing a cup" erscheinen und der Text als Markdown im Textfeld steht. Die Reihenfolge der beiden Abschnitte per Drag & Drop tauschen, speichern. Dann:
```bash
git show HEAD:src/views/about.md > "$TMP/tina-durchstich/about-before.md"
node -e "
const assert = require('assert'); const matter = require('gray-matter'); const fs = require('fs');
const before = matter(fs.readFileSync(process.env.TMP + '/tina-durchstich/about-before.md','utf8')).data;
const after = matter(fs.readFileSync('src/views/about.md','utf8')).data;
assert.deepStrictEqual(after.sections, [before.sections[1], before.sections[0]]);
after.sections = before.sections;
assert.deepStrictEqual(after, before);
console.log('NUR UMSORTIERT, STRUKTURFELDER ERHALTEN');
"
git diff src/views/about.md | head -60
```
Expected: `NUR UMSORTIERT, STRUKTURFELDER ERHALTEN`. Im Diff prüfen, ob die `|`-Blöcke der Texte als Block bleiben oder zu `\n`-Zeichenketten werden, und das notieren. Danach `git checkout src/views/about.md`.

- [ ] **Step 5: Medienverwaltung prüfen**

Testbild erzeugen:
```bash
node -e "require('sharp')({create:{width:64,height:48,channels:3,background:'#1F3A52'}}).jpeg().toFile('tina-test.jpg').then(()=>console.log('ok'))"
```
Mit dem Playwright-MCP den Admin öffnen, „About" → erster Abschnitt → Bildfeld → Medienverwaltung. Prüfen und notieren: Sind die Ordner `glazes`, `news`, `products`, `site`, `workshop` sichtbar und lassen sie sich öffnen? In `workshop` wechseln, `tina-test.jpg` per `browser_file_upload` hochladen, auswählen, speichern. Dann:
```bash
ls src/images/workshop/tina-test.jpg
grep -n "tina-test" src/views/about.md
```
Expected: Datei existiert, `about.md` enthält `url: /images/workshop/tina-test.jpg` (mit oder ohne Anführungszeichen). Dev-Server mit `preview_stop` beenden, dann:
```bash
npm run build:site
grep -o 'src="/images/[^"]*"' "$TMP/tina-durchstich/html-baseline/about/index.html" | head -1
grep -o 'src="/images/[^"]*"' dist/about/index.html | head -1
```
Expected: Build mit Exit-Code 0, und die beiden `src`-Werte unterscheiden sich. Der Shortcode hat also das hochgeladene Bild statt des alten verarbeitet. Aufräumen:
```bash
git checkout src/views/about.md
rm tina-test.jpg src/images/workshop/tina-test.jpg
git status --short
```
Expected: nur die Tina-Dateien aus diesem Task sind geändert.

- [ ] **Step 6: Rich-Text-Probe**

In `tina/collections/about.ts` das Feld `body` vorübergehend ersetzen durch:
```ts
        { type: "rich-text", name: "body", label: "Text" },
```
`preview_start` mit `name: "pottery-dev"`. Im Admin den ersten Abschnitt öffnen, ans Ende des Textes ` Probe` anhängen, speichern. Dann:
```bash
node -e "const m=require('gray-matter'); const b=m(require('fs').readFileSync('src/views/about.md','utf8')).data.sections[0].body; console.log(typeof b, JSON.stringify(b).slice(0,200))"
```
Notieren, ob `string` oder `object` ausgegeben wird.

Nur bei `string`: `git checkout src/views/about.md`, im Admin denselben Abschnitt öffnen, in die erste Zeile `<b>Probe</b>` tippen, speichern und mit demselben Befehl prüfen, ob `<b>Probe</b>` wörtlich im Text steht.

Danach immer: Dev-Server beenden, `git checkout src/views/about.md`, und das Feld wieder auf die Textarea aus Step 2 zurückstellen, **außer** beide Prüfungen haben `string` und wörtliches `<b>Probe</b>` ergeben. Dann das `rich-text`-Feld behalten.

- [ ] **Step 7: Befund festhalten**

In Abschnitt 9 des Specs ergänzen:
```markdown
- **Task 4:** About lokal in Tina bearbeitbar. Umsortieren ändert nur die Reihenfolge, Strukturfelder bleiben erhalten. Mehrzeilige Texte nach dem Speichern: `<Block|Zeichenkette>`. Medienverwaltung: Unterordner `<sichtbar und navigierbar|nicht sichtbar>`, Upload landet in `<Pfad>`, gespeichert als `<Wert>`. Rich-Text speichert als `<string|object>`, HTML `<erhalten|verloren|nicht geprüft>`. Entscheidung: `<Textarea|rich-text>`.
```

- [ ] **Step 8: Commit**

```bash
npm run typecheck
git add tina/collections/about.ts tina/config.ts tina/tina-lock.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(cms): About-Collection in Tina mit Abschnitten und Bildern

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Deploy-Vorschau mit TinaCloud

**Files:**
- Modify: `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`

**Interfaces:**
- Consumes: alle Commits aus Task 1 bis 4
- Produces: eine Netlify-Deploy-Vorschau mit `/admin-tina/` gegen TinaCloud, deren Adresse Task 6 nutzt.

- [ ] **Step 1: Voraussetzungen mit Dan abhaken**

Dan im Chat bestätigen lassen:
1. TinaCloud-Projekt ist mit `g41nxe/11ty-matthew-freed-pottery-web` verbunden.
2. Unter *Site URL(s)* stehen `http://localhost:8080` und die Netlify-Vorschau-Adressen mit Platzhalter, etwa `https://*--<netlify-name>.netlify.app`.
3. `TINA_TOKEN` ist auf Netlify für *Deploy Previews* und *Branch deploys* gesetzt, Scope *Builds*.
4. Der Build-Befehl in Netlify ist `npm run build`, Publish-Verzeichnis `dist`.

Nicht weitermachen, bevor alle vier bestätigt sind.

- [ ] **Step 2: Push nach Bestätigung**

Dan fragen: „Darf ich `feat/tinacloud-migration` pushen und einen Draft-PR nach `main` öffnen, damit Netlify eine Deploy-Vorschau baut?" Nach seinem Ja:
```bash
git push -u origin feat/tinacloud-migration
gh pr create --draft --base main --head feat/tinacloud-migration --title "TinaCloud-Durchstich: Events und About" --body "Durchstich laut docs/superpowers/plans/2026-09-14-tinacloud-durchstich.md. Nicht mergen.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 3: Build beobachten**

Den Netlify-Check des PRs über die ccd_pr-Tools lesen, bis er fertig ist. Im Deploy-Log prüfen und notieren:
- `tinacms build` läuft durch, ohne `heap out of memory`
- die Dauer von `tina:build` und die Gesamtdauer
- Fehlermeldungen zu Branch oder Index

Scheitert der Build mit einer Meldung, dass der Branch nicht indexiert ist, prüft Dan im TinaCloud-Dashboard unter *Configuration* den Indexstatus. Ist er fertig, den Deploy in Netlify neu anstoßen.

Gegenprobe lokal, sobald der Branch indexiert ist. Dan hat `TINA_TOKEN` in `.env` eingetragen (2026-09-14), `tinacms` liest die Datei selbst:
```bash
git check-ignore -q .env && echo ENV_IGNORIERT
GITHUB_BRANCH=feat/tinacloud-migration npm run build
ls dist/admin-tina/index.html
```
Expected: `ENV_IGNORIERT`, Build mit Exit-Code 0, die Datei existiert. Den Inhalt von `.env` nie ausgeben.

- [ ] **Step 4: Vorschau prüfen**

Im Browser-Pane die Vorschau-Adresse öffnen:
- `/` und `/events.html` zeigen dieselben Events wie `https://matthewfreed.ca` (mit `get_page_text` vergleichen)
- `/admin/` zeigt weiterhin Decap
- `/admin-tina/index.html` zeigt den TinaCloud-Login

- [ ] **Step 5: Login und Speichern auf der Vorschau**

Dan meldet sich selbst in `/admin-tina/` an. Dan ändert in „Events" beim ersten Eintrag „Time" um ` TEST` und speichert. Dann:
```bash
git fetch origin
git log origin/feat/tinacloud-migration -1 --format="%an | %s"
git show origin/feat/tinacloud-migration --stat
git diff HEAD origin/feat/tinacloud-migration -- src/views/_data/events.json
```
Expected: ein neuer Commit von TinaCloud, der nur `src/views/_data/events.json` ändert, und im Diff nur die Time-Zeile.

Nur Variante A: Dan wählt zusätzlich bei einem Event den 10. eines Monats. Expected: Der Commit enthält `…-09T22:00:00.000Z` (Sommerzeit) oder `…-09T23:00:00.000Z` (Winterzeit), und nach dem nächsten Vorschau-Build zeigt `/events.html` den 10.

Nach dem Vorschau-Build prüfen, dass ` TEST` auf `/events.html` erscheint. Dann entfernt Dan ` TEST` wieder und speichert, bei Variante A setzt Dan auch das Datum zurück.

- [ ] **Step 6: Lokal nachziehen und Befund festhalten**

```bash
git pull --ff-only
git diff HEAD~2 -- src/views/_data/events.json | head -20
```
In Abschnitt 9 des Specs ergänzen:
```markdown
- **Task 5:** Deploy-Vorschau baut mit TinaCloud. `tina:build` <Dauer>, Gesamt <Dauer>, kein Speicherüberlauf. Login auf `/admin-tina/` klappt, Speichern erzeugt einen Commit von TinaCloud auf dem Branch mit genau der Änderung. `<Nur A: Datum aus Deutschland als <Wert> gespeichert, Seite zeigt den richtigen Tag.>`
```

- [ ] **Step 7: Commit und Push**

```bash
git add docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "docs(cms): Befunde der Deploy-Vorschau mit TinaCloud

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

---

### Task 6: Tor

**Files:**
- Modify: `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`
- Modify: `docs/adr/0001-tinacloud-statt-selbst-gehostetem-tina.md`

**Interfaces:**
- Consumes: Vorschau aus Task 5, Befunde aus Task 1 bis 5
- Produces: Tor-Entscheidung im Spec. Bei „weiter" ist sie Eingabe für den Scheiben-Plan.

- [ ] **Step 1: Bedienung vergleichen**

Dan erledigt dieselben drei Aufgaben einmal in Decap (`https://matthewfreed.ca/admin/`, nicht speichern) und einmal in Tina auf der Vorschau (speichern erlaubt, danach zurücksetzen):
1. Ein neues Event mit Datum, Uhrzeit, Ort und Beschreibung anlegen.
2. Ein vergangenes Event finden und löschen.
3. Auf About den Text des zweiten Abschnitts ändern und das Bild tauschen.

Dan beantwortet im Chat: Welches CMS ist für Matthew klar besser? Was hat in Tina gestört?

- [ ] **Step 2: Entscheidung festhalten**

In Abschnitt 9 des Specs ergänzen:
```markdown
- **Tor (<Datum>):** <weiter|stopp>. Dans Urteil: <Zitat oder Zusammenfassung>. Störend in Tina: <Liste>. Events-Liste <bleibt eine Datei|wird aufgeteilt>.
```
In ADR 0001 den Punkt „Weiter ungeprüft" ersetzen durch:
```markdown
- **Bedienung geprüft am <Datum>:** <Ergebnis in einem Satz>, siehe Abschnitt 9 im Spec `2026-09-14-tinacloud-migration-design.md`.
```
Und den Punkt „Offen: ob der Speicherüberlauf …" ersetzen durch:
```markdown
- **Kein Speicherüberlauf mit TinaCloud:** `tinacms build` lief auf der Deploy-Vorschau in <Dauer> durch.
```
Ist der Build in Task 5 doch übergelaufen, stattdessen das tatsächliche Ergebnis eintragen.

- [ ] **Step 3: Commit und Push**

```bash
git add docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md docs/adr/0001-tinacloud-statt-selbst-gehostetem-tina.md
git commit -m "docs(cms): Tor-Entscheidung nach dem TinaCloud-Durchstich

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 4: Weiter oder Stopp**

- **Weiter:** Scheiben-Plan schreiben, Phase 2 im Spec. Der Draft-PR bleibt offen.
- **Stopp:** Draft-PR mit Begründung schließen, nach Dans Bestätigung. In einem neuen ADR festhalten, warum TinaCloud nicht trägt und was stattdessen gilt.
