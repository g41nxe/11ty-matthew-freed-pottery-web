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
| Events | `events.json` hält zwei Listen (entschieden am 2026-09-15): `markets` (`name`, `location`, `time`, `gmaps`, `description`, `dates` als Liste von `MM-DD-YYYY`) und `events` (`name`, `date`, `end_date`, `time`, `location`, `gmaps`, `description`, `at_studio`). Ein Event mit `end_date` ist mehrtägig; `multi_day_event` und `content.title` entfallen. Begriffe siehe `CONTEXT.md`. Die Seite gruppiert nach Market statt nach Namensgleichheit. Ein Umwandlungsskript läuft bei der Umstellung erneut auf Matthews letztem Stand |
| News | `news.json` entfällt. Der eine Eintrag wird ein flaches Objekt `news` (`date`, `title`, `body`, `image {url, alt}`) im Frontmatter von `src/views/events.md`, `name` und die Hülle `content` fallen weg. Leerer `title` blendet den News-Teil aus. Umsetzung in der Scheibe „Events-Seite" (bestätigt am 2026-09-14) |
| FAQ | Die Fragen ziehen ins Frontmatter von `faq.md`, `faq.json` entfällt (2026-09-16) |
| Galerie, Features | `showcase.json` getrennt: `gallery.json` bleibt eigene Datei (Collections-Seite und Home lesen sie), die Shop-Artikel ziehen als `shop_items` ins Frontmatter von `home.md` (2026-09-16) |
| Admin-Pfad | Tina baut bis zur Umstellung nach `/admin-tina/`. Decap bleibt unverändert unter `/admin/` |
| Client-ID | Öffentlich, steht in `tina/config.ts`: `70c9fe54-ade8-4e7d-b8de-e44bc1d0f0bb`. `NEXT_PUBLIC_TINA_CLIENT_ID` hat Vorrang, falls gesetzt |
| Token | Nur `TINA_TOKEN` in der Umgebung: Netlify für alle Deploy-Kontexte, lokal optional in `.env` (ignoriert). Nie im Repo |
| Branch in Tina | Netlifys `HEAD`, sonst `GITHUB_BRANCH` (lokal), sonst `main` |
| Build | `clean → styles:prod → tina:build → eleventy`. Zusätzlich `build:site` ohne Tina für lokale Prüfungen ohne Token |
| Lokal | `tinacms dev -c "npm run eleventy:serve"` im lokalen Modus: kein Login, kein Token, liest und schreibt die Dateien auf der Platte |
| Medien | Im Repo: `publicFolder: "src"`, `mediaRoot: "images"`. Gespeichert wird `/images/…` wie heute. Die Ordner aus dem Bildumbau vom 2026-09-12 bleiben |
| Strukturfelder | `layout`, `permalink`, `tags`, `eleventyNavigation` werden nicht modelliert |
| Felder in Listen und Objekten | Jeder Schlüssel wird modelliert oder vorher bewusst gelöscht. Tina erhält undeklarierte Schlüssel nur auf oberster Ebene im Frontmatter |

## 4. Tote Schlüssel

Nicht im CMS, nirgends gerendert, gehen beim ersten Tina-Speichern verloren. Sie werden vorher in einem eigenen Commit gelöscht, damit der erste Tina-Commit nur die gewollte Änderung zeigt:

- `events.json`: `featured` (alle 23 Events) und `image` (2 Events), entfernt am 2026-09-14
- `global.json`: `hero` (Bild, Titel, Untertitel), `contact.name`, `socialmedia.title`, `socialmedia.services.*.name` und `socialmedia.services.*.icon`
- `showcase.json`: `gallery[].style`, `gallery[].cta`, `features[].cta.label`
- `faq.md`: `load_more`

Alle vier werden in Decap angezeigt, aber von keinem Template gelesen (geprüft am 2026-09-15). Sie kommen nicht ins Tina-Schema.

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
2. **Scheiben** (Plan `2026-09-15-tina-scheiben.md`, auf Dans Wunsch vor dem Tor): Markets und Events, Events-Seite samt News-Umzug, Pottery und Process, Home, Contact, Collections samt Galerie und Features, Händler, Datenschutz, FAQ, Global, SEO.
3. **Umstellung** (eigener Plan): Inhaltssperre, Umwandlungsskript für Events auf Matthews letztem `events.json` von `main` erneut ausführen, Tina nach `/admin/`, Content-Token für `main` (besser `*`), Medien-Upload auf TinaCloud prüfen, Matthew in TinaCloud einladen, Release mit vorher getaggtem Live-Stand.
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
- **Task 4:** About lokal in Tina bearbeitbar.
  - **Umsortieren** per Drag & Drop ändert inhaltlich nur die Reihenfolge; `layout`, `tags`, `permalink` und `eleventyNavigation` bleiben erhalten. Einmaliges YAML-Rauschen: Listen werden eingerückt, Anführungszeichen wechseln, `title` und `quote` rücken in Schema-Reihenfolge, lange Zeilen werden nicht mehr umbrochen. Mehrzeilige Texte bleiben `|`-Blöcke.
  - **Medienverwaltung:** zeigt alle Unterordner von `src/images` mit „New Folder" und „Upload". Ein Upload in der Medienverwaltung landet im geöffneten Ordner (`src/images/workshop/tina-test.jpg`), gespeichert wird `/images/workshop/tina-test.jpg`, und der `img`-Shortcode verarbeitet das neue Bild. Wird eine Datei dagegen direkt auf das Bildfeld gezogen, landet sie im Wurzelordner `src/images/`. Lokal lädt die Vorschau über den Bilder-Passthrough (`localhost:8080/images/…`); ein frisch hochgeladenes Bild zeigt dort bis zum nächsten Eleventy-Durchlauf kein Vorschaubild.
  - **Rich-Text:** außerhalb des Datei-Bodys als Markdown-Text gespeichert, nicht als AST. Rohes `<b>Think it</b>` erscheint im Editor als gesperrte Marke und bleibt beim Speichern wörtlich erhalten; der übrige Text bleibt Zeichen für Zeichen gleich. Entscheidung: `rich-text` für die Abschnittstexte.
  - **Nur lokal:** Tinas Index übernimmt Änderungen von außen (etwa `git checkout`) nicht immer. Vor dem nächsten Speichern `tina/config.ts` anfassen, sonst schreibt Tina den alten Stand zurück. Uploads in `src/images` lösen einen Eleventy-Neubau aus, der die Admin-Seite neu lädt.
- **Task 5, erster Anlauf (2026-09-14):** Netlify baut Branch-Deploys, `tina:build` scheitert nach fünf Sekunden mit `403 not authorized to access branch`.
  - **Falscher Branch:** Auf Netlify stand noch `GITHUB_BRANCH=feat/tinacms-migration` aus dem Selbsthosting-Versuch, und die Config bevorzugte diese Variable. Jetzt gilt `HEAD` zuerst.
  - **Altlasten in den Netlify-Variablen:** `GITHUB_BRANCH`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `MONGODB_URI`, `NEXTAUTH_SECRET`, `TINA_PUBLIC_IS_LOCAL`. Laut ADR 0001 entfallen sie; das GitHub-Token und der MongoDB-Zugang gehören widerrufen.
  - **Token-Branches:** Auch lokal mit richtigem Branch kam 403. Content-Tokens gelten nur für die Branches im Feld „Git branches"; für Deploy-Vorschauen braucht es `*`.
  - **Token im Klartext:** `tinacms build` gibt bei diesem Fehler das Token in der Konsole aus. Netlify maskiert es im Deploy-Log (`****`), lokal nicht.
  - **`NODE_ENV` ist auf Netlify gesetzt:** Abhängigkeiten, die der Build braucht, gehören in `dependencies` (siehe `cross-env`).
  - **Ursache des 403:** Das erste Content-Token galt nur für den Branch `tina`. TinaCloud prüft das Token pro Branch (`/db/<clientId>/status/<branch>` mit `X-API-KEY`). Ein neues Token für `feat/tinacloud-migration` liefert `200`, „indexing branch succeeded". Für die Umstellung braucht es ein Token, das `main` abdeckt, besser `*` für künftige Vorschauen; das alte Token wird gelöscht.
  - **Tina-Version zu neu für TinaCloud:** Mit gültigem Token scheiterte `tinacms build` an „Invalid version 3.0.0" beim Abruf des Schemas. `tinacms@3.14.0`, `@tinacms/cli@3.0.0` und `@tinacms/graphql@3.0.0` erschienen am 2026-09-14 um 05:46 UTC, TinaCloud nahm die Schnittstelle 3.0 am selben Tag noch nicht an. Zurück auf das Paar vom 2026-09-07: `tinacms` 3.13.0 und `@tinacms/cli` 2.7.0 exakt gepinnt, dazu `overrides` für `@tinacms/app` 2.5.13, `@tinacms/search` 1.2.24, `@tinacms/graphql` 2.4.11 und `@tinacms/mdx` 2.2.2, weil die CLI per `^` sonst die neuen Unterpakete zieht. `tina/tina-lock.json` neu erzeugt (Version 2.4.11); nur `tinacms dev` schreibt diese Datei. Hochziehen erst, wenn TinaCloud 3.0 unterstützt.
- **Task 5, Deploy-Vorschau steht (2026-09-14):** `https://feat-tinacloud-migration--mf-pottery.netlify.app` baut mit TinaCloud in knapp zehn Minuten nach dem Push; `/admin-tina/` und `/admin/` antworten, die Events-Seite ist mit der Live-Seite identisch. Login mit dem TinaCloud-Konto klappt, Datumsauswahl und Uhrzeit-Text funktionieren.
  - **Medien auf TinaCloud:** Der Media-Branch ist fest auf den Default-Branch `main` gesetzt und nicht wählbar. Solange `main` keine Tina-Config hat, meldet TinaCloud „Tina Media Not Configured", und die Medienverwaltung im Admin ist gesperrt. Uploads würden außerdem immer nach `main` committet, der Inhalt aber auf den Vorschau-Branch; der Vorschau-Build fände das Bild nicht. Entscheidung: Medien werden auf der Vorschau nicht getestet. Lokal ist die Medienverwaltung nachgewiesen (Task 4); auf TinaCloud prüft der Umstellungsplan einen Upload, sobald `tina/` auf `main` liegt. Beim Tor entfällt der Bildtausch.
- **Markets und Events (2026-09-15):** `events.json` in vier Markets mit 20 Terminen und drei Events umgewandelt. Die Events-Seite gruppiert über den Market-Schlüssel, `groupByVenue` entfällt. Alle elf Seiten sind identisch zum Stand davor, die strukturierten Daten bis auf die Reihenfolge.
- **Tina-Schema Markets und Events:** Markets zeigen Name, Ort, Zeit, Karte und Beschreibung einmal und die Termine als Liste mit Kalender je Eintrag (`ui.field` auf der String-Liste; `component: "list"` muss für TypeScript ausgeschrieben sein). Im Admin: „+" legt einen Eintrag mit „Pick a date" an, der gewählte Tag landet als `09-10-2026` am Ende der Liste. Round-Trip ohne Änderung, Änderung eines Felds betrifft nur dieses Feld.
  - **Dev-Server:** Ändern sich `.eleventy.js` und Templates zugleich, kann der laufende Eleventy-Watcher die Templates vor der neuen Config laden (`filter not found`). Dann den Dev-Server neu starten.
- **Events-Seite:** News als Objekt `news` im Frontmatter von `events.md`, `news.json` und der Filter `sortByDate` entfallen. Alle Seiten identisch zum Stand davor.
- **Galerie und Features:** `showcase.json` in `gallery.json` und `features.json` getrennt, tote Schlüssel `gallery[].style`, `gallery[].cta` und `features[].cta.label` entfernt. Alle Seiten identisch zum Stand davor.
- **Händler und Datenschutz:** Der Händler-Body (leer) funktioniert als `rich-text`. Beim Datenschutz scheiterte `rich-text` am Round-Trip: Der Editor schreibt beim ersten Speichern `  -` zu `*` um, entfernt Leerzeichen am Zeilenende und macht aus der nackten Cookie-URL einen Markdown-Link, sodass die Seite einen Link zeigt, wo bisher Text stand. Der Datenschutz-Body ist deshalb ein Markdown-Textfeld (`type: "string"`, `isBody: true`); Round-Trip und Seite danach identisch.
  - **Tina-Watcher:** Änderungen an Dateien unter `tina/collections/` übernimmt der Dev-Server nicht immer; `touch tina/config.ts` stößt den Neubau an.
- **Alle Collections (2026-09-15):** 16 Collections in Tina (Events mit Markets, Events-Seite, Home, About, Pottery, Process, Collections-Seite, Galerie, Features, Händler, Contact, FAQ-Seite, FAQ, Datenschutz, Site settings, SEO). Round-Trip über alle 16 ohne Datenverlust, `imageWithBaseUrl` bleibt erhalten. Die einmalige Tina-Formatierung ist ein eigener Commit; die veröffentlichten Seiten sind danach identisch. Die Vorschau stand gut drei Minuten nach dem Push, ihre Seiten sind identisch mit `matthewfreed.ca`. Lokaler Build gegen TinaCloud mit Schema-Prüfung erfolgreich.
  - **Dev-Server über lange Zeit:** `styles:watch` (PostCSS mit Tailwind im Watch-Modus) lief nach 1 h 42 min in einen Speicherüberlauf, und `npm-run-all` beendete alle Prozesse. Für lange Sitzungen den Dev-Server zwischendurch neu starten.
- **Seitenleiste entrümpelt (2026-09-16):** Tina 3.13 kann Collections in der Seitenleiste nicht gruppieren; die Konfiguration bietet dafür nichts, das Admin rendert eine flache Liste. Deshalb sind drei Dateien dorthin gezogen, wo ihr Inhalt erscheint: FAQ-Fragen nach `faq.md`, Shop-Artikel nach `home.md` (`shop_items`), SEO nach `global.json` (`seo`, gelesen von `.eleventy.js`). `gallery.json` bleibt eigenständig, weil zwei Seiten sie lesen. Aus 16 Einträgen werden 13: Events, Events-Seite, Home, About, Pottery, Process, Collections-Seite, Galerie, Händler, Contact, FAQ-Seite, Datenschutz, Site settings. Round-Trip über alle 13 in Ordnung, Seiten identisch.
