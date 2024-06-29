const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("electronAPI", {
    recordSession: (task, duration, category, resource) => ipcRenderer.send("record-session", task, duration, category, resource)
})