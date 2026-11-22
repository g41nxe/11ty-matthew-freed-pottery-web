// One page per glaze, built from the same gallery entries the collections
// page and the home teaser already use, so a glaze is described in one place
// only. A page needs BOTH texts: the lead carries the top of the page and the
// search snippet, the story carries the body. With only one of them the page
// would be thinner than the card that leads to it, so it is not built at all
// and the card keeps linking straight to the shop.
const gallery = require("./gallery.json");
const shopSets = require("./shopSets.js");

// Same rule as the placementSlug filter in .eleventy.js: lowercase, every run
// of other characters becomes one hyphen. "Tree of Life" -> "tree-of-life".
const urlSlug = (value) =>
    String(value == null ? "" : value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

module.exports = gallery.items
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
            set: (() => {
                const set = shopSets.byName[name];
                return set && !set.hide ? set : null;
            })(),
            // Blank lines separate paragraphs, the way the CMS textarea writes them.
            paragraphs: (item.story || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        };
    });

// The four other glazes each page links on to. Always four, so the grid never
// breaks into a row holding one lonely card, and rotating rather than fixed,
// so every glaze is linked to as often as the others instead of the first
// four collecting all the links.
module.exports.forEach((page, i, alle) => {
    page.others = Array.from(
        { length: Math.min(4, alle.length - 1) },
        (_, n) => alle[(i + 1 + n) % alle.length]
    );
});
