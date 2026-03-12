const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let backendServerInstance;

// Ensure games directory exists
const gamesDir = path.join(app.getPath('userData'), 'games');
if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
}

function startBackend() {
  const isPackaged = app.isPackaged;
  const backendDir = isPackaged 
    ? path.join(__dirname, 'backend')
    : path.resolve(__dirname, '..', 'steamjek-backend');
  
  // Load the backend .env explicitly
  require('dotenv').config({ path: path.join(backendDir, '.env') });
  process.env.PORT = '3000';
  
  const backendPath = path.join(backendDir, 'server.js');
  
  try {
    const backendApp = require(backendPath);
    backendServerInstance = backendApp.listen(3000, () => {
      console.log('Backend server successfully started within Electron main process natively on port 3000');
    });
  } catch (err) {
    console.error('Failed to start native backend process:', err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true
  });

  win.loadFile('page1_store.html');
}

// IPC Handlers for real file management
ipcMain.handle('game:download', async (event, { gameId, title, content }) => {
    try {
        const filePath = path.join(gamesDir, `game_${gameId}.txt`);
        fs.writeFileSync(filePath, content);
        return { success: true, path: filePath };
    } catch (err) {
        console.error('Download failed:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('game:delete', async (event, gameId) => {
    try {
        const filePath = path.join(gamesDir, `game_${gameId}.txt`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return { success: true };
        }
        return { success: true, message: 'File was already gone' };
    } catch (err) {
        console.error('Delete failed:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('game:check-installed', async (event, gameId) => {
    const filePath = path.join(gamesDir, `game_${gameId}.txt`);
    return fs.existsSync(filePath);
});

ipcMain.handle('game:open-folder', async () => {
    shell.openPath(gamesDir);
});

ipcMain.handle('game:get-path', async () => {
    return gamesDir;
});

app.whenReady().then(() => {
  startBackend();
  // Delay slightly to give the backend time to listen on the port
  setTimeout(createWindow, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  if (backendServerInstance) {
    backendServerInstance.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
