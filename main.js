const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let runAutomation;

async function loadAutomation() {
  const mod = await import("./automation.mjs");
  runAutomation = mod.runAutomation;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });
  win.loadFile("index.html");
}

app.whenReady().then(async () => {
  await loadAutomation();
  createWindow();
});

ipcMain.handle("start-automation", async (event, formData) => {
  try {
    await runAutomation(formData, event);
    return "success";
  } catch (err) {
    console.error("Automation error:", err);
    return "error";
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
