const { BrowserWindow, ipcMain, dialog } = require("electron");

const fs = require('fs').promises;
const path = require('path');


const showChoiceWarning = (win, warning, title, button1, button2) => {
  return result = dialog.showMessageBoxSync(win, {
    type: "warning",
    title: `${title}`,
    message: warning,
    buttons: [`${button1}`, `${button2}`],
    defaultId: 0,
    cancelId: 1,
  });
};


const LOG_FILE_PATH = process.env.NODE_ENV == `dev` ? path.join(__dirname, '/../../config/logs.json') : path.join(__dirname, '../../../../app.asar.unpacked/app/config/logs.json');

function formatDate(date, hoursOnly) {
    const d = new Date(date);
    const pad = (num) => num.toString().padStart(2, '0');
    let day = hoursOnly ? `` : `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} `;
    return `${day}${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function clearLog() {
  await fs.writeFile(LOG_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
}

async function registerSession(data) {
    try {
        // Read existing logs or initialize an empty array
        let logs = [];
        try {
            const fileData = await fs.readFile(LOG_FILE_PATH, 'utf-8');
            logs = JSON.parse(fileData);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error; // Ignore file not found errors
        }

        // Ensure place is defined
        data.place = data.place || "Unknown";

        // Format date
        const dateFrom = formatDate(data.date);
        const dateTo = formatDate(new Date(), true);
        data.date = `${dateFrom} - ${dateTo}`;

        // Append new data
        logs.push(data);

        // Write back to file
        await fs.writeFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
        console.log("Log registered successfully.");
    } catch (error) {
        console.error("Error registering log:", error);
    }
}

async function readLogs() {
    try {
        const fileData = await fs.readFile(LOG_FILE_PATH, 'utf-8');
        return JSON.parse(fileData);
    } catch (error) {
        if (error.code === 'ENOENT') return []; // Return empty array if file doesn't exist
        throw error;
    }
}

const createFullLogsWin = (zoomFactor) => {
  let win = new BrowserWindow({
    title: 'Sessions',
    show: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    },
  });

  win.loadFile("./app/wins/fullLogsWin/index.html");

  win.once("ready-to-show", async () => {
    win.webContents.setZoomFactor(zoomFactor);
    win.show();
    win.removeMenu();
    //win.openDevTools({mode: `detach`})
  });

  win.on('close', () => {
    ipcMain.removeHandler('get-logs');
    ipcMain.removeHandler('clear-logs');
  });

  ipcMain.handle('get-logs', async () => {
    return await readLogs();
  });

  ipcMain.handle('clear-logs', async () => {
    if(!showChoiceWarning(win, `Are you sure you want to clear all sessions?`, `Warning`, `Yes`, `No`)) {
      await clearLog();
      return true;
    }
  })

  return win;
}



module.exports = {
  registerSession,
  createFullLogsWin
};
