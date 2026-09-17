const fs = require("fs");
const matter = require("gray-matter");

// The shop sets live in the home page's front matter, and Nunjucks does not
// pass `set` variables into an include, so the review page gets them here.
module.exports = () => {
    const home = matter(fs.readFileSync("src/views/home.md", "utf8")).data;
    return {
        shop_sets: home.shop_sets,
        products: home.products,
        showAll: true,
    };
};
