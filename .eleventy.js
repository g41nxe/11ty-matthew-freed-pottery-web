const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const { generateHTML } = require("@11ty/eleventy-img");
const pluginSEO = require("eleventy-plugin-seo");
const markdownIt = require("markdown-it");
const md = markdownIt({ html: true }); // html:true is required — process.md's paragraphs include raw <b> tags

module.exports = function (eleventyConfig) {
    eleventyConfig.addWatchTarget("src/javascript/*.js");

    eleventyConfig.addPassthroughCopy({ "src/admin" : "admin"});
    eleventyConfig.addPassthroughCopy({ "src/assets" : "assets"});
    eleventyConfig.addPassthroughCopy({ "src/javascript" : "js"});
    eleventyConfig.addPassthroughCopy({ "src/_redirects" : "_redirects"});
    eleventyConfig.addPassthroughCopy({ "src/netlify.toml" : "netlify.toml"});


    eleventyConfig.addPassthroughCopy({ "src/assets/favicon.ico" : "favicon.ico"});
    eleventyConfig.addPassthroughCopy({ "src/assets/apple-icon-180x180.png" : "apple-touch-icon.png"});
    eleventyConfig.addPassthroughCopy({ "src/assets/apple-icon-180x180.png" : "apple-touch-icon-retina.png"});

    // Serve the original images at /images/ so the Decap CMS editor can render
    // preview thumbnails (it loads the stored /images/... path). Needed in both
    // dev and production builds, since the deployed CMS resolves previews via
    // the public URL too. The live site itself uses the {% img %} shortcode
    // (hashed variants) and never references these originals.
    eleventyConfig.addPassthroughCopy({ "src/images" : "images" });

    eleventyConfig.addPlugin(pluginSEO, require("./src/views/_data/seo.json"));
    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    // Serve a self-destroying worker at the old SW URL so any previously
    // installed service worker unregisters itself (see src/service-worker.js).
    eleventyConfig.addPassthroughCopy({ "src/service-worker.js": "service-worker.js" });


    eleventyConfig.addNunjucksAsyncShortcode("img", async function(src, alt, sizes="", classes="", loading="lazy") {
        if(alt === undefined) {
          throw new Error(`Missing \`alt\` on image from: ${src}`);
        }

        let metadata = await Image('src/' + src, {
          widths: [160, 320, 640, 768, 1024, 1280, 1536, 1920],
          formats: ["avif", "webp", "jpg"],
          urlPath: "/images/",
          outputDir: "./dist/images/",
        });

        return generateHTML(metadata, { alt, sizes, loading, class: classes });
      });

    eleventyConfig.addNunjucksFilter("sortByDate", function (arr, attribute="date") {
        return arr.slice().sort(function(a, b) {
            return DateTime.fromFormat(b[attribute], 'MM-dd-yyyy').toJSDate()
                 - DateTime.fromFormat(a[attribute], 'MM-dd-yyyy').toJSDate();
        });
    });
    eleventyConfig.addNunjucksFilter("hashtagURL", function (hashtag) {
        return `https://www.instagram.com/explore/tags/${hashtag}/`;
    });
    eleventyConfig.addNunjucksFilter("date", function (date, format) {
        return DateTime.fromFormat(date, 'MM-dd-yyyy').toFormat(format);
    });
    eleventyConfig.addNunjucksFilter("removeFirst", function (array) {
        return array.slice(1, array.length);
    });
    eleventyConfig.addNunjucksFilter("filterFuture", function(array) {
        return array.filter(el => {
            return DateTime.fromFormat(el.date, 'MM-dd-yyyy') > DateTime.now();
        });
    });
    eleventyConfig.addNunjucksFilter("filterPast", function(array) {
        return array.filter(el => {
            return DateTime.fromFormat(el.date, 'MM-dd-yyyy') <= DateTime.now();
        });
    });
    // Special events: studio openings and multi-day shows (Culture Crawl, Circle Craft).
    // These get the large date-block treatment on the events page.
    eleventyConfig.addNunjucksFilter("specialEvents", function(array) {
        return array
            .filter(e => e.atStudio || e.multi_day_event)
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'));
    });
    // Recurring markets grouped by venue name: one entry per market with all
    // upcoming dates, soonest venue first. Excludes special events.
    eleventyConfig.addNunjucksFilter("groupByVenue", function(array) {
        const groups = new Map();
        array
            .filter(e => !(e.atStudio || e.multi_day_event))
            .forEach(e => {
                const key = e.name.trim();
                if (!groups.has(key)) groups.set(key, { name: key, first: e, dates: [] });
                groups.get(key).dates.push(e.date);
            });
        const byDate = (a, b) => DateTime.fromFormat(a, 'MM-dd-yyyy') - DateTime.fromFormat(b, 'MM-dd-yyyy');
        return Array.from(groups.values())
            .map(g => { g.dates.sort(byDate); return g; })
            .sort((a, b) => byDate(a.dates[0], b.dates[0]));
    });
    // One entry per event name (its next occurrence), soonest first.
    // Used by the homepage events band to avoid listing the same market twice.
    eleventyConfig.addNunjucksFilter("nextUp", function(array) {
        const seen = new Set();
        return array.slice()
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'))
            .filter(e => {
                const key = e.name.trim();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    });
    eleventyConfig.addNunjucksFilter("filterFeatured", function(array) {
        return array
            .filter(el => el.featured && DateTime.fromFormat(el.date, 'MM-dd-yyyy') > DateTime.now())
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'))
            .slice(0, 5);
    })
    eleventyConfig.addNunjucksFilter("uuid", function() {
        return uuidv4();
    })
    eleventyConfig.addNunjucksFilter("markdownify", (s) => (s ? md.render(s) : ""));

    return {
        dir: {
            input: "src/views",
            output: "dist",
            includes: "_includes/partials",
            layouts: "_includes/layouts"
        },
        templateFormats: ["md", "njk"],
        markdownTemplateEngine: "njk"
    };
};

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }