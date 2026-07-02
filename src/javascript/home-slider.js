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
})();
