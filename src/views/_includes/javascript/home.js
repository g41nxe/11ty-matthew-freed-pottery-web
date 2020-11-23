window.addEventListener("load", (event) => {

    const gl1 = new Glide('.glide--showcase--images', {
        type: 'carousel',
        autoplay: 3000,
        gap: 0,
        direction: 'ltr',
        animationDuration: 800
    })

    const gl2 = new Glide('.glide--showcase--content', {
        type: 'carousel',
        gap: 0,
        direction: 'ltr',
        animationDuration: 200
    })

    const gl3 = new Glide('.glide--events', {
        type: 'slider',
        autoplay: false,
        gap: 0,
        direction: 'ltr',
        animationDuration: 200
    })

    gl1.mount();
    gl2.mount();
    gl3.mount();

    gl1.on('run', (e) => {
        gl2.go(e.direction);
    })

    window.addEventListener("resize", (e) => {
        if (window.matchMedia('(min-width: 768px)').matches) {
            gl2.update().disable();
        } else {
            gl2.enable();
        }
    })

})