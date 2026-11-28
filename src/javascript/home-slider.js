// The sliders of the site. Swipe (or trackpad-scroll) to browse; on capable
// devices a slider also advances gently on its own, pausing on interaction /
// off-screen / reduced-motion.
//
// Two kinds use this file. The glaze slider (#glaze-slider) is on the home
// page with a strip of palette dots below it -- they double as a position
// indicator and jump nav: the leading card's dot is ringed, and tapping a dot
// slides that glaze into view -- and on a glaze page without the dots. Any
// other row marked data-slider (the pieces on a glaze page) moves the same way
// and never has dots.
(function () {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function einrichten(slider, dots) {
        // Hidden cards take no part: a market date that has passed stays in
        // the HTML with the hidden attribute (events.js), and it has no place
        // on the track to scroll to.
        function cards() {
            return Array.from(slider.children).filter(function (card) {
                return !card.hidden;
            });
        }
        if (!cards().length) return;

        function leadingIndex() {
            const left = slider.getBoundingClientRect().left;
            let best = 0;
            let bestDist = Infinity;
            cards().forEach(function (card, i) {
                const dist = Math.abs(card.getBoundingClientRect().left - left);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = i;
                }
            });
            return best;
        }

        function setCurrent(i) {
            dots.forEach(function (dot, di) {
                dot.classList.toggle("is-current", di === i);
                if (di === i) dot.setAttribute("aria-current", "true");
                else dot.removeAttribute("aria-current");
            });
        }

        function goToCard(i) {
            const card = cards()[i];
            if (!card) return;
            slider.scrollBy({
                left: card.getBoundingClientRect().left - slider.getBoundingClientRect().left,
                behavior: reduceMotion ? "auto" : "smooth",
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                goToCard(parseInt(dot.dataset.goto, 10));
            });
        });

        let ticking = false;
        slider.addEventListener(
            "scroll",
            function () {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(function () {
                    setCurrent(leadingIndex());
                    ticking = false;
                });
            },
            { passive: true }
        );

        setCurrent(0);

        if (reduceMotion) return;

        let timer = null;
        let dir = 1;
        let onScreen = true;
        let held = false;
        let stopped = false;

        // The turning points are the ends of the track, not the first and
        // last card: with four cards to a view the last one never leads, and
        // a slider that waited for it stood still at the end for good.
        function step() {
            const rest = slider.scrollWidth - slider.clientWidth;
            if (rest <= 2) return;
            if (slider.scrollLeft >= rest - 2) dir = -1;
            else if (slider.scrollLeft <= 2) dir = 1;
            goToCard(leadingIndex() + dir);
        }
        function play() {
            if (!timer && onScreen && !held && !stopped) timer = setInterval(step, 4500);
        }
        function pause() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }
        // Deliberate interaction = the user has taken over; auto-advance stays off
        // for the rest of the visit (WCAG 2.2.2 — motion until intent, then respect it).
        function stop() {
            stopped = true;
            pause();
        }

        ["pointerdown", "wheel", "keydown"].forEach(function (e) {
            slider.addEventListener(e, stop, { passive: true });
        });
        dots.forEach(function (dot) {
            dot.addEventListener("click", stop);
        });

        ["pointerenter", "focusin"].forEach(function (e) {
            slider.addEventListener(e, function () {
                held = true;
                pause();
            });
        });
        ["pointerleave", "focusout"].forEach(function (e) {
            slider.addEventListener(e, function () {
                held = false;
                play();
            });
        });

        if ("IntersectionObserver" in window) {
            new IntersectionObserver(
                function (entries) {
                    onScreen = entries[0].isIntersecting;
                    if (onScreen) play();
                    else pause();
                },
                { threshold: 0.4 }
            ).observe(slider);
        }

        play();
    }

    const glazes = document.getElementById("glaze-slider");
    // The dots are optional: a glaze page uses this slider without the strip
    // of dots, and it should still advance on its own there.
    if (glazes) einrichten(glazes, Array.from(document.querySelectorAll(".glaze-dot")));
    Array.from(document.querySelectorAll("[data-slider]")).forEach(function (slider) {
        if (slider !== glazes) einrichten(slider, []);
    });
})();
