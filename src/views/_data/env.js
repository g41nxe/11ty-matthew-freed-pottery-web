// Values that must not live in the repo. Netlify passes its environment
// variables into the build; locally they come from the shell. A missing
// value is an empty string, so templates can simply test for it.
module.exports = {
    googleMapsKey: process.env.GMAPS_API_KEY || "",
    // The commit Netlify builds, published as /build.txt so a script can
    // tell when a deploy with that commit is online (scripts/go-live.mjs).
    commit: process.env.COMMIT_REF || "",
    // Empty until a Umami account is set up: then base.njk renders neither
    // the counting script nor analytics.js, and the page loads nothing external.
    umamiWebsiteId: process.env.UMAMI_WEBSITE_ID || "",
    umamiScript: process.env.UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js",
};
