let nav = document.getElementById("nav")

window.addEventListener("load", (event) => {

    let mobile_btn = document.getElementById("mobile--btn")
    mobile_btn.addEventListener("click", (e) => {
        e.preventDefault();
        
        let btn = e.target
        let target = document.getElementById("mobile--menu")
        
        target.classList.toggle("active")
        
        btn.classList.toggle("fa-bars")
        btn.classList.toggle("fa-times")  
    })

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.85,
    };
  
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    observer.observe(nav);

})

function observerCallback(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        nav.classList.remove('scrolling');
      } else {
        nav.classList.add('scrolling');
      }
    });
  }