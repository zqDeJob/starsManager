const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const PORT = 37541;
let serverProcess = null;
let mainWindow = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getPaths() {
  if (app.isPackaged) {
    return {
      serverEntry: path.join(process.resourcesPath, 'app-server', 'index.js'),
      serverCwd: path.join(process.resourcesPath, 'app-server'),
      clientDist: path.join(process.resourcesPath, 'client-dist'),
      dataDir: path.join(app.getPath('userData'), 'data'),
    };
  }

  return {
    serverEntry: path.join(__dirname, '..', 'server', 'dist', 'index.js'),
    serverCwd: path.join(__dirname, '..', 'server'),
    clientDist: path.join(__dirname, '..', 'client', 'dist'),
    dataDir: path.join(__dirname, '..', 'server', 'data'),
  };
}

function waitForServer(port, retries = 40) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      http.get(`http://127.0.0.1:${port}/api/health`, res => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    };

    const retry = () => {
      attempts += 1;
      if (attempts >= retries) {
        reject(new Error('后端服务启动超时'));
        return;
      }
      setTimeout(check, 250);
    };

    check();
  });
}

async function startBackend() {
  const paths = getPaths();

  if (!fs.existsSync(paths.serverEntry)) {
    throw new Error(`找不到后端文件: ${paths.serverEntry}\n请先运行 npm run build`);
  }

  if (!fs.existsSync(paths.clientDist)) {
    throw new Error(`找不到前端文件: ${paths.clientDist}\n请先运行 npm run build`);
  }

  fs.mkdirSync(paths.dataDir, { recursive: true });

  const env = {
    ...process.env,
    PORT: String(PORT),
    STARS_DATA_DIR: paths.dataDir,
    CLIENT_DIST: paths.clientDist,
    ELECTRON_RUN_AS_NODE: '1',
  };

  if (app.isPackaged) {
    serverProcess = spawn(process.execPath, [paths.serverEntry], {
      env,
      cwd: paths.serverCwd,
      stdio: 'pipe',
    });
  } else {
    serverProcess = spawn('node', [paths.serverEntry], {
      env,
      cwd: paths.serverCwd,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
  }

  serverProcess.stdout?.on('data', chunk => console.log('[server]', chunk.toString()));
  serverProcess.stderr?.on('data', chunk => console.error('[server]', chunk.toString()));
  serverProcess.on('exit', code => {
    if (code !== null && code !== 0) {
      console.error(`Server exited with code ${code}`);
    }
  });

  await waitForServer(PORT);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'Stars Manager',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function stopBackend() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    console.error(err);
    app.exit(1);
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});
