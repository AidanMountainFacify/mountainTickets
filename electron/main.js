const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');

const isDev = process.env.ELECTRON_DEV === '1';
const PORT = process.env.PORT || 4000;

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Mountain Tickets',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL(url);

  // Any unsaved edit (e.g. a ticket field that only saves on blur) can still
  // be in flight when the window closes. Since the API server runs in this
  // same process, closing the window kills it too — so we hold the close
  // until the renderer confirms it has flushed and finished any pending
  // saves, with a timeout as a safety net in case that never arrives.
  let readyToClose = false;
  win.on('close', (event) => {
    if (readyToClose) return;
    event.preventDefault();

    const finishClose = () => {
      if (readyToClose) return;
      readyToClose = true;
      win.close();
    };

    const timeout = setTimeout(finishClose, 3000);
    ipcMain.once('app:ready-to-close', () => {
      clearTimeout(timeout);
      finishClose();
    });
    win.webContents.send('app:before-close');
  });
}

async function start() {
  Menu.setApplicationMenu(null);

  if (isDev) {
    // Server + Vite dev server are already running (see npm run electron:dev).
    createWindow(`http://localhost:5173`);
    return;
  }

  // Deliberately NOT using app.getPath('userData'): on this machine it
  // resolves through Windows' per-app-container AppData redirection, which
  // pointed different launches of this same app at different physical
  // files and made tickets appear to vanish. server/db.js already defaults
  // to a fixed folder inside the project itself, which isn't subject to
  // that redirection, so we just leave MT_DATA_DIR unset here.

  const { createApp } = require('../server/app');
  const expressApp = createApp();

  await new Promise((resolve) => expressApp.listen(PORT, resolve));
  createWindow(`http://localhost:${PORT}`);
}

app.whenReady().then(start);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) start();
});
