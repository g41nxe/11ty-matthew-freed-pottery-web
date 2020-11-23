var tailwindcss = require('tailwindcss')
var autoprefixer = require('autoprefixer')

module.exports = ({
    plugins: {
        tailwindcss: {
            theme: {
                fontFamily: {
                    'sans': ['Open Sans', 'Arial', 'sans-serif'],
                    'display': ['Playfair Display', 'Times New Roman']
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
                        'DEFAULT': '#F2F2F2',
                        'dark': '#6C6C6C'
                    },
                    'transparent': 'transparent'
                }
            }
        },
        autoprefixer: { 
            grid: 'autoplace'
        },
    }
})