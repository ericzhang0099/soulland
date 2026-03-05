import { app, Tray, Menu, BrowserWindow, nativeImage, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 托盘实例
let tray: Tray | null = null;
// 主窗口引用
let mainWindow: BrowserWindow | null = null;
// 是否最小化到托盘
let minimizeToTray = true;
// 全局快捷键
const GLOBAL_SHORTCUT = 'CommandOrControl+Shift+G';

/**
 * 创建托盘图标
 */
function createTrayIcon(): nativeImage {
  // 尝试多个可能的路径
  const possiblePaths = [
    path.join(__dirname, '../../assets/tray-icon.png'),
    path.join(__dirname, '../../assets/icon.png'),
    path.join(__dirname, '../../dist/assets/tray-icon.png'),
    path.join(app.getAppPath(), 'assets/tray-icon.png'),
  ];

  for (const iconPath of possiblePaths) {
    if (fs.existsSync(iconPath)) {
      try {
        const image = nativeImage.createFromPath(iconPath);
        if (!image.isEmpty()) {
          // 调整图标大小为适合托盘的大小
          return image.resize({ width: 16, height: 16 });
        }
      } catch {
        // 继续尝试下一个路径
      }
    }
  }

  // 如果没有找到图标文件，创建一个简单的图标
  return createDefaultIcon();
}

/**
 * 创建默认图标 (使用 Electron 内置方式)
 */
function createDefaultIcon(): nativeImage {
  // 创建一个 16x16 的彩色方块作为默认图标
  // 使用 Canvas API 创建 SVG 然后转换为 nativeImage
  const svgIcon = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="16" rx="3" fill="#6366f1"/>
    <text x="8" y="12" font-size="10" text-anchor="middle" fill="white" font-family="Arial">G</text>
  </svg>`;

  try {
    // 尝试从 Data URL 创建
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgIcon).toString('base64')}`;
    return nativeImage.createFromDataURL(dataUrl);
  } catch {
    // 如果失败，返回空图标
    return nativeImage.createEmpty();
  }
}

/**
 * 创建托盘菜单
 */
function createTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: '显示 GenLoop',
      click: () => {
        showMainWindow();
      },
    },
    {
      label: '隐藏 GenLoop',
      click: () => {
        hideMainWindow();
      },
    },
    { type: 'separator' },
    {
      label: '最小化到托盘',
      type: 'checkbox',
      checked: minimizeToTray,
      click: (menuItem) => {
        minimizeToTray = menuItem.checked;
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      },
    },
  ]);
}

/**
 * 显示主窗口
 */
function showMainWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

/**
 * 隐藏主窗口
 */
function hideMainWindow(): void {
  if (mainWindow) {
    mainWindow.hide();
  }
}

/**
 * 切换主窗口显示/隐藏
 */
function toggleMainWindow(): void {
  if (mainWindow) {
    if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
      hideMainWindow();
    } else {
      showMainWindow();
    }
  }
}

/**
 * 初始化系统托盘
 */
export function initTray(window: BrowserWindow): void {
  mainWindow = window;

  // 创建托盘图标
  const icon = createTrayIcon();
  tray = new Tray(icon);

  // 设置托盘提示文本
  tray.setToolTip('GenLoop Desktop');

  // 设置托盘菜单
  tray.setContextMenu(createTrayMenu());

  // 点击托盘图标切换窗口显示
  tray.on('click', () => {
    toggleMainWindow();
  });

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    showMainWindow();
  });

  // 处理窗口最小化事件
  mainWindow.on('minimize', (event: Event) => {
    if (minimizeToTray) {
      event.preventDefault();
      hideMainWindow();
    }
  });

  // 处理窗口关闭事件 - 最小化到托盘而不是退出
  mainWindow.on('close', (event: Event) => {
    if (minimizeToTray && !app.isQuiting) {
      event.preventDefault();
      hideMainWindow();
    }
  });

  // 注册 IPC 处理器
  registerIpcHandlers();

  console.log('系统托盘已初始化');
}

/**
 * 注册 IPC 处理器
 */
function registerIpcHandlers(): void {
  // 显示窗口
  ipcMain.handle('tray:show', () => {
    showMainWindow();
    return { success: true };
  });

  // 隐藏窗口
  ipcMain.handle('tray:hide', () => {
    hideMainWindow();
    return { success: true };
  });

  // 切换窗口显示状态
  ipcMain.handle('tray:toggle', () => {
    toggleMainWindow();
    return { success: true };
  });

  // 获取托盘设置
  ipcMain.handle('tray:get-settings', () => {
    return {
      minimizeToTray,
      globalShortcut: GLOBAL_SHORTCUT,
    };
  });

  // 设置最小化到托盘
  ipcMain.handle('tray:set-minimize-to-tray', (_, value: boolean) => {
    minimizeToTray = value;
    // 更新菜单状态
    if (tray) {
      tray.setContextMenu(createTrayMenu());
    }
    return { success: true };
  });
}

/**
 * 注册全局快捷键
 */
export function registerGlobalShortcuts(): void {
  // 注册全局快捷键 CommandOrControl+Shift+G 来快速唤起应用
  const ret = globalShortcut.register(GLOBAL_SHORTCUT, () => {
    toggleMainWindow();
  });

  if (!ret) {
    console.warn('全局快捷键注册失败:', GLOBAL_SHORTCUT);
  } else {
    console.log('全局快捷键已注册:', GLOBAL_SHORTCUT);
  }
}

/**
 * 注销全局快捷键
 */
export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
  console.log('全局快捷键已注销');
}

/**
 * 销毁托盘
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  mainWindow = null;
}

/**
 * 获取托盘实例
 */
export function getTray(): Tray | null {
  return tray;
}

/**
 * 更新托盘菜单
 */
export function updateTrayMenu(): void {
  if (tray) {
    tray.setContextMenu(createTrayMenu());
  }
}

/**
 * 设置托盘提示
 */
export function setTrayTooltip(tooltip: string): void {
  if (tray) {
    tray.setToolTip(tooltip);
  }
}

/**
 * 闪烁托盘图标 (用于通知)
 */
export function flashTrayIcon(enabled: boolean): void {
  if (tray) {
    // 在 Windows 上，可以使用 flashFrame
    // 在 macOS 上，可以使用 bounce
    // 这里简单地切换图标来模拟闪烁效果
    if (enabled) {
      // 可以在这里切换到高亮图标
      tray.setToolTip('GenLoop Desktop (新消息)');
    } else {
      tray.setToolTip('GenLoop Desktop');
    }
  }
}
