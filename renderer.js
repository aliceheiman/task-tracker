// Defaults
let timerDurationText = "25 min"
let timerCategoryText = "Create"
let timerResourceText = "N"
let timeLeft = durationTextToSeconds(timerDurationText)
let timerIsRunning = false
let timerId

// Document Elements
const taskInput = document.getElementById("timerTask")
const dumpArea = document.getElementById("timerDump")

const timerLabel = document.getElementById("timerLabel")

const timerCreateBtn = document.getElementById("createBtn")
const timerEditBtn = document.getElementById("editBtn")
const timerInputBtn = document.getElementById("inputBtn")
const timerManageBtn = document.getElementById("manageBtn")
const categoryBtns = [timerCreateBtn, timerEditBtn, timerInputBtn, timerManageBtn]

const timerNoInternetBtn = document.getElementById("noInternetBtn")
const timerInternetBtn = document.getElementById("internetBtn")
const resourceBtns = [timerNoInternetBtn, timerInternetBtn]

const timerDuration10Btn = document.getElementById("duration10")
const timerDuration25Btn = document.getElementById("duration25")
const timerDuration50Btn = document.getElementById("duration50")
const durationBtns = [timerDuration10Btn, timerDuration25Btn, timerDuration50Btn]

const timerStartBtn = document.getElementById('startBtn')
const timerResetBtn = document.getElementById('resetBtn')

//// FUNCTIONS

function unselect(elementArray) {
    for (let element of elementArray) {
        element.classList.remove("selected")
    }
}

function resetTimer() {
    clearInterval(timerId)
    timerLabel.innerHTML = `${timerDurationText.slice(0, 2)}<br />00`
    timeLeft = durationTextToSeconds(timerDurationText)
}

function durationTextToSeconds(durationText) {
    let minutes = parseInt(durationText.split(" ")[0])
    return minutes * 60
}

//// EVENT LISTENERS

// Categories
for (let categoryBtn of categoryBtns) {
    categoryBtn.addEventListener("click", () => {
        timerCategoryText = categoryBtn.innerText
        unselect(categoryBtns)
        categoryBtn.classList.add("selected")
    })
}

// Resources
for (let resourceBtn of resourceBtns) {
    resourceBtn.addEventListener("click", () => {
        timerResourceText = resourceBtn.innerText
        unselect(resourceBtns)
        resourceBtn.classList.add("selected")
    })
}

// Duration
for (let durationBtn of durationBtns) {
    durationBtn.addEventListener("click", () => {
        unselect(durationBtns)
        durationBtn.classList.add("selected")
        timerDurationText = durationBtn.innerText
        resetTimer()
    })
}

//// TIMER

// Adapted from Sotiris Kiritsis @ https://stackoverflow.com/questions/31559469/how-to-create-a-simple-javascript-timer
function startTimer() {
    let minutes, seconds;
    timerId = setInterval(function () {
        minutes = parseInt(timeLeft / 60, 10)
        seconds = parseInt(timeLeft % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        timerLabel.innerHTML = minutes + "<br />" + seconds;

        timeLeft--;
        if (timeLeft < 0) {
            timeLeft = 0;
            clearInterval(timerId)
            // Record pomodoro, send notification 
            // timer = duration; // uncomment this line to reset timer automatically after reaching 0
        }
    }, 1000);
}

// Start timer
timerStartBtn.addEventListener("click", () => {
    if (!timerIsRunning) {
        timerIsRunning = true
        timerStartBtn.innerText = "Pause"
        timerStartBtn.classList.add("running")
        startTimer()
        console.log("starting timer")
    } else {
        timerIsRunning = false
        clearInterval(timerId)
        timerStartBtn.innerText = "Start"
        timerStartBtn.classList.remove("running")
    }
})