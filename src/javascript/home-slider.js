// Prev/next controls for the homepage glaze collections slider.
(function () {
    const slider = document.getElementById("glaze-slider");
    if (!slider) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll("[data-slide]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const dir = btn.dataset.slide === "next" ? 1 : -1;
            slider.scrollBy({
                left: dir * slider.clientWidth * 0.8,
                behavior: reduceMotion ? "auto" : "smooth",
            });
        });
    });

    // Touch devices can't hover the palette strip — play its marble roll
    // and marker sweep whenever the strip scrolls into view instead.
    const strip = document.querySelector(".palette-strip");
    if (
        strip &&
        window.matchMedia("(hover: none)").matches &&
        !reduceMotion &&
        "IntersectionObserver" in window
    ) {
        new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    strip.classList.toggle("is-inview", entry.isIntersecting);
                });
            },
            { threshold: 0.6 }
        ).observe(strip);
    }
})();
