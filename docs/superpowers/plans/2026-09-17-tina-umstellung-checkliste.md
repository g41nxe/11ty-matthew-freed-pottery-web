# Checkliste: Livegang der Tina-Migration

| | |
|---|---|
| Stand | 2026-09-18 |
| Branch | `feat/tinacloud-migration` |
| Vorschau | https://feat-tinacloud-migration--mf-pottery.netlify.app |
| Admin der Vorschau | `/admin-tina/` (Decap bleibt bis zur Umstellung unter `/admin/`) |
| Alle Shop-Sets auf einen Blick | `/preview-sets.html` |

**Legende:** `[x]` erledigt, `[ ]` offen. **D** = Dan, **M** = Matthew.

## Überblick

| # | Phase | Stand | Offen | Wer |
|---|---|---|---|---|
| 1 | Prüfung auf der Vorschau | technisch erledigt | Matthews Bedienungstest, Inhalte gegenlesen | M, D |
| 2 | Zugang und Netlify | offen | Token für `main`, alte Variablen, Einladung | D |
| 3 | Umschalten | offen | Merge, Admin-Umzug, Indexierung | D |
| 4 | Direkt nach dem Umschalten | offen | Medien auf TinaCloud, Smoke-Test | D, M |
| 5 | Aufräumen | offen | Decap, Forestry, Identity, Vergleichsseite | D |
| 6 | Eine Woche danach | offen | Rückblick | D, M |

Abbruchkriterien und Rücksprung stehen am Ende. Gefundene Fehler, Hinweise für Matthew und Merksätze stehen in den Anhängen.

---

## 1. Prüfung auf der Vorschau

### 1.1 Bedienung durch Matthew — das Tor

Matthew arbeitet selbst, Dan schaut zu und notiert, wo er hängen bleibt. Technisch ist alles schon durchgetestet (1.2); hier geht es um sein Urteil.

- [ ] **M** Login auf `/admin-tina/` mit seinem TinaCloud-Konto
- [ ] **M** Markets: Termin hinzufügen und entfernen, einen neuen Markt anlegen
- [ ] **M** Events: einmalig, mehrtägig, „Im Studio"; eines löschen
- [ ] **M** Studio-News ändern
- [ ] **M** Home: Shop-Set verstecken, Artikel **per Ziehen umsortieren** (automatisiert nicht prüfbar)
- [ ] **M** About, Art, Process: Text ändern, Abschnitte umsortieren
- [ ] **M** Die Namen in der Seitenleiste sind verständlich („Events · Markets and events", „About · Art page", „Settings")
- [ ] **M** Urteil: Ist Tina für ihn klar besser als Decap? **Wenn nein: hier stoppen.**

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

### 1.3 Website — fast erledigt

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
- [ ] **D** Strukturierte Daten (JSON-LD) der Events-Seite einmal im Rich-Results-Test prüfen
- [ ] **D** `robots.txt`, Favicons, Selbstabmeldung des Service Workers
- [ ] **D** Ladezeit der Startseite messen (HTML trägt alle Sets, etwa 134 KB unkomprimiert)

### 1.4 Inhalte

- [x] Alle 24 Shop-Artikel: Preis gleich dem Shop, Link führt in den richtigen Artikel (2026-09-18)
- [x] Ausverkaufte Stücke: zwei getauscht, Strathcona versteckt, übrige tragen automatisch „Sold out"
- [ ] **M** Die Shop-Sets auf `/preview-sets.html` gegenlesen — Titel, Texte und Preise sind Entwürfe
- [ ] **D** Entscheiden, ob das Sold-out-Label einen täglichen Neubau braucht (es ist so frisch wie der letzte Build)
- [ ] **D** Preise und Verfügbarkeit kurz vor dem Livegang erneut prüfen

---

## 2. Zugang und Netlify

- [ ] **D** Neues Content-Token in TinaCloud für `main`, besser `*` (sonst scheitern Vorschauen anderer Branches)
- [ ] **D** `TINA_TOKEN` in Netlify für alle Deploy-Kontexte
- [ ] **D** Altes Token (nur `feat/tinacloud-migration`) löschen
- [ ] **D** Alte Variablen löschen: `GITHUB_BRANCH`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `MONGODB_URI`, `NEXTAUTH_SECRET`, `TINA_PUBLIC_IS_LOCAL`
- [ ] **D** GitHub-Token und MongoDB-Zugang aus dem Selbsthosting-Versuch widerrufen
- [ ] **D** Matthew in TinaCloud einladen (zwei Nutzer sind frei, ein dritter kostet)
- [ ] **D** Vorschau eines fremden Branches (z. B. Dependabot): läuft `tinacms build`? Sonst Token auf `*` oder dort `build:site` ohne Tina
- [ ] **D** TinaCloud-Ausfall simulieren (falsches Token): nur der Deploy scheitert, die Live-Seite bleibt online
- [x] Netlify-Build des Branches grün, `tinacms build` ohne Speicherüberlauf

---

## 3. Umschalten — in dieser Reihenfolge

1. [ ] **D** Inhaltssperre mit Matthew verabreden: ab jetzt nichts mehr in Decap speichern
2. [ ] **D** **Zuerst `main` in den Branch mergen**, nicht umgekehrt: `git fetch origin && git merge origin/main` — Matthews Decap-Änderungen liegen auf `main`
3. [ ] **D** Konflikte lösen (erwartet in `events.json`, `home.md`, `global.json`, `events.md`); im Zweifel gewinnt Matthews Fassung
4. [ ] **D** `node scripts/events-to-markets.mjs` auf dem gemergten `events.json`, Diff prüfen
5. [ ] **D** Alle Prüfungen wiederholen: `npm test`, `npm run typecheck`, Round-Trip der betroffenen Collections, Vergleich Vorschau gegen Live, Netlify-Build grün
6. [ ] **D** Tina von `/admin-tina/` nach `/admin/` umziehen: `outputFolder` auf `admin`, dafür Decaps `src/admin/` samt Passthrough entfernen
7. [ ] **D** Live-Stand taggen (Release-Prozess), damit ein Rücksprung möglich ist
8. [ ] **D** Branch nach `main` mergen und pushen
9. [ ] **D** TinaCloud-Indexierung von `main` abwarten und prüfen

---

## 4. Direkt nach dem Umschalten

Medien lassen sich erst jetzt testen: TinaClouds Media-Branch ist fest `main`.

- [ ] **D** Foto in einen Unterordner von `src/images` hochladen, in einem Bildfeld wählen, Build abwarten: Bild erscheint in allen Größen
- [ ] **D** Datei direkt aufs Bildfeld ziehen: landet in `src/images/` (Wurzel) — Matthew darauf hinweisen
- [ ] **D** Großes Foto (mehrere MB): Upload und Build gehen durch
- [ ] **D** HEIC vom iPhone wird abgelehnt
- [ ] **D** Fehlender Alt-Text: Build bricht mit `Missing alt on image` — ist die Meldung im Netlify-Log verständlich?
- [ ] **M** Smoke-Test auf `matthewfreed.ca`: `/admin/` öffnet Tina, eine Kleinigkeit speichern, Änderung erscheint
- [ ] **M** Alte Decap-Lesezeichen und gespeicherte Logins entfernen

---

## 5. Aufräumen (eigener Commit)

- [ ] **D** `.forestry/` löschen
- [ ] **D** Decap-Reste (nach dem Umzug in 3.6): Skripte `cms` und `dev:cms`, Eintrag `pottery-cms` in `.claude/launch.json`
- [ ] **D** Netlify Identity: Widget und `netlifyIdentity`-Block aus `base.njk`; im Dashboard Identity und Git Gateway abschalten
- [ ] **D** `src/netlify.toml` (nur eine Python-Version aus der Forestry-Zeit) samt Passthrough entfernen
- [ ] **D** Vergleichsseite entfernen: `preview-sets.njk`, `preview-sets.11tydata.js`, die `showAll`-Zweige in `current-firing.njk`, der Eintrag in `src/_headers`
- [ ] **D** Passthrough `src/images` **nicht** ersatzlos streichen: das Teilen-Vorschaubild (`/images/share/…`) wird als Original ausgeliefert
- [ ] **D** Alte Branches archivieren (Tag) und löschen: `feat/tinacms-migration`, `feat/sveltia-cms-migration`, lokal `decap`, `master`, `backup*`
- [ ] **D** Analytics-Testdateien im Repo-Wurzelverzeichnis einsortieren oder löschen (`gc.html`, `matomo.*`, `umami*.html`, `u_*.js`, `plaus.html`, `sa.html`, `np.html`, `nfa.html`) — gehören nicht zur Migration

---

## 6. Eine Woche danach

- [ ] **D** Buildzeiten und TinaCloud-Kontingent ansehen
- [ ] **D, M** Pflegt Matthew wirklich selbst? Was hat ihn aufgehalten?

---

## Abbruch und Rücksprung

**Abbrechen, wenn:**
- Matthew in Tina nicht zurechtkommt (1.1)
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
