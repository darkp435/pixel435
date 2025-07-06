const button1 = document.getElementById('button1') as HTMLButtonElement
const button2 = document.getElementById('button2') as HTMLButtonElement
const button3 = document.getElementById('button3') as HTMLButtonElement
const button4 = document.getElementById('button4') as HTMLButtonElement
const button5 = document.getElementById('button5') as HTMLButtonElement
const desc = document.getElementById('desc') as HTMLDivElement
const roundCount = document.getElementById('round-count') as HTMLElement
const pointCounter = document.getElementById('point-counter') as HTMLDivElement
const tokenCounter = document.getElementById('token-counter') as HTMLDivElement
const respectCounter = document.getElementById('respect-counter') as HTMLDivElement
const exchangeTokens = document.getElementById('exchange-tokens') as HTMLButtonElement
let round: Round

enum Focus {
    Building,
    Trading,
    Raiding
}

enum Difficulty {
    Easy,
    Normal,
    Hard
}

enum CivType {
    Floodplains,
    Desert,
    Mountains
}

function setButtonText(text1: string='', text2: string='', text3: string='', text4: string='', text5: string=''): void {
    button1.innerHTML = text1
    button2.innerHTML = text2
    button3.innerHTML = text3
    button4.innerHTML = text4
    button5.innerHTML = text5
}

function setSituation(roundNumber: number, roundBrief: string, roundDesc: string='') {
    roundCount.innerHTML = `Round ${roundNumber}: ${roundBrief}`
    desc.innerHTML = roundDesc
}

// only methods relating to difficulties are here
class DifficultyMethods {
    public roundInstance: Round

    constructor(roundInstance: Round) {
        this.roundInstance = roundInstance
    }

    public celebrations(): void {
        setSituation(this.roundInstance.getRound(), 'Celebrations', "You've made it this far, and got celebrations from another civilization.<br>Gained 5 points.")
        this.roundInstance.addPts(5)
    }

    public thermonuclearWarhead(): void {
        setSituation(this.roundInstance.getRound(), 'Thermonuclear Warhead', 'Oh no! Another civilization launhed a thermonuclear warhead at you!<br>Lost 20 points.')
        this.roundInstance.addPts(-20)
    }

    public asteroid(): void {
        setSituation(this.roundInstance.getRound(), 'Asteroid!', 'A gigantic asteroid from outer space hit your civilization.<br>Lost 30 points.')
        this.roundInstance.addPts(-30)
    }

    public UFO(): void {
        setSituation(this.roundInstance.getRound(), 'UFO!', 'A UFO came around and absolutely obliterated your civilization.<br>Lost 50 points.')
        this.roundInstance.addPts(-50)
    }

    public gifts(): void {
        setSituation(this.roundInstance.getRound(), 'Gifts!', 'A lot of civilizations came and gave you gifts.<br>Gained 10 points.')
        this.roundInstance.addPts(10)
    }

    public goodUFO(): void {
        setSituation(this.roundInstance.getRound(), 'Alien Gifts!', 'A foreign civilization from another planet personally visited you to give you some gifts.<br>Gained 20 points.')
        this.roundInstance.addPts(20)
    }
}

// methods relating to tokens are here
class SpecialMethods {
    public roundInstance: Round

    constructor(roundInstance: Round) {
        this.roundInstance = roundInstance
    }

    public tokensToPts() {
        if (this.roundInstance.getTokens() > 0) {
            this.roundInstance.addPts(3)
            this.roundInstance.modifyTokens(-1)
        }
    }
}

// civilization object and only the standard methods here
... (497 lines left)