const { app, BrowserWindow, Notification, ipcMain } = require('electron/main')
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

function getStats() {
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
    let d1 = new Date()
    let d2

    // collect daily and weekly tallies, check number of streaks.
    let dailyTallies = []
    let weeklyTallies = []
    let lastDate = null

    fs.createReadStream(logFile)
        .pipe(parse({ delimiter: ";", from_line: 2 }))
        .on("data", (row) => {
            d2 = new Date(row[0])
            if (isSameDay(d1, d2)) stats.daily++
            if (isSameWeek(d1, d2)) stats.weekly++

            // Keep track of streaks
            if (lastDate === null || !isSameDay(d2, lastDate)) {
                dailyTallies.push(1)
            } else {
                dailyTallies[dailyTallies.length - 1] = dailyTallies[dailyTallies.length - 1] + 1
            }
            if (lastDate === null || !isSameWeek(d2, lastDate)) {
                weeklyTallies.push(1)
            } else {
                weeklyTallies[weeklyTallies.length - 1] = weeklyTallies[weeklyTallies.length - 1] + 1
            }
            lastDate = d2

            // All time
            if (row[4] == "Create") stats.create++
            if (row[4] == "Edit") stats.edit++
            if (row[4] == "Input") stats.input++
            if (row[4] == "Manage") stats.manage++
        })
        .on("error", (err) => {
            throw err
        })
        .on("end", () => {
            // Check streak from the end
            console.log("Daily tallies")
            console.log(dailyTallies)
            console.log("Weekly tallies")
            console.log(weeklyTallies)

            let dailyStreak = 0
            dailyTallies.slice().reverse().forEach((tally) => {
                if (tally >= DAILY_GOAL) {
                    dailyStreak++
                } else {
                    return
                }
            })
            let weeklyStreak = 0
            weeklyTallies.slice().reverse().forEach((tally) => {
                if (tally >= WEEKLY_GOAL) {
                    weeklyStreak++
                } else {
                    return
                }
            })
            stats.dailyStreak = dailyStreak
            stats.weeklyStreak = weeklyStreak

            console.log("Retrieved stats")
            console.log(stats)
        })
}


const createWindow = () => {
    const win = new BrowserWindow({
        width: 460,
        height: 520,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    ipcMain.on("record-session", handleRecordSession)
    getStats()
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})


