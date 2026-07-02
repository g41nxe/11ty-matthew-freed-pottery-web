document.addEventListener("DOMContentLoaded", () => {
    const chips = document.querySelectorAll("[data-filter]");
    const cards = document.querySelectorAll("[data-group]");
    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => c.classList.toggle("is-active", c === chip));
            const group = chip.dataset.filter;
            cards.forEach((card) => {
                card.hidden = group !== "all" && card.dataset.group !== group;
            });
        });
    });
});
