# Feature: Shop-Tags aufräumen

> **Status: offen.** Entstanden beim Grillen der dynamischen Glasurkacheln am 2026-11-25. Entscheidung Dan: Die Glasurseiten holen ihre Stücke künftig über den Shopify-Tag, und zwar **nur** über ihn — kein Rückfall auf den Produkttitel, keine Warnung im Build. Damit wird der Tag zur tragenden Angabe, und die Lücken darin sind kein Schönheitsfehler mehr, sondern fehlende Stücke auf der Website.

## Problemstellung (Problem Statement)

Matthews Shop hat 200 Produkte. Die Glasurseiten sollen ihre vier Kacheln über den Tag des Produkts finden. Gemessen am 2026-11-25 trifft das heute für 182 Produkte zu; bei achtzehn geht es schief, und zwar unbemerkt:

- **Zwei Produkte haben gar keinen Tag:** „Side Plate - Jericho" und „Square Wave Tray - Saltspring". Sie tauchen auf keiner Glasurseite auf.
- **Ein Produkt trägt den falschen Tag:** „Shorty Mug - Squamish Night" ist mit `Garibaldi` getaggt. Es erscheint auf der Garibaldi-Seite. Im Titel fehlt außerdem das s.
- **Dreizehn Produkte teilen sich einen Tag für zwei Glasuren:** `Pemberton` umfasst Pemberton Sky (3) und Pemberton Earth (10). Beide Seiten zeigen damit dieselben gemischten Stücke, keine zeigt ihre eigenen.
- **Zwei Produkte nennen eine Glasur, die es auf der Website nicht gibt:** „Condiment Cozy - Aqua" und „French Butter Dish - Aqua". Entweder fehlt Aqua in der Glasurgalerie, oder die Stücke sind Altbestand.

Dazu zwei Schreibweisen, die mit der Website auseinanderlaufen: Der Shop-Tag heißt `Squamish Nights`, der Slug der Website `Squamish` — der Knopf „See all Squamish Nights pieces" führt heute schon auf eine leere Shop-Seite. Und `Tree-of-life` und `dogwood` weichen in Bindestrich und Kleinschreibung von den übrigen Tags ab; für den Abgleich ist das harmlos, solange er Groß- und Kleinschreibung ignoriert.

## Lösung (Solution)

Die Tags werden im Shopify-Backend bereinigt, nicht im Code umgangen. Danach gilt: ein Tag je Glasur, jede Glasur der Website hat genau einen, und jedes Produkt trägt den Tag der Glasur, aus der es ist.

Im Einzelnen:

1. „Side Plate - Jericho" bekommt `Jericho`, „Square Wave Tray - Saltspring" bekommt `Saltspring`.
2. „Shorty Mug - Squamish Night": Tag auf `Squamish Nights`, Titel auf „Squamish Nights".
3. Die dreizehn `Pemberton`-Produkte bekommen `Pemberton Sky` oder `Pemberton Earth`; der Titel sagt jeweils, welches.
4. Für „Aqua" entscheidet Matthew: eigene Glasur auf der Website, einer bestehenden zuordnen oder aus dem Shop nehmen.
5. Der Slug der Glasur „Squamish Nights" auf der Website wird auf den Tag des Shops gezogen.

Wer das macht, hängt an den Rechten: Die Mitarbeiter-Anfrage im September umfasste Themes, Seiten, Navigation und Checkout — **Produkte waren nicht dabei**. Entweder erweitert Matthew den Zugang, oder er räumt selbst auf. Für den zweiten Fall gehört die Liste oben in die nächste Mail, zusammen mit dem Grund: Von den Tags hängt ab, welche Stücke auf welcher Glasurseite stehen.

## Nicht im Leistungsumfang (Out of Scope)

Die dynamischen Kacheln selbst — Datenfile, Bild-Shortcode für entfernte Bilder, Auswahl und Reihenfolge der vier Stücke. Dieses Ticket schafft nur die Grundlage, auf der sie verlässlich funktionieren.

## Weitere Anmerkungen (Further Notes)

Gemessen über `https://shop.matthewfreed.net/collections/all/products.json`, dieselbe Quelle, aus der `soldOut.js` beim Build die Verfügbarkeit liest. Die Zahlen oben stammen vom 2026-11-25 und ändern sich mit dem Sortiment.
