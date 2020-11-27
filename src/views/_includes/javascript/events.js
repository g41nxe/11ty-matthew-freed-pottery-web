
const filter = document.querySelectorAll("button.event--filter");

for (let f of filter) {
    f.addEventListener("click", (e) => {  
        e.preventDefault();

        const all = document.querySelectorAll("button.event--filter");
        for (const a of all) {
            a.classList.remove("font-bold");
        }

        e.currentTarget.classList.add("font-bold");

        const btns = document.querySelectorAll(".event--item");
        for (const b of btns) {
            b.classList.remove("hidden");
        }

    
        const tag = e.currentTarget.dataset.filter;
        if (tag != "all") {
            const events = document.querySelectorAll(`.event--item[data-event="${tag}"]`);

            for (const event of events) {
                event.classList.add("hidden");
            }
        }
    })
}

const toggler = document.querySelectorAll(".event--item-toggle")

for (let t of toggler) {
    t.addEventListener("click", (e) => {
        e.preventDefault();

        const target = document.getElementById(e.currentTarget.dataset.target)
        let icon = document.getElementById(e.currentTarget.dataset.icon)
        
        //target.classList.toggle("max-h-0");
        target.classList.toggle("full");

        icon.classList.toggle("fa-minus")
        icon.classList.toggle("fa-plus")
        
    })
}

var url_string = window.location.href
var url = new URL(url_string);
var id = url.searchParams.get("open");

let event_item = document.querySelector(`[id="${id}"] h2`)

if (event_item) {
    event_item.click()
    
    const y = event_item.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({top: y, behavior: "smooth"});
}
