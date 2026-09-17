# Checkliste vor dem Livegang der Tina-Migration

Stand 2026-09-17, Branch `feat/tinacloud-migration`, Vorschau
`https://feat-tinacloud-migration--mf-pottery.netlify.app`.

Reihenfolge: Abschnitt 1 bis 4 auf der Vorschau, dann die Umstellung
(Abschnitt 5 bis 7), danach Abschnitt 8 auf der Live-Seite. Abschnitt 9 sagt,
wann abgebrochen wird.

## 0. Schon geprüft, nicht noch einmal nötig

- Round-Trip über alle 13 Collections: lesen, schreiben, Inhalt unverändert.
- Gebautes HTML identisch zur Live-Seite, außer den gewollten Änderungen
  (About-Karten, Footer-Link „Everyday art", Shop-Sets).
- Datumsauswahl speichert `MM-DD-YYYY`, Enddatum lässt sich leeren.
- Rich-Text behält rohes HTML; Datenschutz-Body ist ein Markdown-Textfeld.
- Tina 3.14: Änderung in einem Listeneintrag überlebt das Zurücknavigieren.
- Datenschutz-Body wächst nicht mehr um eine Leerzeile je Speichern.
- Zufallswechsel: sechs Sets, nur das gezeigte lädt Bilder, ohne JavaScript
  erscheint das erste Set.
- Medienverwaltung **lokal**: Unterordner, Upload, Bild im Feld, Build.

## 1. Das Tor: Matthew bedient Tina (Vorschau)

Matthew macht das selbst, Dan schaut zu und notiert, wo er hängen bleibt.

- [ ] Login auf `/admin-tina/` mit seinem TinaCloud-Konto.
- [ ] **Markets:** einen Termin zu einem bestehenden Markt hinzufügen, einen
      entfernen, speichern. Danach: steht der neue Termin auf der Events-Seite
      und im Band der Startseite?
- [ ] **Markets:** einen ganzen Markt neu anlegen (Name, Ort, Zeit, Karte,
      Beschreibung, zwei Termine).
- [ ] **Events:** ein einmaliges Event anlegen, ein mehrtägiges mit Enddatum,
      eines mit „Im Studio". Eines wieder löschen.
- [ ] **Events-Seite:** Studio-News ändern; Titel leeren und prüfen, dass der
      News-Kasten verschwindet.
- [ ] **Home:** ein Shop-Set verstecken, ein Set umbenennen, einen Artikel
      austauschen, die Artikel per Drag & Drop umsortieren. „+" ist bei vier
      Artikeln aus.
- [ ] **About, Art, Process:** Text ändern, Abschnitte umsortieren, ein Bild
      austauschen.
- [ ] **FAQ, Kontakt, Händler, Datenschutz, Collections, Galerie, Settings:**
      je eine Kleinigkeit ändern und speichern.
- [ ] Nach jedem Speichern: Netlify baut, die Änderung steht auf der Vorschau.
      Dauer notieren (bisher etwa drei bis zehn Minuten).
- [ ] Namen in der Seitenleiste sind für Matthew verständlich („Events ·
      Markets and events", „About · Art page", „Settings").
- [ ] Urteil: ist das für ihn klar besser als Decap? Wenn nein, hier stoppen.

## 2. Medien auf TinaCloud

Geht erst, wenn `tina/` auf `main` liegt: der Media-Branch ist fest der
Default-Branch. Vorher meldet TinaCloud „Tina Media Not Configured".

- [ ] Upload eines Fotos in der Medienverwaltung, in einem Unterordner von
      `src/images`.
- [ ] Das hochgeladene Bild in einem Bildfeld auswählen, speichern, Build
      abwarten: Bild erscheint in allen Größen (`eleventy-img`).
- [ ] Datei direkt auf ein Bildfeld ziehen: landet im Wurzelordner
      `src/images/` — Matthew darauf hinweisen.
- [ ] Nur JPEG, PNG, WebP werden angeboten; ein HEIC vom iPhone lässt sich
      nicht hochladen (sharp kann es nicht lesen, der Build würde brechen).
- [ ] Ein großes Foto (mehrere MB) hochladen: Upload und Build gehen durch.
- [ ] Alt-Text ist Pflichtfeld-Gewohnheit: fehlt er, bricht der Build
      (`Missing alt on image from: …`). Einmal bewusst auslösen und schauen,
      ob die Fehlermeldung im Netlify-Log verständlich ist.

## 3. Token, Zugriff, Netlify-Variablen

- [ ] Neues Content-Token in TinaCloud, das `main` abdeckt — besser `*`, sonst
      scheitern Deploy-Vorschauen anderer Branches.
- [ ] `TINA_TOKEN` in Netlify für alle Deploy-Kontexte gesetzt.
- [ ] Altes Token (nur `feat/tinacloud-migration`) löschen.
- [ ] Alte Variablen aus dem Selbsthosting-Versuch entfernen: `GITHUB_BRANCH`,
      `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_PERSONAL_ACCESS_TOKEN`,
      `MONGODB_URI`, `NEXTAUTH_SECRET`, `TINA_PUBLIC_IS_LOCAL`.
      GitHub-Token und MongoDB-Zugang widerrufen.
- [ ] Zwei Nutzer in TinaCloud (Dan, Matthew) — ein dritter kostet.
- [ ] Matthew ist eingeladen und kommt rein, ohne dass Dan danebensitzt.

## 4. Build und Deploy

- [ ] `npm run build` lokal grün (mit Token in `.env`).
- [ ] Netlify-Build des Branches grün, `tinacms build` ohne Speicherüberlauf.
- [ ] **Nach jeder Schemaänderung** einmal `tinacms dev` laufen lassen, damit
      `tina/tina-lock.json` neu geschrieben wird — sonst bricht der Build mit
      „The local Tina schema doesn't match the remote Tina schema".
- [ ] Deploy-Vorschau eines fremden Branches (zum Beispiel Dependabot):
      scheitert `tinacms build` dort? Wenn ja: entweder Token auf `*` oder
      für solche Branches `build:site` ohne Tina.
- [ ] TinaCloud-Ausfall: bewusst mit falschem Token bauen und sehen, dass nur
      der Deploy scheitert, die Live-Seite aber online bleibt.

## 5. Inhalt vor dem Livegang

- [ ] **Shop-Sets:** Matthew liest die sechs Sets auf
      `/preview-sets.html` gegen. Titel, Beschreibungen und Preise sind meine
      Entwürfe aus den Shop-Texten.
- [ ] **Ausverkaufte Artikel** ersetzen oder die betroffenen Sets verstecken:
      Yaletown Teekanne und Serviertablett, drei der vier Ölflaschen
      (nur Tree of Life ist da), beide Strathcona-Platten und die
      Strathcona-Essschale.
- [ ] Preise gegen den Shop prüfen, sie stehen fest im CMS.
- [ ] Jeder Artikel-Link führt in den richtigen Shop-Artikel (die Handles sind
      teils irreführend, etwa `copy-large-teapot-tofino` für die
      Yaletown-Kanne).
- [ ] **Events:** erst `main` in den Branch mergen (Abschnitt 7), dann
      `events.json` auf Matthews letztem Stand erneut
      durch `node scripts/events-to-markets.mjs` schicken (das Skript ist
      idempotent), Diff prüfen, `npm test` grün.
- [ ] Inhaltssperre: ab dem Umwandlungsskript bis zum Livegang niemand mehr in
      Decap arbeiten.

## 6. Regression der Website (Vorschau gegen Live)

- [ ] `node scripts/compare-html.mjs <live-build> <vorschau-build>`: nur die
      gewollten Abweichungen.
- [ ] **Events-Logik:** vergangene Termine fallen raus, „Nächster Markt" und
      „Next up" stimmen, mehrtägige Events bleiben bis zum Enddatum stehen,
      strukturierte Daten (JSON-LD) sind vollständig.
- [ ] **Startseite:** Rotation wechselt beim Neuladen, kein Springen beim
      Laden, Seite ohne JavaScript zeigt das erste Set.
- [ ] **About, Art, Process:** Karten am Seitenende verlinken die jeweils
      anderen beiden, Footer-Link „Everyday art" führt auf die Art-Seite.
- [ ] **Telefon (375 px):** keine waagerechte Scrollleiste, Karten stapeln.
- [ ] **Kontaktformular** absenden: Netlify Forms mit reCAPTCHA, Ziel
      `/success` — diese Seite liegt nicht im Repo, also prüfen, was nach dem
      Absenden erscheint und ob die Nachricht in Netlify ankommt.
- [ ] **Weiterleitungen** aus `src/_redirects` stichprobenartig: `/home/bio`,
      `/updates`, `/shop`, `/about/retail-stores`.
- [ ] `sitemap.xml` (ohne `/preview-sets.html`), `robots.txt`, Favicons,
      Service Worker meldet sich weiterhin selbst ab.
- [ ] SEO: Titel, Beschreibung und Share-Bild kommen aus `global.json`
      (`seo`), Open-Graph-Bild lädt.
- [ ] Ladezeit der Startseite messen (das HTML trägt jetzt alle sechs Sets,
      etwa 134 KB unkomprimiert).

## 7. Die Umstellung selbst

- [ ] **Zuerst `main` in den Branch mergen,** nicht umgekehrt: Matthew pflegt
      bis zur Inhaltssperre in Decap weiter, und diese Commits landen auf
      `main`. `git fetch origin && git merge origin/main`.
      Am 2026-09-17 war `main` ohne eigene Commits, der Branch 35 voraus —
      das ändert sich mit jeder Änderung, die Matthew noch speichert.
- [ ] Konflikte erwartungsgemäß in den Inhaltsdateien: `_data/events.json`,
      `home.md`, `_data/global.json`, `events.md`. Im Zweifel gewinnt
      Matthews Fassung von `main`, die Tina-Struktur wird darauf neu
      angewandt (Abschnitt 5, Umwandlungsskript).
- [ ] Nach dem Merge alle Prüfungen wiederholen: `npm test`, `npm run
      typecheck`, Round-Trip über die betroffenen Collections, HTML-Vergleich,
      Netlify-Build grün.
- [ ] Live-Stand vorher taggen (Release-Prozess), damit ein Rücksprung möglich
      ist.
- [ ] Branch nach `main` mergen.
- [ ] Tina zieht von `/admin-tina/` nach `/admin/`, Decap weicht.
- [ ] TinaCloud indexiert `main` — Status prüfen, bevor Matthew loslegt.
- [ ] Medientest aus Abschnitt 2 jetzt nachholen.
- [ ] Rollback-Probe auf einem Testbranch: Revert der Tina-Commits plus
      `src/admin` zurück ergibt wieder ein funktionierendes Decap.

## 8. Aufräumen (eigener Commit nach dem Livegang)

- [ ] `.forestry/` löschen.
- [ ] `src/admin/` löschen, Passthrough-Zeile `src/admin` in `.eleventy.js`,
      Skripte `cms` und `dev:cms`, Eintrag `pottery-cms` in
      `.claude/launch.json`.
- [ ] Netlify-Identity-Widget und den `netlifyIdentity`-Block aus
      `base.njk`; im Netlify-Dashboard Identity und Git Gateway abschalten.
- [ ] Bilder-Passthrough `src/images` prüfen: brauchte nur Decaps Vorschau.
- [ ] `src/netlify.toml` (setzt nur eine Python-Version aus der
      Forestry-Zeit) samt Passthrough entfernen.
- [ ] Vergleichsseite entfernen: `src/views/preview-sets.njk`,
      `preview-sets.11tydata.js`, die `showAll`-Zweige in
      `current-firing.njk` und das `noindex`-Flag in `base.njk`.
- [ ] Alte Branches archivieren und löschen: `feat/tinacms-migration`,
      `feat/sveltia-cms-migration`, lokal `decap`, `master`, `backup*`.
- [ ] Ungeklärte Dateien im Repo-Wurzelverzeichnis (`gc.html`, `matomo.*`,
      `umami*.html`, `u_*.js`, `plaus.html`, `sa.html`, `np.html`, `nfa.html`)
      einsortieren oder löschen — sie gehören zum Analytics-Vergleich, nicht
      zur Migration.

## 9. Nach dem Livegang

- [ ] Smoke-Test auf `matthewfreed.ca`: `/admin/` öffnet Tina, Matthew
      speichert eine Kleinigkeit, Deploy läuft, Änderung ist sichtbar.
- [ ] Alte `/admin/`-Lesezeichen und gespeicherte Decap-Logins bei Matthew
      aufräumen.
- [ ] Eine Woche später: Buildzeiten, TinaCloud-Kontingent und ob Matthew
      wirklich selbst pflegt.

## Abbruchkriterien

- Matthew kommt in Tina nicht zurecht (Abschnitt 1).
- Medien auf TinaCloud funktionieren nach dem Merge nicht (Abschnitt 2).
- `tinacms build` ist auf Netlify nicht verlässlich grün (Abschnitt 4).

Bis zur Umstellung ist der Rücksprung trivial: Decap liegt unberührt unter
`/admin/`, Tina daneben unter `/admin-tina/`.
