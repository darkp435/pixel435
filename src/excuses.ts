// note: all the arrays containing excuses must have equal size or else the function will not work
const excuses = [
    "My dog ate my computer.",
    "The compiler wasn't working.",
    "It works on my machine.",
    "My coffee wasn't strong enough.",
    "The code just didn't feel like working today.",
    "The program didn't want to be debugged.",
    "The coding gods weren't happy.",
    "My rubber duck wasn't helping me like usual.",
    "My software sent itself to /dev/null.",
    "The software is outdated.",
    "The code isn't coding.",
    "It's an IDE error, I swear.",
    "My computer's keyboard cannot type semicolons.",
    "The compilation took forever.",
    "It's a feature, not a bug, I swear.",
    "The code needed to be optimised for performance reasons.",
    "My internet is too slow.",
    "My cat walked across my keyboard.",
    "I accidentally deleted the file.",
    "The function decided to not function.",
    "I had to peer review my code.",
    "I encounted circular dependencies.",
    "Somebody tried to DDoS my computer.",
    "My brackets entangled itself.",
    "The compatibility issues were very annoying.",
    "It just doesn't work on our machine.",
    "I had to deal with performance issues.",
    "Segmentation faults were difficult to debug.",
    "The semicolons were replaces with greek question marks.",
    "The libraries decided to glitch.",
    "It's just a little bit slow today.",
    "The registers weren't registering.",
    "The project details were gone for whatever reason.",
    "The networking issues were brutal.",
    "The USB drive with all the files got corrupted.",
    "The pointer didn't point to the correct place!",
    "The compiler didn't give me the details to the bug.",
    "My computer fans were distracting me.",
    "For some reason it kept on booting to the UEFI firmware settings.",
    "I attempted to install something that took way too long.",
    "My settings glitched and altered things I didn't want.",
    "Stack overflow did not have the solution.",
    "The github pages didn't help at all.",
    "Windows update got stuck in a loop.",
    "The refactoring didn't go well.",
    "The variables, functions and classes were too confusing to navigate.",
    "I was too focused on trying to follow the official code guidelines on code readability.",
    "The IDE glitched and there was a syntax error on a blank line.",
    "The tutorial I watched on how to fix the bug was quite long.",
    "The program is just shy.",
]

const normal = [
    "I got caught in traffic.",
    "I forgot about the meeting.",
    "My alarm didn't go off.",
    "I was feeling under the weather.",
    "I had a family emergency.",
    "My phone battery died.",
    "I had a last-minute appointment.",
    "I was running late from a previous engagement.",
    "I was waiting for a delivery.",
    "I had to deal with an unexpected issue at home.",
    "I lost track of time.",
    "I was dealing with a technical problem.",
    "I had a sudden change in plans.",
    "I was feeling overwhelmed and needed a break.",
    "I had to pick up a family member.",
    "I was dealing with a personal matter.",
    "I was in a meeting that ran over time.",
    "I had car trouble.",
    "I was dealing with a work crisis.",
    "I needed to finish a project at the last minute.",
    "I had a power outage.",
    "I was waiting for an important phone call.",
    "I had an unexpected guest.",
    "I was not feeling well emotionally.",
    "I had to handle an urgent task.",
    "I needed to take care of a pet emergency.",
    "I had a scheduling conflict.",
    "I was caught up in paperwork.",
    "I was attending to a health issue.",
    "I had a sudden family obligation.",
    "I had trouble with public transportation.",
    "I was working on a critical deadline.",
    "I had a prior commitment that ran long.",
    "I was experiencing internet issues.",
    "I had to manage an unexpected situation.",
    "I was helping a friend in need.",
    "I had to make an unplanned trip.",
    "I was caught up in a long phone call.",
    "I had to attend to a legal matter.",
    "I was involved in a time-sensitive task.",
    "I had to deal with a maintenance issue at home.",
    "I was dealing with an urgent email.",
    "I needed to take care of some paperwork.",
    "I had a sudden change in my schedule.",
    "I was feeling fatigued and needed rest.",
    "My computer just said no.",
    "Your mom blocked my driveway so I couldn't pull up.",
    "Somebody decided it was a good idea to throw a rock at my window.",
    "I discovered some rat nests in my house.",
    "Somebody hacked my home computer."
]

const school = [
    "I have a doctor's appointment.",
    "I was feeling sick this morning.",
    "I had a family emergency.",
    "I missed the bus.",
    "I had a dentist appointment.",
    "I was feeling under the weather.",
    "I had to take care of a sibling.",
    "I had a personal matter to attend to.",
    "I had car trouble.",
    "I had a late night and overslept.",
    "I lost track of time.",
    "I had a problem with my alarm.",
    "I had to deal with an unexpected situation at home.",
    "I needed to finish a project for another class.",
    "I was involved in a community service event.",
    "I had a technical issue with my online learning.",
    "I had a family obligation.",
    "I was waiting for an important delivery.",
    "I was feeling exhausted.",
    "I had to attend a legal appointment.",
    "I was dealing with a personal crisis.",
    "I had an urgent household repair.",
    "I was helping a family member with a crisis.",
    "I needed to catch up on missed work.",
    "I had an important phone call to take.",
    "I was experiencing severe weather conditions.",
    "I had a temporary health issue.",
    "I had to attend a significant event.",
    "I was dealing with a utility outage.",
    "I had an issue with my transportation.",
    "I had a scheduled meeting.",
    "I was unable to access my online resources.",
    "I had a conflicting appointment.",
    "I had to manage an unexpected situation at home.",
    "I had to run an essential errand.",
    "I was dealing with a family member's illness.",
    "I was experiencing severe fatigue.",
    "I had a minor medical procedure.",
    "I had a significant family event.",
    "I had a last-minute issue to resolve.",
    "I needed time for personal reflection.",
    "I was attending a necessary interview.",
    "I had a scheduling conflict.",
    "I had to attend a crucial workshop.",
    "I had a personal engagement.",
    "I needed to handle a financial matter.",
    "I had a problem with my study materials.",
    "I was dealing with an unexpected family situation.",
    "I had to address a pressing issue at home.",
    "I had a critical appointment to keep.",
]

function generateExcuse(type) { 
    let randomIndex = Math.floor(Math.random() * excuses.length) // arrays are same size so it just use the first one

    switch (type) {
        case 'excuse':
            document.getElementById('excuse')!.innerHTML = excuses[randomIndex]
            break
        case 'normal':
            document.getElementById('normal')!.innerHTML = normal[randomIndex]
            break
        case 'school':
            document.getElementById('school')!.innerHTML = school[randomIndex]
    }
}

document.getElementById('button-1')!.onclick = () => generateExcuse("excuse")
document.getElementById('button-2')!.onclick = () => generateExcuse('normal')
document.getElementById('button-3')!.onclick = () => generateExcuse('school')