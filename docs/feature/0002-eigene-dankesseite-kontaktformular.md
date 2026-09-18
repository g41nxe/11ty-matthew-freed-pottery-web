# Feature: Eigene Dankesseite nach dem Kontaktformular

> **Status: für später, nicht Teil der Tina-Migration.** Das Kontaktformular funktioniert (geprüft 2026-09-18): Nach dem Absenden zeigt Netlify seine Standardseite. Dieses Dokument hält fest, was eine eigene Seite braucht.

## Problemstellung (Problem Statement)

Wer über die Kontaktseite eine Nachricht schickt, landet danach auf einer fremden Seite: weiße Karte auf schwarzem Grund, „Thank you! Your form submission has been received.", darunter „Back to our site". Das ist Netlifys Standardseite. Sie trägt weder das Design noch die Stimme der Website, und sie sagt nichts darüber, was als Nächstes passiert — wann Matthew antwortet, wo man ihn bis dahin findet.

Der Moment direkt nach dem Absenden ist der, in dem jemand gerade Interesse gezeigt hat. Die Seite verschenkt ihn.

Matthew kann den Text nicht ändern, denn die Seite gehört nicht zur Website und steht in keinem CMS.

## Lösung (Solution)

Nach dem Absenden erscheint eine Dankesseite im Design der Website, mit Navigation, Footer und einem Text in Matthews Worten. Sie bestätigt, dass die Nachricht angekommen ist, sagt, wann mit einer Antwort zu rechnen ist, und bietet naheliegende nächste Schritte an: zurück zur Startseite, in den Shop, zu den nächsten Markt-Terminen.

Matthew pflegt den Text im CMS wie jede andere Seite.

## User Stories

1. Als Besucher, der eine Nachricht geschickt hat, möchte ich eine Bestätigung im Design der Website sehen, um sicher zu sein, dass ich noch auf der richtigen Seite bin.
2. Als Besucher möchte ich lesen, dass meine Nachricht angekommen ist, um sie nicht ein zweites Mal zu schicken.
3. Als Besucher möchte ich erfahren, wann ungefähr mit einer Antwort zu rechnen ist, um nicht im Ungewissen zu warten.
4. Als Besucher möchte ich von der Dankesseite direkt weiter in den Shop kommen, um mir die Stücke anzusehen, nach denen ich vielleicht gefragt habe.
5. Als Besucher möchte ich sehen, wann Matthew als Nächstes auf einem Markt ist, um ihn dort persönlich zu treffen.
6. Als Besucher möchte ich über die gewohnte Navigation zurück auf jede Seite kommen, um nicht den Zurück-Knopf des Browsers bemühen zu müssen.
7. Als Besucher auf dem Telefon möchte ich die Dankesseite ohne Zoomen und ohne seitliches Scrollen lesen können.
8. Als Besucher, der die Seite direkt aufruft, ohne etwas abgeschickt zu haben, möchte ich keine irreführende Bestätigung sehen, die mich glauben lässt, ich hätte etwas gesendet.
9. Als Matthew möchte ich den Text der Dankesseite im CMS ändern, um die Antwortzeit anpassen zu können, etwa in der Marktsaison.
10. Als Matthew möchte ich die Überschrift, den Text und die Beschriftung der Links getrennt pflegen, um nicht in einem langen Textblock suchen zu müssen.
11. Als Matthew möchte ich die Dankesseite in der CMS-Seitenleiste neben der Kontaktseite finden, um nicht zu raten, wo sie steckt.
12. Als Matthew möchte ich, dass jede Nachricht weiterhin in Netlify ankommt, um keine Anfrage zu verlieren.
13. Als Dan möchte ich, dass die Dankesseite nicht in Suchmaschinen erscheint, um keine Treffer auf eine Bestätigung ohne Inhalt zu erzeugen.
14. Als Dan möchte ich, dass die Dankesseite nicht in der Sitemap steht, aus demselben Grund.
15. Als Dan möchte ich, dass der Spamschutz des Formulars (Honeypot und reCAPTCHA) unverändert bleibt, um mit der neuen Seite keine Lücke zu öffnen.
16. Als Dan möchte ich, dass die Dankesseite ohne Tina-Build und ohne JavaScript funktioniert, um sie nicht von TinaCloud abhängig zu machen.

## Implementierungs-Entscheidungen (Implementation Decisions)

- **Netlify zeigt die eigene Seite von selbst.** Das Formular sendet schon heute an den Pfad `/success`. Netlify Forms nimmt den POST entgegen und zeigt danach die Seite, die unter diesem Pfad liegt; gibt es keine, erscheint die Standardseite. Eine Seite unter genau diesem Pfad genügt also, das Formular selbst ändert sich nicht. Bei Umsetzung auf der Deploy-Vorschau bestätigen, dass Netlify die eigene Seite tatsächlich nach dem POST ausliefert.
- **Eigene Seite mit eigener CMS-Sammlung.** Die Dankesseite ist eine eigene Seitendatei mit eigenem Front Matter, im CMS als „Contact · Thank-you page" — nach der Regel, dass jeder Eintrag mit der Seite beginnt, zu der er gehört. Der Text in den Daten der Kontaktseite wäre für eine andere Seite nicht erreichbar: Nunjucks reicht Daten einer Seite nicht an eine andere weiter (siehe Befund zur Vergleichsseite der Shop-Sets).
- **Felder:** Überschrift, Text (mehrzeilig), Hinweis zur Antwortzeit, Beschriftungen der Links. Keine SEO-Felder — nach ADR 0002 gilt der globale Eintrag.
- **Nächste Schritte als Links, nicht als Kopie von Inhalten.** Shop-Link aus den globalen Einstellungen, Link zur Events-Seite. Ob die nächsten Markt-Termine direkt auf der Seite stehen (mit den vorhandenen Events-Filtern), ist bei Umsetzung zu entscheiden; ein Link ist das Minimum.
- **Nicht indexieren.** Die Seite wird aus den Sammlungen ausgeschlossen (damit nicht in der Sitemap) und bekommt über `_headers` einen `X-Robots-Tag: noindex`. Kein zweites robots-Meta im HTML, weil das SEO-Plugin auf jeder Seite `index,follow` schreibt.
- **Direkter Aufruf ohne Absenden.** Die Seite ist statisch und kann nicht unterscheiden, ob gerade etwas abgeschickt wurde. Die Formulierung muss deshalb auch bei einem direkten Aufruf stimmen, etwa „Danke für deine Nachricht" statt „Deine Nachricht ist soeben eingegangen", oder die Seite verzichtet auf eine Bestätigungsformel, die ohne Absenden falsch wäre. Bei Umsetzung mit Matthew klären.
- **Pfad.** Das Formular zeigt auf `/success`. Netlifys Pretty URLs liefern eine Seite `success.html` unter `/success` aus; den Pfad des Formulars nicht ändern, solange das zutrifft.

## Test-Entscheidungen (Testing Decisions)

Gute Tests prüfen nur, was Besucher und Matthew sehen, nicht wie die Seite gebaut ist.

- **Nahtstelle 1, der Eleventy-Build (höchste lokale Stelle):** Die gebaute Seite liegt unter dem erwarteten Pfad, trägt Layout, Navigation und Footer, steht nicht in `sitemap.xml`, und `_headers` enthält die noindex-Regel für diesen Pfad. Vorbild: die Prüfungen der Vergleichsseite der Shop-Sets und `scripts/compare-html.mjs` für den Seitenvergleich.
- **Nahtstelle 2, der Tina-Round-Trip:** Die neue Sammlung lässt sich lesen und schreiben, ohne dass sich der Inhalt ändert (`npm run tina:roundtrip`), wie bei den übrigen 13 Sammlungen.
- **Nahtstelle 3, Netlify selbst (nur auf der Deploy-Vorschau, von Hand):** Formular absenden, die eigene Dankesseite erscheint, die Nachricht steht in Netlifys Formular-Eingang. Lässt sich lokal nicht nachstellen, weil Netlify Forms nur im Deploy arbeitet.
- **Keine neuen Unit-Tests nötig,** solange die Seite keine eigene Logik hat. Stehen die nächsten Markt-Termine auf der Seite, decken die vorhandenen Tests der Events-Filter (`test/events-filters.test.mjs`) das Auswählen ab.
- Telefonbreite (375 px) ohne seitliches Scrollen, wie bei den übrigen Seiten geprüft.

## Nicht im Leistungsumfang (Out of Scope)

- Änderungen an den Formularfeldern, an reCAPTCHA oder am Honeypot.
- E-Mail-Benachrichtigungen oder eine automatische Antwort an den Absender.
- Eine eigene Fehlerseite für abgelehnte Absendungen (etwa bei fehlgeschlagenem reCAPTCHA).
- Das Zählen von Formular-Absendungen als Ziel in einer Statistik. Das gehört zur Auswertung von Klicks und Verkäufen, die gesondert geplant wird, und kann diese Seite später als Messpunkt nutzen.
- Automatisches Weiterleiten nach einigen Sekunden.

## Weitere Anmerkungen (Further Notes)

- Die Standardseite von Netlify erscheint unter der Adresse der Website, `/success`. Ein direkter Aufruf dieses Pfads ohne Absenden gibt heute 404 — das war der Anlass für einen falschen Befund in der Checkliste vom 2026-09-17, der inzwischen korrigiert ist.
- Die Texte kommen von Matthew; ein Entwurf kann sich am Ton der Kontaktseite orientieren („Feel free to get in touch with me. I am always open to individual requests.").
