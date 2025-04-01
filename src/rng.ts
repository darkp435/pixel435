const result = document.getElementById('result') as HTMLDivElement

class Tag {
    private color: string
    private type: string
    private size: number
    private font: string

    constructor(color: string, type: string, size: number, font: string) {
        this.color = color
        this.type = type
        this.size = size
        this.font = font
        return this
    }

    display() {
        result.textContent = this.type
        result.style.setProperty('font-family', this.font)
        result.style.setProperty('size', this.size.toString())
        result.style.setProperty('color', this.color)
    }
    
    addGlitched() {
        result.textContent += " (glitched)"
    }
}

const colors = [
    'red',
    'blue',
    'green',
    'white',
    'yellow',
    'pink',
    'purple',
    'light blue'
]

const types = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'very epic',
    'legendary',
    'top of legendary',
    'mythic',
    'exotic',
    'unheard of',
    'secret'
]

const fonts = [
    'Source Sans 3',
    'Times New Roman',
    'Courier New',
    'Inter',
    'Merriweather',
    'Open Sans'
]

const sizes = [15, 20, 25, 30, 35, 40, 45, 50]

let randomNum: number

document.getElementById('roll-button')!.onclick = () => {
    // another placeholder
}