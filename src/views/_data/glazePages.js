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
            // The pieces come from the shop set of the same name. Without one
            // the page still works, it just shows no pieces of its own.
            set: shopSets.byName[name] || null,
            // Blank lines separate paragraphs, the way the CMS textarea writes them.
            paragraphs: (item.story || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        };
    });
