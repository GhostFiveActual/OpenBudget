const { app, BrowserWindow, session, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#f5f7fb',
    title: 'OwnLedger',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      webviewTag: false
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    const dev = process.env.OWNLEDGER_DEV === '1';
    const allowed = dev && url.startsWith('http://127.0.0.1:5173');
    if (!allowed) event.preventDefault();
  });

  if (process.env.OWNLEDGER_DEV === '1') {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // Deny all renderer permission requests. OwnLedger does not need camera, microphone,
  // geolocation, notifications, MIDI, USB, Bluetooth, clipboard-read, or other device access.
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  if (session.defaultSession.setDevicePermissionHandler) session.defaultSession.setDevicePermissionHandler(() => false);

  // Runtime network kill-switch. Production OwnLedger may read only local file/data/blob URLs.
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const dev = process.env.OWNLEDGER_DEV === '1';
    const allowed = details.url.startsWith('file://') || details.url.startsWith('data:') || details.url.startsWith('blob:') ||
      (dev && details.url.startsWith('http://127.0.0.1:5173'));
    callback({ cancel: !allowed });
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
