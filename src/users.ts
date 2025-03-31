function game(repeat) {
    // Timer variables
    let startTime = Date.now();

    // Update timer every 100ms
    let timerInterval = setInterval(() => {
        let elapsedTime = Date.now() - startTime;
        paragraph.innerHTML = `Time: ${(elapsedTime / 1000).toFixed(3)} seconds`;
    }, 10);

    let emailLabel = document.createElement('label'),
        emailInput = document.createElement('input'),
        userLabel = document.createElement('label'),
        userInput = document.createElement('input'),
        passwordLabel = document.createElement('label'),
        passwordInput = document.createElement('input'),
        confirmLabel = document.createElement('label'),
        confirmInput = document.createElement('input')

    let failure = document.createElement('div');
    failure.innerHTML = 'Failed to create user account.<br>';
    document.body.appendChild(failure);
    failure.style.display = 'none';
    failure.className = 'text-red-500 mt-4';

    let paragraph = document.querySelector('p');
    document.getElementById('start').innerHTML = 'Create account';
    let game1Elements = [emailLabel, emailInput, userLabel, userInput, passwordLabel, passwordInput, confirmLabel, confirmInput];

    // Get high score from localStorage (if any)
    let highScore = localStorage.getItem('highScore');
    if (highScore) {
        paragraph.innerHTML = `High score: ${highScore} seconds`;
    }

    // add onclick function for button so that the user could finish the game
    document.getElementById('start').onclick = () => {
        let userVal = userInput.value,
            passwordVal = passwordInput.value,
            confirmVal = confirmInput.value,
            passwordsMatch,
            emailValid,
            userLength;

        const isValidPassword =
            passwordVal === confirmVal &&
            passwordVal.trim() !== '' &&
            passwordVal.length > 7 &&
            /[A-Z]/.test(passwordVal) &&  // At least one uppercase letter
            /[a-z]/.test(passwordVal) &&  // At least one lowercase letter
            /\d/.test(passwordVal) &&     // At least one number
            /[!@#$%^&*(),.?":{}|<>]/.test(passwordVal) &&  // At least one special char
            /.*42.*/.test(passwordVal) // If 42 is present

        // check if the user requirements are satisfactory
        if (isValidPassword) {
            passwordsMatch = true;
        } else {
            passwordsMatch = false;
        }

        if (emailInput.validity.valid && emailInput.value.trim() !== '') {
            emailValid = true;
        } else {
            emailValid = false;
        }

        if (userVal.length < 4 || userVal.length > 30) {
            userLength = false;
        } else {
            userLength = true;
        }

        paragraph.style.display = 'block';
        if (passwordsMatch && emailValid && userLength) {
            for (let element of game1Elements) {
                element.remove();
            }
            document.getElementById('start').remove();
            clearInterval(timerInterval);
            let elapsedTime = Date.now() - startTime;
            let elapsedSeconds = (elapsedTime / 1000).toFixed(2);
            failure.style.display = 'none';
            paragraph.innerHTML = `Congrats, you have beat the game in ${elapsedSeconds} seconds.`;

            // Check if this is a new high score
            if (!highScore || elapsedSeconds < highScore) {
                localStorage.setItem('highScore', elapsedSeconds);
                paragraph.innerHTML += ` New high score: ${elapsedSeconds} seconds!`;
            }
        } else {
            failure.style.display = 'block';
            if (repeat) {
                if (!emailValid) {
                    failure.innerHTML += ' Email must be valid.<br>';
                }

                if (!passwordsMatch) {
                    failure.innerHTML += ' Password must be at least 8 characters long, include at least 1 uppercase letter, lowercase letter, number, special character, and the meaning of life.<br>';
                }

                if (!userLength) {
                    failure.innerHTML += ' Username must be between 4 and 30 characters long.<br>';
                }
                repeat = false;
            }
        }
    };

    for (let element of game1Elements) {
        document.querySelector('#division').appendChild(element);
        element.style.margin = '8px 0';
    }

    emailLabel.setAttribute('for', 'email');
    emailInput.setAttribute('type', 'email');
    emailInput.setAttribute('id', 'email');

    userLabel.setAttribute('for', 'username');
    userInput.setAttribute('type', 'text');
    userInput.setAttribute('id', 'username');

    passwordLabel.setAttribute('for', 'password');
    passwordInput.setAttribute('type', 'password');
    passwordInput.setAttribute('id', 'password');

    confirmLabel.setAttribute('for', 'confirm-password');
    confirmInput.setAttribute('type', 'password');
    confirmInput.setAttribute('id', 'confirm-password');

    emailLabel.innerHTML = 'Email:';
    userLabel.innerHTML = 'Username:';
    passwordLabel.innerHTML = 'Password:';
    confirmLabel.innerHTML = 'Confirm password:';

    emailInput.className = 'border-2 border-gray-300 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-4';
    userInput.className = 'border-2 border-gray-300 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-4';
    passwordInput.className = 'border-2 border-gray-300 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-4';
    confirmInput.className = 'border-2 border-gray-300 bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 px-4';

    emailLabel.className = 'text-left text-gray-700';
    emailLabel.style.marginBottom = '0px'
    emailInput.style.marginTop = '0px'
    userLabel.style.marginBottom = '0px'
    userInput.style.marginTop = '0px'
    passwordLabel.style.marginBottom = '0px'
    passwordInput.style.marginTop = '0px'
    confirmLabel.style.marginBottom = '0px'
    confirmInput.style.marginTop = '0px'
    userLabel.className = 'text-left text-gray-700';
    passwordLabel.className = 'text-left text-gray-700';
    confirmLabel.className = 'text-left text-gray-700';
}

document.getElementById('start').onclick = () => {
    let repeat = true;
    game(repeat);
};
