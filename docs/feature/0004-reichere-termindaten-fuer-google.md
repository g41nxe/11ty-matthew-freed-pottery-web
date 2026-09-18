# Feature: Reichere Termindaten für Google

> **Status: für später, nicht Teil der Tina-Migration.** Die Termindaten der Events-Seite sind gültig (Rich-Results-Test von Google am 2026-09-18: 7 gültige Elemente, keine Fehler). Dieses Dokument hält fest, was sie vollständiger machen würde.

## Problemstellung (Problem Statement)

Die Events-Seite beschreibt jeden kommenden Termin zusätzlich maschinenlesbar für Suchmaschinen: Name, Datum und Ort, je Markt-Termin und je Event. Google erkennt sie als gültig und kann sie in der Suche als Termine zeigen. Zu jedem Termin meldet der Test aber sechs fehlende, empfohlene Angaben. Ohne sie fällt der Eintrag in der Suche schlichter aus: kein Bild, kein Satz dazu, kein ausdrücklicher Hinweis, dass der Termin stattfindet.

Drei dieser Angaben liegen schon vor oder sind eindeutig:

- Jeder Markt und jedes Event hat im CMS ein Feld „Description", das auf der Seite erscheint, in den Termindaten aber fehlt.
- Ein Termin auf der Seite findet statt; abgesagte Termine löscht Matthew.
- Für ein Bild gibt es das globale Teilen-Vorschaubild.

Dazu kommt ein Fehler, den der Test nicht bemängelt: Als Adresse steht dort das Feld „Location on Google Maps". Bei manchen Einträgen ist das keine Adresse, sondern ein Kartenlink, etwa beim Bespoke Summer Night Market. Suchmaschinen bekommen dann eine URL als Adresse.

## Lösung (Solution)

Die Termindaten tragen zusätzlich die Beschreibung aus dem CMS, den Status „findet statt" und ein Bild. Als Adresse dient das Kartenfeld nur, wenn es eine Adresse ist; ein Kartenlink wird durch den Ortsnamen ersetzt. Matthew muss dafür nichts Neues pflegen, und im CMS kommt kein Feld dazu.

## User Stories

1. Als jemand, der bei Google nach „farmers market Vancouver pottery" sucht, möchte ich zu Matthews Termin einen kurzen Satz sehen, um zu wissen, was mich dort erwartet.
2. Als Suchender möchte ich neben dem Termin ein Foto sehen, um Matthews Stand wiederzuerkennen.
3. Als Suchender möchte ich eine echte Adresse sehen und keinen Kartenlink, um den Ort einschätzen zu können.
4. Als Matthew möchte ich, dass die Beschreibung, die ich im CMS für einen Markt eintrage, auch in der Suche erscheint, um sie nicht zweimal pflegen zu müssen.
5. Als Matthew möchte ich für die Suche kein zusätzliches Feld ausfüllen müssen, um meine Pflege nicht zu vergrößern.
6. Als Matthew möchte ich, dass ein Termin ohne Beschreibung trotzdem gültig bleibt, um nicht jedes Feld füllen zu müssen.
7. Als Matthew möchte ich im Kartenfeld weiter einen Link einfügen dürfen, um mir das Abtippen der Adresse zu sparen.
8. Als Dan möchte ich, dass der Rich-Results-Test danach weniger Hinweise meldet und weiterhin keine Fehler, um die Verbesserung belegen zu können.
9. Als Dan möchte ich, dass keine Angabe geraten wird (Veranstalter, Eintritt, Mitwirkende), um Google nichts Falsches mitzuteilen.
10. Als Dan möchte ich, dass sich an der sichtbaren Events-Seite nichts ändert, um keinen Vergleich Vorschau gegen Live zu stören.
11. Als Dan möchte ich die Termindaten in einem Test prüfen können, ohne die ganze Seite zu bauen, um Fehler früh zu sehen.

## Implementierungs-Entscheidungen (Implementation Decisions)

- **description:** die Beschreibung des Markts bzw. Events aus dem CMS, ohne Markup. Fehlt sie, entfällt die Angabe.
- **eventStatus:** fest „EventScheduled". Abgesagte Termine gibt es auf der Seite nicht.
- **image:** das globale Teilen-Vorschaubild aus den Settings, als absolute Adresse. Passt zu ADR 0002 (nur globale SEO-Angaben): kein Bildfeld je Markt oder Event. Ein Foto je Glasur oder je Markt wäre ein eigenes Feature.
- **Adresse:** Ist das Kartenfeld eine URL, wird stattdessen der Ortsname verwendet. Ob die Termindaten dafür zusätzlich die Karten-URL als `hasMap` tragen, ist offen.
- **Nicht ergänzt:** `organizer` (Veranstalter ist der Markt, nicht Matthew), `performer` (gibt es nicht), `offers` (Eintrittspreise unbekannt, Märkte sind meist frei). Google meldet diese drei weiter als optionale Hinweise.
- **Aufbau der Daten:** Die Termindaten entstehen heute direkt im Template der Events-Seite. Für den Test wird der Aufbau eines Eintrags in einen Filter der Eleventy-Konfiguration verlegt, wie bei den übrigen Event-Filtern. Das Template gibt nur noch die Liste aus.

## Test-Entscheidungen (Testing Decisions)

- Ein guter Test prüft, was Suchmaschinen bekommen: welche Felder ein Termin trägt, bei welcher Eingabe. Nicht, wie das Template es zusammensetzt.
- **Nahtstelle:** der neue Filter für einen Termin, erreichbar über den bestehenden Stub der Eleventy-Konfiguration, so wie die Tests der Event-Filter heute. Fälle: mit und ohne Beschreibung, Kartenfeld als Adresse und als URL, Event mit Enddatum, Bild als absolute Adresse.
- **Nachweis am Ende:** Rich-Results-Test auf der Vorschau: keine Fehler, drei statt sechs Hinweise je Termin.
- Die Nahtstelle ist ein Vorschlag und mit Dan abzustimmen, bevor die Arbeit beginnt.

## Nicht im Leistungsumfang (Out of Scope)

- Eigene Bilder je Markt, Event oder Glasur in den Termindaten.
- Veranstalter, Eintritt, Mitwirkende.
- Strukturierte Daten für andere Seiten (Shop-Artikel, Händler, Kontakt).
- Änderungen am CMS-Schema.

## Weitere Anmerkungen (Further Notes)

- Test vom 2026-09-18 auf der Vorschau der Migration: 7 gültige Termine, alle Markt-Termine; die Sonder-Events des Sommers lagen schon in der Vergangenheit.
- Die Änderung ist klein und ändert die sichtbare Seite nicht. Sie kann mit einem ohnehin fälligen Build mitlaufen, damit sie keine eigenen Netlify-Minuten kostet.
