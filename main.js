const { app, BrowserWindow, Notification, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require('fs')

// Motivational phrases
const motivations = [
    "A-MAZING WORK! Take a break and keep up the momentum."
]

const logFile = path.join(__dirname, "sessionlog.csv")

// Message passing
function handleRecordSession(event, task, duration, category, resource) {
    // Record session in csv
    const record = `${new Date().toJSON()},${task},${duration},${category},${resource}\n`
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
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})


