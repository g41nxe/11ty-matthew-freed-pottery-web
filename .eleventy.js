const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const { generateHTML } = require("@11ty/eleventy-img");
const pluginPWA = require("eleventy-plugin-pwa-v2");
const pluginSEO = require("eleventy-plugin-seo");

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

    // Dev only: serve the original images at /images/ so the Decap CMS editor
    // can render preview thumbnails (it loads the stored /images/... path).
    // The live site uses the {% img %} shortcode (hashed variants), never the
    // originals, so they are intentionally excluded from production builds.
    if (process.env.ELEVENTY_RUN_MODE !== "build") {
        eleventyConfig.addPassthroughCopy({ "src/images" : "images" });
    }

    eleventyConfig.addPlugin(pluginSEO, require("./src/views/_data/seo.json"));
    eleventyConfig.addPlugin(pluginPWA);
    eleventyConfig.addPlugin(eleventyNavigationPlugin);


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
    eleventyConfig.addNunjucksFilter("filterFeatured", function(array) {
        return array
            .filter(el => el.featured && DateTime.fromFormat(el.date, 'MM-dd-yyyy') > DateTime.now())
            .sort((a, b) => DateTime.fromFormat(a.date, 'MM-dd-yyyy') - DateTime.fromFormat(b.date, 'MM-dd-yyyy'))
            .slice(0, 5);
    })
    eleventyConfig.addNunjucksFilter("uuid", function() {
        return uuidv4();
    })

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