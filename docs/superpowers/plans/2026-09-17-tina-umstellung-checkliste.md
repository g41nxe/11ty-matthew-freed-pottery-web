# Checkliste: Livegang der Tina-Migration

| | |
|---|---|
| Stand | 2026-09-18 |
| Branch | `feat/tinacloud-migration` |
| Vorschau | https://feat-tinacloud-migration--mf-pottery.netlify.app |
| Admin der Vorschau | `/admin-tina/` (Decap bleibt bis zur Umstellung unter `/admin/`) |
| Alle Shop-Sets auf einen Blick | `/preview-sets.html` |
| Anleitung für Matthew | https://claude.ai/artifact/874NMeYA5GWXKPkm7Ui88s (privat, vor dem Verschicken freigeben) |
| Umschalten und Aufräumen | `npm run go-live -- check`, `switch`, `cleanup` (Skill `tina-livegang`) |

**Legende:** `[x]` erledigt, `[ ]` offen. **D** = Dan, **M** = Matthew.

## Überblick

| # | Phase | Stand | Offen | Wer |
|---|---|---|---|---|
| 1 | Prüfung auf der Vorschau | technisch erledigt | Anleitung an Matthew, Inhalte gegenlesen | M, D |
| 2 | Zugang und Netlify | erledigt | – | D |
| 3 | Umschalten | per Skript vorbereitet | `go-live switch` | D |
| 4 | Direkt nach dem Umschalten | offen | Medien auf TinaCloud, Smoke-Test | D, M |
| 5 | Aufräumen | per Skript vorbereitet | `go-live cleanup`, Identity im Dashboard | D |
| 6 | Eine Woche danach | offen | Rückblick | D, M |

Abbruchkriterien und Rücksprung stehen am Ende. Gefundene Fehler, Hinweise für Matthew und Merksätze stehen in den Anhängen.

---

## 1. Prüfung auf der Vorschau

### 1.1 Anleitung für Matthew

Kein Bedienungstest: Matthew kommt mit CMS-Oberflächen zurecht. Er bekommt eine kurze Anleitung, die nur zeigt, was sich gegenüber Decap ändert (was wohin gewandert ist, Märkte und Events, Shop-Sets, Fotos, zwei Eigenheiten), mit Screenshots aus dem Admin.

- [x] **D** Anleitung geschrieben (Link oben)
- [ ] **D** Anleitung freigeben und Matthew schicken, zusammen mit der TinaCloud-Einladung (nach dem Umschalten, Abschnitt 4)

### 1.2 CMS technisch — erledigt

Am 2026-09-18 im Admin der Vorschau durchgetestet. Jede Speicherung wurde ein eigener Commit auf dem Branch und stand rund fünf Minuten später auf der Vorschau. Alle Testinhalte sind zurückgesetzt (`d187f8d`).

- [x] Round-Trip über alle 13 Collections: lesen, schreiben, Inhalt unverändert
- [x] Markets: Termin hinzugefügt und gelöscht, neuer Markt mit zwei Terminen
- [x] Events: einmalig, mehrtägig, „Im Studio", Löschen — nach Behebung von Fehler 1 (Anhang A)
- [x] Studio-News, Shop-Set umbenannt und versteckt, „+" bei vier Artikeln gesperrt
- [x] Rich-Text (About): der Commit enthält nur die geänderte Zeile
- [x] Je eine Änderung in Art, Process, Händler, Kontakt, FAQ, Collections, Datenschutz, Settings
- [x] Settings: Pfad des Teilen-Vorschaubilds bleibt beim Speichern erhalten — nach Behebung von Fehler 2
- [x] Galerie: Farbprüfung sperrt „Save" bei ungültigem Wert, „Reset" verwirft nach Rückfrage
- [x] Datumsauswahl speichert `MM-DD-YYYY`, Enddatum lässt sich leeren
- [x] Datenschutz: keine zusätzliche Leerzeile je Speichern (auch über TinaCloud)
- [x] Tina 3.14: Änderungen in einem Listeneintrag überleben das Zurücknavigieren
- [x] Uploads nur als JPEG, PNG, WebP (HEIC kann der Build nicht lesen)
- [x] Medienverwaltung **lokal**: Unterordner, Upload, Bild im Feld, Build
- [x] Alt-Text: Tina sperrt „Save", solange ein gewähltes Bild keinen hat; fehlt er trotzdem, nimmt der Build einen Standardtext und nennt die Seite im Log, statt abzubrechen (`14e170f`)

### 1.3 Website

- [x] Vorschau gegen Live: nur gewollte Abweichungen — Alt-Text des Yaletown-Galeriebilds, Abstand unter dem Medaillen-Hinweis und seit `0703a86` der neue Pfad des Teilen-Vorschaubilds auf jeder Seite
- [x] Keine toten Links: 13 interne Ziele, alle Bilddateien, 33 externe Links antworten mit 200
- [x] Weiterleitungen aus `src/_redirects` stichprobenartig: alle 301 aufs erwartete Ziel
- [x] Events-Logik: `npm test` mit 18 Tests grün; „Next market" auf der Startseite stimmt
- [x] Shop-Sets: Rotation wechselt beim Neuladen, nur das gezeigte Set lädt Bilder, ohne JavaScript erscheint das erste
- [x] About, Art, Process verlinken sich gegenseitig; Footer-Link „Everyday art"
- [x] Telefon (375 px): keine waagerechte Scrollleiste
- [x] Kontaktformular: nach dem Absenden erscheint Netlifys Dankesseite (eigene Seite für später: `docs/feature/0002-…`)
- [x] Teilen-Vorschaubild (`og:image`) lädt; alte Adresse leitet weiter
- [x] `sitemap.xml` ohne `/preview-sets.html`; die Vergleichsseite trägt `noindex`
- [ ] **D** Strukturierte Daten (JSON-LD) der Events-Seite im Rich-Results-Test von Google prüfen (search.google.com/test/rich-results, URL der Vorschau eingeben). Die Seite liefert 7 Einträge vom Typ `Event` mit Name, Datum und Ort; Warnungen zu fehlenden empfohlenen Feldern (Bild, Beschreibung, Veranstalter) sind kein Fehler
- [x] **D** `robots.txt` und Sitemap: **Fehler gefunden und behoben** — beide lasen noch `seo.url`, das seit der Migration `global.seo.url` heißt, und schrieben relative Adressen, die Google in einer Sitemap nicht annimmt. Lokal geprüft; kommt mit dem nächsten Vorschau-Build. `go-live compare` vergleicht beide jetzt mit Live
- [x] **D** Favicons: `favicon.ico`, `favicon.svg` und das Apple-Icon unter `/assets/` antworten. `/apple-touch-icon.png` ist 404, auch auf Live: die zweite Passthrough-Zeile mit derselben Quelle überschreibt die erste. Harmlos, der `<link>` im Kopf zeigt auf `/assets/`
- [x] **D** Service Worker: `/service-worker.js` ist der selbstabmeldende Worker, alte Installationen räumen sich weiter auf
- [x] **D** Startseite: 126 KB HTML mit allen Sets, komprimiert 12 KB; Bilder laden nur für das gezeigte Set. Unkritisch

### 1.4 Inhalte

- [x] Alle 24 Shop-Artikel: Preis gleich dem Shop, Link führt in den richtigen Artikel (2026-09-18)
- [x] Ausverkaufte Stücke: zwei getauscht, Strathcona versteckt, übrige tragen automatisch „Sold out"
- [ ] **M** Die Shop-Sets auf `/preview-sets.html` gegenlesen — Titel, Texte und Preise sind Entwürfe
- [x] **D** Täglicher Neubau fürs Sold-out-Label (es ist so frisch wie der letzte Build): vertagt, Ticket `docs/feature/0003-taeglicher-neubau-fuer-sold-out-label.md`
- [ ] **D** Preise und Verfügbarkeit kurz vor dem Livegang erneut prüfen: `npm run shop:check` schreibt `reports/shop-check.html` (Bild von Seite und Shop, Titel, Preis, Verfügbarkeit, Link). Läuft auch in `go-live check` und `switch` mit. Stand 2026-09-18: 24 Artikel, keine Preisabweichung, 9 ausverkauft

---

## 2. Zugang und Netlify

- [x] **D** Neues Content-Token in TinaCloud (2026-09-18): liest `main`, `feat/tinacloud-migration` und `chore/aufraeumen-nach-tina`, gilt also für alle Branches. `main` meldet „unknown“, bis dort mit dem Umschalten die Tina-Konfiguration ankommt
- [x] **D** `TINA_TOKEN` in Netlify und in der lokalen `.env` (Netlify-seitig bestätigt der nächste Build, spätestens beim Umschalten)
- [x] **D** Altes Token (nur `feat/tinacloud-migration`) löschen
- [x] **D** Alte Variablen löschen: `GITHUB_BRANCH`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `MONGODB_URI`, `NEXTAUTH_SECRET`, `TINA_PUBLIC_IS_LOCAL`
- [x] **D** Vorschau eines fremden Branches (z. B. Dependabot): das neue Token gilt für alle Branches, TinaCloud hat auch `chore/aufraeumen-nach-tina` indexiert
- [ ] **D** TinaCloud-Ausfall simulieren (falsches Token): nur der Deploy scheitert, die Live-Seite bleibt online
- [x] Netlify-Build des Branches grün, `tinacms build` ohne Speicherüberlauf

---

## 3. Umschalten — per Skript

Vorher `npm run go-live -- check` (Probelauf, ändert nichts), dann `npm run go-live -- switch`. Das Skript arbeitet die Schritte unten ab, erkennt erledigte Schritte und hält an bei Konflikten, gescheiterten Prüfungen und vor jedem Push auf `main`; weiter geht es mit `--ja=<schlüssel>` (Skill `tina-livegang`). Probelauf am 2026-09-18: alles grün bis auf den Token (Abschnitt 2).

1. [ ] **D** Inhaltssperre mit Matthew verabreden: ab jetzt nichts mehr in Decap speichern — *Skript fragt (`sperre`)*
2. [ ] **D** Branch auf den Stand von GitHub, dann **`main` in den Branch mergen**, nicht umgekehrt — *Skript*
3. [ ] **D** Konflikte lösen; Matthews Inhalte gewinnen, Struktur und Code vom Branch — *`events.json` übernimmt das Skript; Änderungen an `faq.json`, `news.json`, `seo.json`, `showcase.json` meldet es mit Ziel zum Übertragen von Hand*
4. [ ] **D** `events.json` in Märkte und Events umwandeln, Ergebnis ansehen — *Skript, listet Märkte und Termine*
5. [ ] **D** Prüfungen: `npm test`, Typecheck, Round-Trip aller 13 Collections, Shop-Abgleich — *Skript*
6. [ ] **D** Tina von `/admin-tina/` nach `/admin/`, Decaps `src/admin/` samt Passthrough weg, Weiterleitung `/admin-tina/*` — *Skript*
7. [ ] **D** Einmal pushen, Vorschau-Build abwarten (`/build.txt`), `/admin/` ist Tina, Vorschau gegen Live — *Skript*
8. [ ] **D** Live-Stand taggen, Branch nach `main` mergen, Release taggen, pushen — *Skript fragt (`release`)*
9. [ ] **D** Live-Deploy und TinaCloud-Indexierung von `main` abwarten, `/admin/` prüfen — *Skript*

---

## 4. Direkt nach dem Umschalten

Medien lassen sich erst jetzt testen: TinaClouds Media-Branch ist fest `main`.

- [ ] **D** Foto in einen Unterordner von `src/images` hochladen, in einem Bildfeld wählen, Build abwarten: Bild erscheint in allen Größen
- [ ] **D** Datei direkt aufs Bildfeld ziehen: landet in `src/images/` (Wurzel) — Matthew darauf hinweisen
- [ ] **D** Großes Foto (mehrere MB): Upload und Build gehen durch
- [ ] **D** HEIC vom iPhone wird abgelehnt
- [x] **D** Fehlender Alt-Text bricht den Build nicht mehr ab (siehe 1.2)
- [ ] **D** Matthew in TinaCloud einladen (zwei Nutzer sind frei, ein dritter kostet) und ihm die Anleitung schicken
- [ ] **M** Erste Speicherung auf `matthewfreed.ca/admin/`: eine Kleinigkeit, Änderung erscheint
- [ ] **M** Alte Decap-Lesezeichen und gespeicherte Logins entfernen

---

## 5. Aufräumen — per Skript

Die Code-Änderungen liegen fertig auf `chore/aufraeumen-nach-tina` (`930b177`, lokal gebaut: aus den Seiten fallen nur die Identity-Skripte, die Vergleichsseite ist weg). `npm run go-live -- cleanup` merged den Branch nach `main` (fragt vorher), wartet auf den Deploy und archiviert die alten Branches (fragt vorher). Von Hand bleiben Netlify Identity im Dashboard und die Analytics-Dateien.

- [ ] **D** `.forestry/` löschen — *im Branch*
- [ ] **D** Decap-Reste: Skripte `cms` und `dev:cms`, Eintrag `pottery-cms` in `.claude/launch.json` — *im Branch*
- [ ] **D** Netlify Identity: Widget und `netlifyIdentity`-Block aus `base.njk` — *im Branch*; im Dashboard Identity und Git Gateway abschalten — *von Hand*
- [ ] **D** `src/netlify.toml` (nur eine Python-Version aus der Forestry-Zeit) samt Passthrough entfernen — *im Branch*
- [ ] **D** Vergleichsseite entfernen: `preview-sets.njk`, `preview-sets.11tydata.js`, die `showAll`-Zweige in `current-firing.njk`, `src/_headers` — *im Branch*
- [x] **D** Passthrough `src/images` bleibt: das Teilen-Vorschaubild (`/images/share/…`) wird als Original ausgeliefert (Kommentar im Branch angepasst)
- [ ] **D** Alte Branches archivieren (Tag `archiv/<name>`) und löschen: `feat/tinacms-migration`, `feat/sveltia-cms-migration`, lokal `decap`, `master`, `backup*` — *Skript fragt (`branches`); Tags lokaler Branches bleiben lokal*
- [ ] **D** Analytics-Testdateien im Repo-Wurzelverzeichnis einsortieren oder löschen (`gc.html`, `matomo.*`, `umami*.html`, `u_*.js`, `plaus.html`, `sa.html`, `np.html`, `nfa.html`) — gehören nicht zur Migration

---

## 6. Eine Woche danach

- [ ] **D** Buildzeiten und TinaCloud-Kontingent ansehen
- [ ] **D** GitHub-Token und MongoDB-Zugang aus dem Selbsthosting-Versuch widerrufen (für den Livegang nicht nötig)
- [ ] **D, M** Pflegt Matthew wirklich selbst? Was hat ihn aufgehalten?

---

## Abbruch und Rücksprung

**Abbrechen, wenn:**
- Medien auf TinaCloud nach dem Merge nicht funktionieren (4)
- `tinacms build` auf Netlify nicht verlässlich grün ist

**Rücksprung:** Bis zum Umschalten trivial — Decap liegt unberührt unter `/admin/`, Tina daneben unter `/admin-tina/`. Danach: auf den getaggten Live-Stand zurück, `src/admin` wiederherstellen. Die Datenform bleibt gleich, es geht nichts verloren.

---

## Anhang A: Gefundene und behobene Fehler

| # | Fehler | Folge | Behebung | Commit |
|---|---|---|---|---|
| 1 | Neues Event zeigt das heutige Datum an, speichert es aber nicht | Events ohne Datum; der Netlify-Build brach ab | Neue Events starten mit dem heutigen Datum als Wert; leeres Datum sperrt „Save"; der Build überspringt Einträge ohne Datum | `b8a3a66`, `4ddaf86` |
| 2 | Tinas Bildfeld schreibt Pfade außerhalb des Medienordners um | Teilen-Vorschaubild zeigte ins Leere | Bild liegt unter `/images/share/`, alte Adresse leitet weiter | `0703a86` |
| 3 | Jedes Speichern des Datenschutzes fügte oben eine Leerzeile ein | Datei wuchs mit jedem Speichern | `beforeSubmit` entfernt führende Leerzeilen | `6e864fb` |
| 4 | Tina 3.13 verwarf ungespeicherte Änderungen in Listeneinträgen beim Zurücknavigieren | Datenverlust beim Bearbeiten | Update auf Tina 3.14 | `6e864fb` |
| 5 | `tina-lock.json` nach einer Schemaänderung nicht neu erzeugt | Netlify-Build brach mit „schema doesn't match" ab | Datei neu erzeugt (siehe Merksatz in Anhang C) | `a1303c4` |

## Anhang B: Hinweise für Matthews Einweisung

Was Matthew wissen muss, steht in seiner Anleitung (Link oben). Hier die vollständige Liste:

- **Status oben rechts:** In einem Listeneintrag, den er nicht geändert hat, ist der Punkt grün und „Save" grau, auch wenn im Dokument noch Ungespeichertes steckt. Erst eine Ebene höher wird es wieder rot — dort speichern.
- **Löschen fragt nicht nach**, und danach rutscht die Liste nach: der nächste Klick trifft leicht den falschen Eintrag. Ein Fehlklick auf „+" legt einen leeren Eintrag an. „Reset" holt beides zurück, solange nicht gespeichert ist.
- **Neue Einträge landen am Ende**, Markttermine also unsortiert. Die Website sortiert selbst.
- **Nach dem Speichern dauert es rund fünf Minuten**, bis die Änderung online ist.
- **Bilder:** besser über die Medienverwaltung in den passenden Ordner hochladen als direkt aufs Feld ziehen. Keine HEIC-Fotos. Alt-Text immer ausfüllen.

Mögliche Verbesserungen für später:
- Die Abschnitte auf About heißen beide „Matthew throwing a cup" (Beschriftung aus dem Alt-Text des Bildes).
- Die Rich-Text-Werkzeugleiste zeigt Tabelle, Code und Einbettung, die Matthew nicht braucht; Tina kann sie einschränken.

## Anhang C: Merksätze für Dan

- **Nach jeder Änderung am Tina-Schema** einmal `tinacms dev` laufen lassen und `tina/tina-lock.json` mit committen — sonst bricht der Netlify-Build ab.
- **Vorschau gegen Live vergleichen, nicht lokal gegen Live:** Netlify schreibt beim Deploy die Links um (`.html` weg, andere Attributreihenfolge), das erzeugt auf jeder Seite Unterschiede.
- **Jede Speicherung im Admin ist ein Commit** auf dem Branch, den das Admin bearbeitet. Vor eigenen Commits erst `git pull`.
- **Round-Trip über GraphQL umgeht `beforeSubmit`:** der Datenschutz bekommt dort weiter eine Leerzeile; der Round-Trip vergleicht den Body getrimmt.
- **Build-Minuten sparen:** Am 2026-09-18 war die Hälfte des Netlify-Kontingents (28.08.–28.09.) verbraucht. Commits, die die Website nicht ändern (Doku, Skripte, Tests), bekommen `[skip netlify]` in die Nachricht; Netlify baut dann nicht, sofern der Commit zuoberst im Push liegt.
- **`/build.txt`** zeigt den Commit, den Netlify zuletzt gebaut hat. Das Skript wartet darauf, statt ins Dashboard zu schauen.
