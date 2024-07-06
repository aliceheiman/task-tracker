const { app, BrowserWindow, Notification, Menu, clipboard, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require('fs')
const { parse } = require("csv-parse")
const { log } = require('node:console')

////////////// SETUP
const tasksFilePath = path.join(app.getPath('userData'), 'tasks.json');
const configFilePath = path.join(__dirname, 'app.config.json');
let config = {};

console.log("[+] Initializing app...")
console.log(`[x] Tasks logged at ${tasksFilePath}`)
console.log(`[x] Config logged at ${configFilePath}`)

async function handleLoadTasks() {
    const data = fs.readFileSync(tasksFilePath)
    return JSON.parse(data)
}
async function handleLoadConfig() {
    const data = fs.readFileSync(configFilePath)
    return JSON.parse(data)
}

// Ensure tasks file exists
if (!fs.existsSync(tasksFilePath)) {
    fs.writeFileSync(tasksFilePath, JSON.stringify([]));
}

////////////// FUNCTIONS

// File handling and task logging 
function logTask(task) {
    console.log(task)
    fs.readFile(tasksFilePath, (err, data) => {
        if (err) throw err;
        const tasks = JSON.parse(data);
        tasks.push(task);
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

function generateDailyLog() {
    let d1 = new Date()

    let report = `### ${d1.toLocaleDateString("SE")}\n`

    fs.createReadStream(userLogFile)
        .pipe(parse({ delimiter: ";", from_line: 2 }))
        .on("data", (row) => {
            d2 = new Date(row[0])
            if (isSameDay(d1, d2)) {
                // Update report
                report += `Task: ${row[1]}\nCategory: ${row[4]}\n\n`
            }
        })
        .on("error", (err) => {
            throw err
        })
        .on("end", () => {
            console.log("Retrieved stats")
            report += `Stats\nSessions completed: ${stats.daily}\nTotal minutes: ${stats.minutesSpent}`
            console.log(report)
            clipboard.writeText(report)
        })
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1000, //460,
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
                    click: () => generateDailyLog(),
                    label: "Get Daily Log"
                },
            ]
        }
    ])
    Menu.setApplicationMenu(menu)
    win.loadFile('index.html')
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    ipcMain.handle('request:loadTasks', handleLoadTasks)
    ipcMain.handle('request:loadConfig', handleLoadConfig)
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})