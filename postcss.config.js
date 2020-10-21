var tailwindcss = require('tailwindcss')
var autoprefixer = require('autoprefixer')

module.exports = ({
    plugins: {
        tailwindcss,
        autoprefixer: { 
            grid: 'autoplace'
        },
    }
})