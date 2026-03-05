import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { gatewayManager } from './gateway.js';
import { walletManager } from './wallet.js';
import { cronManager } from './cron.js';
import { browserManager } from './browser.js';
import { notificationManager } from './notification.js';
import { initTray, destroyTray, registerGlobalShortcuts, unregisterGlobalShortcuts } from './tray.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 保持窗口全局引用
let mainWindow: BrowserWindow | null = null;

// 创建窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,  // 启用 webview
    },
  });

  // 加载应用
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // 处理新窗口打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 初始化系统托盘
  initTray(mainWindow);

  // 设置管理器的主窗口引用
  gatewayManager.setMainWindow(mainWindow);
  walletManager.setMainWindow(mainWindow);
  browserManager.setMainWindow(mainWindow);
  notificationManager.setMainWindow(mainWindow);
}

// 应用生命周期
app.whenReady().then(() => {
  createWindow();

  // 注册全局快捷键
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // 注销全局快捷键
  unregisterGlobalShortcuts();
  // 销毁托盘
  destroyTray();
});

// IPC 处理器
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:get-platform', () => {
  return process.platform;
});

ipcMain.handle('shell:open-external', async (_, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle('dialog:show-message', async (_, options) => {
  const result = await dialog.showMessageBox(mainWindow!, options);
  return result;
});
