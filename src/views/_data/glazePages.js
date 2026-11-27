// One page per glaze, built from the same gallery entries the collections
// page and the home teaser already use, so a glaze is described in one place
// only. A page needs BOTH texts: the lead carries the top of the page and the
// search snippet, the story carries the body. With only one of them the page
// would be thinner than the card that leads to it, so it is not built at all
// and the card keeps linking straight to the shop.
const gallery = require("./gallery.json");
const shopSets = require("./shopSets.js");
const shopPieces = require("./shopPieces.js");

// Same rule as the placementSlug filter in .eleventy.js: lowercase, every run
// of other characters becomes one hyphen. "Tree of Life" -> "tree-of-life".
const urlSlug = (value) =>
    String(value == null ? "" : value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const seiten = gallery.items
    .filter((item) => (item.lead || "").trim() && (item.story || "").trim())
    .map((item) => {
        const name = item.title.replace(" Collection", "");
        return {
            ...item,
            name,
            // "Blues", "Charcoals" or "Patterned": the same grouping the
            // collections page filters by, used as the line above the name.
            group: (item.filterGroups || [])[0] || "",
            path: `/collections/${urlSlug(name)}/`,
            // The pieces come from the shop set of the same name. A hidden set
            // counts as no set: "hide" is how Matthew takes pieces out of the
            // rotation on the home page, and showing them here anyway would put
            // the very things he withdrew back in front of visitors. Without a
            // set the page still works, it just shows no pieces of its own and
            // leads to the shop and the ask block instead.
            // Die handverlesenen Stücke sind nur noch eine Reihenfolge: welche
            // Adressen zuerst kommen sollen. Titel, Preis, Foto und
            // Verfügbarkeit holt die Seite beim Shop, damit nichts veraltet
            // (ADR 0006). Ein verstecktes Set zählt wie keins.
            // Normalerweise holt die Seite ihre Stücke über das Tag. Wo zwei
            // Glasuren sich eines teilen -- Shopify kennt nur "Pemberton", die
            // Webseite kennt Sky und Earth -- kann im CMS eine Liste stehen, die
            // das Tag für diese eine Seite ersetzt.
            nurDiese: (item.pieces || []).filter(Boolean),
            // Die Gegenrichtung: einzelne Stücke aus dem Tag heraushalten.
            // Pemberton Earth nimmt weiter alles unter "Pemberton", nur die
            // drei blauen Sky-Stücke nicht.
            nichtDiese: (item.exclude || []).filter(Boolean),
            vorrang: (() => {
                const set = shopSets.byName[name];
                if (!set || set.hide) return [];
                return (set.items || []).map((i) => i.cta && i.cta.url).filter(Boolean);
            })(),
            // Das große Bild links: Matthews Gruppenfoto, solange keins da ist
            // die Karte dieser Glasur. Jede Seite hat damit dieselbe Form und
            // immer ein Bild ihrer eigenen Glasur.
            feature: item.feature_image && item.feature_image.url ? item.feature_image : item.image,
            // Blank lines separate paragraphs, the way the CMS textarea writes them.
            paragraphs: (item.story || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        };
    });

// The four other glazes each page links on to. Always four, so the grid never
// breaks into a row holding one lonely card, and rotating rather than fixed,
// so every glaze is linked to as often as the others instead of the first
// four collecting all the links.
seiten.forEach((page, i, alle) => {
    page.others = Array.from(
        { length: Math.min(4, alle.length - 1) },
        (_, n) => alle[(i + 1 + n) % alle.length]
    );
});

// Vier Stücke je Glasur, aus dem Shop. Die Vorrangliste bestimmt nur, was
// vorn steht; alles andere -- auch ob überhaupt etwas da ist -- entscheidet
// der Shop. Eine Glasur ohne Stücke behält ihr Gruppenfoto und den Link.
// Getrennt vom Netzaufruf, damit die Regel ohne Shop prüfbar ist: Welche
// vier Stücke eine Seite zeigt, hängt nur von ihrer Vorrangliste und dem ab,
// was der Shop unter ihrem Tag führt.
// Aus "https://shop.../products/medium-teapot-jericho?x=1" wird
// "medium-teapot-jericho". Ein Vergleich mit includes() traf auch dann, wenn
// der Name nur zufällig irgendwo in der Adresse steckte -- "a" steht schon in
// "matthewfreed".
const handleAus = (url) => {
    const hinter = String(url).split("/products/")[1];
    return hinter ? hinter.split("?")[0].split("#")[0] : "";
};

function mitStuecken(liste, nachTag) {
    // Eine kuratierte Adresse soll ihr Stück auch dann finden, wenn dessen
    // Tag nicht zur Seite passt -- sonst wäre die Liste von derselben Angabe
    // abhängig, die sie gerade ersetzt.
    const nachHandle = {};
    for (const gruppe of Object.values(nachTag)) {
        for (const stueck of gruppe) nachHandle[stueck.handle] = stueck;
    }

    for (const page of liste) {
        const kuratiert = (page.nurDiese || []).map(handleAus).filter(Boolean);
        const ausgeschlossen = new Set((page.nichtDiese || []).map(handleAus).filter(Boolean));
        const alle = (kuratiert.length
            ? kuratiert.map((handle) => nachHandle[handle]).filter(Boolean)
            : nachTag[shopPieces.tagSchluessel(page.slug)] || []
        ).filter((stueck) => !ausgeschlossen.has(stueck.handle));
        const vorn = page.vorrang
            .map((url) => handleAus(url))
            .map((handle) => alle.find((stueck) => stueck.handle === handle))
            .filter(Boolean);
        const rest = alle.filter((stueck) => !vorn.includes(stueck));
        page.pieces = vorn.concat(rest).slice(0, 4);
    }
    return liste;
}

module.exports = async function () {
    return mitStuecken(seiten, await shopPieces());
};

// Für die Tests: die Seiten ohne den Shop, und die Regel allein.
module.exports.seiten = seiten;
module.exports.mitStuecken = mitStuecken;
