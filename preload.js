const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("electronAPI", {
    recordSession: (task, dump, duration, category, resource) => ipcRenderer.send("record-session", task, dump, duration, category, resource),
    onLoadStats: (callback) => ipcRenderer.on('load-stats', (_event, value) => callback(value)),
})