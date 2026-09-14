# Migration auf TinaCloud — Design

Datum: 2026-09-14
Status: Entwurf, Durchstich geplant
Branch: `feat/tinacloud-migration` (von `main` bei v2.0.3)
Ersetzt: `docs/superpowers/specs/2026-07-19-tinacms-migration-design.md` und den zugehörigen Plan, beide nur auf dem Archiv-Branch `feat/tinacms-migration`
Entscheidungen: ADR 0001 (TinaCloud statt Selbsthosting), ADR 0003 (Redesign zuerst, neuer Branch)

## 1. Ziel

Matthew pflegt die Seite künftig in TinaCMS statt in Decap. Inhalte bleiben JSON und Markdown im Repo, Eleventy liest sie weiter direkt von der Platte. Das veröffentlichte Design ändert sich nicht.

Gründe: Decaps Git Gateway ist abgekündigt, und verschachtelte Inhalte sind in Decap mühsam zu bearbeiten.

## 2. Was vom Juli-Stand bleibt und was nicht

Der Juli-Spec plante selbst gehostetes Tina mit MongoDB, Auth.js und einer Netlify-Funktion, dazu die Aufteilung von sechs Datenlisten in eine Datei pro Eintrag. Beides entfällt.

**Übernommen werden Erkenntnisse, kaum Code:**

- **GraphQL-Namen:** Collection-Namen nur mit Buchstaben, Ziffern und Unterstrich. `collection`, `collections`, `node`, `document` und `getOptimizedQuery` sind reserviert. Kein Feldname beginnt mit `__`.
- **Einzeldateien:** `path` ist der Ordner, die Datei wird über `match: { include: "<name ohne Endung>" }` gewählt, nie über einen vollen Dateipfad.
- **Frontmatter auf oberster Ebene bleibt erhalten**, auch wenn das Schema es nicht kennt. Nachgewiesen am 2026-07-19 mit `home.md`: `layout`, `permalink`, `eleventyNavigation` und alle anderen Blöcke überlebten ein Speichern. Harmloser Nebeneffekt: Das gespeicherte Feld wandert ans Ende, Werte mit Komma oder `https://` werden in einfache Anführungszeichen gesetzt, am Ende kommt eine Leerzeile dazu.
- **Typprüfung:** `tsc --noEmit` über `tina/**/*.ts`, weil `tinacms build` mit esbuild übersetzt und dabei keine Typen prüft.
- **Heap für den Build:** `NODE_OPTIONS=--max-old-space-size=4096` für `tinacms build`.

## 3. Festgelegte Entscheidungen

| Thema | Entscheidung |
|---|---|
| Betrieb | TinaCloud, kostenloser Tarif, zwei Nutzer: Dan und Matthew |
| Vorgehen | Vertikale Scheiben. Erst ein Durchstich mit Events und About, dann ein Tor, dann die übrigen Collections |
| Datenform | Keine Ordner-Collections, keine Datenbrücken. Jede Datei ist ein Tina-Dokument, Listen bleiben Listen in der Datei |
| Events | Bleibt `events.json`, ein Dokument mit der Liste aller Events (bestätigt am 2026-09-14) |
| News | `news.json` entfällt. Der eine Eintrag wird ein flaches Objekt `news` (`date`, `title`, `body`, `image {url, alt}`) im Frontmatter von `src/views/events.md`, `name` und die Hülle `content` fallen weg. Leerer `title` blendet den News-Teil aus. Umsetzung in der Scheibe „Events-Seite" (bestätigt am 2026-09-14) |
| FAQ | Bleibt `faq.json` |
| Galerie, Features | `showcase.json` wird in `gallery.json` und `features.json` getrennt, jede mit ihrer kompletten Liste. Eigene Scheibe nach dem Tor |
| Admin-Pfad | Tina baut bis zur Umstellung nach `/admin-tina/`. Decap bleibt unverändert unter `/admin/` |
| Client-ID | Öffentlich, steht in `tina/config.ts`: `70c9fe54-ade8-4e7d-b8de-e44bc1d0f0bb`. `NEXT_PUBLIC_TINA_CLIENT_ID` hat Vorrang, falls gesetzt |
| Token | Nur `TINA_TOKEN` in der Umgebung: Netlify für alle Deploy-Kontexte, lokal optional in `.env` (ignoriert). Nie im Repo |
| Branch in Tina | `GITHUB_BRANCH`, sonst Netlifys `HEAD`, sonst `main` |
| Build | `clean → styles:prod → tina:build → eleventy`. Zusätzlich `build:site` ohne Tina für lokale Prüfungen ohne Token |
| Lokal | `tinacms dev -c "npm run eleventy:serve"` im lokalen Modus: kein Login, kein Token, liest und schreibt die Dateien auf der Platte |
| Medien | Im Repo: `publicFolder: "src"`, `mediaRoot: "images"`. Gespeichert wird `/images/…` wie heute. Die Ordner aus dem Bildumbau vom 2026-09-12 bleiben |
| Strukturfelder | `layout`, `permalink`, `tags`, `eleventyNavigation` werden nicht modelliert |
| Felder in Listen und Objekten | Jeder Schlüssel wird modelliert oder vorher bewusst gelöscht. Tina erhält undeklarierte Schlüssel nur auf oberster Ebene im Frontmatter |

## 4. Tote Schlüssel

Nicht im CMS, nirgends gerendert, gehen beim ersten Tina-Speichern verloren. Sie werden vorher in einem eigenen Commit gelöscht, damit der erste Tina-Commit nur die gewollte Änderung zeigt:

- `events.json`: `featured` (alle 23 Events) und `image` (2 Events)

Die übrigen Dateien werden in ihrer jeweiligen Scheibe gegen das Schema abgeglichen.

## 5. Offene Punkte, die der Durchstich klärt

1. **Datum.** Tinas `datetime`-Feld speichert laut Doku einen ISO-Zeitstempel in UTC, umgerechnet aus der Ortszeit des Browsers. Alle Datumsfilter in `.eleventy.js` lesen heute nur `MM-dd-yyyy`.
   - **Variante A:** Datumsauswahl behalten. Ein toleranter `parseDate` liest beide Formate und rundet ISO-Werte auf die nächste UTC-Mitternacht. Ein in Vancouver gewählter Tag (07:00Z) und ein in Deutschland gewählter (22:00Z am Vortag) ergeben so denselben Kalendertag. Das trägt nur, wenn Tina beim Wählen die Ortszeit auf 00:00 setzt.
   - **Variante B:** Textfeld mit Prüfung auf `MM-DD-YYYY`. Keine Umrechnung, keine Filteränderung, aber keine Datumsauswahl.
   - **Messung:** Ein Tag wird im Browser mit Zeitzone `Europe/Berlin` und `America/Vancouver` gewählt, der gespeicherte Wert wird notiert. Setzt Tina 00:00 Ortszeit, gilt A, sonst B.
   - **Entschieden am 2026-09-14: Variante C.** Tinas Kalender (`component: "date"`, `dateFormat: "MM-DD-YYYY"`) auf einem Textfeld, mit `parse` und `format`, die nur den Kalendertag übergeben. Die Datei behält `MM-DD-YYYY`, die Filter bleiben unverändert. Messwerte in Abschnitt 9.
2. **Markdown-Texte.** Ob Tinas `rich-text` außerhalb des Datei-Bodys als Markdown-Text oder als AST-Objekt gespeichert wird, sagt die Doku nicht. `markdownify` braucht Text, und `process.md` enthält rohes `<b>`. Standard ist ein mehrzeiliges Textfeld mit Markdown. `rich-text` nur, wenn der Durchstich Markdown-Text mit erhaltenem HTML nachweist.
3. **Medienverwaltung.** Lassen sich die Unterordner von `src/images` durchsuchen, und landet ein Upload im gewählten Ordner?
4. **Build auf Netlify.** Läuft `tinacms build` ohne Speicherüberlauf, und findet TinaCloud den Branch?
5. **Bedienung.** Sind Events und About in Tina für Matthew klar besser als in Decap? Das ist das Tor.

## 6. Risiken für die Umstellung, nicht für den Durchstich

- **Jeder Deploy braucht TinaCloud.** `tinacms build` verlangt Netzzugriff auf TinaCloud. Die veröffentlichte Seite bleibt bei einem Ausfall erreichbar, neue Deploys scheitern aber. Ob der Build dann ohne Admin weiterlaufen soll, entscheidet der Umstellungsplan.
- **Deploy-Vorschauen fremder Branches.** Ob `tinacms build` auf einem Branch scheitert, den TinaCloud nicht indexiert hat (etwa Dependabot), ist ungeklärt.
- **Formatierungsrauschen.** Tina schreibt JSON und YAML in eigener Form. Beim ersten Speichern jeder Datei entsteht ein größerer Diff.
- **Zwei Nutzer sind die Obergrenze.** Ein dritter Bearbeiter kostet 24 Dollar im Monat.

## 7. Phasen

1. **Durchstich** (eigener Plan): Grundgerüst, Events, Datumsmessung, About mit Medien, Deploy-Vorschau, Tor.
2. **Scheiben** (Plan nach dem Tor): Home, Global, SEO, Galerie und Features samt Trennung, FAQ, Process, Pottery, Contact, Collections, Events-Seite samt News-Umzug, Händler, Datenschutz.
3. **Umstellung** (eigener Plan): Inhaltssperre, Tina nach `/admin/`, Matthew in TinaCloud einladen, Release mit vorher getaggtem Live-Stand.
4. **Aufräumen, als letzter Schritt:** Alle Überbleibsel früherer CMS entfernen. Bestand am 2026-09-14:
   - **Forestry:** `.forestry/` (`settings.yml` und zehn Frontmatter-Vorlagen)
   - **Decap:** `src/admin/` (`config.yml`, `custom-widgets.js`, `index.html`), die Passthrough-Zeile `src/admin` in `.eleventy.js`, die Skripte `cms` und `dev:cms` in `package.json`, der Eintrag `pottery-cms` in `.claude/launch.json`
   - **Netlify Identity:** das Widget-Skript und der `netlifyIdentity`-Block in `src/views/_includes/layouts/base.njk`. Dazu schaltet Dan im Netlify-Dashboard Identity und Git Gateway ab
   - **Bilder-Passthrough:** `src/images` nach `/images/` in `.eleventy.js` existiert laut Kommentar nur für Decaps Vorschaubilder und kopiert alle Originale ins Deployment. Entfällt, wenn Tinas Medienverwaltung ohne ihn Vorschaubilder zeigt. Das prüft der Aufräumplan
   - **`src/netlify.toml`:** wird nach `dist/` kopiert, dort von Netlify ignoriert, und setzt nur eine Python-Version aus der Forestry-Zeit. Datei und Passthrough-Zeile entfallen
   - **Alte Branches** auf GitHub (`feat/tinacms-migration`, `feat/sveltia-cms-migration`) und lokal (`decap`, `master`, `backup*`): Löschen nur nach Dans Bestätigung, vorher Archiv-Tags setzen

## 8. Zurückrollen

Bis zur Umstellung trivial: Decap unter `/admin/` bleibt unberührt, Tina liegt daneben. Nach der Umstellung ist nichts verlustbehaftet, weil die Datenform gleich bleibt. Ein Revert der Tina-Dateien und das Zurückholen von `src/admin` stellen Decap wieder her.

## 9. Befunde aus dem Durchstich

- **Task 1:** `featured` und `image` aus `events.json` entfernt (31 Zeilen, nur Löschungen). Kein Template liest sie, das gebaute HTML aller 11 Seiten ist vorher und nachher identisch.
- **Task 2:** Events lokal in Tina bearbeitbar. Die Liste zeigt 23 Einträge als „Aug 7, 2026 · Harmony Arts Festival". Ändern, Anlegen und Löschen funktionieren, ein Datum außerhalb von `MM-DD-YYYY` blockiert das Speichern. Das erste Speichern sortiert die Schlüssel jedes Events in Schema-Reihenfolge (74 Zeilen), fügt aber keine leeren Schlüssel hinzu; neue Events enthalten nur ausgefüllte Felder plus die Standardwerte `multi_day_event` und `atStudio`. Inhalt vorher und nachher mit `assert.deepStrictEqual` gleich, gebautes HTML identisch.
  - **Bedienung:** Das Löschen eines Listeneintrags fragt nicht nach. Bis zum Speichern holt „Reset" ihn zurück.
  - **Nur lokal:** Jedes Speichern löst einen Eleventy-Neubau von etwa einer Minute aus, danach lädt die Admin-Seite neu und springt zurück zur Liste.
  - **Abhängigkeiten:** `react` und `react-dom` auf 18.3.1 gepinnt, weil das in Tina gebündelte `react-final-form` React 19 nicht zulässt. `cross-env` steht in `dependencies`, weil `tina:build` es auf Netlify braucht. TypeScript 7 lädt `@types/node` nur mit `"types": ["node"]`.
  - **`clean`:** `rm -rf` lief in der Windows-Shell des Dev-Servers nicht und ist durch `fs.rmSync` ersetzt.
  - **Logzeile `Body must be a string`:** kommt von GET-Anfragen an `/graphql` ohne Query, hier von einem Bereitschafts-Check. Harmlos.
- **Task 3:** Datumsauswahl gemessen, jeweils der 10. gewählt.
  - **`datetime` mit `dateFormat: "MM-DD-YYYY"`:** Berlin ändern `2026-08-09T22:00:00.000Z`, neu `2026-09-10T17:00:46.172Z`. Vancouver ändern `2026-08-10T07:00:00.000Z`, neu `2026-09-10T17:07:09.144Z`. Beim Neuanlegen kommt die aktuelle Uhrzeit mit, daher träfe die Rundung auf UTC-Mitternacht nachmittags den Folgetag. Außerdem schreibt jedes Speichern alle anderen Datumswerte der Datei nach ISO um, in der Zeitzone von Tinas Server (lokal Berlin). Variante A fällt durch.
  - **Warum `dateFormat` allein nicht reicht:** `dateFormat` steuert nur die Anzeige. Das Widget ruft `input.onChange(value.toISOString())` auf, und Tinas GraphQL-Server wandelt jeden `datetime`-Wert beim Speichern mit `new Date(value)` um (`resolveDateInput` in `@tinacms/graphql`). `parse` auf einem `datetime`-Feld wird deshalb wieder zu ISO.
  - **Variante C, Kalender auf Textfeld:** Berlin und Vancouver speichern beim Ändern `08-10-2026` und beim Neuanlegen `09-10-2026`. Alle anderen Events bleiben unverändert (`assert.deepStrictEqual`), der Diff enthält nur die gewollten Zeilen. Übernommen, `parseDate` entfällt.
  - **Enddatum:** braucht `required: false` ausdrücklich, sonst setzt das Widget beim Leeren das heutige Datum. Ob das Leeren den Wert entfernt, prüft Task 5.
  - **Dev-Server:** Eine Änderung in `tina/` baut das Admin neu und indexiert neu (etwa eine Minute). Währenddessen lädt die Admin-Seite nicht.
