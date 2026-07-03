document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("nav-toggle");
    const menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
        const open = menu.hidden;
        menu.hidden = !open;
        toggle.setAttribute("aria-expanded", String(open));
    });
});

// Condense the sticky header once the page is scrolled.
document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const update = () => header.classList.toggle("is-stuck", window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
});
