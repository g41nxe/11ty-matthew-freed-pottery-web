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
                        'hero-bg': '#E5F8FE',
                        'hero-title': '#130B57',
                    },
                    'highlight': '#E9B45A',
                    'white': '#FFFFFF',
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