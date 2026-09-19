// Every Umami event in one place. The file is only included when a website ID
// is set; track() still checks that Umami loaded, so an ad blocker does not
// cause console errors. No cookie, no localStorage: nothing is stored on the device.
// Wrapped in a function like home-slider.js and events.js, so nothing leaks
// into the scope that all classic scripts on the page share.
(function () {
    const track = (name, data) => {
        if (typeof window.umami === "undefined") return;
        window.umami.track(name, data);
    };

    // Which shop set did the rotation show, and did it come into view?
    // Only both together make the sets' click counts comparable.
    // The rotation hides the other sets with the "hidden" class, not the attribute.
    const shownSet = document.querySelector("[data-firing-set]:not(.hidden)");
    if (shownSet) {
        const set = shownSet.dataset.firingName || "unbenannt";
        track("firing-shown", { set });
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                track("firing-seen", { set });
                observer.disconnect();
            }, { threshold: 0.3 });
            observer.observe(shownSet);
        }
    }

    const parse = (href) => {
        try {
            return new URL(href);
        } catch {
            return null;
        }
    };

    // One listener for every link instead of attributes in each template.
    // The placement is already in the URL (utm_content), set at build time.
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        const url = link && parse(link.href);
        if (!url) return;
        if (url.hostname.startsWith("shop.")) {
            track("shop-click", {
                piece: url.pathname.replace(/^\/+|\/+$/g, ""),
                placement: url.searchParams.get("utm_content") || "unbenannt",
            });
        }
    });
})();
