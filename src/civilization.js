const button1 = document.getElementById('button1')
const button2 = document.getElementById('button2')
const button3 = document.getElementById('button3')
const desc = document.getElementById('desc')
const roundCount = document.getElementById('round-count')
let randevent

class Round {
    constructor(civilization, pts) {
        this.civilization = civilization
        this.pts = pts
        this.roundNum = 0
        this.emergencyWater = false
    }

    plague() {
        this.roundNum++
        roundCount.innerHTML = `Round ${this.roundNum}: Plague`
        desc.innerHTML = 'Your civilization was hit with a heavy plague.<br>2 points lost.'
        this.pts -= 2
    }

    flood() {
        this.roundNum++
        roundCount.innerHTML = `Round ${this.roundNum}: Flood`
        switch (civilization) {
            case 'floodplains': 
                desc.innerHTML = 'The floods absolutely devoured your civilization with no mercy.<br>4 points lost.'
                this.pts -= 4
            case 'mountains':
                desc.innerHTML = 'The floods did a minor toll on your civilization.<br>2 points lost.'
                this.pts -= 2
            case 'desert':
                desc.innerHTML = 'You heard news that a flood happened nearby. However, being in the desert, there is a lack of water.<br>No points gained or lost.'
        }
    }

    waterChoice() {
        this.roundNum++
        roundCount.innerHTML = `Round ${this.roundNum}: Water Situation`
        desc.innerHTML = 'You discover that you have an excess supply of water. What do you want to do with the exccess water?'
        button1.style.display = 'flex'
        button2.style.display = 'flex'

        button1.innerHTML = 'Irrigate the crops'
        button2.innerHTML = 'Save the water (in case of emergency)'
        
        const waitForClick = new Promise((resolve) => {
            button1.onclick = () => {
                desc.innerHTML = 'You irrigate the crops and they seem to grow a lot better.<br>3 points from the extra food.'
                this.pts += 3
                resolve()
            }

            button2.onclick = () => {
                desc.innerHTML = 'You decide to think for the future and save your excess water for later use. Perhaps this might come in useful later...?'
                this.emergencyWater = true
                resolve()
            }
        })

        waitForClick.then(() => {
            return
        })
    }

    gold() {
        this.roundNum++
        desc.innerHTML = 'You struck gold, a valuable resource!<br>Gained 3 points.'
        this.pts += 3
    }

    trade() {
        this.roundNum++
        desc.innerHTML = 'You found another civilization and made some trades with them. The trades were way better for you than they were for them.<br>Gained 3 points.'
        this.pts += 3
    }

    waterShortage() {
        this.roundNum++
        let random = Math.floor(Math.random() * 3) + 2 // generate number between 2 and 4 inclusive

        if (this.emergencyWater) {
            desc.innerHTML = 'There has been a water shortage, but luckily, you thought beforehand and used the preserved water.'
            this.emergencyWater = false
        } else {
            desc.innerHTML = `There has been a water shortage, and since you didn't have a backup water source, some people died of dehydration.<br>Lost ${random} points.`
            this.pts -= random
        }
    }
}

function rounds(civilization) {
    let round
    switch (civilization) {
        case 'floodplains': 
            round = new Round('floodplains', 8)
        case 'mountains':
            round = new Round('mountains', 5)
        case 'desert':
            round = new Round('desert', 3)
    }

    desc.innerHTML = `You have chosen ${civilization}.`

    while (true) {
        button1.style.display = 'none'
        button2.style.display = 'none'
        button3.style.display = 'none'

        if (round.roundNum % 5 === 0) {
            round.waterChoice()
        } else {
            randevent = Math.floor(Math.random() * 5)
            switch (randevent) {
                case 0: round.plague()
                case 1: round.flood()
                case 2: round.trade()
                case 3: round.gold()
                case 4: round.waterShortage()
            }
        }
        
        if (round.pts > 0) {
            button1.style.display = 'flex'
            button2.style.display = 'none'
            button3.style.display = 'none'
            button1.innerHTML = 'Continue to next round'
            
            const waitForClick = new Promise((resolve) => {
                button1.onclick = () => {
                    resolve()
                }
            })

            waitForClick.then(() => {})
        } else {
            desc.innerHTML = `Your civilization has crumbled! Made it to round ${round.roundNum} before the ultimate demise of your society.`
            button1.style.display = 'none'; button2.style.display = 'none'; button3.style.display = 'none'
        }
    }
}

button1.onclick = () => {
    desc.textContent = 'Choose your environment.'
    button1.innerHTML = 'Floodplains'
    button2.innerHTML = 'Mountains'
    button3.innerHTML = 'Desert'
    button1.style.display = 'flex'; button2.style.display = 'flex'; button3.style.display = 'flex'
    button1.onclick = () => rounds('floodplains')
    button2.onclick = () => rounds('mountains')
    button3.onclick = () => rounds('desert')
}