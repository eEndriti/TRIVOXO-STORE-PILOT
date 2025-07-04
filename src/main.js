const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

const createWindow = () => {
    const win = new BrowserWindow({
      autoHideMenuBar: true, 
      webPreferences: {
        preload: path.join(__dirname, 'renderer.js'), // Ensure the correct path to preload.js
        contextIsolation: true,  // Enable context isolation for security
        nodeIntegration: true,  // Disable nodeIntegration for security
        enableRemoteModule: false
  ,
      }
    });
    win.maximize()
    win.loadURL('http://localhost:5173'); // Assuming your React app is running on localhost:3000
  };

app.on('ready', createWindow);

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	if (mainWindow === null) {
		createWindow();
	}
});