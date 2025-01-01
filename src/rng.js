const resultElement = document.getElementById("result")

class CreateTag {
    special = false

    constructor(name, value, description, color) {
        this.name = name
        this.value = value // value is percentage chance
        this.description = description
        this.color = color
    }

    getValue() {
        return this.value + ' % chance';
    }

    setTagColor() {
        resultElement.style.color = this.color
    }
}

class SpecialTag extends CreateTag {
    special = true

    constructor(name, value, description, color, attribute='', minigame, font) {
        super(name, value, description, color)
        this.attribute = attribute
        this.minigame = minigame
        this.font = font
    }

    getAttribute() {
        if (attribute !== '') {
            return `but wait, it's special! ${this.attribute}`
        }
        return
    }

    displayMinigame() {
        return `since this is special, you must play a minigame to obtain it: ${this.minigame}`
    }

    setFont() {
        resultElement.style.fontFamily = this.font
    }
}

// value is percentage chance (e.g. 50 will be 50%)
const bruteForce = new CreateTag("brute force", 50, "Most common exploit, also being the most easy to avoid", "white")
const bufferOverflow = new CreateTag("buffer overflow", 25, "Another common exploit, but slightly more professional", "white")
const rainbowTable = new CreateTag("rainbow table", 12, "An exploit that shows a little more understanding but still lacking", "white")
const SQLInjection = new CreateTag("SQL injection", 5, "Easy, but obsolete against modern databases", "white")
const DDoS = new CreateTag("DDoS", 3, "Overwhelming vulnerable servers and requires a little more plotting", "green")
const socialEngineering = new CreateTag("social engineering", 2.5, "Clever manipulations to trick people into giving information", "red")
const rootkit = new CreateTag("rootkit", 1.5, "Causing damage AND being hidden? That's advanced", "blue")
const dataInterception = new CreateTag("data interception", 0.7, "Intercepting data, just like the name says", "yellow")
const Day0 = new SpecialTag("0-day exploit", 0.3, "The gold mine for hackers - a newly discovered vulnerability", "purple", '', 'button clicking', 'Courier New')

const rollButton = document.getElementById("rollButton");
const options = [
    bruteForce,
    bufferOverflow,
    rainbowTable,
    SQLInjection,
    DDoS,
    socialEngineering,
    rootkit,
    dataInterception,
    Day0
];

function RNG() {
    let origin = Math.floor(Math.random() * 1000);
    const thresholds = [500, 750, 870, 920, 950, 975, 990, 997];
    const index = thresholds.findIndex(threshold => origin < threshold);
    
    return options[index !== -1 ? index : 8];
}

function tagToObject(tag) {
    switch (tag) {
        case 'brute force':
            return bruteForce
        case 'buffer overflow':
            return bufferOverflow
        case 'rainbow table':
            return rainbowTable
        case 'SQL injection':
            return SQLInjection
        case 'DDoS':
            return DDoS
        case 'social engineering':
            return socialEngineering
        case 'rootkit':
            return rootkit
        case 'data interception':
            return dataInterception
        case '0-day exploit':
            return Day0
        default:
            return
    }
}

function rollForItem() {
    resultElement.style.color = 'white'
    rollButton.disabled = true
    document.getElementById('gotTag').style.visibility = 'visible'
    let spins = 0;
    let delay = 150;

    function roll() {
        resultElement.style.fontFamily = 'Arial'
        // Select a random item
        let rolling = RNG();
        let result = RNG();
        
        // Update the text content with the result
        resultElement.textContent = rolling.name;

        rolling.setTagColor()
        if (rolling.special) {
            rolling.setFont()
        }
        // Stop after 20 spins
        if (spins > 9) {
            rollButton.disabled = false
            resultElement.textContent = result.name;
            result.setTagColor()
            if (rolling.special) {
                rolling.setFont()
            }

            localStorage.setItem('recent', result.name)
            document.getElementById('desc').style.display = 'block'
            document.getElementById('desc').textContent = result.description
            return; // Stop the function from running further
        }

        // Increase delay by 40ms for the next spin
        delay += 40;

        // Set the next timeout with the updated delay
        spins++;
        setTimeout(roll, delay);
    }

    // Start the first roll with initial delay
    setTimeout(roll, delay);
}

let recent = tagToObject(localStorage.getItem('recent'))

if (recent !== undefined) {
    recent.textContent += `${recent.name}, ${recent.getValue}`
} else {
    throw new Error('error')
}

rollButton.addEventListener("click", rollForItem);
