const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const moment = require("moment/moment");
const { minify } = require("terser");

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(eleventyNavigationPlugin);

    eleventyConfig.addPassthroughCopy({ "src/images" : "images"});
    eleventyConfig.addPassthroughCopy({ "src/admin" : "admin"});
    eleventyConfig.addPassthroughCopy({ "src/assets" : "assets"});

    eleventyConfig.addNunjucksFilter("nl2br", function(str) {
        return str.replace(/\r|\n|\r\n/g, '<br />')
    });

    eleventyConfig.addNunjucksFilter("date", function (date, format) {
        return moment(date, 'MM-DD-YYYY').format(format);
    });

    eleventyConfig.addNunjucksFilter("getFutureOrPast", function (date) {
        date  = moment(date, 'MM-DD-YYYY');
        today = moment();
        
        if (date.isAfter(today)) 
            return 'past';
        else   
            return 'future';
    });

    eleventyConfig.addNunjucksAsyncFilter("jsmin", async function (
        code,
        callback
        ) {
        try {
            const minified = await minify(code);
            callback(null, minified.code);
        } catch (err) {
            console.error("Terser error: ", err);
            // Fail gracefully.
            callback(null, code);
        }
    });

    return {
        dir: {
            input: "src/views",
            output: "dist",
            includes: "_includes/partials",
            layouts: "_includes/layouts"
        },
        templateFormats: ["md", "njk"],
        markdownTemplateEngine: "njk",
        passthroughFileCopy: true
    };
};