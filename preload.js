const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("electronAPI", {
    logTask: (task) => ipcRenderer.send("log-task", task),
    loadTasks: () => ipcRenderer.invoke('request:loadTasks'),
    loadConfig: () => ipcRenderer.invoke('request:loadConfig'),
    loadStreaks: () => ipcRenderer.invoke('request:loadStreaks')
})