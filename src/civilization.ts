const button1 = document.getElementById('button1') as HTMLButtonElement
const button2 = document.getElementById('button2') as HTMLButtonElement
const button3 = document.getElementById('button3') as HTMLButtonElement
const button4 = document.getElementById('button4') as HTMLButtonElement
const button5 = document.getElementById('button5') as HTMLButtonElement
const desc = document.getElementById('desc') as HTMLElement
const roundCount = document.getElementById('round-count') as HTMLElement
const pointCounter = document.getElementById('point-counter') as HTMLElement
let round: Round
let specialMethods: SpecialMethods

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

    public gifts(): void {
        setSituation(this.roundInstance.getRound(), 'Gifts!', 'A lot of civilizations came and gave you gifts.<br>Gained 10 points.')
        this.roundInstance.addPts(10)
    }
}

// methods relating to tokens are here
class SpecialMethods {
    public roundInstance: Round

    constructor(roundInstance: Round) {
        this.roundInstance = roundInstance
    }

    public tokensToPts() {
        this.roundInstance.addPts(3)
        this.roundInstance.modifyTokens(-1)
    }
}

// civilization object and only the standard methods here
class Round {
    private civilization: string
    private pts: number
    private focus: string
    private roundNum: number
    private emergencyWater: boolean
    private happiness: number
    private hasTribute: boolean
    private faminePotential: boolean
    private builtLess: boolean
    private immunity: boolean
    private difficulty: string
    private tornadoEffects: number
    private respect: number
    private tokens: number 
    private specialMethods: DifficultyMethods

    constructor(civilization: string, pts: number, focus: string, difficulty: string) {
        this.civilization = civilization
        this.pts = pts
        this.focus = focus
        this.difficulty = difficulty
        this.roundNum = 0
        this.emergencyWater = false
        this.happiness = 3
        this.hasTribute = false
        this.faminePotential = false
        this.builtLess = false
        this.immunity = false
        this.tornadoEffects = 0
        this.respect = 0
        this.tokens = 0
        this.specialMethods = new DifficultyMethods(this)
    }

    private async randomEvent() {
        let randevent: number = Math.floor(Math.random() * 10)

        switch (randevent) {
            case 0: this.plague(); break
            case 1: this.flood(); break
            case 2: this.trade(); break    
            case 3: await this.gold(); break
            case 4: this.waterShortage(); break
            case 5: await this.buy(); break
            case 6: this.farms(); break
            case 7: this.tornado(); break
            case 8: await this.resources(); break
            case 9: this.famine(); break
        }
    }

    public async newRound(): Promise<void> {
        this.roundNum++
        if (this.happiness <= 0) this.revolution()
        else if (this.roundNum % 30 === 0) this.difficulty === 'hard' ? this.specialMethods.asteroid() : this.specialMethods.gifts()
        else if (this.roundNum % 15 === 0) this.difficulty === 'hard' ? this.specialMethods.thermonuclearWarhead() : this.specialMethods.celebrations()
        else if (this.roundNum % 10 === 0) this.raid()
        else if (this.roundNum % 5 === 0) await this.waterChoice()
        else await this.randomEvent()

        if (this.tornadoEffects > 0) {
            this.pts--
            this.tornadoEffects--
        }
    }

    // getters/modifiers to control access
    public getRound(): number {
        return this.roundNum
    }

    public getPts(): number {
        return this.pts
    }

    public addPts(ptsToAdd: number): void {
        this.pts += ptsToAdd
    }

    public getTokens(): number {
        return this.tokens
    }

    public modifyTokens(tokensToModify: number): void {
        this.tokens += tokensToModify // plus operator can also simulate minus hence why we use it
    }

    // actual methods start here
    private plague(): void {
        setSituation(this.roundNum, 'Plague', !this.immunity ? 'Your civilization was hit by a heavy plague.<br>Lost 4 points' : 'Your civilization was hit by a plague but you had immunity.<br>Lost 1 point.')

        if (!this.immunity) this.pts -= 4
        else this.pts--

        this.immunity = !this.immunity
    }

    private flood(): void {
        roundCount.innerHTML = `Round ${this.roundNum}: Flood`
        switch (this.civilization) {
            case 'floodplains': 
                desc.innerHTML = 'The floods absolutely devoured your civilization with no mercy.<br>Lost 4 points.'
                this.pts -= 4
                break
            case 'mountains':
                desc.innerHTML = 'The floods did a minor toll on your civilization.<br>Lost 2 points.'
                this.pts -= 2
                break
            case 'desert':
                desc.innerHTML = 'You heard news that a flood happened nearby. However, being in the desert, there is a lack of water.<br>No points gained or lost.'
                break
        }   
    }

    private waterChoice(): Promise<void> {
        roundCount.innerHTML = `Round ${this.roundNum}: Water Situation`
        desc.innerHTML = 'You discover that you have an excess supply of water. What do you want to do with the exccess water?'
        button1.style.display = 'flex'
        button2.style.display = 'flex'

        setButtonText('Irrigate the crops', this.emergencyWater ? 'Already excess water' : 'Save the water')
        if (this.emergencyWater) button2.disabled = true
        
        return new Promise<void>((resolve) => {
            button1.onclick = () => {
                desc.innerHTML = 'You irrigate the crops and they seem to grow a lot better.<br>Gained 3 points.'
                this.pts += 3
                button2.disabled = false
                resolve()
            }

            button2.onclick = () => {
                desc.innerHTML = 'You decide to think for the future and save your excess water for later use. Perhaps this might come in useful later...?<br>No points gained or lost.'
                this.respect++
                this.emergencyWater = true
                resolve()
            }
        })
    }

    private gold(): Promise<void> {
        roundCount.innerHTML = `Round ${this.roundNum}: Gold!`
        desc.innerHTML = 'You struck gold, a valuable resource! What would you like to do with it?'
        button1.style.display = 'flex'; button2.style.display = 'flex'; button3.style.display = 'flex'
        setButtonText('Take it all', 'Give them to the people', 'Pay tribute to the gods')

        return new Promise<void>((resolve) => {
            button1.onclick = () => {
                desc.innerHTML = 'You took all the gold for yourself, because you are king of this civilization. However, not that many people are happy with your decision...<br>Gained 3 points.'
                this.happiness -= Math.floor(Math.random() * 2) + 1
                this.pts += 3
                resolve()
            }

            button2.onclick = () => {
                desc.innerHTML = "You decided that sharing is caring and gave them all to the people, because communism. The people seemed happy, but you didn't really get anything.<br>No points gained or lost, but this may not be a bad thing..."
                this.respect += 2
                this.happiness++
                resolve()
            }

            button3.onclick = () => {
                desc.innerHTML = "The gods should be honored was what you decided. Your people agree with this as that will probably be the best use scenario - satisfying the gods so that they could protect you, but this will only come in handy later...<br>No points gained or lost."
                this.respect++
                this.hasTribute = true
                resolve()
            }
        })
    }

    private raid(): void {
        setSituation(this.roundNum, 'Raid')
        if (this.hasTribute) {
            desc.innerHTML = "The civilization is trying to raid you, and they found your tribute and took it and left. At least it didn't crumble...<br>No points gained or lost."
            this.hasTribute = false
        } else if (this.focus === 'raiding') {
            desc.innerHTML = "The civilization is trying to raid you, but you, being raiders, defended yourself quite well.<br>Lost 2 points."
            this.pts -= 2
        } else {
            desc.innerHTML = "The civilization has raided you and took everything valuable in your civilization with no mercy.<br>Lost 5 points."
            this.pts -= 5
        }
    }

    private trade(): void {
        setSituation(this.roundNum, 'Trades', 
            this.focus === 'trading' ? "You bargained with the civlization and got some extra.<br>Gained 5 points." : "You made some trades.<br>Gained 3 points."
        )
        
        this.focus += (this.focus === 'trading' ? 5 : 3)
    }

    private waterShortage(): void {
        roundCount.innerHTML = `Round ${this.roundNum}: Water Shortage`
        let random = Math.floor(Math.random() * 3) + 2 // generate number between 2 and 4 inclusive so that this is a risk

        if (this.emergencyWater) {
            desc.innerHTML = 'There has been a water shortage, but luckily, you thought beforehand and used the preserved water.'
            this.emergencyWater = false
        } else {
            desc.innerHTML = `There has been a water shortage, and since you didn't have a backup water source, some people died of dehydration.<br>Lost ${random} points.`
            this.pts -= random
        }
    }

    private revolution(): void {
        setSituation(this.roundNum, 'Revolution', "Due to your bad decisions, your people hate you and rebelled against you.<br>Lost 10 points.")
        this.pts -= 10
    }

    private buy(): Promise<void> {
        setSituation(this.roundNum, 'Build', "Your people ask for you to build some more things. What do you wish to build?")
        button1.style.display = 'flex'; button2.style.display = 'flex'; button3.style.display = 'flex'; button4.style.display = 'flex'; button5.style.display = 'flex'
        setButtonText('Schools', 'Roads', 'Healthcare', 'Temple', 'Nothing')
        
        return new Promise<void>((resolve) => {
            button1.onclick = () => {
                desc.innerHTML = 'Your people decided that for whatever reason, schools were not the main priority, which is probably expected from civilians that did not get much education.<br>Lost 2 points.'
                this.pts -= 2
                resolve()
            }

            button2.onclick = () => {
                desc.innerHTML = "Out of all the things that you could've spent the civilization's resources on, you decided that roads would be the main priority. It is no wonder that your people aren't happy.<br>Lost 3 points."
                this.pts -= 3
                resolve()
            }

            button3.onclick = () => {
                desc.innerHTML = "You actually decide to spend your resources on something actually good! But, this was a massive fail because your people did not know how to treat patients, but it was an epic fail.<br>Lost 1 point."
                this.pts--
                resolve()
            }

            button4.onclick = () => {
                desc.innerHTML = "Worshipping your gods were your top priority, but it didn't really sit well with your people because you could've spent it on something more immediately beneficial to your civilization.<br>Lost 2 points."
                this.pts -= 2
                resolve()
            }

            button5.onclick = () => {
                desc.innerHTML = "You decided not listen to your people and your people were not very happy about it.<br>Lost 4 points."
                this.pts -= 4
                this.builtLess = true
                resolve()
            }
        })
    }

    private farms(): void {
        roundCount.innerHTML = `Round ${this.roundNum}: Farm Success`
        switch (this.civilization) {
            case 'floodplains':
                desc.innerHTML = "Your farms grew extremely successful, and paired with the fertile soil of the floodplains, you gained a lot.<br>Gained 5 points."
                this.pts += 5
                break
            case 'mountains':
                desc.innerHTML = "Your farms grew quite successful in your civilization.<br>Gained 3 points."
                this.pts += 3
                break
            case 'desert':
                desc.innerHTML = "Your farms grew a little successful in your civilization.<br>Gained 1 point."
                this.pts++
                break
        }
    }

    private tornado(): void {
        roundCount.innerHTML = `Round ${this.roundNum}: Tornado`
        if (this.focus === 'building') {
            desc.innerHTML = "A tornado went through your civilization, but since your civilization was specialized in building, it was quite fortified and you also repaired it with ease.<br>Lost 1 point."
            this.pts--
        } else {
            desc.innerHTML = "A tornado did a major toll on your civilization, and you don't see much recovery anytime soon.<br>Lost 5 points."
            this.pts -= 5
            if (this.difficulty === 'hard') this.tornadoEffects = 4
            else if (this.difficulty === 'normal') this.tornadoEffects = 3
            else this.tornadoEffects = 2
        }
    }

    private resources(): Promise<void> {
        if (this.faminePotential) {
            return new Promise<void>((resolve) => {
                this.famine()
                resolve()
            })
        }

        setSituation(round.roundNum, 'Resource Crisis', 'You are running out of resources. What do you do?')
        if (this.builtLess) {
            return new Promise<void>((resolve) => {
                desc.innerHTML = "You almost had a resource crisis, but due to you building less, it didn't really have an effect, but after that, your building speed has gone back to normal.<br>Lost 1 point."
                this.pts--
                this.builtLess = false
                resolve()
            })
        }

        button1.style.display = 'flex'
        button2.style.display = 'flex'
        button1.innerHTML = 'Do nothing'

        switch (this.focus) {
            case 'building':
                button2.innerHTML = "Build less"
                return new Promise<void>((resolve) => {
                    button1.onclick = () => {
                        desc.innerHTML = "You decide to do nothing about it.<br>Lost 4 points."
                        this.pts -= 4
                        resolve()
                    }

                    button2.onclick = () => {
                        desc.innerHTML = "You decide to build less, but that was a big problem because your civilization is primarily focused on building.<br>Lost 6 points."
                        this.pts -= 6
                        this.builtLess = true
                        resolve()
                    }
                })

            case 'trading':
                button2.innerHTML = "Trade with other civilizations"
                return new Promise<void>((resolve) => {
                    button1.onclick = () => {
                        desc.innerHTML = "You did nothing about the resource crisis.<br>Lost 4 points."
                        this.pts -= 4
                        resolve()
                    }

                    button2.onclick = () => {
                        desc.innerHTML = "You traded with another civilization with your food to try to avoid it. However, now your food is little.<br>No points gained or lost."
                        this.faminePotential = true
                        resolve()
                    }
                })

            case 'raiding':
                button2.innerHTML = "Raid another civilization"

                return new Promise<void>((resolve) => {
                    button1.onclick = () => {
                        desc.innerHTML = "You did nothing about the resource crisis.<br>Lost 3 points."
                        this.pts -= 3
                        resolve()
                    }

                    button2.onclick = () => {
                        let randevent = Math.floor(Math.random() * 2)
                        if (randevent === 0) {
                            desc.innerHTML = "You decided to raid another civilization and lost.<br>Lost 6 points."
                            this.pts -= 6
                            resolve()
                        } else {
                            desc.innerHTML = "You decided to raid another civilization and won.<br>Gained 3 points."
                            this.pts += 3
                            resolve()
                        }
                    }
                })
            default:
                return new Promise<void>((resolve) => {
                    console.error("unknown civilization detected")
                    resolve()
                })
        }
    }

    private famine(): void {
        setSituation(this.roundNum, 'Famine', "You had a famine and it hit really hard.<br>Lost 9 points.")
        this.pts -= 9
        this.faminePotential = false
    }
}

function waitForClick(civ: boolean=false, focus: boolean=false, difficulty: boolean=false): Promise<string> {
    return new Promise<string>((resolve) => {
        if (civ) {
            button1.onclick = () => resolve('floodplains')
            button2.onclick = () => resolve('mountains')
            button3.onclick = () => resolve('desert')
        } else if (focus) {
            button1.onclick = () => resolve('building')
            button2.onclick = () => resolve('trading')
            button3.onclick = () => resolve('raiding')
        } else if (difficulty) {
            button1.onclick = () => resolve('easy')
            button2.onclick = () => resolve('normal')
            button3.onclick = () => resolve('hard')
        } else {
            button1.onclick = () => resolve('')
        }
    })
}

// pts mapping values may change due to balancing
const ptsMapping: { [key: string]: number } = {
    floodplains: 10,
    mountains: 8,
    desert: 5
}

async function roundLoop(civilization: string, focus: string, difficulty: string) {
    round = new Round(civilization, ptsMapping[civilization], focus, difficulty)
    specialMethods = new SpecialMethods(round)

    desc.innerHTML = `You have chosen ${civilization}.`
    button1.innerHTML = 'Start'
    button2.style.display = 'none'
    button3.style.display = 'none'
    await waitForClick()

    while (true) {
        button1.style.display = 'none'
        button2.style.display = 'none'
        button3.style.display = 'none'
        button4.style.display = 'none'
        button5.style.display = 'none'
        await round.newRound()

        if (round.getPts() > 0) {
            button1.style.display = 'flex'
            button2.style.display = 'none'
            button3.style.display = 'none'
            button4.style.display = 'none'
            button5.style.display = 'none'

            button1.innerHTML = 'Continue to next round'
            pointCounter.innerHTML = `Current points: ${round.getPts()}`
            await waitForClick()
        } else {
            desc.innerHTML += `<br>Your civilization has crumbled! Made it to round ${round.getRound()} before the ultimate demise of your society.`
            pointCounter.style.display = 'none'
            button1.style.display = 'none'; button2.style.display = 'none'; button3.style.display = 'none'; button4.style.display = 'none'; button5.style.display = 'none'
            break
        }
    }
}

async function startGame() {
    desc.textContent = 'Choose your environment.'
    button1.innerHTML = 'Floodplains'
    button2.innerHTML = 'Mountains'
    button3.innerHTML = 'Desert'
    button1.style.display = 'flex'; button2.style.display = 'flex'; button3.style.display = 'flex'
    let civ: string = await waitForClick(true, false, false)

    desc.innerHTML = 'Choose the focus of your civilization'
    button1.innerHTML = 'Building'
    button2.innerHTML = 'Trading'
    button3.innerHTML = 'Raiding'
    let focus: string = await waitForClick(false, true, false)

    desc.innerHTML = 'Choose the difficulty'
    button1.innerHTML = 'Easy'
    button2.innerHTML = 'Normal'
    button3.innerHTML = 'Hard'
    let difficulty: string = await waitForClick(false, false, true)

    roundLoop(civ, focus, difficulty)
}

button1.onclick = () => startGame()