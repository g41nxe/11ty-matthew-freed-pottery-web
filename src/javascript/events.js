    
var url_string = window.location.href
var url = new URL(url_string);
var id = url.searchParams.get("open");

let event_item = document.querySelector(`[id="${id}"] h2`)

if (event_item) {
    event_item.click()

    const y = event_item.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({top: y, behavior: "smooth"});
}
