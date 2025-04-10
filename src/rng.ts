import '../styles/styles.css';

const result = document.getElementById('result') as HTMLDivElement
const rollButton = document.getElementById('roll-button') as HTMLButtonElement

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

const colorProbability: Array<number> = [0.5, 0.8, 0.95, 0.98, 0.99, 0.996, 0.999]
const typeProbability: Array<number> = [0.5, 0.8, 0.95, 0.98, 0.99, 0.996, 0.999]
const fontProbability: Array<number> = [0.5, 0.8, 0.95, 0.98, 0.995]
const sizeProbability: Array<number> = [0.5, 0.8, 0.95, 0.98, 0.99, 0.996, 0.999]

let chosenColor: string
let chosenType: string
let chosenFont: string
let chosenSize: number

function getRandomisedIndex(thresholds: Array<number>): number {
    let randomised: number = Math.random()
    return thresholds.findIndex(t => randomised < t) ?? thresholds.length - 1
}

rollButton.onclick = () => {
    chosenColor = colors[getRandomisedIndex(colorProbability)]
    chosenType = types[getRandomisedIndex(typeProbability)]
    chosenFont = fonts[getRandomisedIndex(fontProbability)]
    chosenSize = sizes[getRandomisedIndex(sizeProbability)]
    
    let result = new Tag(chosenColor, chosenType, chosenSize, chosenFont)


    rollButton.disabled = true

    setTimeout(() => {
        result.display()
        rollButton.disabled = false
    }, 500);
}