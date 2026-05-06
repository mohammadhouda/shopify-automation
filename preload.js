const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  startAutomation: (formData) => ipcRenderer.invoke("start-automation", formData),
  onStatusUpdate: (callback) => ipcRenderer.on("status-update", callback),
  offStatusUpdate: () => ipcRenderer.removeAllListeners("status-update"),
});
