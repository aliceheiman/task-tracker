const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("electronAPI", {
    logPom: (pom) => ipcRenderer.invoke("post:logPom", pom),
    loadPoms: () => ipcRenderer.invoke('get:loadPoms'),
})