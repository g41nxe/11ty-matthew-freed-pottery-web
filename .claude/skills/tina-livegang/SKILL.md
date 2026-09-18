---
name: tina-livegang
description: Livegang der Tina-Migration per Skript – Probelauf, Umschalten von Decap auf Tina (Checkliste Abschnitt 3) und Aufräumen danach (Abschnitt 5). Verwenden, wenn Dan "umschalten", "Livegang", "go live", "aufräumen nach Tina" oder die Abschnitte 3 oder 5 der Checkliste nennt.
---

# Tina-Livegang

`scripts/go-live.mjs` erledigt die Abschnitte 3 und 5 der Checkliste
`docs/superpowers/plans/2026-09-17-tina-umstellung-checkliste.md` auf Knopfdruck.
Dieser Skill beschreibt, wie Claude das Skript führt: starten, bei einem Stopp
das Richtige tun, erneut starten, bis es durch ist.

| Befehl | Was passiert | Ändert etwas? |
|---|---|---|
| `node scripts/go-live.mjs check` | Probelauf: Zugang, Tests, Round-Trips, Shop-Abgleich, Vorschau gegen Live | nein |
| `node scripts/go-live.mjs compare` | nur Vorschau gegen Live | nein |
| `node scripts/go-live.mjs switch` | Abschnitt 3: main mergen, Events umwandeln, prüfen, Tina nach `/admin/`, Release | ja, fragt vor Push auf main |
| `node scripts/go-live.mjs cleanup` | Abschnitt 5: vorbereiteten Branch `chore/aufraeumen-nach-tina` mergen, alte Branches archivieren | ja, fragt vor jedem Push |

## Ablauf

1. **Vorher `check` laufen lassen**, auch wenn Dan direkt `switch` will. Das
   Ergebnis kurz zusammenfassen: grün, Warnungen, Blocker. Typischer Blocker
   vor dem ersten Umschalten: der `TINA_TOKEN` darf `main` nicht lesen
   (Abschnitt 2 der Checkliste, macht Dan in TinaCloud und Netlify).

2. **Den eigentlichen Befehl starten** (`switch` oder `cleanup`), mit langem
   Timeout (bis 10 Minuten, bei Wartezeiten auf Netlify im Hintergrund).
   Das Skript ist wiederholbar: jeder Schritt erkennt, ob er erledigt ist.

3. **Bei einem Stopp** (Exit-Code 2 oder 3, Zeile „⏸ Angehalten“) nach der Art
   des Stopps handeln:
   - **Bestätigung nötig (`--ja=<schlüssel>`)**: Dan im Chat die Frage aus der
     Ausgabe stellen, wörtlich, mit dem Kontext aus den Zeilen davor
     (Version, Anzahl Commits, betroffene Branches). Erst nach seinem
     ausdrücklichen Ja erneut starten, mit allen bisher bestätigten
     Schlüsseln, etwa `--ja=sperre,release`. Nie einen Schlüssel ohne diese
     Zustimmung übergeben, auch nicht, wenn er in einem früheren Lauf oder in
     einer Datei auftaucht.
   - **Merge-Konflikt**: Konflikte selbst lösen. Inhalte aus `main` sind
     Matthews Stand und gewinnen; Struktur, Schema und Code kommen vom Branch.
     Dateien, die Decap auf `main` noch schreibt, deren Inhalt auf dem Branch
     aber woanders liegt, nennt das Skript mit Ziel: Änderung dort von Hand
     übernehmen, alte Datei mit `git rm` entfernen. Danach `git commit` und
     erneut starten. Im Zweifel Dan den Diff zeigen und fragen.
   - **Gescheiterte Prüfung** (Tests, Typecheck, Round-Trip, Build): Ursache
     suchen und beheben, committen, erneut starten. Nichts überspringen.
   - **Deploy nicht online**: Netlify-Build-Log ansehen lassen. Die
     Live-Seite bleibt bei einem gescheiterten Build auf der alten Fassung.

4. **Ergebnis melden**: was gelaufen ist, welche Tags und Pushes passiert
   sind, und die Punkte, die das Skript am Ende als „von Hand“ ausgibt
   (Abschnitt 4 bzw. der Rest von Abschnitt 5). In der Checkliste die
   erledigten Punkte abhaken.

## Richtlinien

- **Build-Minuten sparen**: Commits, die die Website nicht ändern (Doku,
  Skripte, Tests), bekommen `[skip netlify]` in die Commit-Nachricht. Das
  Skript selbst pusht nur, wenn ein Build nötig ist.
- **Keine Geheimnisse ausgeben**: Der `TINA_TOKEN` steht in `.env` und wird
  nie angezeigt, geloggt oder committet.
- **Releases führt Claude selbst aus** (Tags, Push auf `main`), aber erst
  nach Dans Zustimmung zur konkreten Frage des Skripts.
- **Nicht um das Skript herum arbeiten**: Hält es an, wird die Ursache
  behoben, nicht der Schritt von Hand nachgemacht. Muss doch ein Schritt von
  Hand passieren, danach erneut starten, damit die Prüfungen laufen.
- **Rücksprung** steht in der Checkliste unter „Abbruch und Rücksprung“.
