# 5. Runde und eckige Bildrahmen

Runde Ecken (`rounded-xl`) tragen Karten mit eigenem Rahmen und frei stehende redaktionelle Bilder. Eckig bleiben Warenbilder in Rastern, vollbreite Bänder und jedes Bild, das in einer runden Karte steckt.

## Kontext

Die Regel galt in der Praxis schon, stand aber nirgends. Eine Auszählung aller Bildrahmen am 2026-11-22 ergab:

| Fall | Ecken | Vorkommen |
|---|---|---|
| Karte mit Rahmen (weiß + Haarlinie) | rund | Collections-Karten, Event-Karten |
| Bild innerhalb so einer Karte | eckig | dieselben Karten |
| Frei stehendes redaktionelles Bild | rund | About, Process, Retail Stores, Karte auf Kontakt |
| Warenbild im Raster | eckig | „From the current firing", Glasur-Slider |
| Vollbreites Band | eckig | About-Band auf der Startseite |

Die Unterscheidung ist nicht zufällig: Rund gehört zum Erzählen, eckig zur Ware. Ein Besucher benennt das nicht, aber er liest es mit.

Beim Bau der Glasurseiten entstand trotzdem eine dritte Variante — rundes Bild ohne Rahmen, mit `bg-tile` statt der Glasurfarbe als Hintergrund. Nicht aus Missachtung der Regel, sondern weil sie nicht aufgeschrieben war. Auf der Glasurseite standen dadurch runde und eckige Bilder nebeneinander: die Shop-Kacheln aus „From the current firing" eckig, die neuen Glasurkacheln rund.

Erwogen und verworfen wurde, stattdessen die ganze Seite zu vereinheitlichen. Das wären sieben Dateien und jede Seite gewesen, mit einem Nutzen, den die Messung nie hätte zeigen können — und mitten in einem Versuch, dessen Wirkung wir in vier Wochen an Zahlen ablesen wollen. Zwei gleichzeitige Änderungen hätten dieses Ergebnis unlesbar gemacht.

## Entscheidung

- **Karten mit eigenem Rahmen sind rund.** Eine Karte ist ein Behälter mit Hintergrund oder Rahmen, der Bild und Text zusammenhält.
- **Frei stehende redaktionelle Bilder sind rund.** Gemeint sind Bilder in einer Textspalte, die für sich stehen.
- **Warenbilder in Rastern sind eckig**, ebenso Kacheln, die zu mehreren eine Reihe bilden.
- **Vollbreite Bänder sind eckig.** Ein Band läuft bis an den Rand des Abschnitts, eine Rundung würde dort auffallen wie ein Fehler.
- **Ein Bild in einer runden Karte bleibt eckig**, weil die Karte es ohnehin beschneidet.
- **Eine Glasurkachel ist eine Kachel, keine Karte**: eckig, mit der Glasurfarbe als Hintergrund hinter dem Bild (nicht `bg-tile`), darunter Farbpunkt, Name und Einzeiler. So sieht dieselbe Glasur im Slider der Startseite und unter „Other glazes" auf den Glasurseiten gleich aus.
- `rounded-full` bleibt davon unberührt: Es betrifft Farbpunkte und Buttons, nicht Bildrahmen.

## Konsequenzen

- **Die bestehenden Seiten ändern sich nicht.** Das ADR schreibt auf, was schon gilt; angepasst wurde nur die neue Glasurseite.
- **Zwei Sprachen statt einer.** Wer die Unterscheidung nicht kennt, hält sie für Unordnung. Das ist der Preis dafür, Erzählung und Ware auseinanderzuhalten, und der Grund, warum dieses Dokument existiert.
- **Die Grenzfälle sind nicht alle entschieden.** Ob ein Bild „redaktionell" oder „Ware" ist, entscheidet der Platz auf der Seite, nicht das Motiv. Im Zweifel gilt: steht es in einer Textspalte, ist es rund; steht es in einer Reihe mit seinesgleichen, ist es eckig.
- **Eine spätere Vereinheitlichung bleibt möglich.** Sie wäre eine eigene Entscheidung nach dem Pilot, mit einem Vorher-Nachher auf About und Retail Stores — nicht ein nebenbei geändertes Detail.
