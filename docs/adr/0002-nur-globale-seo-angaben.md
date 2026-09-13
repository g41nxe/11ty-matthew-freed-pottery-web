# 2. Nur globale SEO-Angaben

Titel, Beschreibung und Vorschaubild für Suchmaschinen und das Teilen in sozialen Netzwerken kommen ausschließlich aus dem globalen SEO-Eintrag. Seiten bekommen keine eigenen Überschreibungen, weder im Front Matter noch im CMS-Schema.

Seitenspezifische Angaben sind als Idee festgehalten: `docs/feature/0001-seitenspezifische-seo-angaben.md`.

## Kontext

`eleventy-plugin-seo` liest bestimmte Schlüssel aus dem Front Matter jeder Seite als Überschreibung des globalen Eintrags: `image` für das Vorschaubild, `excerpt` für die Beschreibung, `author` und `ogtype`. Die Namen sind fest und nicht in einen eigenen Namensraum verschiebbar.

Das hat auf zwei Branches zu gegensätzlichen Ständen geführt:

- `feat/site-redesign-v2` hat die Schlüssel mit Commit `b5f177b` als tote Platzhalter entfernt.
- `feat/tinacms-migration` hat sie mit Commit `9804975` für zwei Seiten wiederhergestellt, weil das Plugin sie tatsächlich auswertet. Die Sammlungsseite hatte eine eigene Beschreibung, die Kontaktseite ein eigenes Vorschaubild. Dieses Bild, `/images/uploads/contact.jpeg`, existiert in keinem Branch.

Die festen Schlüsselnamen kollidieren mit Inhaltsfeldern. Die Händlerseite hat ein Feld `image` für ihr Foto, als Objekt mit `url` und `alt`. Das Plugin übernimmt es als Vorschaubild und schreibt `og:image content="[object Object]"` ins HTML.

Matthew bearbeitet die Seite ausschließlich im CMS und wird Teilen-Einstellungen je Seite nicht pflegen.

## Entscheidung

- Der Merge von `feat/site-redesign-v2` in `feat/tinacms-migration` übernimmt den Stand von v2: keine Überschreibungen in `collections.md` und `contact.md`.
- Das Tina-Schema modelliert für Seiten keine SEO-Felder.
- Kein Inhaltsfeld einer Seite heißt auf oberster Ebene `image`, `excerpt`, `author` oder `ogtype`. Das Foto der Händlerseite wird umbenannt.

## Konsequenzen

- Jede Seite teilt sich mit demselben Vorschaubild und derselben Beschreibung, nur der Seitentitel unterscheidet sich.
- Die eigene Beschreibung der Sammlungsseite geht verloren. Ihr Text ist im Feature-Dokument festgehalten, damit er bei einer späteren Umsetzung nicht neu geschrieben werden muss.
- Die vier reservierten Schlüsselnamen müssen beim Anlegen neuer Seitenfelder gemieden werden. Sonst entsteht still derselbe Fehler wie auf der Händlerseite.
- Unabhängig davon ist das globale Vorschaubild heute relativ (`/assets/blue-arrangement.jpg`), weil in `seo.json` die Plugin-Option `imageWithBaseUrl` fehlt. Soziale Netzwerke brauchen eine absolute Adresse. Das ist ein Fehler unter dieser Entscheidung, keine Folge von ihr, und wird mit behoben.
