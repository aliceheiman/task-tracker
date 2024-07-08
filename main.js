// Modules to control application life and create native browser window
const { app, BrowserWindow, Notification, ipcMain, Menu, dialog, clipboard } = require('electron')
const path = require('node:path')
const fs = require('fs')
const dayjs = require('dayjs');
var weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);

const pomFilePath = path.join(app.getPath('userData'), 'pom.json');
// console.log(`[ ] pomFilePath at ${pomFilePath}`)
// Ensure tasks file exists
if (!fs.existsSync(pomFilePath)) {
    fs.writeFileSync(pomFilePath, JSON.stringify([]));
}

//// POM LOGGING
async function handleLoadPoms() {
    const data = fs.readFileSync(pomFilePath)
    return JSON.parse(data)
}
async function handleLogPom(event, pom) {
    const poms = await handleLoadPoms()
    poms.push(pom)
    fs.writeFile(pomFilePath, JSON.stringify(poms, null, 2), (err) => {
        if (err) throw err;
        console.log("[+] Logged Pomodoro")
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
        dialog.showMessageBox({
            type: 'info',
            message: 'A-MAZING Work! 🎉',
            detail: 'Your session is logged',
        })
    });
}
function filterTodayPoms(poms, today) {
    return poms.filter(pom => {
        const pomDate = dayjs(pom.datetime);
        return pomDate.isSame(today, 'day');
    });
}
function filterWeekPoms(poms, today) {
    return poms.filter(pom => {
        const pomDate = dayjs(pom.datetime);
        return pomDate.isSame(today, 'week') && pomDate.isSame(today, 'year');
    });
}
function secondsToMin(seconds, decimals = 1) {
    let min = seconds / 60
    return parseFloat(min.toFixed(decimals))
}
function getStats(poms) {
    const stats = {
        totalTime: 0,
        create: 0,
        edit: 0,
        input: 0,
        manage: 0
    }
    for (let pom of poms) {
        stats.totalTime += pom.duration
        if (pom.category == "Create") stats.create += 1
        if (pom.category == "Edit") stats.edit += 1
        if (pom.category == "Input") stats.input += 1
        if (pom.category == "Manage") stats.manage += 1
    }
    return stats
}

//// MENU FUNCTIONS
function showAbout() {
    dialog.showMessageBox({
        type: 'info',
        title: 'About Focus&Fun',
        message: 'Focus&Fun APP',
        detail: 'This is a simple Pomodoro Timer application to help you manage your time effectively by breaking work into intervals, traditionally 25 minutes in length, separated by short breaks.'
    })
}
async function getDailyReport() {
    const poms = await handleLoadPoms();
    const today = new Date();
    const todayPoms = filterTodayPoms(poms, today);

    const formattedDate = today.toLocaleDateString('en-CA')
    // const formattedDate = today.toISOString().split('T')[0];
    let report = `**${formattedDate}**\n`;

    if (todayPoms.length > 0) {
        const stats = getStats(todayPoms)

        report += `Sessions: ${todayPoms.length} (${stats.create}C, ${stats.edit}E, ${stats.input}I, ${stats.manage}M)\n`
        report += `Total time: ${secondsToMin(stats.totalTime)} min\n\n`
        report += `--- Session Log --\n`
        for (let pom of todayPoms) {
            report += `Objective: ${pom.objective}\n`
            report += `Task: ${pom.task} (${pom.category}/${pom.resource})\n`
            report += `Time: ${secondsToMin(pom.duration)} min\n`
            if (pom.dump.length > 0) {
                report += "Notes:\n"
                for (let dump of pom.dump) {
                    report += ` - ${dump}\n`
                }
            }
            report += "\n"
        }
    } else {
        report += "No sessions completed."
    }
    console.log(report);
    clipboard.writeText(report)
    dialog.showMessageBox({
        type: 'info',
        message: 'Daily Report copied to clipboard.',
    })
}
async function getWeekReport() {
    const poms = await handleLoadPoms();
    const today = new Date();
    const weekPoms = filterWeekPoms(poms, today);

    const locale = app.getLocale();
    const weekNumber = dayjs(today).locale(locale).week();
    const formattedDate = `${today.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
    let report = 'week,sessions,duration (sec),create,edit,input,manage\n'
    if (weekPoms.length > 0) {
        const stats = getStats(weekPoms)
        report += `${formattedDate},${weekPoms.length},${stats.totalTime},${stats.create},${stats.edit},${stats.input},${stats.manage}`
    } else {
        report += `${formattedDate},0,0,0,0,0,0`
    }
    console.log(report);
    clipboard.writeText(report)
    dialog.showMessageBox({
        type: 'info',
        message: 'Weekly Report copied to clipboard.',
    })
}

function getUserDataPath() {
    clipboard.writeText(app.getPath('userData'))
    console.log("[+] Path saved to clipboard.")
    dialog.showMessageBox({
        type: 'info',
        message: 'Data Path copied to clipboard.',
    })
}

const createWindow = () => {
    const mainWindow = new BrowserWindow({
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
                    label: `About ${app.name}`,
                    click: () => showAbout()
                }
            ]
        },
        {
            label: "File",
            submenu: [
                {
                    label: "Daily Report",
                    click: () => getDailyReport(),
                },
                {
                    label: "Week Report",
                    click: () => getWeekReport(),
                },
                {
                    label: "Get User Data Path",
                    click: () => getUserDataPath()
                }
            ]
        }
    ])
    Menu.setApplicationMenu(menu)

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    ipcMain.handle('get:loadPoms', handleLoadPoms)
    ipcMain.handle('post:logPom', handleLogPom)
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
app.on('window-all-closed', function () {
    app.quit()
})