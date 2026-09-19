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
            // The section is up to ~1600px tall on a phone in landscape, so a
            // fraction-of-the-section threshold would never be reached there.
            // threshold: 0 with a -25% bottom rootMargin fires as soon as any
            // part of the section enters the top three quarters of the viewport.
            const observer = new IntersectionObserver((entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                track("firing-seen", { set });
                observer.disconnect();
            }, { threshold: 0, rootMargin: "0px 0px -25% 0px" });
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
    // Shared between "click" and "auxclick" so a shop link opened in a new
    // tab by middle-click counts too; auxclick also fires for other non-
    // primary buttons, so it is limited here to the middle button (1).
    const handleLinkClick = (event) => {
        if (event.type === "auxclick" && event.button !== 1) return;
        const link = event.target.closest("a[href]");
        const url = link && parse(link.href);
        if (!url) return;
        if (url.hostname.startsWith("shop.")) {
            const firingSet = link.closest("[data-firing-set]");
            track("shop-click", {
                piece: url.pathname.replace(/^\/+|\/+$/g, ""),
                placement: url.searchParams.get("utm_content") || "unbenannt",
                ...(firingSet ? { set: firingSet.dataset.firingName } : {}),
            });
        }
        if (url.hostname.endsWith("google.com") && url.pathname.startsWith("/maps")) {
            track("directions", { page: window.location.pathname });
        }
    };
    document.addEventListener("click", handleLinkClick);
    document.addEventListener("auxclick", handleLinkClick);

    // First deliberate use of the glaze slider: the same interactions
    // home-slider.js treats as user takeover (pointerdown, wheel, keydown),
    // reported as "slider", plus a dot click, reported as "dot". Scrolling on
    // its own does not count because the slider advances by itself.
    const slider = document.getElementById("glaze-slider");
    if (slider) {
        let reported = false;
        const used = (how) => {
            if (reported) return;
            reported = true;
            track("glaze-slider", { how });
        };
        ["pointerdown", "wheel", "keydown"].forEach((type) => {
            slider.addEventListener(type, () => used("slider"), { once: true, passive: true });
        });
        document.querySelectorAll(".glaze-dot").forEach((dot) => {
            dot.addEventListener("click", () => used("dot"), { once: true });
        });
    }

    // Sent, not delivered: Netlify serves the success page, which does not load
    // our layout. The event can be lost if the browser cancels the request while
    // it navigates. Once a success page in the site layout exists, its page view
    // is the more reliable signal.
    const form = document.getElementById("contact_form");
    if (form) {
        form.addEventListener("submit", () => track("contact-sent", {}));
    }
})();
