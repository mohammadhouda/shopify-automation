const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { runAutomation } = require("./automation.mjs");

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

ipcMain.handle("start-automation", async (event, formData) => {
  try {
    await runAutomation(formData, event);
    return "success";
  } catch (err) {
    console.error(err);
    return "error";
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
