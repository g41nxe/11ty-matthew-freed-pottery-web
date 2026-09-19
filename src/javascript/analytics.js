// Alle Umami-Ereignisse an einer Stelle. Die Datei wird nur eingebunden, wenn
// eine Website-ID gesetzt ist; track() prüft trotzdem, ob Umami geladen ist,
// damit ein Werbeblocker keinen Fehler in der Konsole erzeugt.
// Kein Cookie, kein localStorage: hier wird nichts auf dem Gerät gespeichert.
const track = (name, data) => {
    if (typeof window.umami === "undefined") return;
    window.umami.track(name, data);
};

// Welches Shop-Set hat die Rotation gezeigt, und kam es ins Bild?
// Erst beides zusammen macht die Klickzahlen der Sets vergleichbar.
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

// Ein Listener für alle Links statt Attributen an jeder Stelle.
// Die Platzierung steht schon in der URL (utm_content), gesetzt beim Bauen.
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
