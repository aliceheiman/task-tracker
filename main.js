const { app, BrowserWindow, Notification, Menu, clipboard, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require('fs')
const { parse } = require("csv-parse")
const { log } = require('node:console')
const dayjs = require('dayjs')

// Motivational phrases
const motivations = [
    "A-MAZING WORK! Take a break and keep up the momentum."
]

const DAILY_GOAL = 2
const WEEKLY_GOAL = 4

const logFile = path.join(__dirname, "sessionlog.csv")

// Message passing
function handleRecordSession(event, task, dump, duration, category, resource) {
    // Record session in csv
    const record = `${new Date().toJSON()};${task};${dump};${duration};${category};${resource}\n`
    console.log(`Received session record: ${record}`) // log
    fs.appendFile(logFile, record, (err) => {
        if (err) throw err
        // Notify recorded session
        new Notification({
            title: "Session Completed!",
            body: "A-MAZING WORK! Take a break and keep up the momentum."
        }).show()

        console.log(`Recorded session in ${logFile}`) // log
    })
}

function isSameDay(d1, d2) {
    return (d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate())
}
function isSameWeek(d1, d2) {
    let day1 = dayjs(d1)
    let day2 = dayjs(d2)
    return day1.isSame(day2, "week") && day1.isSame(day2, "year")
}

async function getStats() {
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
    };
    let d1 = new Date();
    let d2;

    // collect daily and weekly tallies, check number of streaks.
    let dailyTallies = [];
    let weeklyTallies = [];
    let lastDate = null;

    return new Promise((resolve, reject) => {
        fs.createReadStream(logFile)
            .pipe(parse({ delimiter: ";", from_line: 2 }))
            .on("data", (row) => {
                d2 = new Date(row[0]);
                if (isSameDay(d1, d2)) stats.daily++;
                if (isSameWeek(d1, d2)) stats.weekly++;

                // All time
                if (row[4] === "Create") stats.create++;
                if (row[4] === "Edit") stats.edit++;
                if (row[4] === "Input") stats.input++;
                if (row[4] === "Manage") stats.manage++;
            })
            .on("error", (err) => {
                reject(err);
            })
            .on("end", () => {
                resolve(stats);
            });
    });
}

function generateDailyLog() {
    const stats = {
        daily: 0,
        create: 0,
        edit: 0,
        input: 0,
        manage: 0,
        minutesSpent: 0,
    }

    let d1 = new Date()

    let report = `### ${d1.toLocaleDateString("SE")}\n`

    fs.createReadStream(logFile)
        .pipe(parse({ delimiter: ";", from_line: 2 }))
        .on("data", (row) => {
            d2 = new Date(row[0])
            if (isSameDay(d1, d2)) {
                // Update report
                report += `Task: ${row[1]}\nCategory: ${row[4]}\n\n`

                // Stats
                stats.daily++
                if (row[4] == "Create") stats.create++
                if (row[4] == "Edit") stats.edit++
                if (row[4] == "Input") stats.input++
                if (row[4] == "Manage") stats.manage++
                stats.minutesSpent += parseInt(row[3].slice(0, 2))
            }
        })
        .on("error", (err) => {
            throw err
        })
        .on("end", () => {
            console.log("Retrieved stats")
            report += `Stats\nSessions completed: ${stats.daily}\nTotal minutes: ${stats.minutesSpent}`
            console.log(stats)
            console.log(report)
            clipboard.writeText(report)
        })
}

const createWindow = (stats) => {
    const win = new BrowserWindow({
        width: 460,
        height: 520,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    const menu = Menu.buildFromTemplate([
        {
            label: app.name,
            submenu: [
                {
                    click: () => generateDailyLog(),
                    label: "Get Daily Log"
                }
            ]
        }
    ])
    Menu.setApplicationMenu(menu)

    win.loadFile('index.html')
        .then(() => {
            console.log("Sending stats")
            win.webContents.send('load-stats', stats)
        })
}

app.whenReady().then(async () => {
    ipcMain.on("record-session", handleRecordSession)

    getStats().then(stats => {
        console.log(stats)
        createWindow(stats)
    }).catch(err => {
        console.error(err);
    });
})

app.on('window-all-closed', () => {
    app.quit()
})