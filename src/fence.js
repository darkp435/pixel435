let automatic = localStorage.getItem('auto') || false
let power = parseInt(localStorage.getItem('power')) || 0
let autoButton = document.getElementById('auto')
let burnButton = document.getElementById('burn')
let count = document.getElementById('burnCount')
let upgrade1Button = document.getElementById('upgrade')
let savedBurns = parseInt(localStorage.getItem('burns')) || 0
let burns = savedBurns
let counter = power + 1
let burnerPower = parseInt(localStorage.getItem('burner') || 0) + 100
let burnerUpgrade = document.getElementById('burner-upgrade')
let suspicion = parseInt(localStorage.getItem('suspicion')) || 0
let lowerSuspicion = document.getElementById('lower-suspicion')
let agreement = localStorage.getItem('agreement') || false
let agreeButton = document.getElementById('agreement-button')

function updateCounter() {
    count.innerHTML = `Ashes: ${burns}`
    counter = power + 1
    document.getElementById('suspicion').innerHTML = `Jame's suspicion: ${suspicion}`
}

function save() {
    localStorage.setItem('burns', burns)
    localStorage.setItem('power', power)
    localStorage.setItem('auto', automatic)
    localStorage.setItem('burner', burnerPower - 100)
    localStorage.setItem('suspicion', suspicion)
    localStorage.setItem('agreement', agreement)
}

if (agreement !== 'true') {
    let raiseSuspicion = setInterval(() => {
        if (burns > 999) {
            suspicion++
            updateCounter()
            save()
        }

        if (suspicion > 99) {
            document.querySelectorAll('div, button, h3, br').forEach((element) => {
                element.remove()
            })

            localStorage.clear()

            document.body.append(document.createElement('div').innerHTML = 'You have lost! Restart to try again (save wiped).')
        }
    }, 2000)
} else {
    agreeButton.disabled = true
    agreeButton.innerHTML = 'Bought.'
}

burnButton.onclick = () => {
    burnButton.disabled = true

    setTimeout(() => {
        burns += counter
        updateCounter()
        save()
        burnButton.disabled = false
    }, 50)
}

upgrade1Button.onclick = () => {
    // stop the burns from going negative
    if (burns > 99) {
        burns -= 100
        power++
        updateCounter()
        save()
    } else {
        console.log('not enough burns')
    }
}

autoButton.onclick = () => {
    if (burns > 9999) {
        burns -= 10000
        automatic = true
        autoButton.disabled = true
        autoButton.innerHTML = 'Bought.'
        burnerUpgrade.disabled = false

        setInterval(() => {
            burns += burnerPower
            updateCounter()
            save()
        }, 1000)

        save()
        updateCounter()
    }
}

burnerUpgrade.onclick = () => {
    if (burns > 998) {
        burnerPower += 5
        burns -= 999
        save()
        updateCounter()
    }
}

lowerSuspicion.onclick = () => {
    if (burns > 1336) {
        if (suspicion > 2) {
            burns -= 1337
            suspicion -= 3
            save()
            updateCounter()
        } else {
            burns -= 1337
            suspicion = 0
            save()
            updateCounter()
        }
    }
}

agreeButton.onclick = () => {
    if (burns > 999999) {
        burns -= 1000000
        agreement = true
        clearInterval(raiseSuspicion)
        suspicion = 0
        agreeButton.disabled = true
        agreeButton.innerHTML = 'Bought.'
        save()
        updateCounter()
    }
}

updateCounter()

if (automatic === 'true') {
    autoButton.disabled = true
    autoButton.innerHTML = 'Bought.'

    setInterval(() => {
        burns += burnerPower
        updateCounter()
        save()
    }, 1000)

} else {
    burnerUpgrade.disabled = true
}