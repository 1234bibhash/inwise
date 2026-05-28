const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'public/icon.png'),
    title: 'InWise ERP',
    autoHideMenuBar: true // Hides the default menu bar
  });

  // Remove the default menu entirely
  Menu.setApplicationMenu(null);

  // Load the wrapper URL (using localhost for local dev/wrapping, replace with prod URL if deployed)
  mainWindow.loadURL('https://inwise.vercel.app');
  
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
