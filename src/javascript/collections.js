window.addEventListener("load", (event) => {
    const gl4 = new Glide('.glide--features', {
        type: 'carousel',
        peek: 60,
        autoplay: false,
        gap: 30,
        direction: 'ltr',
        animationDuration: 600,
        focusAt: 'center',
        perView: 4,
        breakpoints: {
            640: {
                perView: 1,
                gap: 0,
                peek: 0,
            },
            768: {
                perView: 2,
                peek: 30
            },
            1024: {
                perView: 3
            }
        }
    })

    gl4.mount();

})
