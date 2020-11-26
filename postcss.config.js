var tailwindcss = require('tailwindcss')
var autoprefixer = require('autoprefixer')
var cssnano = require('cssnano')

module.exports = ({
    plugins: [
        tailwindcss({
            purge: {
                // enabled: true, % to force purge (or use NODE_ENV=prodution)
                content: [
                    './src/**/*.njk', 
                    './src/**/*.md', 
                    './src/**/*.json', 
                    './src/**/*.js',  
                    './src/**/*.css',  
                ]
            },
            theme: {
                screens: {
                    'sm': '640px',
                    'md': '768px',
                    'lg': '1024px'
                },
                fontFamily: {
                    'sans': ['Open Sans', 'Arial', 'sans-serif'],
                    'display': ['Playfair Display', 'Georgia', 'serif']
                },
                colors: {
                    'brand': '#050237',
                    'blue': {
                        'hero-bg-start': '#E4F5FF;',
                        'hero-bg-stop': '#EEFCFF',
                        'hero-title': '#130B57',
                    },
                    'highlight': '#E9B45A',
                    'white': '#FFFFFF',
                    'black': '#000000',
                    'gray': {
                        'light': '#EAEAEA',
                        'lighter': '#FAFAFA',
                        'default': '#F2F2F2',
                        'dark': '#D2D2D2',
                        'darker': '#6C6C6C'
                    },
                    'transparent': 'transparent'
                }
            }
        }),
        autoprefixer({ 
            grid: 'autoplace'
        }),
        cssnano({
            preset: 'default',
        }),
    ]
})