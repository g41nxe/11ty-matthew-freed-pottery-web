// Homepage glaze slider. The palette dots below double as a position indicator
// and jump nav: swipe (or trackpad-scroll) to browse, the leading card's dot is
// ringed, and tapping a dot slides that glaze into view. On capable devices it
// also auto-advances gently, pausing on interaction / off-screen / reduced-motion.
(function () {
    const slider = document.getElementById("glaze-slider");
    if (!slider) return;
    const cards = Array.from(slider.children);
    const dots = Array.from(document.querySelectorAll(".glaze-dot"));
    if (!cards.length || !dots.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function leadingIndex() {
        const left = slider.getBoundingClientRect().left;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach(function (card, i) {
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
        const card = cards[i];
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

    function step() {
        let i = leadingIndex();
        if (i >= cards.length - 1) dir = -1;
        else if (i <= 0) dir = 1;
        goToCard(i + dir);
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
})();
