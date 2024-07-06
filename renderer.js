// Defaults
let timerDuration = 25 // minutes
let timerCategoryText = "Create"
let timerResourceText = "N"
let timeLeft = minToSec(timerDuration)
let timerIsRunning = false
let timerId

let tasks = {}
let config = {
    "dailyGoal": 8,
    "weeklyGoal": 56
}


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
const objectiveInput = document.getElementById("timerObjective")
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
const timerFinishBtn = document.getElementById('finishBtn')

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
    timerLabel.innerHTML = `${timerDuration}<br />00`
    timeLeft = minToSec(timerDuration)
    timerIsRunning = false
    timerStartBtn.classList = ""
    timerStartBtn.innerText = "Start"
    timerFinishBtn.classList = ""
}

// Date functions
function isSameDay(d1, d2) {
    return (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate())
}
function isSameWeek(d1, d2) {
    return false
}

function updateStats() {
    for (let task of tasks) {
        if (isSameDay(new Date(task.datetime), new Date())) {
            stats.daily += 1;
            if (task.category === "Create") {
                stats.create += 1;
            } else if (task.category === "Edit") {
                stats.edit += 1;
            } else if (task.category === "Input") {
                stats.input += 1;
            } else if (task.category === "Manage") {
                stats.manage += 1;
            }
        }
        if (isSameWeek(new Date(task.datetime), new Date())) {
            stats.weekly += 1;
        }
    }
}

function updateUI() {
    statDailyLabel.innerText = `${stats.daily}/${config["dailyGoal"]}`
    statDailyStreakLabel.innerText = stats.dailyStreak
    statWeeklyLabel.innerText = `${stats.weekly}/${config["weeklyGoal"]}`
    statWeeklyStreakLabel.innerText = stats.weeklyStreak
}

function minToSec(minutes) {
    return 3 // debug
    // return minutes * 60
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
        timerDuration = parseInt(durationBtn.innerText.slice(0, 2))
        resetTimer()
    })
}

//// TIMER
function logTask() {
    clearInterval(timerId)
    timerIsRunning = false
    timerStartBtn.classList.add("disabled")
    timerStartBtn.disabled = true
    timerFinishBtn.classList.add("disabled")
    timerFinishBtn.disabled = true

    const timeSpent = minToSec(timerDuration) - timeLeft

    // Notify main to record pomodoro!
    const task = {
        "datetime": Date.now(),
        "objective": objectiveInput.value,
        "task": taskInput.value,
        "timeSpent": timeSpent,
        "category": timerCategoryText,
        "resource": timerResourceText,
        "dump": dumpArea.value.split("\n")
    }
    window.electronAPI.logTask(task)

    // Update stats
    stats.daily++
    stats.weekly++
    if (stats.daily === config["dailyGoal"]) stats.dailyStreak++
    if (stats.weekly === config["weeklyGoal"]) stats.weeklyStreak++
    if (timerCategoryText == "Create") stats.create++
    if (timerCategoryText == "Edit") stats.edit++
    if (timerCategoryText == "Input") stats.input++
    if (timerCategoryText == "Manage") stats.manage++
    updateUI()
}

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
            logTask()
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

// Finish button
timerFinishBtn.addEventListener("click", () => {
    logTask()
})

document.addEventListener('DOMContentLoaded', async () => {
    tasks = await window.electronAPI.loadTasks()
    config = await window.electronAPI.loadConfig()
    updateStats()
    updateUI()
});

