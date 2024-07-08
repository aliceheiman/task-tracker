//// DOM ELEMENTS
const objectiveInput = document.getElementById("timerObjective")
const taskInput = document.getElementById("timerTask")
const dumpArea = document.getElementById("timerDump")
const timerLabel = document.getElementById("timerLabel")
const durationBtns = document.getElementsByClassName("duration")
const categoryBtns = document.getElementsByClassName("category")
const resourceBtns = document.getElementsByClassName("resource")
const buttonGroups = [durationBtns, categoryBtns, resourceBtns]

const timerStartBtn = document.getElementById('startBtn')
const timerFinishBtn = document.getElementById('finishBtn')

const statToday = document.getElementById('statToday')
const statTotal = document.getElementById('statTotal')

//// DOM FUNCTIONS

// Unselects all elements in the provided array.
function unselect(elementArray) {
    for (let element of elementArray) {
        element.classList.remove("selected")
    }
}
// Get selected of a list of elements
function getSelected(elementArray) {
    for (let element of elementArray) {
        if (element.classList.contains("selected")) {
            return element;
        }
    }
    return null;
}
// Turn e.g. "10 min" into 600
function minStringToSeconds(minString) {
    const [minutes, unit] = minString.split(" ");
    if (unit === "min") {
        return parseInt(minutes) * 60;
    }
    return 0;
}
function getSelectedDuration() {
    return parseInt(getSelected(durationBtns).getAttribute('data-seconds'), 10)
}
// Update UI
function updateUI() {
    minutes = parseInt(timeLeft / 60, 10)
    seconds = parseInt(timeLeft % 60, 10);
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    timerLabel.innerHTML = minutes + "<br />" + seconds;
}
// Update stats UI
function updateStats() {
    let total = poms.length
    let today = poms.filter(pom => {
        let pomDate = new Date(pom.datetime);
        let now = new Date();
        return pomDate.getDate() === now.getDate() &&
            pomDate.getMonth() === now.getMonth() &&
            pomDate.getFullYear() === now.getFullYear();
    }).length;
    statToday.innerText = today
    statTotal.innerText = total
}

//// INITIALIZATION
let timeLeft = null
let timerIsRunning = false
let timerId = null
let stopTime = null;
let skipTime = 0
let poms = []

//// TIMER

function resetTimer() {
    clearInterval(timerId)
    timerIsRunning = false
    stopTime = null;
    timeLeft = getSelectedDuration()
    skipTime = 0
    timerStartBtn.innerText = "▶"
    timerFinishBtn.innerText = "⏭︎"
    timerStartBtn.disabled = false
    timerStartBtn.classList = ""
    updateUI()
}
function startTimer() {
    var t = new Date()
    t.setSeconds(t.getSeconds() + timeLeft + 1)
    stopTime = t

    timerId = setInterval(() => {
        timeLeft = Math.floor((stopTime - new Date()) / 1000)
        if (timeLeft <= 0) {
            clearInterval(timerId)
            timerIsRunning = false
            timeLeft = 0
            timerStartBtn.disabled = true
            timerStartBtn.classList.add("disabled")
            timerStartBtn.innerText = "▶"
            timerFinishBtn.innerText = "⏮︎"
            updateUI()
            logPomodoro()
        }
        updateUI()
    }, 1000)
}

//// POMODORO HANDLING
function logPomodoro() {
    const pom = {
        datetime: Date.now(),
        objective: objectiveInput.value,
        task: taskInput.value,
        duration: parseInt(getSelected(durationBtns).getAttribute('data-seconds'), 10) - skipTime,
        category: getSelected(categoryBtns).innerText,
        resource: getSelected(resourceBtns).innerText,
        dump: dumpArea.value.split("\n").filter(line => line !== "")
    }
    poms.push(pom)
    updateStats()
    window.electronAPI.logPom(pom)
}

//// EVENT LISTENERS
timerStartBtn.addEventListener("click", () => {
    if (timerStartBtn.disabled) return
    if (!timerIsRunning) {
        timerIsRunning = true
        timerStartBtn.innerText = "⏸"
        startTimer()
    } else {
        timerIsRunning = false
        clearInterval(timerId)
        timerStartBtn.innerText = "▶"
    }
})
timerFinishBtn.addEventListener("click", () => {
    if (timerIsRunning) {
        if (stopTime != null) {
            var t = new Date()
            t.setSeconds(t.getSeconds() + 1)
            skipTime = Math.floor((stopTime - new Date()) / 1000)
            stopTime = t
        }
    } else {
        resetTimer()
    }
})
// Select button
for (let btnGroup of buttonGroups) {
    for (let btn of btnGroup) {
        btn.addEventListener("click", () => {
            unselect(btnGroup)
            btn.classList.add("selected")
            if (btnGroup == durationBtns) {
                resetTimer()
            }
        })
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    poms = await window.electronAPI.loadPoms()
    timeLeft = getSelectedDuration()
    updateUI()
    updateStats()
});