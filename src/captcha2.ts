// new version of captcha script to replace original captcha.ts
const question = document.getElementById('question') as HTMLElement
const backToHome = document.getElementById('homepg') as HTMLElement
const ImgContainer = document.querySelector('.container-img') as HTMLDivElement
const tryAgain = document.createElement('a') as HTMLAnchorElement

tryAgain.textContent = 'Retry'
tryAgain.style.display = 'none'
ImgContainer!.appendChild(tryAgain)

function level1() {
    document.getElementById('start')!.remove()
    question.textContent = 'Please select the bat.'
    document.querySelector('h1')!.className = 'text-lg'
    document.querySelector('p')!.className = 'hidden'
    backToHome.className = 'hidden'
    
}

document.getElementById('start')!.onclick = () => level1()