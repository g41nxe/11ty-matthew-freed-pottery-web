# Feature: Das Terminband füllt freie Plätze nicht

> **Status: offen.** Gefunden von Dan am 2026-11-25, nachdem Matthews vier Dezembertermine live gingen.

## Problemstellung (Problem Statement)

Das Terminband auf der Startseite hat vier Plätze. Im Kalender stehen gerade vier künftige Termine — zwei Märkte an je zwei Tagen. Sichtbar sind trotzdem nur zwei: Riley Park am 5. Dezember und Kitsilano am 6. Dezember. Der 19. und der 20. werden gebaut, tragen aber `hidden`.

Der Grund steht in `nextUp` (`.eleventy.js`): Der Filter sortiert nach Datum und behält je Name genau einen Eintrag, den frühesten. Das ist gewollt und richtig, solange viele Märkte um wenige Plätze konkurrieren — ein wöchentlicher Markt soll das Band nicht allein füllen. Es hört nur nicht auf, wenn nichts mehr zu entdoppeln ist: Bei zwei verschiedenen Namen bleiben zwei von vier Plätzen leer, obwohl zwei weitere Termine bereitstehen.

Das trifft genau die Lage, in der Matthew im Winter ist: wenige Märkte, dafür mehrere Termine je Markt. Die Startseite wirkt dann leerer als sein Kalender.

Dieselbe Auswahl läuft noch einmal im Browser (`events.js`), damit ein Termin, der seit dem Build vergangen ist, herausfällt und der nächste nachrückt. Eine Korrektur muss an beiden Stellen greifen, sonst zeigt die Seite nach dem ersten Nachrücken etwas anderes als nach dem Build.

## Lösung (Solution)

Erst wie bisher je Markt der nächste Termin, dann die freien Plätze mit den weiteren Terminen derselben Märkte auffüllen, wieder nach Datum. Bei vier Plätzen und zwei Märkten mit je zwei Terminen stehen damit alle vier im Band; kämen fünf Märkte dazu, bliebe es bei einem Termin je Markt.

## Nicht im Leistungsumfang (Out of Scope)

Die Zahl der Plätze und das Aussehen der Karten. Die Veranstaltungsseite selbst ist nicht betroffen: Dort stehen unter einem Markt ohnehin alle kommenden Termine.

## Weitere Anmerkungen (Further Notes)

Nachgestellt am 2026-11-25 am gebauten `dist/index.html`: vier Karten mit `data-date`, zwei davon ohne `hidden`.
