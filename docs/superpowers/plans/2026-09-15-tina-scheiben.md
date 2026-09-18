# Tina-Scheiben: Markets, Events und alle Seiten — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Matthew pflegt jede sichtbare Seite und alle Daten in Tina, und Events sind nach Markets gruppiert statt per Namensvergleich.

**Architecture:** `events.json` wird zu zwei Listen, `markets` mit Datumsliste und `events`. Ein Filter `occurrences` macht daraus die flache Terminliste, die Startseite, Hero-Zeile und strukturierte Daten schon kennen; die Events-Seite gruppiert über einen Market-Schlüssel. Jede weitere Datei bekommt eine Tina-Collection über die bestehende Datei. Zwei Prüfwerkzeuge sichern jeden Schritt: ein HTML-Vergleich zweier Eleventy-Builds und ein Round-Trip über Tinas lokale GraphQL-API.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, Luxon, TinaCMS 3.13.0 mit `@tinacms/cli` 2.7.0, `gray-matter`, `js-yaml` 3, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md` (Abschnitte 3, 4, 7 und 9). Begriffe: `CONTEXT.md`.

## Global Constraints

- Branch `feat/tinacloud-migration`. Push auf diesen Branch ist freigegeben, `main` wird nicht angefasst.
- Tina-Versionen bleiben exakt gepinnt (`tinacms` 3.13.0, `@tinacms/cli` 2.7.0, `overrides` in `package.json`). Nicht hochziehen.
- Datumswerte bleiben `MM-DD-YYYY`. Datumsfelder nutzen `datePicker` aus `tina/fields/date.ts`, nie `type: "datetime"`.
- Tote Schlüssel aus Spec Abschnitt 4 kommen nicht ins Schema; sie werden in der jeweiligen Task gelöscht.
- `layout`, `permalink`, `tags`, `eleventyNavigation`, `social_flush` werden nicht modelliert.
- Collection-Namen nur `[A-Za-z0-9_]`, keine reservierten Namen (`collection`, `collections`, `node`, `document`). Die Collection für `process.md` wird als `processPage` exportiert, weil ein Export namens `process` in `tina/config.ts` das globale `process` verdecken würde.
- Jede JSON-Collection modelliert jeden verbleibenden Schlüssel, sonst geht er beim Speichern verloren.
- `src/admin/` (Decap) bleibt unverändert. Dass Decap auf diesem Branch Events und News nicht mehr bearbeiten kann, ist hingenommen; produktiv ist Decap auf `main`.
- Dev-Server nur über `preview_start` mit `name: "pottery-dev"`. Nach Änderungen an Dateien außerhalb von Tina (Skripte, `git checkout`) vor dem nächsten Round-Trip `touch tina/config.ts` und im Log auf `Re-index complete` warten; Tinas lokaler Index übernimmt Änderungen von außen nicht zuverlässig.
- Jede Task endet mit `npm run typecheck` ohne Fehler, bevor committet wird.
- Commit-Nachrichten Deutsch, `typ(bereich): …`, Abschluss `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Befunde landen in Abschnitt 9 des Specs, im Commit der Task.

---

## Dateien

| Datei | Aufgabe |
|---|---|
| `scripts/compare-html.mjs` (neu) | Vergleicht die HTML-Seiten zweier Builds, strukturierte Daten sortiert |
| `scripts/tina-roundtrip.mjs` (neu) | Liest ein Dokument über Tinas API, speichert es zurück, prüft die Datei |
| `scripts/events-to-markets.mjs` (neu) | Wandelt die flache Event-Liste in `markets` und `events` |
| `test/events-to-markets.test.mjs` (neu) | Tests für die Umwandlung |
| `.eleventy.js` | Filter `occurrences`, `marketSchedule`, `specialEvents` neu; `groupByVenue` und `sortByDate` entfallen |
| `src/views/_includes/layouts/events-layout.njk` | Markets, Events, News aus dem Frontmatter |
| `src/views/_includes/partials/home-events.njk`, `hero.njk` | Terminliste über `occurrences` |
| `src/views/_includes/layouts/collections-layout.njk`, `partials/collections-teaser.njk`, `partials/current-firing.njk` | `gallery.items`, `features.items` |
| `src/views/_data/events.json` | neue Form |
| `src/views/_data/news.json`, `showcase.json` | entfallen |
| `src/views/_data/gallery.json`, `features.json` (neu) | aus `showcase.json` |
| `src/views/events.md` | bekommt `news` |
| `src/views/_data/global.json`, `src/views/faq.md` | tote Schlüssel entfernt |
| `tina/fields/date.ts` (neu) | `datePicker`, `dateList`, `dayLabel` |
| `tina/fields/common.ts` (neu) | `imageField`, `linkField` |
| `tina/fields/sections.ts` (neu) | Abschnittsliste für About, Pottery, Process |
| `tina/collections/*.ts` | eine Datei pro Collection |
| `tina/config.ts` | alle Collections in Reihenfolge der Seitenleiste |
| `package.json` | Skripte `test`, `tina:roundtrip` |

---

### Task 1: Prüfwerkzeuge

**Files:**
- Create: `scripts/compare-html.mjs`
- Create: `scripts/tina-roundtrip.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `node scripts/compare-html.mjs <vorher> <nachher>` gibt `IDENTISCH (<n> Seiten)` aus und endet mit 0, sonst die abweichenden Seiten mit Exit-Code 1. `npm run tina:roundtrip -- <collection> <relativePath> [--set=<pfad>=<wert>]` gibt `ROUND-TRIP OK: <datei>` aus oder bricht mit dem Diff ab. Build in ein Verzeichnis: `node node_modules/@11ty/eleventy/cmd.cjs --output=<dir> --quiet`.

- [ ] **Step 1: HTML-Vergleich schreiben**

`scripts/compare-html.mjs`:
```js
// Compares the HTML pages of two Eleventy builds. Structured data is
// compared as data with its @graph sorted, because a change may list the
// same events in a different order without changing what they say.
import fs from "node:fs";
import path from "node:path";

const [beforeDir, afterDir] = process.argv.slice(2);
if (!beforeDir || !afterDir) {
  console.error("usage: node scripts/compare-html.mjs <before-dir> <after-dir>");
  process.exit(2);
}

const pages = (dir) =>
  fs.readdirSync(dir, { recursive: true }).filter((f) => f.endsWith(".html")).sort();

const normalize = (html) =>
  html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (_, json) => {
    const data = JSON.parse(json);
    if (Array.isArray(data["@graph"])) {
      data["@graph"].sort((a, b) => `${a.name}|${a.startDate}`.localeCompare(`${b.name}|${b.startDate}`));
    }
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  });

let differing = 0;
const all = new Set([...pages(beforeDir), ...pages(afterDir)]);
for (const page of all) {
  const a = path.join(beforeDir, page);
  const b = path.join(afterDir, page);
  if (!fs.existsSync(a) || !fs.existsSync(b)) {
    console.log(`FEHLT: ${page} (${fs.existsSync(a) ? "nachher" : "vorher"})`);
    differing++;
    continue;
  }
  const left = normalize(fs.readFileSync(a, "utf8"));
  const right = normalize(fs.readFileSync(b, "utf8"));
  if (left !== right) {
    let i = 0;
    while (left[i] === right[i]) i++;
    console.log(`ABWEICHUNG: ${page}\n  vorher:  ${JSON.stringify(left.slice(Math.max(0, i - 60), i + 80))}\n  nachher: ${JSON.stringify(right.slice(Math.max(0, i - 60), i + 80))}`);
    differing++;
  }
}
if (differing) {
  console.log(`${differing} Seite(n) weichen ab`);
  process.exit(1);
}
console.log(`IDENTISCH (${all.size} Seiten)`);
```

- [ ] **Step 2: Vergleich an sich selbst prüfen**

Run:
```bash
W="$TMP/tina-scheiben"; rm -rf "$W"; mkdir -p "$W"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/check-a" --quiet
node scripts/compare-html.mjs "$W/check-a" "$W/check-a"
cp -r "$W/check-a" "$W/check-b" && sed -i 's/Where to find me/Where to find us/' "$W/check-b/events.html"
node scripts/compare-html.mjs "$W/check-a" "$W/check-b"; echo "exit=$?"
```
Expected: erst `IDENTISCH (11 Seiten)`, dann `ABWEICHUNG: events.html` mit beiden Ausschnitten und `exit=1`.

- [ ] **Step 3: Round-Trip-Skript schreiben**

`scripts/tina-roundtrip.mjs`:
```js
// Round-trip check for one Tina document against the local dev server
// (npm run dev). It reads the document through Tina's GraphQL API, saves
// the same values back the way the admin does, and fails unless the file
// still holds the same data. With --set=a.0.b=value one field is changed
// first, and that must be the only difference.
import fs from "node:fs";
import assert from "node:assert/strict";
import matter from "gray-matter";

const API = "http://localhost:4001/graphql";
const [collection, relativePath, ...flags] = process.argv.slice(2);
const set = flags.find((f) => f.startsWith("--set="))?.slice("--set=".length);

const schema = JSON.parse(fs.readFileSync("tina/__generated__/_schema.json", "utf8"));
const definition = schema.collections.find((c) => c.name === collection);
if (!definition) throw new Error(`Unknown collection "${collection}"`);
const file = `${definition.path}/${relativePath}`;

function readFile() {
  const text = fs.readFileSync(file, "utf8");
  if (definition.format === "json") return JSON.parse(text);
  const { data, content } = matter(text);
  return { ...data, $body: content.replace(/\r\n/g, "\n").trim() };
}

// Only fields the schema declares go into the mutation. Tina keeps the
// other top-level frontmatter on its own.
function pick(values, fields) {
  const out = {};
  for (const field of fields) {
    const value = values?.[field.name];
    if (value === undefined || value === null) continue;
    if (field.type === "object") {
      out[field.name] = field.list ? value.map((v) => pick(v, field.fields)) : pick(value, field.fields);
    } else {
      out[field.name] = value;
    }
  }
  return out;
}

function setPath(target, dottedPath, value) {
  const keys = dottedPath.split(".");
  const last = keys.pop();
  const parent = keys.reduce((node, key) => node[key], target);
  parent[last] = value;
}

async function graphql(query, variables) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

const before = readFile();
const { document } = await graphql(
  `query ($collection: String!, $relativePath: String!) {
     document(collection: $collection, relativePath: $relativePath) { ... on Document { _values } }
   }`,
  { collection, relativePath },
);
const params = pick(document._values, definition.fields);
const expected = structuredClone(before);
if (set) {
  const [dottedPath, ...rest] = set.split("=");
  setPath(params, dottedPath, rest.join("="));
  setPath(expected, dottedPath, rest.join("="));
}
await graphql(
  `mutation ($collection: String!, $relativePath: String!, $params: DocumentUpdateMutation!) {
     updateDocument(collection: $collection, relativePath: $relativePath, params: $params) { __typename }
   }`,
  { collection, relativePath, params: { [collection]: params } },
);
assert.deepEqual(readFile(), expected);
console.log(`ROUND-TRIP OK: ${file}${set ? ` (${set.split("=")[0]} geändert)` : ""}`);
```

- [ ] **Step 4: Skripte in `package.json`**

`"test"` ersetzen und ergänzen:
```json
    "test": "node --test",
    "tina:roundtrip": "node scripts/tina-roundtrip.mjs",
```

- [ ] **Step 5: Round-Trip gegen die bestehenden Collections prüfen**

`preview_start` mit `name: "pottery-dev"`, im Log auf `Watching…` und `TinaCMS Dev Server is active` warten. Dann:
```bash
npm run tina:roundtrip -- about about.md
npm run tina:roundtrip -- events events.json
git status --short src/views
npm run tina:roundtrip -- about about.md --set=headline=ROUNDTRIP
git diff --stat src/views/about.md
git checkout src/views/about.md && touch tina/config.ts
```
Expected: zweimal `ROUND-TRIP OK`, danach kein geänderter Inhalt in `src/views` außer höchstens Formatierung von `about.md` (die erste Tina-Speicherung dieser Datei, siehe Befund Task 4 im Spec). Das dritte Kommando meldet `ROUND-TRIP OK: src/views/about.md (headline geändert)`.

Scheitert die Mutation mit einem GraphQL-Fehler zu Rich-Text (etwa `body` erwartet ein anderes Format), die Fehlermeldung in Abschnitt 9 notieren und in `pick` Rich-Text-Felder (`field.type === "rich-text"`) unverändert lassen; scheitert es weiter, Dan fragen, bevor Round-Trips durch Klicks im Admin ersetzt werden.

- [ ] **Step 6: Commit**

```bash
npm run typecheck
git add scripts/compare-html.mjs scripts/tina-roundtrip.mjs package.json
git commit -m "chore(cms): Prüfwerkzeuge für HTML-Vergleich und Tina-Round-Trip

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Umwandlung der Event-Liste

**Files:**
- Create: `test/events-to-markets.test.mjs`
- Create: `scripts/events-to-markets.mjs`

**Interfaces:**
- Produces: `toMarketsAndEvents(data: { events: FlatEvent[] } | { markets, events }) => { markets: Market[], events: Event[] }` aus `scripts/events-to-markets.mjs`. CLI: `node scripts/events-to-markets.mjs <datei>` schreibt die Datei um. `Market = { name, location?, time?, gmaps?, description?, dates: string[] }`, `Event = { name, date, end_date?, time?, location?, gmaps?, description?, at_studio: boolean }`.

- [ ] **Step 1: Failing Tests schreiben**

`test/events-to-markets.test.mjs`:
```js
import test from "node:test";
import assert from "node:assert/strict";
import { toMarketsAndEvents } from "../scripts/events-to-markets.mjs";

const market = (date, extra = {}) => ({
  name: "Trout Lake Farmer's Market", date, time: "9 a.m. to 2 p.m.",
  location: "John Hendry Park", gmaps: "Trout Lake", multi_day_event: false, atStudio: false,
  content: { title: "Trout Lake", body: "Weekly market" }, ...extra,
});

test("groups a market's dates, sorted, with details from its latest date", () => {
  const result = toMarketsAndEvents({ events: [
    market("05-02-2026"),
    market("04-18-2026", { content: { body: "Old text" } }),
    market("10-17-2026", { name: "Trout Lake Farmer's Market ", content: { body: "Weekly market!" } }),
  ] });
  assert.deepEqual(result.markets, [{
    name: "Trout Lake Farmer's Market", location: "John Hendry Park", time: "9 a.m. to 2 p.m.",
    gmaps: "Trout Lake", description: "Weekly market!", dates: ["04-18-2026", "05-02-2026", "10-17-2026"],
  }]);
  assert.deepEqual(result.events, []);
});

test("keeps studio and multi-day entries as events", () => {
  const result = toMarketsAndEvents({ events: [
    { name: "Harmony Arts Festival", date: "08-07-2026", end_date: "08-09-2026", multi_day_event: true,
      time: "2pm", location: "Argyle Avenue", gmaps: "West Vancouver", atStudio: false,
      content: { title: "HAF", body: "Live music" } },
    { name: "Studio sale", date: "11-21-2026", end_date: "11-22-2026", multi_day_event: false,
      time: "10-4", location: "Studio", atStudio: true, content: {} },
  ] });
  assert.deepEqual(result.markets, []);
  assert.deepEqual(result.events, [
    { name: "Harmony Arts Festival", date: "08-07-2026", end_date: "08-09-2026", time: "2pm",
      location: "Argyle Avenue", gmaps: "West Vancouver", description: "Live music", at_studio: false },
    { name: "Studio sale", date: "11-21-2026", time: "10-4", location: "Studio", at_studio: true },
  ]);
});

test("leaves an already converted file alone", () => {
  const converted = { markets: [{ name: "X", dates: ["01-01-2027"] }], events: [] };
  assert.equal(toMarketsAndEvents(converted), converted);
});

test("refuses to merge a market whose dates disagree on the place", () => {
  assert.throws(
    () => toMarketsAndEvents({ events: [market("05-02-2026"), market("06-06-2026", { location: "Elsewhere" })] }),
    /Trout Lake Farmer's Market: "location" differs/,
  );
});
```

- [ ] **Step 2: Tests scheitern sehen**

Run: `npm test`
Expected: FAIL mit `Cannot find module` für `scripts/events-to-markets.mjs`.

- [ ] **Step 3: Umwandlung schreiben**

`scripts/events-to-markets.mjs`:
```js
// Converts the flat event list Decap writes into markets and events (see
// CONTEXT.md). A market is every entry that is neither at the studio nor
// multi-day, grouped by name. Run it again at the cutover on Matthew's
// latest events.json from main; a converted file is left alone.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const sortable = (date) => {
  const [month, day, year] = date.split("-");
  return `${year}-${month}-${day}`;
};

// Drop keys whose value is undefined so the JSON only holds filled fields,
// the way Tina writes it.
const compact = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

export function toMarketsAndEvents(data) {
  if (Array.isArray(data.markets)) return data;

  const byName = new Map();
  const events = [];
  for (const entry of data.events ?? []) {
    const name = entry.name.trim();
    if (entry.atStudio || entry.multi_day_event) {
      events.push(compact({
        name,
        date: entry.date,
        end_date: entry.multi_day_event && entry.end_date ? entry.end_date : undefined,
        time: entry.time,
        location: entry.location,
        gmaps: entry.gmaps,
        description: entry.content?.body,
        at_studio: Boolean(entry.atStudio),
      }));
      continue;
    }
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(entry);
  }

  const markets = [...byName].map(([name, entries]) => {
    const sorted = [...entries].sort((a, b) => sortable(a.date).localeCompare(sortable(b.date)));
    for (const field of ["location", "time", "gmaps"]) {
      if (new Set(sorted.map((e) => e[field] ?? "")).size > 1) {
        throw new Error(`${name}: "${field}" differs between its dates; fix events.json by hand first`);
      }
    }
    const latest = sorted[sorted.length - 1];
    return compact({
      name,
      location: latest.location,
      time: latest.time,
      gmaps: latest.gmaps,
      description: latest.content?.body,
      dates: sorted.map((e) => e.date),
    });
  });

  return { markets, events };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  const converted = toMarketsAndEvents(JSON.parse(fs.readFileSync(file, "utf8")));
  fs.writeFileSync(file, JSON.stringify(converted, null, 2) + "\n");
  console.log(`${file}: ${converted.markets.length} markets, ${converted.events.length} events`);
}
```

- [ ] **Step 4: Tests bestehen**

Run: `npm test`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add scripts/events-to-markets.mjs test/events-to-markets.test.mjs
git commit -m "feat(events): Umwandlung der Event-Liste in Markets und Events

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Markets und Events auf der Seite

**Files:**
- Modify: `src/views/_data/events.json`
- Modify: `.eleventy.js:84-104`
- Modify: `src/views/_includes/layouts/events-layout.njk:13-15,28-39,59,122`
- Modify: `src/views/_includes/partials/home-events.njk:12-13,39`
- Modify: `src/views/_includes/partials/hero.njk:13`

**Interfaces:**
- Consumes: `toMarketsAndEvents` aus Task 2, `compare-html.mjs` aus Task 1
- Produces: Nunjucks-Filter `occurrences(events) => Occurrence[]` (Markets tragen `market: "market-<index>"`), `specialEvents(Occurrence[])`, `marketSchedule(Occurrence[]) => { name, first: Occurrence, dates: string[] }[]`. Global data `events = { markets, events }`.

- [ ] **Step 1: Vorher-Build**

Tina-Dev-Server darf laufen. Run:
```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t3-before"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t3-before" --quiet && echo BUILD_OK
```

- [ ] **Step 2: Daten umwandeln**

Run:
```bash
node scripts/events-to-markets.mjs src/views/_data/events.json
node -e "const e=require('./src/views/_data/events.json'); console.log(e.markets.map(m=>m.name+' '+m.dates.length).join(' | '), '||', e.events.map(x=>x.name).join(' | '))"
```
Expected: `src/views/_data/events.json: 4 markets, 3 events`, dann `Trout Lake Farmer's Market 6 | Kitsilano Farmer's Market 6 | West End Farmer's Market 5 | Ladner Village Market 3 || Harmony Arts Festival | Harmony Arts Festival | Bespoke Summer Night Market`.

- [ ] **Step 3: Filter ersetzen**

In `.eleventy.js` die Filter `specialEvents` und `groupByVenue` samt Kommentaren ersetzen durch:
```js
    // One entry per day something is on: every date of every market, then
    // every event, shaped like the flat list the templates were written
    // for. Market dates carry a `market` key so the schedule groups them
    // without comparing names.
    eleventyConfig.addNunjucksFilter("occurrences", function (data) {
        const markets = (data.markets || []).flatMap((market, index) => {
            const { dates, ...details } = market;
            return (dates || [])
                .filter(Boolean)
                .map(date => ({ ...details, date, market: `market-${index}` }));
        });
        return markets.concat(data.events || []);
    });
    // Special events: everything that is not a market date, soonest first.
    // These get the large date-block treatment on the events page.
    eleventyConfig.addNunjucksFilter("specialEvents", function(array) {
        return array
            .filter(e => !e.market)
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'));
    });
    // Upcoming market dates grouped by market, soonest market first. The
    // dates are sorted before grouping, so `first` is each market's next
    // date: the object the template compares with the soonest event.
    eleventyConfig.addNunjucksFilter("marketSchedule", function(array) {
        const groups = new Map();
        array
            .filter(e => e.market)
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'))
            .forEach(e => {
                if (!groups.has(e.market)) groups.set(e.market, { name: e.name, first: e, dates: [] });
                groups.get(e.market).dates.push(e.date);
            });
        return Array.from(groups.values());
    });
```
Run: `grep -c "groupByVenue" .eleventy.js src/views/_includes/layouts/events-layout.njk`
Expected: `.eleventy.js:0` und `events-layout.njk:1` (wird in Step 4 ersetzt).

- [ ] **Step 4: Events-Seite umstellen**

In `src/views/_includes/layouts/events-layout.njk`:

Zeilen 13 bis 15 ersetzen durch:
```njk
        {% set upcoming = events | occurrences | filterUpcoming %}
        {% set special = upcoming | specialEvents %}
        {% set markets = upcoming | marketSchedule %}
```
Im Special-Card-Block `event.atStudio` an allen drei Stellen durch `event.at_studio` ersetzen. Die Datumszeile (Zeile 30) wird zu:
```njk
                <span class="font-display text-xl font-black text-ink">{{ event.date | date("d") }}{% if event.end_date and event.end_date != event.date %}–{{ event.end_date | date("d") }}{% endif %}</span>
```
Zeile 39 wird zu:
```njk
                {% if event.description %}<p class="mt-2 text-sm leading-relaxed text-muted">{{ event.description }}</p>{% endif %}
```
Zeile 59 wird zu:
```njk
            {% if group.first.description %}<p class="mt-2 text-sm leading-relaxed text-muted">{{ group.first.description }}</p>{% endif %}
```
Zeile 122 wird zu:
```njk
    {% for event in upcoming %}
```

- [ ] **Step 5: Startseite und Hero umstellen**

`src/views/_includes/partials/home-events.njk` Zeilen 12 und 13:
```njk
        {% set upcoming = events | occurrences | filterUpcoming | byDateAsc %}
        {% set shortlist = upcoming | nextUp %}
```
Zeile 39: `event.atStudio` durch `event.at_studio` ersetzen.

`src/views/_includes/partials/hero.njk` Zeile 13:
```njk
        {% set next = (events | occurrences | filterUpcoming | nextUp) | first %}
```
Run: `grep -rn "events\.events\|atStudio\|content\.body\|multi_day_event" src/views/_includes`
Expected: keine Ausgabe.

- [ ] **Step 6: Nachher-Build vergleichen**

Run:
```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t3-after"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t3-after" --quiet && node scripts/compare-html.mjs "$W/t3-before" "$W/t3-after"
```
Expected: `IDENTISCH (11 Seiten)`. Die strukturierten Daten dürfen in anderer Reihenfolge stehen; das Skript vergleicht sie sortiert. Liegt Mitternacht zwischen beiden Builds, Step 1 wiederholen.

- [ ] **Step 7: Befund und Commit**

In Abschnitt 9 des Specs ergänzen:
```markdown
- **Markets und Events (2026-09-15):** `events.json` in vier Markets mit 20 Terminen und drei Events umgewandelt. Die Events-Seite gruppiert über den Market-Schlüssel, `groupByVenue` entfällt. Alle elf Seiten sind identisch zum Stand davor, die strukturierten Daten bis auf die Reihenfolge.
```
```bash
npm run typecheck
git add .eleventy.js src/views/_data/events.json src/views/_includes/layouts/events-layout.njk src/views/_includes/partials/home-events.njk src/views/_includes/partials/hero.njk docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(events): Markets mit Terminliste statt Gruppierung nach Namen

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Tina-Schema für Markets und Events

**Files:**
- Create: `tina/fields/date.ts`
- Modify: `tina/collections/events.ts` (vollständig ersetzen)
- Modify: `tina/tina-lock.json` (generiert)

**Interfaces:**
- Consumes: `events.json` aus Task 3
- Produces: `datePicker`, `dateList`, `dayLabel(value?: string): string` aus `tina/fields/date.ts`; `events: Collection`.

- [ ] **Step 1: Datumshelfer auslagern**

`tina/fields/date.ts`:
```ts
// Dates stay "MM-DD-YYYY", the format every date filter in .eleventy.js
// reads. The fields use Tina's date picker on a string field: a "datetime"
// field would make Tina's server rewrite every date to an ISO timestamp.
const US_DATE = /^(\d{2})-(\d{2})-(\d{4})$/;

const usDate = (value: string) =>
  value && !US_DATE.test(value) ? "Use MM-DD-YYYY, for example 10-04-2026" : undefined;

// "10-04-2026" -> "2026-10-04T00:00:00", which every browser reads as local
// midnight (Safari rejects "10-04-2026" itself).
const fromUsDate = (value: string): string => {
  const m = value?.match(US_DATE);
  return m ? `${m[3]}-${m[1]}-${m[2]}T00:00:00` : value;
};

// The picker hands over an ISO timestamp: local midnight when a date is
// changed, the current clock time when the field was empty. Either way the
// editor's browser shows the day they picked, so only that day is kept.
const pad = (n: number) => String(n).padStart(2, "0");
const toUsDate = (value: string): string => {
  if (!value || US_DATE.test(value)) return value;
  const day = new Date(value);
  return isNaN(day.getTime())
    ? value
    : `${pad(day.getMonth() + 1)}-${pad(day.getDate())}-${day.getFullYear()}`;
};

export const datePicker = {
  component: "date",
  dateFormat: "MM-DD-YYYY",
  parse: toUsDate,
  format: fromUsDate,
  validate: usDate,
};

// For a list of dates. Tina builds every entry from `ui.field`, so each
// entry gets the same picker; required: false keeps a new, empty entry
// from showing today's date.
export const dateList = { field: { ...datePicker, required: false } };

// Item labels in lists, shown in the editor's own calendar.
export const dayLabel = (value?: string): string => {
  if (!value) return "";
  const day = new Date(fromUsDate(value));
  return isNaN(day.getTime())
    ? value
    : day.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};
```

- [ ] **Step 2: Collection ersetzen**

`tina/collections/events.ts`:
```ts
import type { Collection } from "tinacms";
import { dateList, datePicker, dayLabel } from "../fields/date";

// Field order matches the order scripts/events-to-markets.mjs writes, so a
// first save does not reorder every entry.
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
      name: "markets",
      label: "Markets",
      list: true,
      ui: { itemProps: (item) => ({ label: item?.name || "New market" }) },
      fields: [
        { type: "string", name: "name", label: "Name", required: true },
        { type: "string", name: "location", label: "Location" },
        { type: "string", name: "time", label: "Time" },
        { type: "string", name: "gmaps", label: "Location on Google Maps" },
        { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
        { type: "string", name: "dates", label: "Dates", list: true, ui: dateList },
      ],
    },
    {
      type: "object",
      name: "events",
      label: "Events",
      description: "One-off and multi-day events, shown under “Special events”",
      list: true,
      ui: {
        itemProps: (item) => ({
          label: [dayLabel(item?.date), item?.name].filter(Boolean).join(" · ") || "New event",
        }),
        defaultItem: { at_studio: false },
      },
      fields: [
        { type: "string", name: "name", label: "Name", required: true },
        { type: "string", name: "date", label: "Date", required: true, ui: datePicker },
        { type: "string", name: "end_date", label: "End date", description: "Only for multi day events", required: false, ui: datePicker },
        { type: "string", name: "time", label: "Time" },
        { type: "string", name: "location", label: "Location" },
        { type: "string", name: "gmaps", label: "Location on Google Maps" },
        { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
        { type: "boolean", name: "at_studio", label: "Takes place at my studio" },
      ],
    },
  ],
};
```
Run: `npm run typecheck`. Expected: Exit-Code 0. Meldet TypeScript bei `ui: dateList`, dass `field` unbekannt ist, `dateList` mit `as { field: typeof datePicker & { required: boolean } }` typisieren, nicht mit `any`.

- [ ] **Step 3: Round-Trip**

Im Dev-Server-Log auf `Re-index complete` warten. Run:
```bash
npm run tina:roundtrip -- events events.json
npm run tina:roundtrip -- events events.json --set=markets.0.time=TEST
git checkout src/views/_data/events.json && touch tina/config.ts
```
Expected: zweimal `ROUND-TRIP OK`. Das erste darf die Datei nicht ändern: `git diff --stat src/views/_data/events.json` direkt nach dem ersten Kommando zeigt nichts oder nur eine Zeilenende-Änderung.

- [ ] **Step 4: Datumsliste im Admin prüfen**

Nach `Re-index complete` im Browser-Pane `http://localhost:8080/admin-tina/index.html` öffnen, **Events** → **Markets** → „Trout Lake Farmer's Market". Mit `read_page` und Screenshot prüfen:
1. Unter **Dates** stehen sechs Einträge, jeder mit Kalender-Symbol und Datum.
2. „+" bei Dates fügt einen Eintrag hinzu, der „Pick a date" zeigt.
3. Im neuen Eintrag den Kalender öffnen, den 10. wählen, speichern.

Dann:
```bash
node -e "console.log(require('./src/views/_data/events.json').markets[0].dates)"
```
Expected: sieben Werte, der letzte `MM-10-YYYY` im angezeigten Monat. Danach `git checkout src/views/_data/events.json && touch tina/config.ts`.

Zeigt die Liste Textfelder statt Kalender, im Spec notieren und `dates` als Objektliste umbauen: `{ type: "object", name: "dates", label: "Dates", list: true, ui: { itemProps: (item) => ({ label: dayLabel(item?.date) || "New date" }) }, fields: [{ type: "string", name: "date", label: "Date", required: true, ui: datePicker }] }`. Das ändert die Datenform auf `dates: [{ "date": "…" }]` und verlangt Anpassungen in `events-to-markets.mjs` (Tests zuerst), im Filter `occurrences` (`.map(d => d.date)`) und einen erneuten HTML-Vergleich wie in Task 3. Vorher Dan fragen.

- [ ] **Step 5: Befund und Commit**

In Abschnitt 9 ergänzen:
```markdown
- **Tina-Schema Markets und Events:** Markets zeigen Name, Ort, Zeit, Karte und Beschreibung einmal und die Termine als Liste mit Kalender je Eintrag (`ui.field` auf der String-Liste). Round-Trip ohne Änderung, Änderung eines Felds betrifft nur dieses Feld.
```
```bash
npm run typecheck
git add tina/fields/date.ts tina/collections/events.ts tina/tina-lock.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(cms): Markets mit Terminliste und Events als eigene Liste in Tina

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Events-Seite mit Studio-News

**Files:**
- Modify: `src/views/events.md`
- Delete: `src/views/_data/news.json`
- Modify: `src/views/_includes/layouts/events-layout.njk:83-102`
- Modify: `.eleventy.js:53-58,105-106`
- Create: `tina/fields/common.ts`
- Create: `tina/collections/eventsPage.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Consumes: `datePicker` aus Task 4
- Produces: `imageField(name: string, label: string): TinaField`, `linkField(name: string, label: string): TinaField` aus `tina/fields/common.ts`; `eventsPage: Collection` mit `name: "events_page"`.

- [ ] **Step 1: Vorher-Build**

```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t5-before"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t5-before" --quiet && echo BUILD_OK
```

- [ ] **Step 2: News ins Frontmatter verschieben**

Run:
```bash
node -e "
const fs = require('fs'); const yaml = require('js-yaml');
const n = JSON.parse(fs.readFileSync('src/views/_data/news.json', 'utf8')).news[0];
const news = { date: n.date, title: n.content.title, body: n.content.body, image: { url: n.image.url, alt: n.image.alt } };
const file = 'src/views/events.md'; const src = fs.readFileSync(file, 'utf8');
const end = src.search(/\r?\n---\s*$/);
if (end < 0) throw new Error('Frontmatter-Ende nicht gefunden');
const nl = src.includes('\r\n') ? '\r\n' : '\n';
const block = yaml.safeDump({ news }, { lineWidth: -1 }).trimEnd().split('\n').join(nl);
fs.writeFileSync(file, src.slice(0, end) + nl + block + src.slice(end));
"
git rm -q src/views/_data/news.json
node -e "const m=require('gray-matter'); const d=m(require('fs').readFileSync('src/views/events.md','utf8')).data; console.log(JSON.stringify(d.news).slice(0,160), Object.keys(d).join(','))"
```
Expected: das News-Objekt mit `date`, `title`, `body`, `image`, und die Schlüsselliste endet mit `,news`.

- [ ] **Step 3: Template umstellen**

In `src/views/_includes/layouts/events-layout.njk` den Block von `{% set latestNews = news.news | sortByDate | first %}` bis zur Trennlinie ersetzen durch:
```njk
        {# news comes from the events page's own front matter; an empty
           title hides the news part of the card. #}
        {% if news.title or studio.title %}
        <div class="overflow-hidden rounded-xl border border-hairline bg-white">
            {% if news.title %}
            <div>
                {% if news.image.url %}
                {% img news.image.url, news.image.alt, "(min-width: 1152px) 445px, (min-width: 1024px) 30vw, 100vw", "aspect-[4/3] w-full object-cover" %}
                {% endif %}
                <div class="p-6">
                    <p class="cap-label text-[11px] text-soft">{{ section_labels.from_studio }} &middot; {{ news.date | date("MMM d") }}</p>
                    <h2 class="mt-2 font-display text-xl font-black text-ink">{{ news.title }}</h2>
                    <p class="mt-3 text-sm leading-relaxed text-muted">{{ news.body | safe }}</p>
                    {% img "images/site/signature.jpg", "Cheers, Matthew", "144px", "ml-auto block h-auto w-32" %}
                </div>
            </div>
            {% endif %}

            {% if news.title and studio.title %}
            <div class="mx-6 border-t border-hairline"></div>
            {% endif %}
```
Der folgende `{% if studio.title %}`-Block bleibt unverändert.

Run: `grep -rn "latestNews\|sortByDate" src/views`
Expected: keine Ausgabe.

- [ ] **Step 4: Ungenutzten Filter entfernen**

In `.eleventy.js` den Filter `sortByDate` (Zeilen 53 bis 58) löschen. Im Kommentar über `byDateAsc` den Satz „Note the direction: sortByDate above sorts newest-first." entfernen.

Run: `grep -c "sortByDate" .eleventy.js`
Expected: `0`.

- [ ] **Step 5: Nachher-Build vergleichen**

```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t5-after"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t5-after" --quiet && node scripts/compare-html.mjs "$W/t5-before" "$W/t5-after"
```
Expected: `IDENTISCH (11 Seiten)`.

- [ ] **Step 6: Gemeinsame Felder anlegen**

`tina/fields/common.ts`:
```ts
import type { TinaField } from "tinacms";

// An image the site renders through the {% img %} shortcode: the path
// Tina stores (/images/…) plus the alt text.
export const imageField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: [
    { type: "image", name: "url", label: "Image" },
    { type: "string", name: "alt", label: "Alt text", description: "Describes the image for people who cannot see it" },
  ],
});

export const linkField = (name: string, label: string): TinaField => ({
  type: "object",
  name,
  label,
  fields: [
    { type: "string", name: "label", label: "Label" },
    { type: "string", name: "url", label: "URL" },
  ],
});
```

- [ ] **Step 7: Collection Events-Seite**

`tina/collections/eventsPage.ts`:
```ts
import type { Collection } from "tinacms";
import { imageField, linkField } from "../fields/common";
import { datePicker } from "../fields/date";

export const eventsPage: Collection = {
  name: "events_page",
  label: "Events page",
  path: "src/views",
  format: "md",
  match: { include: "events" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    {
      type: "object", name: "intro", label: "Intro",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title" },
      ],
    },
    { type: "string", name: "rhythm", label: "Annual rhythm note", ui: { component: "textarea" } },
    {
      type: "object", name: "section_labels", label: "Section headings",
      fields: [
        { type: "string", name: "special", label: "Special events heading" },
        { type: "string", name: "markets", label: "Market schedule heading" },
        { type: "string", name: "studio_news", label: "Studio news heading" },
        { type: "string", name: "from_studio", label: "Dateline above the studio note" },
      ],
    },
    {
      type: "object", name: "studio", label: "Visit the studio card",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        linkField("cta", "Button"),
        { type: "string", name: "footnote", label: "Footnote", ui: { component: "textarea" } },
      ],
    },
    { type: "string", name: "no_events", label: "Text when no events", ui: { component: "textarea" } },
    {
      type: "object", name: "news", label: "Studio news",
      description: "Leave the title empty to hide the news",
      fields: [
        { type: "string", name: "date", label: "Date", ui: datePicker },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "body", label: "Text", ui: { component: "textarea" } },
        imageField("image", "Image"),
      ],
    },
  ],
};
```
In `tina/config.ts` den Import `import { eventsPage } from "./collections/eventsPage";` ergänzen und `schema: { collections: [events, eventsPage, about] }` setzen.

- [ ] **Step 8: Commit**

Vor dem Round-Trip committen: Der Round-Trip setzt die Datei am Ende per `git checkout` zurück und würde sonst den News-Umzug verwerfen. In Abschnitt 9 ergänzen:
```markdown
- **Events-Seite:** News als Objekt `news` im Frontmatter von `events.md`, `news.json` und der Filter `sortByDate` entfallen. Alle Seiten identisch zum Stand davor.
```
```bash
npm run typecheck
git add .eleventy.js src/views/events.md src/views/_includes/layouts/events-layout.njk tina/fields/common.ts tina/collections/eventsPage.ts tina/config.ts tina/tina-lock.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(cms): Events-Seite in Tina, Studio-News im Frontmatter der Seite

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
Expected: `git status --short src/views` ist danach leer.

- [ ] **Step 9: Round-Trip**

Nach `Re-index complete`:
```bash
npm run tina:roundtrip -- events_page events.md
npm run tina:roundtrip -- events_page events.md --set=news.title=TEST
git checkout src/views/events.md && touch tina/config.ts
```
Expected: zweimal `ROUND-TRIP OK`, danach ist `git status --short src/views` wieder leer. Scheitert ein Round-Trip, das Schema korrigieren und als eigenen Commit nachziehen.

---

### Task 6: Pottery und Process

**Files:**
- Create: `tina/fields/sections.ts`
- Modify: `tina/collections/about.ts`
- Create: `tina/collections/pottery.ts`, `tina/collections/processPage.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Consumes: `imageField` aus Task 5
- Produces: `sectionsField: TinaField`; `pottery: Collection` (`name: "pottery"`), `processPage: Collection` (`name: "process"`).

- [ ] **Step 1: Abschnittsliste auslagern**

`tina/fields/sections.ts`:
```ts
import type { TinaField } from "tinacms";
import { imageField } from "./common";

// The image-and-text sections of About, Pottery and Process. Outside the
// file body Tina stores rich-text as a Markdown string, which the
// markdownify filter renders; raw HTML such as <b> shows up as a locked
// chip and is written back unchanged.
export const sectionsField: TinaField = {
  type: "object",
  name: "sections",
  label: "Sections",
  list: true,
  ui: { itemProps: (item) => ({ label: item?.image?.alt || "Section" }) },
  fields: [
    imageField("image", "Image"),
    { type: "rich-text", name: "body", label: "Text" },
  ],
};
```
In `tina/collections/about.ts` den Import `import { sectionsField } from "../fields/sections";` ergänzen und das ganze `sections`-Objekt in `fields` durch `sectionsField,` ersetzen.

- [ ] **Step 2: Pottery und Process**

`tina/collections/pottery.ts`:
```ts
import type { Collection } from "tinacms";
import { sectionsField } from "../fields/sections";

export const pottery: Collection = {
  name: "pottery",
  label: "Pottery",
  path: "src/views",
  format: "md",
  match: { include: "pottery" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    sectionsField,
  ],
};
```
`tina/collections/processPage.ts`:
```ts
import type { Collection } from "tinacms";
import { sectionsField } from "../fields/sections";

// Exported as processPage: an export named `process` would shadow Node's
// process in tina/config.ts.
export const processPage: Collection = {
  name: "process",
  label: "Process",
  path: "src/views",
  format: "md",
  match: { include: "process" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Eyebrow" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    { type: "string", name: "quote", label: "Pull quote (shown after the first section)", ui: { component: "textarea" } },
    sectionsField,
  ],
};
```
In `tina/config.ts` beide importieren und `collections: [events, eventsPage, about, pottery, processPage]` setzen.

- [ ] **Step 3: Round-Trips**

Nach `Re-index complete`:
```bash
npm run tina:roundtrip -- about about.md
npm run tina:roundtrip -- pottery pottery.md
npm run tina:roundtrip -- process process.md
npm run tina:roundtrip -- process process.md --set=headline=TEST
git checkout src/views/about.md src/views/pottery.md src/views/process.md && touch tina/config.ts
```
Expected: viermal `ROUND-TRIP OK`. `process.md` enthält `<b>Think it</b>`; der Round-Trip beweist, dass es erhalten bleibt.

- [ ] **Step 4: Commit**

```bash
npm run typecheck
git add tina/fields/sections.ts tina/collections/about.ts tina/collections/pottery.ts tina/collections/processPage.ts tina/config.ts tina/tina-lock.json
git commit -m "feat(cms): Pottery und Process in Tina mit gemeinsamer Abschnittsliste

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Home

**Files:**
- Create: `tina/collections/home.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Consumes: `imageField`, `linkField` aus Task 5
- Produces: `home: Collection` (`name: "home"`)

- [ ] **Step 1: Collection**

`tina/collections/home.ts`:
```ts
import type { Collection } from "tinacms";
import { imageField, linkField } from "../fields/common";

export const home: Collection = {
  name: "home",
  label: "Home",
  path: "src/views",
  format: "md",
  match: { include: "home" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    {
      type: "object", name: "hero", label: "Hero",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "highlight", label: "Highlight word (shown in sand)", description: "Must appear in the title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "cta_primary", label: "Primary button" },
        linkField("cta_secondary", "Secondary link"),
        imageField("image", "Image"),
      ],
    },
    {
      type: "string", name: "trust", label: "Trust ribbon (below the hero)", list: true,
      description: "Short claims in the ribbon under the hero. It scrolls on phones, spreads across on desktop and shows in uppercase.",
    },
    {
      type: "object", name: "featured_piece", label: "Featured piece",
      fields: [
        { type: "string", name: "eyebrow", label: "Small label above the title" },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "caption", label: "Glaze caption" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "price", label: "Price" },
        imageField("image", "Image"),
        linkField("cta", "Shop link"),
      ],
    },
    {
      type: "object", name: "collections_teaser", label: "Collections teaser",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "item_cta", label: "Link text on each glaze card" },
        { type: "string", name: "link_label", label: "Field-guide link (wide screens)" },
        { type: "string", name: "link_label_short", label: "Field-guide link (phones)" },
      ],
    },
    {
      type: "object", name: "products", label: "Products section",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "note", label: "Note under the grid" },
        { type: "string", name: "link_label", label: "Shop-all link text" },
      ],
    },
    {
      type: "object", name: "events_band", label: "Events band",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "link_label", label: "All-events link text" },
        { type: "string", name: "no_events", label: "Text when no events", ui: { component: "textarea" } },
      ],
    },
    {
      type: "object", name: "story_teaser", label: "Story teaser",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "quote", label: "Quote" },
        { type: "string", name: "label", label: "Link label" },
        imageField("image", "Image"),
      ],
    },
  ],
};
```
In `tina/config.ts` importieren und ans Ende von `collections` anhängen.

- [ ] **Step 2: Round-Trip und Commit**

Nach `Re-index complete`:
```bash
npm run tina:roundtrip -- home home.md
npm run tina:roundtrip -- home home.md --set=trust.1=TEST
git checkout src/views/home.md && touch tina/config.ts
npm run typecheck
git add tina/collections/home.ts tina/config.ts tina/tina-lock.json
git commit -m "feat(cms): Home in Tina

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
Expected vor dem Commit: zweimal `ROUND-TRIP OK`; `social_flush` steht nach dem ersten Round-Trip weiter in `home.md` (`grep -c social_flush src/views/home.md` ergibt `1`).

---

### Task 8: Contact und Collections-Seite

**Files:**
- Create: `tina/collections/contact.ts`, `tina/collections/collectionsPage.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Produces: `contact: Collection` (`name: "contact"`), `collectionsPage: Collection` (`name: "collections_page"`)

- [ ] **Step 1: Collections**

`tina/collections/contact.ts`:
```ts
import type { Collection } from "tinacms";

// One textarea per paragraph. Tina builds every list entry from ui.field;
// kept in a constant because the UI type does not declare `field`.
const paragraphList = { component: "list", field: { component: "textarea" } };

export const contact: Collection = {
  name: "contact",
  label: "Contact",
  path: "src/views",
  format: "md",
  match: { include: "contact" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Small label above the headline" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "subheadline", label: "Subheadline" },
    { type: "string", name: "social_title", label: "Heading above the social icons" },
    { type: "string", name: "intro", label: "Intro paragraphs", list: true, ui: paragraphList },
    { type: "string", name: "message", label: "Label above the email address" },
    { type: "string", name: "phone", label: "Label above the phone number" },
    { type: "string", name: "address", label: "Label above the address" },
    {
      type: "object", name: "contactform", label: "Contact form",
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "submit", label: "Button text" },
        { type: "string", name: "info", label: "Note under the title" },
        {
          type: "object", name: "placeholders", label: "Field labels",
          description: "The asterisk on required fields is added automatically",
          fields: [
            { type: "string", name: "name", label: "Name" },
            { type: "string", name: "email", label: "Email (required field)" },
            { type: "string", name: "phone", label: "Phone" },
            { type: "string", name: "message", label: "Message (required field)" },
          ],
        },
      ],
    },
  ],
};
```
`tina/collections/collectionsPage.ts`:
```ts
import type { Collection } from "tinacms";

// name "collections_page": "collections" is reserved in Tina's GraphQL.
export const collectionsPage: Collection = {
  name: "collections_page",
  label: "Collections page",
  path: "src/views",
  format: "md",
  match: { include: "collections" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    {
      type: "object", name: "intro", label: "Intro",
      fields: [
        { type: "string", name: "eyebrow", label: "Eyebrow" },
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
      ],
    },
    { type: "string", name: "item_cta", label: "Link text on each collection card" },
    { type: "string", name: "filters", label: "Filter chips", list: true },
  ],
};
```
In `tina/config.ts` beide importieren und ans Ende von `collections` anhängen; die endgültige Reihenfolge setzt Task 12.

Run: `npm run typecheck`. Expected: Exit-Code 0.

- [ ] **Step 2: Round-Trips und Commit**

Nach `Re-index complete`:
```bash
npm run tina:roundtrip -- contact contact.md
npm run tina:roundtrip -- contact contact.md --set=intro.0=TEST
npm run tina:roundtrip -- collections_page collections.md
git checkout src/views/contact.md src/views/collections.md && touch tina/config.ts
npm run typecheck
git add tina/collections/contact.ts tina/collections/collectionsPage.ts tina/config.ts tina/tina-lock.json
git commit -m "feat(cms): Contact und Collections-Seite in Tina

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
Expected: dreimal `ROUND-TRIP OK`; `permalink` bleibt in `contact.md` (`grep -c permalink src/views/contact.md` ergibt `1`).

---

### Task 9: Galerie und Features

**Files:**
- Create: `src/views/_data/gallery.json`, `src/views/_data/features.json`
- Delete: `src/views/_data/showcase.json`
- Modify: `src/views/_includes/layouts/collections-layout.njk:19`, `src/views/_includes/partials/collections-teaser.njk:7,24`, `src/views/_includes/partials/current-firing.njk:19`
- Create: `tina/collections/gallery.ts`, `tina/collections/features.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Consumes: `imageField` aus Task 5
- Produces: Global data `gallery.items`, `features.items`; `gallery: Collection`, `features: Collection`

- [ ] **Step 1: Vorher-Build**

```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t9-before"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t9-before" --quiet && echo BUILD_OK
```

- [ ] **Step 2: Datei trennen, tote Schlüssel entfernen**

```bash
node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('src/views/_data/showcase.json', 'utf8'));
const gallery = s.gallery.map(({ style, cta, ...item }) => item);
const features = s.features.map(({ cta, ...item }) => ({ ...item, cta: { url: cta.url } }));
fs.writeFileSync('src/views/_data/gallery.json', JSON.stringify({ items: gallery }, null, 2) + '\n');
fs.writeFileSync('src/views/_data/features.json', JSON.stringify({ items: features }, null, 2) + '\n');
console.log(gallery.length, features.length, Object.keys(gallery[0]).join(','), '|', Object.keys(features[0]).join(','));
"
git rm -q src/views/_data/showcase.json
```
Expected: `15 16 image,title,text,slug,swatch,filterGroups | title,overlay,price,image,hide,cta`.

- [ ] **Step 3: Templates umstellen**

Ersetzen: `showcase.gallery` durch `gallery.items` in `collections-layout.njk` (Zeile 19) und `collections-teaser.njk` (Zeilen 7 und 24); `showcase.features` durch `features.items` in `current-firing.njk` (Zeile 19).

Run: `grep -rn "showcase" src/views .eleventy.js`
Expected: keine Ausgabe.

- [ ] **Step 4: Nachher-Build vergleichen**

```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t9-after"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t9-after" --quiet && node scripts/compare-html.mjs "$W/t9-before" "$W/t9-after"
```
Expected: `IDENTISCH (11 Seiten)`.

- [ ] **Step 5: Collections**

`tina/collections/gallery.ts`:
```ts
import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

const hexColour = (value: string) =>
  value && !/^#[0-9A-Fa-f]{6}$/.test(value) ? "Use a hex colour like #1F3A52" : undefined;

export const gallery: Collection = {
  name: "gallery",
  label: "Glaze gallery",
  path: "src/views/_data",
  format: "json",
  match: { include: "gallery" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "items", label: "Glaze lines", list: true,
      description: "Shown on the collections page and in the home page teaser, in this order",
      ui: { itemProps: (item) => ({ label: item?.title || "New glaze line" }) },
      fields: [
        imageField("image", "Image"),
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
        { type: "string", name: "slug", label: "Shop collection slug (tail of the shop URL)" },
        { type: "string", name: "swatch", label: "Swatch colour (hex)", ui: { validate: hexColour } },
        { type: "string", name: "filterGroups", label: "Filter groups", list: true, options: ["Blues", "Charcoals", "Patterned"] },
      ],
    },
  ],
};
```
`tina/collections/features.ts`:
```ts
import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

export const features: Collection = {
  name: "features",
  label: "Featured shop items",
  path: "src/views/_data",
  format: "json",
  match: { include: "features" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "items", label: "Items", list: true,
      description: "The grid next to the featured piece on the home page, in this order",
      ui: { itemProps: (item) => ({ label: item?.title || "New item" }) },
      fields: [
        { type: "string", name: "title", label: "Title", description: "“Glaze - Piece”, for example “Tofino - Belly Mug”" },
        { type: "object", name: "overlay", label: "Overlay", fields: [{ type: "string", name: "text", label: "Text", ui: { component: "textarea" } }] },
        { type: "string", name: "price", label: "Price" },
        imageField("image", "Image"),
        { type: "boolean", name: "hide", label: "Hide" },
        { type: "object", name: "cta", label: "Shop link", fields: [{ type: "string", name: "url", label: "URL" }] },
      ],
    },
  ],
};
```
In `tina/config.ts` beide importieren und ans Ende von `collections` anhängen.

- [ ] **Step 6: Commit**

Vor dem Round-Trip committen, weil `gallery.json` und `features.json` neu sind und der Round-Trip sie per `git checkout` zurücksetzt. In Abschnitt 9 ergänzen:
```markdown
- **Galerie und Features:** `showcase.json` in `gallery.json` und `features.json` getrennt, tote Schlüssel `gallery[].style`, `gallery[].cta` und `features[].cta.label` entfernt. Alle Seiten identisch zum Stand davor.
```
```bash
npm run typecheck
git add src/views/_data/gallery.json src/views/_data/features.json src/views/_includes/layouts/collections-layout.njk src/views/_includes/partials/collections-teaser.njk src/views/_includes/partials/current-firing.njk tina/collections/gallery.ts tina/collections/features.ts tina/config.ts tina/tina-lock.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(cms): Galerie und Features als eigene Dateien in Tina

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Round-Trips**

Nach `Re-index complete`:
```bash
npm run tina:roundtrip -- gallery gallery.json
npm run tina:roundtrip -- features features.json --set=items.2.price=TEST
git checkout src/views/_data/gallery.json src/views/_data/features.json && touch tina/config.ts
```
Expected: zweimal `ROUND-TRIP OK`, danach `git status --short src/views` leer.

---

### Task 10: Händler und Datenschutz

**Files:**
- Create: `tina/collections/retail.ts`, `tina/collections/privacy.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Consumes: `imageField` aus Task 5
- Produces: `retail: Collection` (`name: "retail"`), `privacy: Collection` (`name: "privacy"`)

- [ ] **Step 1: Collections**

`tina/collections/retail.ts`:
```ts
import type { Collection } from "tinacms";
import { imageField } from "../fields/common";

export const retail: Collection = {
  name: "retail",
  label: "Retail stores",
  path: "src/views",
  format: "md",
  match: { include: "retail-stores" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "eyebrow", label: "Eyebrow" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    imageField("banner", "Banner image"),
    {
      type: "object", name: "stores", label: "Stores", list: true,
      ui: { itemProps: (item) => ({ label: [item?.name, item?.city].filter(Boolean).join(" · ") || "New store" }) },
      fields: [
        { type: "string", name: "name", label: "Name" },
        { type: "string", name: "url", label: "Website URL" },
        { type: "string", name: "address", label: "Street address" },
        { type: "string", name: "city", label: "City" },
      ],
    },
    { type: "rich-text", name: "body", label: "Text below the stores", isBody: true },
  ],
};
```
`tina/collections/privacy.ts`:
```ts
import type { Collection } from "tinacms";

export const privacy: Collection = {
  name: "privacy",
  label: "Privacy statement",
  path: "src/views",
  format: "md",
  match: { include: "privacy-statement" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
    { type: "rich-text", name: "body", label: "Text", isBody: true },
  ],
};
```
In `tina/config.ts` beide importieren und ans Ende von `collections` anhängen.

- [ ] **Step 2: Round-Trips, Body genau prüfen**

Nach `Re-index complete`:
```bash
npm run tina:roundtrip -- retail retail-stores.md
npm run tina:roundtrip -- privacy privacy-statement.md
git diff src/views/privacy-statement.md | head -40
```
Expected: zweimal `ROUND-TRIP OK`. Der Round-Trip vergleicht den Body als getrimmten Text.

Scheitert `privacy` wegen eines geänderten Bodys (etwa andere Listenzeichen oder Leerzeilen), das Feld durch den Text-Body ersetzen und erneut prüfen:
```ts
    { type: "string", name: "body", label: "Text (Markdown)", isBody: true, ui: { component: "textarea" } },
```
Beide Ergebnisse in Abschnitt 9 notieren. Danach `git checkout src/views/retail-stores.md src/views/privacy-statement.md && touch tina/config.ts`.

- [ ] **Step 3: Commit**

```bash
npm run typecheck
git add tina/collections/retail.ts tina/collections/privacy.ts tina/config.ts tina/tina-lock.json docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "feat(cms): Händler und Datenschutzerklärung in Tina

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: FAQ

**Files:**
- Modify: `src/views/faq.md`
- Create: `tina/collections/faqPage.ts`, `tina/collections/faq.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Produces: `faqPage: Collection` (`name: "faq_page"`), `faq: Collection` (`name: "faq"`)

- [ ] **Step 1: Toten Schlüssel entfernen und vergleichen**

```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t11-before" "$W/t11-after"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t11-before" --quiet
sed -i '/^load_more:/d' src/views/faq.md
grep -c "load_more" src/views/faq.md
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t11-after" --quiet && node scripts/compare-html.mjs "$W/t11-before" "$W/t11-after"
```
Expected: `0`, dann `IDENTISCH (11 Seiten)`.

- [ ] **Step 2: Collections**

`tina/collections/faqPage.ts`:
```ts
import type { Collection } from "tinacms";

export const faqPage: Collection = {
  name: "faq_page",
  label: "FAQ page",
  path: "src/views",
  format: "md",
  match: { include: "faq" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "headline", label: "Headline" },
    { type: "string", name: "intro", label: "Intro", ui: { component: "textarea" } },
  ],
};
```
`tina/collections/faq.ts`:
```ts
import type { Collection } from "tinacms";

export const faq: Collection = {
  name: "faq",
  label: "FAQ questions",
  path: "src/views/_data",
  format: "json",
  match: { include: "faq" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "sections", label: "Sections", list: true,
      ui: { itemProps: (item) => ({ label: item?.title || "New section" }) },
      fields: [
        { type: "string", name: "title", label: "Section title" },
        {
          type: "object", name: "questions", label: "Questions", list: true,
          ui: { itemProps: (item) => ({ label: item?.title || "New question" }) },
          fields: [
            { type: "string", name: "title", label: "Question" },
            { type: "string", name: "body", label: "Answer", ui: { component: "textarea" } },
          ],
        },
      ],
    },
  ],
};
```
In `tina/config.ts` beide importieren und ans Ende von `collections` anhängen.

- [ ] **Step 3: Commit**

Vor dem Round-Trip committen, damit `git checkout` die Entfernung von `load_more` nicht zurückholt.
```bash
npm run typecheck
git add src/views/faq.md tina/collections/faqPage.ts tina/collections/faq.ts tina/config.ts tina/tina-lock.json
git commit -m "feat(cms): FAQ-Seite und Fragen in Tina, ungenutztes load_more entfernt

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Round-Trips**

Nach `Re-index complete`:
```bash
npm run tina:roundtrip -- faq_page faq.md
npm run tina:roundtrip -- faq faq.json --set=sections.0.questions.0.title=TEST
git checkout src/views/faq.md src/views/_data/faq.json && touch tina/config.ts
grep -c load_more src/views/faq.md
```
Expected: zweimal `ROUND-TRIP OK`, dann `0`.

---

### Task 12: Global, SEO und Reihenfolge der Seitenleiste

**Files:**
- Modify: `src/views/_data/global.json`
- Create: `tina/collections/global.ts`, `tina/collections/seo.ts`
- Modify: `tina/config.ts`

**Interfaces:**
- Produces: `global: Collection` (`name: "global"`), `seo: Collection` (`name: "seo"`); endgültige `schema.collections`

- [ ] **Step 1: Tote Schlüssel entfernen und vergleichen**

```bash
W="$TMP/tina-scheiben"; rm -rf "$W/t12-before" "$W/t12-after"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t12-before" --quiet
node -e "
const fs = require('fs'); const f = 'src/views/_data/global.json';
const g = JSON.parse(fs.readFileSync(f, 'utf8'));
delete g.hero; delete g.contact.name; delete g.socialmedia.title;
for (const s of Object.values(g.socialmedia.services)) { delete s.name; delete s.icon; }
fs.writeFileSync(f, JSON.stringify(g, null, 2) + '\n');
console.log(Object.keys(g).join(','), '|', JSON.stringify(g.socialmedia));
"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t12-after" --quiet && node scripts/compare-html.mjs "$W/t12-before" "$W/t12-after"
```
Expected: `social,contact,shop,labels,footer,socialmedia | {"services":{"instagram":{"url":…},"facebook":{"url":…}}}`, dann `IDENTISCH (11 Seiten)`.

- [ ] **Step 2: Collections**

`tina/collections/global.ts`:
```ts
import type { Collection } from "tinacms";

export const global: Collection = {
  name: "global",
  label: "Site settings",
  path: "src/views/_data",
  format: "json",
  match: { include: "global" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    {
      type: "object", name: "social", label: "Follow band (bottom of every page)",
      fields: [
        { type: "string", name: "title", label: "Heading" },
        { type: "string", name: "text", label: "Text under the heading" },
        { type: "string", name: "instagram_label", label: "Instagram button text" },
        { type: "string", name: "facebook_label", label: "Facebook button text" },
      ],
    },
    {
      type: "object", name: "contact", label: "Contact information",
      fields: [
        { type: "string", name: "address", label: "Address", ui: { component: "textarea" } },
        { type: "string", name: "phone", label: "Phone" },
        { type: "string", name: "email", label: "Email" },
        { type: "string", name: "text", label: "Text in the footer", ui: { component: "textarea" } },
      ],
    },
    {
      type: "object", name: "shop", label: "Shop",
      fields: [
        { type: "string", name: "base", label: "Base URL (no trailing slash)" },
        { type: "string", name: "collectionsPath", label: "Collections path" },
      ],
    },
    {
      type: "object", name: "labels", label: "Shared labels (used on more than one page)",
      fields: [
        { type: "string", name: "at_studio", label: "Studio-event badge" },
        { type: "string", name: "directions", label: "Map link text" },
        { type: "string", name: "next_market", label: "Home page, label in front of the next market" },
        { type: "string", name: "next_up", label: "Badge on the next event card" },
        { type: "string", name: "dates_soon", label: "Shown when every listed date has passed" },
      ],
    },
    {
      type: "object", name: "footer", label: "Footer links (text only)",
      fields: [
        { type: "string", name: "retail", label: "Retail stores" },
        { type: "string", name: "faq", label: "FAQ" },
        { type: "string", name: "process", label: "Process" },
        { type: "string", name: "privacy", label: "Privacy" },
      ],
    },
    {
      type: "object", name: "socialmedia", label: "Social media links",
      fields: [
        {
          type: "object", name: "services", label: "Profiles",
          fields: [
            { type: "object", name: "instagram", label: "Instagram", fields: [{ type: "string", name: "url", label: "Profile URL" }] },
            { type: "object", name: "facebook", label: "Facebook", fields: [{ type: "string", name: "url", label: "Profile URL" }] },
          ],
        },
      ],
    },
  ],
};
```
`tina/collections/seo.ts`:
```ts
import type { Collection } from "tinacms";

export const seo: Collection = {
  name: "seo",
  label: "SEO",
  path: "src/views/_data",
  format: "json",
  match: { include: "seo" },
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { type: "string", name: "title", label: "Title" },
    { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
    { type: "string", name: "url", label: "Site URL (no trailing slash)" },
    { type: "string", name: "author", label: "Author" },
    { type: "image", name: "image", label: "Social share image" },
    {
      type: "object", name: "options", label: "Options",
      fields: [
        { type: "string", name: "titleDivider", label: "Title divider" },
        // Required for absolute share-image URLs; kept in the file, not shown.
        { type: "boolean", name: "imageWithBaseUrl", label: "Image with base URL", ui: { component: null } },
      ],
    },
  ],
};
```

- [ ] **Step 3: Endgültige Config**

`tina/config.ts` bekommt alle Importe und diese Reihenfolge:
```ts
  schema: {
    collections: [
      events, eventsPage,
      home, about, pottery, processPage,
      collectionsPage, gallery, features,
      retail, contact, faqPage, faq, privacy,
      global, seo,
    ],
  },
```
Run:
```bash
npm run typecheck
node -e "console.log(require('./tina/__generated__/_schema.json').collections.map(c=>c.name).join(','))"
```
Expected nach `Re-index complete`: `events,events_page,home,about,pottery,process,collections_page,gallery,features,retail,contact,faq_page,faq,privacy,global,seo`.

- [ ] **Step 4: Round-Trips über alle Collections**

```bash
for c in "events events.json" "events_page events.md" "home home.md" "about about.md" "pottery pottery.md" "process process.md" "collections_page collections.md" "gallery gallery.json" "features features.json" "retail retail-stores.md" "contact contact.md" "faq_page faq.md" "faq faq.json" "privacy privacy-statement.md" "global global.json" "seo seo.json"; do npm run tina:roundtrip --silent -- $c || echo "FEHLER: $c"; done
grep -c imageWithBaseUrl src/views/_data/seo.json
```
Expected: 16 Zeilen `ROUND-TRIP OK`, kein `FEHLER`, dann `1`.

Die Formatierungsänderungen dieses Durchlaufs sind die einmalige Tina-Normalisierung. Prüfen, dass inhaltlich nichts fehlt, und sie als eigenen Commit behalten:
```bash
git diff --stat src/views
W="$TMP/tina-scheiben"; rm -rf "$W/t12-norm"
node node_modules/@11ty/eleventy/cmd.cjs --output="$W/t12-norm" --quiet && node scripts/compare-html.mjs "$W/t12-before" "$W/t12-norm"
```
Expected: `IDENTISCH (11 Seiten)`.

- [ ] **Step 5: Commits**

```bash
git add src/views/_data/global.json tina/collections/global.ts tina/collections/seo.ts tina/config.ts tina/tina-lock.json
git commit -m "feat(cms): Global und SEO in Tina, ungenutzte Einstellungen entfernt

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git add src/views
git commit -m "chore(content): einmalige Formatierung durch Tina

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
Der zweite Commit entfällt, wenn `git status --short src/views` leer ist.

---

### Task 13: Vorschau und Übergabe

**Files:**
- Modify: `docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md`

- [ ] **Step 1: Tests und Build lokal**

Dev-Server mit `preview_stop` beenden. Run:
```bash
npm test
npm run typecheck
GITHUB_BRANCH=feat/tinacloud-migration npm run build 2>&1 | sed -E 's/[0-9a-f]{32,}/****/g' | tail -3
```
Expected: `# fail 0`, Typprüfung ohne Fehler, Build endet mit `Wrote 12 files`. `GITHUB_BRANCH` gilt nur lokal; die `.env` mit dem Token nie ausgeben.

- [ ] **Step 2: Push und Vorschau**

```bash
git push
```
Warten, bis `https://feat-tinacloud-migration--mf-pottery.netlify.app/admin-tina/index.html` mit 200 antwortet (Branch-Deploy dauert etwa zehn Minuten). Dann im Browser-Pane `/events.html` und `/` der Vorschau mit `https://matthewfreed.ca` vergleichen (`get_page_text`): gleiche Termine, gleiche Market-Karten.

- [ ] **Step 3: Befund und Übergabe**

In Abschnitt 9 ergänzen:
```markdown
- **Alle Collections (<Datum>):** 16 Collections in Tina, alle Round-Trips ohne Datenverlust, Seiten identisch. Vorschau gebaut in <Dauer>.
```
```bash
git add docs/superpowers/specs/2026-09-14-tinacloud-migration-design.md
git commit -m "docs(cms): Befunde nach allen Tina-Collections

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```
Dan bitten, sich auf der Vorschau einzuloggen und die Gate-Aufgaben aus dem Durchstich-Plan (Task 6) zu erledigen, mit Markets statt der alten Event-Liste: einen Termin zu einem Market hinzufügen, ein Event anlegen, einen alten Termin löschen, einen Abschnittstext auf About ändern. Bildtausch entfällt (Spec Abschnitt 9, Medien auf TinaCloud).
