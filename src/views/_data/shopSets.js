// The shop sets still live in the front matter of home.md, where Matthew
// edits them under Home in the CMS. The glaze pages need the same pieces, so
// this reads them once and offers them by set name. Should the sets ever move
// into their own CMS collection, this module is the only place to change.
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const home = matter(fs.readFileSync(path.join(__dirname, "..", "home.md"), "utf8")).data;
const sets = home.shop_sets || [];

module.exports = {
    all: sets,
    // Matched by name, the same string the CMS shows: "Jericho", "Tree of Life".
    byName: Object.fromEntries(sets.map((set) => [set.name, set])),
};
