let automatic: boolean = localStorage.getItem('auto') === 'true' || false;
let power: number = parseInt(localStorage.getItem('power') || "0")
const autoButton = document.getElementById('auto') as HTMLButtonElement
const burnButton = document.getElementById('burn') as HTMLButtonElement
const count = document.getElementById('burnCount') as HTMLElement
const upgrade1Button = document.getElementById('upgrade') as HTMLButtonElement
let savedBurns: number = parseInt(localStorage.getItem('burns') || "0")
let burns: number = savedBurns
let counter: number = power + 1
let burnerPower: number = parseInt(localStorage.getItem('burner') || "0") + 100
const burnerUpgrade = document.getElementById('burner-upgrade') as HTMLButtonElement
let suspicion: number = parseInt(localStorage.getItem('suspicion') || "0")
const lowerSuspicion = document.getElementById('lower-suspicion') as HTMLButtonElement
let agreement: boolean = localStorage.getItem('agreement') === 'true' || false
let agreeButton = document.getElementById('agreement-button') as HTMLButtonElement
const info = document.getElementById('info') as HTMLElement
const details = document.getElementById('details') as HTMLElement

function updateCounter() {
    count.innerHTML = `Ashes: ${burns}`;
    counter = power + 1;
    document.getElementById('suspicion')!.innerHTML = `James' suspicion: ${suspicion}`;
}

function save() {
    localStorage.setItem('burns', burns.toString());
    localStorage.setItem('power', power.toString());
    localStorage.setItem('auto', automatic.toString());
    localStorage.setItem('burner', (burnerPower - 100).toString());
    localStorage.setItem('suspicion', suspicion.toString());
    localStorage.setItem('agreement', agreement ? 'true' : 'false');
}

let raiseSuspicion = setInterval(() => {
    if (!agreement) {
        if (burns > 999) {
            suspicion++;
            updateCounter();
            save();
        }

        if (suspicion > 99) {
            document.querySelectorAll('div, button, h3, br').forEach((element) => {
                element.remove();
            });

            localStorage.clear();

            let gameOverMessage = document.createElement('div');
            gameOverMessage.textContent = 'You have lost! Restart to try again (save wiped).';
            document.body.appendChild(gameOverMessage);
        }
    } else {
        clearInterval(raiseSuspicion)
        agreeButton.disabled = true
        agreeButton.innerHTML = 'Bought.'
    }
}, 2000);

burnButton.onclick = () => {
    burnButton.disabled = true;

    setTimeout(() => {
        burns += counter;
        updateCounter();
        save();
        burnButton.disabled = false;
    }, 50);
};

upgrade1Button.onclick = () => {
    // stop the burns from going negative
    if (burns > 99) {
        burns -= 100;
        power++;
        updateCounter();
        save();
    } else {
        console.log('not enough burns');
    }
};

autoButton.onclick = () => {
    if (burns > 9999) {
        burns -= 10000;
        automatic = true;
        autoButton.disabled = true;
        autoButton.innerHTML = 'Bought.';
        burnerUpgrade.disabled = false;

        setInterval(() => {
            burns += burnerPower;
            updateCounter();
            save();
        }, 1000);

        save();
        updateCounter();
    }
};

burnerUpgrade.onclick = () => {
    if (burns > 998) {
        burnerPower += 5;
        burns -= 999;
        save();
        updateCounter();
    }
};

lowerSuspicion.onclick = () => {
    if (burns > 1336) {
        if (suspicion > 2) {
            burns -= 1337;
            suspicion -= 3;
            save();
            updateCounter();
        } else {
            burns -= 1337;
            suspicion = 0;
            save();
            updateCounter();
        }
    }
};

agreeButton.onclick = () => {
    if (burns > 999999) {
        burns -= 1000000;
        agreement = true;
        clearInterval(raiseSuspicion);
        suspicion = 0;
        agreeButton.disabled = true;
        agreeButton.innerHTML = 'Bought.';
        save();
        updateCounter();
    }
};

info.onclick = () => {
    const currentDisplay = window.getComputedStyle(details).display;
    details.style.display = currentDisplay !== 'none' ? 'none' : 'flex';
}

updateCounter();

if (automatic) {
    autoButton.disabled = true;
    autoButton.innerHTML = 'Bought.';

    setInterval(() => {
        burns += burnerPower;
        updateCounter();
        save();
    }, 1000);
} else {
    burnerUpgrade.disabled = true;
}
