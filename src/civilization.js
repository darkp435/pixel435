const button1 = document.getElementById('button1')
const button2 = document.getElementById('button2')
const button3 = document.getElementById('button3')
const button4 = document.getElementById('button4')
const button5 = document.getElementById('button5')
const desc = document.getElementById('desc')
const roundCount = document.getElementById('round-count')
const pointCounter = document.getElementById('point-counter')
let randevent

class Round {
    #civilization
    #pts
    #focus
    #roundNum
    #emergencyWater
    #happiness
    #hasTribute

    constructor(civilization, pts, focus) {
        this.#civilization = civilization
        this.#pts = pts
        this.#focus = focus
        this.#roundNum = 0
        this.#emergencyWater = false
        this.#happiness = 3
        this.#hasTribute = false
    }

    newRound() {
        this.#roundNum++
    }

    getRound() {
        return this.#roundNum
    }

    getPts() {
        return this.#pts
    }

    plague() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Plague`
        desc.innerHTML = 'Your civilization was hit with a heavy plague.<br>Lost 2 points.'
        this.#pts -= 2
    }

    flood() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Flood`
        switch (this.#civilization) {
            case 'floodplains': 
                desc.innerHTML = 'The floods absolutely devoured your civilization with no mercy.<br>Lost 4 points.'
                this.#pts -= 4
                break
            case 'mountains':
                desc.innerHTML = 'The floods did a minor toll on your civilization.<br>Lost 2 points.'
                this.#pts -= 2
                break
            case 'desert':
                desc.innerHTML = 'You heard news that a flood happened nearby. However, being in the desert, there is a lack of water.<br>No points gained or lost.'
                break
        }   
    }

    waterChoice() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Water Situation`
        desc.innerHTML = 'You discover that you have an excess supply of water. What do you want to do with the exccess water?'
        button1.style.display = 'flex'
        button2.style.display = 'flex'

        button1.innerHTML = 'Irrigate the crops'
        button2.innerHTML = 'Save the water (in case of emergency)'
        
        return new Promise((resolve) => {
            button1.onclick = () => {
                desc.innerHTML = 'You irrigate the crops and they seem to grow a lot better.<br>Gained 3 points.'
                this.#pts += 3
                resolve()
            }

            button2.onclick = () => {
                desc.innerHTML = 'You decide to think for the future and save your excess water for later use. Perhaps this might come in useful later...?<br>No points gained or lost.'
                this.#emergencyWater = true
                resolve()
            }
        })
    }

    gold() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Gold!`
        desc.innerHTML = 'You struck gold, a valuable resource! What would you like to do with it?'
        button1.style.display = 'flex'
        button1.innerHTML = 'Take them all'
        button2.style.display = 'flex'
        button2.innerHTML = 'Give them to the people'
        button3.style.display = 'flex'
        button3.innerHTML = 'Pay tribute to the gods'

        return new Promise((resolve) => {
            button1.onclick = () => {
                desc.innerHTML = 'You took all the gold for yourself, because you are king of this civilization. However, not that many people are happy with your decision...<br>Gained 3 points.'
                this.#happiness -= Math.floor(Math.random() * 2) + 1
                this.#pts += 3
                resolve()
            }

            button2.onclick = () => {
                desc.innerHTML = "You decided that sharing is caring and gave them all to the people, because communism. The people seemed happy, but you didn't really get anything.<br>No points gained or lost, but this may not be a bad thing..."
                this.#happiness++
                resolve()
            }

            button3.onclick = () => {
                desc.innerHTML = "The gods should be honored was what you decided. Your people agree with this as that will probably be the best use scenario - satisfying the gods so that they could protect you, but this will only come in handy later...<br>No points gained or lost."
                this.#hasTribute = true
                resolve()
            }
        })
    }

    raid() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Raid`
        if (this.#hasTribute) {
            desc.innerHTML = "The civilization is trying to raid you, and they found your tribute and took it and left. At least it didn't crumble...<br>No points gained or lost."
            this.#hasTribute = false
        } else if (this.#focus === 'raiding') {
            desc.innerHTML = "The civilization is trying to raid you, but you, being raiders, defended yourself quite well.<br>Lost 2 points."
            this.#pts -= 2
        } else {
            desc.innerHTML = "The civilization has raided you and took everything valuable in your civilization with no mercy.<br>Lost 5 points."
            this.#pts -= 5
        }
    }

    trade() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Trading`
        if (this.#focus === 'trading') {
            desc.innerHTML = "Being focused on trading, you naturally learnt how to negotiate and bargain, and trading was your expertise.<br>Gained 5 points."
            this.#pts += 5
        } else {
            desc.innerHTML = "You made some trades with another civilization. You didn't really know how to do it, so you could've gotten a bit more.<br>Gained 3 points."
            this.#pts += 3
        }
    }

    waterShortage() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Water Shortage`
        let random = Math.floor(Math.random() * 3) + 2 // generate number between 2 and 4 inclusive so that this is a risk

        if (this.#emergencyWater) {
            desc.innerHTML = 'There has been a water shortage, but luckily, you thought beforehand and used the preserved water.'
            this.#emergencyWater = false
        } else {
            desc.innerHTML = `There has been a water shortage, and since you didn't have a backup water source, some people died of dehydration.<br>Lost ${random} points.`
            this.#pts -= random
        }
    }

    revolution() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Revolution`
        desc.innerHTML = "Due to your bad decisions, your people don't want to be ruled by you. They plotted a revolution and you have been overthrown by your people.<br>Maybe hoarding that gold all to yourself wasn't a good idea...?<br>Due to this, you are no longer in charge of your civilization, but at least they have a new leader now that could probably manage a civilization better than you, right?"
    }

    buy() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Build`
        desc.innerHTML = "Your people ask for you to build some things to benefit the civilization more. What do you wish to build?"
        button1.style.display = 'flex'; button2.style.display = 'flex'; button3.style.display = 'flex'; button4.style.display = 'flex', button5.style.display = 'flex'
        button1.innerHTML = 'Schools'
        button2.innerHTML = 'Roads'
        button3.innerHTML = 'Healthcare'
        button4.innerHTML = 'Temple'
        button5.innerHTML = 'Farms'
        
        return new Promise((resolve) => {
            button1.onclick = () => {
                desc.innerHTML = 'Your people decided that for whatever reason, schools were not the main priority, which is probably expected from civilians that did not get much education.<br>Lost 2 points.'
                this.#pts -= 2
                resolve()
            }

            button2.onclick = () => {
                desc.innerHTML = "Out of all the things that you could've spent the civilization's resources on, you decided that roads would be the main priority. It is no wonder that your people aren't happy.<br>Lost 3 points."
                this.#pts -= 3
                resolve()
            }

            button3.onclick = () => {
                desc.innerHTML = "You actually decide to spend your resources on something actually good! But, this was a massive fail because your people did not know how to treat patients, but it was an epic fail.<br>Lost 1 point."
                this.#pts--
                resolve()
            }

            button4.onclick = () => {
                desc.innerHTML = "Worshipping your gods were your top priority, but it didn't really sit well with your people because you could've spent it on something more immediately beneficial to your civilization.<br>Lost 2 points."
                this.#pts -= 2
                resolve()
            }

            button5.onclick = () => {
                desc.innerHTML = "Your people expected something more... specialised, but oh well, you got some extra farms, at least that's extra food, even though you still had plenty.<br>No points gained or lost."
                resolve()
            }
        })
    }

    farms() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Farm Success`
        switch (this.#civilization) {
            case 'floodplains':
                desc.innerHTML = "Your farms grew extremely successful, and paired with the fertile soil of the floodplains, you gained a lot.<br>Gained 5 points."
                this.#pts += 5
                break
            case 'mountains':
                desc.innerHTML = "Your farms grew quite successful in your civilization.<br>Gained 3 points."
                this.#pts += 3
                break
            case 'desert':
                desc.innerHTML = "Your farms grew a little successful in your civilization.<br>Gained 1 point."
                this.#pts++
                break
        }
    }

    tornado() {
        roundCount.innerHTML = `Round ${this.#roundNum}: Tornado`
        if (this.#focus === 'building') {
            desc.innerHTML = "A tornado went through your civilization, but since your civilization was specialized in building, it was quite fortified and you also repaired it with ease.<br>Lost 1 point."
            this.#pts--
        } else {
            desc.innerHTML = "A tornado did a major toll on your civilization, and you don't see that much recovery soon.<br>Lost 5 points."
            this.#pts -= 5
        }
    }
}

function waitForClick(civ=false, focus=false) {
    return new Promise((resolve) => {
        if (civ) {
            button1.onclick = () => resolve('floodplains')
            button2.onclick = () => resolve('mountains')
            button3.onclick = () => resolve('desert')
        } else if (focus) {
            button1.onclick = () => resolve('building')
            button2.onclick = () => resolve('trading')
            button3.onclick = () => resolve('raiding')
        } else {
            button1.onclick = () => resolve()
        }
    })
}

async function rounds(civilization, focus) {
    let round

    switch (civilization) {
        case 'floodplains': 
            round = new Round('floodplains', 10, focus); break
        case 'mountains':
            round = new Round('mountains', 8, focus); break
        case 'desert':
            round = new Round('desert', 5, focus); break
    }

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
        pointCounter.innerHTML = `Current points: ${round.getPts()}`

        round.newRound()

        if (round.happiness <= 0) {
            round.revolution()
            break
        } else if (round.getRound() % 10 === 0 && round.getRound() !== 0) {
            round.raid()
        } else if (round.getRound() % 5 === 0 && round.getRound() !== 0) {
            await round.waterChoice()
        } else {
            randevent = Math.floor(Math.random() * 8) // num of unique rounds
            switch (randevent) {
                case 0: round.plague(); break
                case 1: round.flood(); break
                case 2: round.trade(); break    
                case 3: await round.gold(); break
                case 4: round.waterShortage(); break
                case 5: await round.buy(); break
                case 6: round.farms(); break
                case 7: round.tornado(); break
            }
        }

        if (round.getPts() > 0) {
            button1.style.display = 'flex'
            button2.style.display = 'none'
            button3.style.display = 'none'
            button4.style.display = 'none'
            button5.style.display = 'none'

            button1.innerHTML = 'Continue to next round'
            await waitForClick()
        } else {
            desc.innerHTML += `<br>Your civilization has crumbled! Made it to round ${round.getRound()} before the ultimate demise of your society.`
            button1.style.display = 'none'; button2.style.display = 'none'; button3.style.display = 'none'
            break
        }
    }
}

async function startGame() {
    let civ, focus

    desc.textContent = 'Choose your environment.'
    button1.innerHTML = 'Floodplains'
    button2.innerHTML = 'Mountains'
    button3.innerHTML = 'Desert'
    button1.style.display = 'flex'; button2.style.display = 'flex'; button3.style.display = 'flex'
    civ = await waitForClick(true)

    desc.innerHTML = 'Choose the focus of your civilization'
    button1.innerHTML = 'Building'
    button2.innerHTML = 'Trading'
    button3.innerHTML = 'Raiding'
    focus = await waitForClick(focus=true)

    rounds(civ, focus)
}

button1.onclick = () => startGame()