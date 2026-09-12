# Datumsfilter aufräumen — Design

Datum: 2026-09-12
Status: Punkt 1 und 2 umgesetzt (Commit folgt), Punkt 3 offen
Branch: `feat/site-redesign-v2`
Auslöser: Commit `5fb9c13` ändert `filterFuture` auf die Enddatum-Regel und
lässt `filterPast` unangetastet zurück.

## Kontext

`filterFuture` prüfte `Startdatum > jetzt`. Seit `5fb9c13` prüft er
`letzter Tag >= heute 00:00`, damit eine mehrtägige Veranstaltung während
ihrer Laufzeit gelistet bleibt und ein Markt an seinem eigenen Tag nicht um
Mitternacht verschwindet. `filterPast` prüft weiter `Startdatum <= jetzt`.

Damit teilen die beiden Filter die Liste nicht mehr auf. Ein Termin, der
begonnen hat und noch läuft, liegt in beiden Mengen. Eine Lücke entsteht
nicht: wer nicht vergangen ist, hat auch seinen letzten Tag in der Zukunft.

Die Frage war, ob daraus drei Funktionen werden sollten — `past`, `future`
und `current`.

## Befunde

**Alle Aufrufstellen wollen dieselbe Menge.** Fünf Stellen rufen
`filterFuture` auf, keine davon will etwas anderes als "noch nicht vorbei":

| Aufrufstelle | Zweck |
|---|---|
| `src/views/_includes/partials/hero.njk:13` | nächster Termin für die Hero-Zeile |
| `src/views/_includes/partials/home-events.njk:12` | alle Karten der Band |
| `src/views/_includes/partials/home-events.njk:13` | Auswahl der ersten vier |
| `src/views/_includes/layouts/events-layout.njk:13` | Sonderveranstaltungen und Marktgruppen |
| `src/views/_includes/layouts/events-layout.njk:122` | Event-Schema für Suchmaschinen |

Eine Aufteilung in drei Filter ergäbe drei ungenutzte Funktionen, und für
die fünf Stellen bräuchte es zusätzlich die Vereinigung aus `current` und
`future`. Nunjucks hat keinen Filter, der zwei Listen zusammenfügt, also
müsste diese Vereinigung ohnehin als eigene Funktion existieren — genau
das, was `filterFuture` heute schon tut.

**`filterPast` hatte einen Abnehmer, der weggefallen ist.** Er speiste den
Abschnitt "Events archive" auf der alten Updates-Seite
(`{% set items = events.events | filterPast | sortByDate %}`). Commit
`a30763e` vom 2026-07-02 hat diese Seite durch die Events-Seite ersetzt und
das Archiv dabei entfernt. Ob absichtlich oder vergessen, geht aus dem
Verlauf nicht hervor.

**Fünf der zwölf registrierten Filter ruft kein Template auf:**
`filterPast`, `filterFeatured`, `hashtagURL`, `removeFirst`, `uuid`.

**Der Gedanke hinter `current` trifft trotzdem etwas Echtes**, nur nicht auf
Listenebene. Durch die Enddatum-Regel kann der erste Eintrag einer sein, der
schon läuft. Zwei Stellen zeigen dann ein vergangenes Startdatum unter einer
Zukunfts-Beschriftung. Geprüft gegen die Culture-Crawl-Daten von 2025
(20.–23.11.):

| Simuliertes Datum | Hero-Zeile |
|---|---|
| 19.11. | Next market: Thu 20 Nov, Eastside Culture Crawl |
| 21.11. | Next market: Thu 20 Nov, Eastside Culture Crawl — läuft, Tag 2 |
| 23.11. | Next market: Thu 20 Nov, Eastside Culture Crawl — letzter Tag |
| 24.11. | Next market: Sat 6 Dec, Riley Park Farmer's Market |

Die Bandkarte hat dasselbe Problem: sie zeigt nur den Starttag plus das
Abzeichen "Next up". Die Karte auf der Events-Seite ist unauffällig, weil
sie den Zeitraum als `20–23` rendert.

Das ist kein Randfall. Der Culture Crawl ist eine viertägige Studioöffnung,
jeden November, und der wichtigste Termin des Jahres. Die Einträge für 2026
fehlen noch, der letzte stammt von November 2025. Es fällt also auf, sobald
Matthew sie einträgt.

## Entscheidung

Keine drei Listen-Filter. Stattdessen:

1. **`filterFuture` umbenennen.** Der Name behauptet Zukunft, gemeint ist
   "noch nicht vorbei". Vorschlag: `filterUpcoming`. Fünf Aufrufstellen und
   der Kommentar in `.eleventy.js` wandern mit.
2. **Die fünf unbenutzten Filter löschen**, `filterPast` eingeschlossen.
   Eine Reparatur an Code, den niemand ausführt, ist Pflege ohne Nutzen und
   täuscht Geprüftheit vor.
3. **Offen — eine Prüfung pro Termin ergänzen**, ob er heute läuft, also
   `Startdatum <= heute <= letzter Tag`. Genau zwei Abnehmer: die Hero-Zeile
   und die Bandkarte. Dort steht dann "Happening now" statt "Next market"
   und der Zeitraum statt des Starttags.

Punkt 3 ist eine Funktionsänderung, nicht Aufräumen, und braucht einen
neuen Text in `global.labels` samt Feld in `src/admin/config.yml`. Er kann
auch später kommen, muss aber vor dem November stehen.

## Offen

- Soll das Event-Archiv zurückkehren? Dann wäre `filterPast` wieder nützlich
  und müsste das exakte Gegenstück werden, also `letzter Tag < heute`. Das
  ist eine Frage an Matthew, keine technische.

## Verifikation

- `npm run build` bleibt bei 0.
- Kein Treffer mehr auf die gelöschten Filternamen in `src/`.
- Die fünf umbenannten Aufrufstellen rendern unverändert: vier Karten auf
  der Startseite, vier auf der Events-Seite, sieben Einträge im Event-Schema.
