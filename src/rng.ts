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

const colors: Array<string> = [
    'red',
    'blue',
    'green',
    'white',
    'yellow',
    'pink',
    'purple',
    'brown'
]

const types: Array<string> = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'mythic',
    'exotic',
    'secret'
]

const fonts: Array<string> = [
    'Source Sans 3',
    'Times New Roman',
    'Courier New',
    'Inter',
    'Merriweather',
    'Open Sans'
]

const sizes: Array<number> = [15, 20, 25, 30, 35, 40, 45, 50]

const colorProbability: Array<number> = [0.001, 0.003, 0.006, 0.01, 0.03, 0.15, 0.3, 0.5]
const typeProbability: Array<number> = [0.001, 0.003, 0.006, 0.01, 0.03, 0.15, 0.3, 0.5]
const fontProbability: Array<number> = [0.005, 0.015, 0.03, 0.15, 0.3, 0.5]
const sizeProbability: Array<number> = [0.001, 0.003, 0.006, 0.01, 0.03, 0.15, 0.3, 0.5]

let randomNum: number

document.getElementById('roll-button')!.onclick = () => {
    // another placeholder
}