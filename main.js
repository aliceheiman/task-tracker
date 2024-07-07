const { app, BrowserWindow, Notification, Menu, clipboard, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require('fs')
const { parse } = require("csv-parse")
const { log } = require('node:console')

////////////// SETUP
const tasksFilePath = path.join(app.getPath('userData'), 'tasks.json');
const configFilePath = path.join(__dirname, 'app.config.json');
let config = {
    "dailyGoal": 8,
    "weeklyGoal": 56
}

console.log("[+] Initializing app...")
console.log(`[x] Tasks logged at ${tasksFilePath}`)
console.log(`[x] Config logged at ${configFilePath}`)

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}
function getCurrentWeekDates() {
    const currentDate = new Date();
    const firstDayOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        weekDates.push(date.toISOString().split('T')[0]);
    }
    return weekDates;
}

async function handleLoadTasks() {
    const data = fs.readFileSync(tasksFilePath)
    return JSON.parse(data)
}
async function handleLoadConfig() {
    const data = fs.readFileSync(configFilePath)
    return JSON.parse(data)
}
async function handleLoadStreaks() {
    const tasks = JSON.parse(fs.readFileSync(tasksFilePath))
    const streaks = {
        daily: 0,
        dailyStreak: 0,
        weekly: 0,
        weeklyStreak: 0,
    }
    const dateStr = getCurrentDate()
    if (tasks[dateStr]) {
        streaks.daily = tasks[dateStr]["tasks"].length
    } else {
        streaks.daily = 0
    }
    let weekTotal = 0
    const currentWeekDates = getCurrentWeekDates();
    for (const date of currentWeekDates) {
        if (tasks[date]) {
            weekTotal += tasks[date]["tasks"].length
        }
    }
    streaks.weekly = weekTotal;

    let dailyStreak = 0;
    const currentDate = new Date();
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (tasks[dateStr] && tasks[dateStr]["tasks"].length >= config.dailyGoal) {
            dailyStreak += 1;
        } else {
            break;
        }
        currentDate.setDate(currentDate.getDate() - 1);
    }
    streaks.dailyStreak = dailyStreak;
    return streaks
}
// Ensure tasks file exists
if (!fs.existsSync(tasksFilePath)) {
    fs.writeFileSync(tasksFilePath, JSON.stringify({}));
}

////////////// FUNCTIONS

// File handling and task logging 
function logTask(task) {
    console.log(task)
    fs.readFile(tasksFilePath, (err, data) => {
        if (err) throw err;
        const tasks = JSON.parse(data);
        const currentDate = getCurrentDate()

        if (!tasks[currentDate]) {
            tasks[currentDate] = {
                "stats": {
                    create: 0,
                    edit: 0,
                    input: 0,
                    manage: 0
                },
                "tasks": []
            };
        }
        tasks[currentDate]["tasks"].push(task);
        if (task.category == "Create") tasks[currentDate]["stats"].create += 1
        if (task.category == "Edit") tasks[currentDate]["stats"].edit += 1
        if (task.category == "Input") tasks[currentDate]["stats"].input += 1
        if (task.category == "Manage") tasks[currentDate]["stats"].manage += 1

        fs.writeFile(tasksFilePath, JSON.stringify(tasks, null, 2), (err) => {
            if (err) throw err;
            console.log("Task logged")
            new Notification({
                title: "Task Logged",
                body: "Your task has been logged successfully."
            }).show();
        });
    });
}
ipcMain.on("log-task", (event, task) => {
    logTask(task);
});

function secondsToMin(seconds, decimals = 1) {
    // rounded to one decimal
    let min = seconds / 60
    return parseFloat(min.toFixed(decimals))
}
async function getWeeklyReport() {
    const dateStr = getCurrentDate()
    const tasks = await handleLoadTasks()

    const csv = {
        total: 0,
        time: 0,
        create: 0,
        edit: 0,
        input: 0,
        manage: 0,
    }
    let report = 'totalSessions,totalTime (sec),create,edit,input,manage\n'

    const currentWeekDates = getCurrentWeekDates();
    for (const date of currentWeekDates) {
        if (tasks[date]) {
            csv.total += tasks[date]["tasks"].length
            csv.create += tasks[date]["stats"].create
            csv.edit += tasks[date]["stats"].edit
            csv.input += tasks[date]["stats"].input
            csv.manage += tasks[date]["stats"].manage
            for (const task of tasks[date]["tasks"]) {
                csv.time += task["timeSpent"]
            }
        }
    }
    // turn into csv
    report += `${csv.total},${csv.time},${csv.create},${csv.edit},${csv.input},${csv.manage}`
    console.log("[+] Report saved to clipboard.")
    clipboard.writeText(report)
}
async function getDailyReport() {
    const dateStr = getCurrentDate()
    const tasks = await handleLoadTasks()

    let report = `**${dateStr}**\n`
    if (tasks[dateStr]) {
        let t = tasks[dateStr]

        let totalTime = 0
        for (let task of t["tasks"]) {
            totalTime += task["timeSpent"]
        }
        totalTime = secondsToMin(totalTime)

        report += `Sessions: ${t["tasks"].length} (${t["stats"].create}C, ${t["stats"].edit}E, ${t["stats"].input}I, ${t["stats"].manage}M)\n`
        report += `Total time spent on tasks: ${totalTime} min\n\n`
        report += `--- Task Log START ---\n\n`
        for (let task of t["tasks"]) {
            report += `Objective: ${task["objective"]}\n`
            report += `Task: ${task["task"]} (${task["category"]}/${task["resource"]})\n`
            report += `Time: ${secondsToMin(task["timeSpent"])} min\n`
            if (task["dump"].length > 0) {
                report += "Notes:\n"
                for (let dump of task["dump"]) {
                    report += ` - ${dump}\n`
                }
            }
            report += "\n"
        }
        report += `--- Task Log END ---\n\n`
    } else {
        report += "No tasks completed."
    }
    // console.log(report)
    console.log("[+] Report saved to clipboard.")
    clipboard.writeText(report)

    new Notification({
        title: "Daily Report Created",
        body: "Your daily report has been copied to clipboard."
    }).show();
}

const createWindow = () => {
    const win = new BrowserWindow({
        // width: 1000, // debug
        width: 500,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    const menu = Menu.buildFromTemplate([
        {
            label: app.name,
            submenu: [
                {
                    click: () => getDailyReport(),
                    label: "Get Daily Report"
                },
                {
                    click: () => getWeeklyReport(),
                    label: "Get Weekly Report"
                }
            ]
        }
    ])
    Menu.setApplicationMenu(menu)
    win.loadFile('index.html')
    // win.webContents.openDevTools(); // debug
}

app.whenReady().then(() => {
    ipcMain.handle('request:loadTasks', handleLoadTasks)
    ipcMain.handle('request:loadConfig', handleLoadConfig)
    ipcMain.handle('request:loadStreaks', handleLoadStreaks)
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})