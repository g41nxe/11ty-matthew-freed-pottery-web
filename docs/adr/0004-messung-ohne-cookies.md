# 4. Messung ohne Cookies

Klicks und Verkäufe werden ohne Cookies gemessen: UTM-Parameter auf jedem Shop-Link, gebaut aus der Platzierung statt dem Stücknamen, dazu Umami Cloud im kostenlosen Tarif als zweite Schicht auf der eigenen Seite.

## Kontext

Kostenlos war Vorgabe (entschieden 2026-09-13, wie ADR 0001). Analytics-Dienste mit Kosten (Plausible, Fathom) und Google Analytics 4 fielen deshalb aus, GA4 zusätzlich wegen des Cookie-Banners.

Ein Banner war ausgeschlossen: Matthew tippt keine Parameter und pflegt Analytics nicht mit, ein Consent-Baustein hätte diese Pflege verlangt. Damit blieb nur ein Dienst, der ohne Cookies auskommt.

`matthewfreed.ca` und `shop.matthewfreed.net` sind zwei Domains ohne gemeinsame Cookies. Ein Klick auf einen Shop-Link verlässt die eigene Seite vollständig; nur die Adresse selbst trägt Information in den Shop hinüber. Deshalb tragen alle Shop-Links `utm_campaign=website` (sonst zählt Shopify den Besuch nicht als Marketing) und `utm_content` für die Platzierung.

Platzierung statt Stückname: Welches Stück gemeint war, weiß Shopify bereits aus der Landeseite. Ein Stückname wäre lesbarer, bricht aber die Historie, sobald Matthew ihn in Tina ändert. Ein Ortsname wie `firing-tofino-tile2` bleibt stabil, weil er den Platz benennt, nicht den Inhalt.

## Entscheidung

- Jeder Shop-Link bekommt sein `utm_content` zur Bauzeit, in einem Eleventy-Filter statt im CMS: die Platzierung (der Ort auf der Seite), nicht das Stück.
- Analytics läuft über Umami Cloud im kostenlosen Tarif, cookiefrei, und rendert nur, wenn `UMAMI_WEBSITE_ID` gesetzt ist.
- Erfasst werden genau sechs Ereignisse: `firing-shown`, `firing-seen`, `shop-click`, `directions`, `glaze-slider`, `contact-sent`.
- Kein Cookie-Banner: weder die Seite noch Umami setzen Cookies.

## Konsequenzen

- **Ereignis-Kontingent.** Umamis kostenloser Tarif begrenzt die Ereignisse im Monat; bei dieser Besuchergröße bleibt der Verbrauch weit darunter. Ein Seitenaufruf der Startseite umfasst den Seitenaufruf selbst, `firing-shown`, höchstens ein `firing-seen`, höchstens ein `glaze-slider`, dazu einen `shop-click` je geöffnetem Shop-Link (Links öffnen neue Tabs, mehrere sind also möglich).
- **Sechs Monate Aufbewahrung.** Ältere Daten sind weg, sobald der Tarif sie löscht. Ein Vergleich mit dem Vorjahr ist damit nicht möglich; wird das je gebraucht, muss vorher exportiert werden.
- **Eigene Besuche zählen mit.** Umami könnte sie per `localStorage`-Schalter ausnehmen; der Aufwand lohnt bei zwei Personen nicht. Beim Lesen der Zahlen ist das mitzudenken.
- **Keine Heatmaps.** Microsoft Clarity hätte Ziel 3 direkter beantwortet, setzt aber Cookies und bräuchte ein Banner. Solange kein Banner gilt, bleibt offen, wo auf einer Seite Besucher tatsächlich hinsehen.
- **Kontaktformular vorerst per Submit gezählt.** Netlify liefert die Erfolgsseite außerhalb des eigenen Layouts aus, das Ereignis kann bei einem abgebrochenen Request verloren gehen. Erst eine eigene Erfolgsseite im Seitenlayout würde einen zuverlässigeren Seitenaufruf als Signal erlauben.
