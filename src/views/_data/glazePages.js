// One page per glaze, built from the same gallery entries the collections
// page and the home teaser already use, so a glaze is described in one place
// only. A page needs BOTH texts: the lead carries the top of the page and the
// search snippet, the story carries the body. With only one of them the page
// would be thinner than the card that leads to it, so it is not built at all
// and the card keeps linking straight to the shop.
const gallery = require("./gallery.json");
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
            // Welche Stücke die Seite zeigt, entscheidet der Shop über das Tag
            // (ADR 0006) -- keine Auswahl und keine Reihenfolge von Hand. Die
            // eine Ausnahme: einzelne Stücke aus dem Tag heraushalten. Die
            // beiden Pemberton teilen sich im Shop eines, also sperrt Earth die
            // blauen Sky-Stücke aus und Sky die braunen von Earth.
            nichtDiese: (item.exclude || []).filter(Boolean),
            // Das große Bild links: Matthews Gruppenfoto, solange keins da ist
            // die Karte dieser Glasur. Jede Seite hat damit dieselbe Form und
            // immer ein Bild ihrer eigenen Glasur.
            feature: item.feature_image && item.feature_image.url ? item.feature_image : item.image,
            // Blank lines separate paragraphs, the way the CMS textarea writes them.
            paragraphs: (item.story || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        };
    });

// The other glazes each page links on to, for the slider at the foot of the
// page: all of them, starting with the one after this glaze, so every page
// opens on a different neighbour instead of sixteen sliders all starting at
// Skaha.
seiten.forEach((page, i, alle) => {
    page.others = Array.from(
        { length: alle.length - 1 },
        (_, n) => alle[(i + 1 + n) % alle.length]
    );
});

// Vier Stücke je Glasur, aus dem Shop: die verfügbaren zuerst, dann die
// zuletzt eingestellten (so sortiert shopPieces.js). Eine Vorrangliste aus den
// Shop-Sets gab es hier und ist wieder weg -- vier handverlesene Stücke
// füllten alle vier Plätze, auch ausverkauft, während der Shop verfügbare
// führte, die niemand sah. Getrennt vom Netzaufruf, damit die Regel ohne Shop
// prüfbar ist.
// Aus "https://shop.../products/medium-teapot-jericho?x=1" wird
// "medium-teapot-jericho". Ein Vergleich mit includes() traf auch dann, wenn
// der Name nur zufällig irgendwo in der Adresse steckte -- "a" steht schon in
// "matthewfreed".
const handleAus = (url) => {
    const hinter = String(url).split("/products/")[1];
    return hinter ? hinter.split("?")[0].split("#")[0] : "";
};

function mitStuecken(liste, nachTag) {
    for (const page of liste) {
        const ausgeschlossen = new Set((page.nichtDiese || []).map(handleAus).filter(Boolean));
        page.pieces = (nachTag[shopPieces.tagSchluessel(page.slug)] || [])
            .filter((stueck) => !ausgeschlossen.has(stueck.handle))
            .slice(0, 4);
    }
    return liste;
}

module.exports = async function () {
    return mitStuecken(seiten, await shopPieces());
};

// Für die Tests: die Seiten ohne den Shop, und die Regel allein.
module.exports.seiten = seiten;
module.exports.mitStuecken = mitStuecken;
