// Defaults
let timerDurationText = "25 min"
let timerCategoryText = "Create"
let timerResourceText = "N"
let timeLeft = durationTextToSeconds(timerDurationText)
let timerIsRunning = false
let timerId

const DAILY_GOAL = 8
const WEEKLY_GOAL = 56

// Statistics
const stats = {
    daily: 0,
    dailyStreak: 0,
    weekly: 0,
    weeklyStreak: 0,
    create: 0,
    edit: 0,
    input: 0,
    manage: 0,
}

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

const statDailyLabel = document.getElementById('stat-daily')
const statDailyStreakLabel = document.getElementById('stat-daily-streak')
const statWeeklyLabel = document.getElementById('stat-weekly')
const statWeeklyStreakLabel = document.getElementById('stat-weekly-streak')
const statCreateLabel = document.getElementById('stat-create')
const statEditLabel = document.getElementById('stat-edit')
const statInputLabel = document.getElementById('stat-input')
const statManageLabel = document.getElementById('stat-manage')

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
    timerIsRunning = false
    timerStartBtn.classList = ""
    timerStartBtn.innerText = "Start"
}

function updateStatsLabels() {
    statDailyLabel.value = "0"
    statDailyLabel.innerText = `${stats.daily}/${DAILY_GOAL}`
    statDailyStreakLabel.innerText = stats.dailyStreak
    statWeeklyLabel.innerText = `${stats.weekly}/${WEEKLY_GOAL}`
    statWeeklyStreakLabel.innerText = stats.weeklyStreak
    statCreateLabel.innerText = stats.create
    statEditLabel.innerText = stats.edit
    statInputLabel.innerText = stats.input
    statManageLabel.innerText = stats.manage
}

function durationTextToSeconds(durationText) {
    let minutes = parseInt(durationText.split(" ")[0])
    return 3 // debug
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
            timerLabel.innerHTML = "00<br />00";
            timerIsRunning = false
            timerStartBtn.classList.add("disabled")

            // Notify main to record pomodoro!
            let taskText = taskInput.value
            let dumpText = dumpArea.value.replaceAll("\n", " ")
            window.electronAPI.recordSession(taskText, dumpText, timerDurationText, timerCategoryText, timerResourceText)

            // Update stats
            stats.daily++
            stats.weekly++
            if (stats.daily === DAILY_GOAL) stats.dailyStreak++
            if (stats.weekly === WEEKLY_GOAL) stats.weeklyStreak++
            if (timerCategoryText == "Create") stats.create++
            if (timerCategoryText == "Edit") stats.edit++
            if (timerCategoryText == "Input") stats.input++
            if (timerCategoryText == "Manage") stats.manage++
            updateStatsLabels()
        }
    }, 1000);
}

// Start timer
timerStartBtn.addEventListener("click", () => {
    if (timerStartBtn.classList.contains("disabled")) return

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

// Reset button
timerResetBtn.addEventListener("click", () => {
    resetTimer()
})

// Default run
updateStatsLabels()