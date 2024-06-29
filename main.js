const { app, BrowserWindow, Notification } = require('electron/main')
const path = require('node:path')

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
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})