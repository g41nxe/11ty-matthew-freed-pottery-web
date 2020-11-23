window.addEventListener("load", (event) => {

    const filter = document.querySelectorAll('button.event--filter');

    for (const f of filter) {
        f.addEventListener("click", (e) => {  
            e.preventDefault();

            const all = document.querySelectorAll('button.event--filter');
            for (const a of all) {
                a.classList.remove("font-bold");
            }

            e.currentTarget.classList.add("font-bold");

            const btns = document.querySelectorAll(".event--item");
            for (const b of btns) {
                b.classList.remove("hidden");
            }

        
            const tag = this.dataset.filter;
            if (tag != "all") {
                const events = document.querySelectorAll(`.event--item[data-event='${tag}']`);

                for (const event of events) {
                    event.classList.add("hidden");
                }
            }
        })
    }

    const toggler = document.querySelectorAll("button.event--item-toggle")

    for (const t of toggler) {
        t.addEventListener("click", (e) => {
            let target = document.getElementById(e.currentTarget.dataset.target)

            target.classList.toggle("hidden")
            e.target.classList.toggle("fa-minus")
            e.target.classList.toggle("fa-plus")
            
        })
    }
})