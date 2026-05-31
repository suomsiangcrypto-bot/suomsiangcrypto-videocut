// ───────────────────────────────────────────────
// SUOMSIANG VIDEOCUT — Electron main process
// ───────────────────────────────────────────────
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow(){
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: '#0e0e14',
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,          // ให้ preload ใช้ Node (fs / child_process / ffmpeg-static) ได้
      backgroundThrottling: false
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'app', 'editor.html'));

  // เปิด DevTools เมื่อรันแบบ dev (ตั้ง env SUOMSIANG_DEV=1)
  if (process.env.SUOMSIANG_DEV) win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
