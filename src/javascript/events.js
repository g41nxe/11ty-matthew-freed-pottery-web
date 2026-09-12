// Pages are built once and then served until the next deploy, so a date that
// was upcoming at build time can already be over by the time somebody reads
// it. Both the home band and the events page render every date the build
// considered upcoming; this re-runs the selection against today in the
// browser. It can only ever remove dates, never invent them, so the worst
// case without JavaScript is the state the build produced.
(function () {
    // yyyy-MM-dd sorts as a string, so no parsing and no timezone handling.
    var now = new Date();
    var today = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');

    // An event is over once its last day is over, so a multi-day show stays
    // listed while it is running and a market still shows on its own morning.
    // data-until carries that last day; a date chip has only itself.
    function past(el) {
        return (el.dataset.until || el.dataset.date) < today;
    }

    function markNext(card, isNext) {
        card.classList.toggle('border-2', isNext);
        card.classList.toggle('border', !isNext);
        var label = card.querySelector('[data-next-label]');
        if (label) label.hidden = !isNext;
    }

    // The home band: one card per market, the four soonest, the first marked.
    (function band() {
        var root = document.getElementById('events-band');
        if (!root) return;
        var cards = Array.prototype.slice.call(root.querySelectorAll('[data-event]'));
        if (!cards.length) return;

        var seen = {};
        var live = cards.filter(function (card) {
            return !past(card);
        }).filter(function (card) {
            if (seen[card.dataset.name]) return false;
            seen[card.dataset.name] = true;
            return true;
        }).slice(0, 4);

        cards.forEach(function (card) {
            var isNext = live[0] === card;
            card.hidden = live.indexOf(card) === -1;
            markNext(card, isNext);
            card.classList.toggle('border-sand', isNext);
            card.classList.toggle('border-blue-light', !isNext);
        });

        var grid = root.querySelector('[data-events-grid]');
        var soon = root.querySelector('[data-events-soon]');
        if (grid) grid.hidden = !live.length;
        if (soon) soon.hidden = live.length > 0;

        var heroLine = document.getElementById('hero-next');
        if (!heroLine) return;
        heroLine.hidden = !live.length;
        if (!live.length) return;
        var heroText = heroLine.querySelector('[data-hero-next-text]');
        if (heroText) heroText.textContent = live[0].dataset.hero;
    })();

    // The events page: drop passed dates from each market's date list, drop
    // cards that have none left, and move the badge to the soonest survivor.
    (function page() {
        var root = document.getElementById('events-list');
        if (!root) return;
        var cards = Array.prototype.slice.call(root.querySelectorAll('[data-event-card]'));
        if (!cards.length) return;

        var live = [];
        cards.forEach(function (card) {
            var chips = Array.prototype.slice.call(card.querySelectorAll('[data-chip]'));
            var remaining = chips.filter(function (chip) {
                chip.hidden = past(chip);
                return !chip.hidden;
            });
            chips.forEach(function (chip, i) {
                var isNextDate = remaining[0] === chip;
                chip.classList.toggle('bg-sand', isNextDate);
                chip.classList.toggle('bg-tile', !isNextDate);
                if (isNextDate) chip.title = 'Next date';
                else chip.removeAttribute('title');
            });

            // A card with chips lives as long as one date is left; a card
            // without chips (a studio event or a multi-day show) goes by its
            // own date. Either way the earliest surviving date decides where
            // it sits in the running.
            var next = chips.length ? (remaining[0] || null) : (past(card) ? null : card);
            card.hidden = !next;
            if (next) live.push({ card: card, date: next.dataset.date });
        });

        live.sort(function (a, b) {
            return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        });
        cards.forEach(function (card) {
            markNext(card, live.length > 0 && live[0].card === card);
            card.classList.toggle('border-blue', live.length > 0 && live[0].card === card);
            card.classList.toggle('border-hairline', !(live.length > 0 && live[0].card === card));
        });

        // A section heading with nothing under it would read as a mistake.
        ['special', 'markets'].forEach(function (name) {
            var heading = root.querySelector('p[data-section="' + name + '"]');
            if (!heading) return;
            heading.hidden = !cards.some(function (card) {
                return card.dataset.section === name && !card.hidden;
            });
        });

        var soon = root.querySelector('[data-events-soon]');
        if (soon) soon.hidden = live.length > 0;
    })();
})();
