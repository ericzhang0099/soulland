import { ipcMain, app, BrowserWindow } from 'electron';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

// 自动化脚本接口
export interface AutomationScript {
  id: string;
  name: string;
  description?: string;
  steps: AutomationStep[];
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
}

export type AutomationStep =
  | { type: 'navigate'; url: string }
  | { type: 'click'; selector: string }
  | { type: 'type'; selector: string; text: string }
  | { type: 'wait'; duration: number }
  | { type: 'screenshot'; fullPage?: boolean; path?: string }
  | { type: 'evaluate'; script: string };

class BrowserManager {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private scripts: Map<string, AutomationScript> = new Map();
  private dataPath: string;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'browser-scripts.json');
    this.loadScripts();
    this.setupIpcHandlers();
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private loadScripts() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
        data.scripts?.forEach((script: AutomationScript) => {
          this.scripts.set(script.id, script);
        });
      }
    } catch (error) {
      console.error('Failed to load scripts:', error);
    }
  }

  private saveScripts() {
    try {
      const data = { scripts: Array.from(this.scripts.values()) };
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save scripts:', error);
    }
  }

  // 启动内置浏览器
  async launchBuiltin(): Promise<void> {
    const chromiumPath = await this.getChromiumPath();
    
    this.browser = await puppeteer.launch({
      headless: false,
      executablePath: chromiumPath,
      userDataDir: path.join(app.getPath('userData'), 'chromium'),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.page = await this.browser.newPage();
    
    // 设置视口
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  // 获取 Chromium 路径
  private async getChromiumPath(): Promise<string> {
    // 尝试从 puppeteer 获取
    try {
      const puppeteerPkg = require('puppeteer-core');
      // 返回系统 Chrome 路径或下载的 Chromium
      return puppeteerPkg.executablePath();
    } catch {
      // 返回常见路径
      const platform = process.platform;
      if (platform === 'darwin') {
        return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      } else if (platform === 'win32') {
        return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      }
      return '/usr/bin/google-chrome';
    }
  }

  // 连接 Chrome 扩展
  async connectChrome(): Promise<void> {
    // 通过 Chrome DevTools Protocol 连接
    const response = await fetch('http://127.0.0.1:9222/json/version');
    const data = await response.json();
    
    this.browser = await puppeteer.connect({
      browserWSEndpoint: data.webSocketDebuggerUrl,
    });

    const pages = await this.browser.pages();
    this.page = pages[0];
  }

  // 关闭浏览器
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  // 执行脚本
  async executeScript(scriptId: string): Promise<any> {
    const script = this.scripts.get(scriptId);
    if (!script) throw new Error('Script not found');

    if (!this.page) {
      throw new Error('Browser not launched');
    }

    const results: any[] = [];

    for (const step of script.steps) {
      try {
        switch (step.type) {
          case 'navigate':
            await this.page.goto(step.url, { waitUntil: 'networkidle2' });
            break;

          case 'click':
            await this.page.click(step.selector);
            break;

          case 'type':
            await this.page.type(step.selector, step.text);
            break;

          case 'wait':
            await this.page.waitForTimeout(step.duration);
            break;

          case 'screenshot':
            const screenshotPath = step.path || path.join(
              app.getPath('pictures'),
              `genloop-screenshot-${Date.now()}.png`
            );
            await this.page.screenshot({
              path: screenshotPath,
              fullPage: step.fullPage,
            });
            results.push({ type: 'screenshot', path: screenshotPath });
            break;

          case 'evaluate':
            const result = await this.page.evaluate(step.script);
            results.push({ type: 'evaluate', result });
            break;
        }
      } catch (error) {
        console.error(`Step failed: ${step.type}`, error);
        throw error;
      }
    }

    script.lastRun = new Date();
    script.runCount++;
    this.saveScripts();

    return results;
  }

  // 创建脚本
  createScript(scriptData: Omit<AutomationScript, 'id' | 'createdAt' | 'runCount'>): AutomationScript {
    const script: AutomationScript = {
      ...scriptData,
      id: Date.now().toString(),
      createdAt: new Date(),
      runCount: 0,
    };

    this.scripts.set(script.id, script);
    this.saveScripts();

    return script;
  }

  // 删除脚本
  deleteScript(id: string): boolean {
    const deleted = this.scripts.delete(id);
    if (deleted) {
      this.saveScripts();
    }
    return deleted;
  }

  // 获取所有脚本
  getScripts(): AutomationScript[] {
    return Array.from(this.scripts.values());
  }

  // 录制脚本（简化版）
  startRecording(): void {
    // 实际实现需要 Chrome 扩展配合
    console.log('Recording started');
  }

  stopRecording(): AutomationScript | null {
    // 返回录制的脚本
    console.log('Recording stopped');
    return null;
  }

  private setupIpcHandlers() {
    ipcMain.handle('browser:launch', async (_, type: 'builtin' | 'chrome') => {
      if (type === 'builtin') {
        await this.launchBuiltin();
      } else {
        await this.connectChrome();
      }
      return { success: true };
    });

    ipcMain.handle('browser:close', async () => {
      await this.close();
      return { success: true };
    });

    ipcMain.handle('browser:execute-script', async (_, scriptId: string) => {
      const results = await this.executeScript(scriptId);
      return { success: true, results };
    });

    ipcMain.handle('browser:get-scripts', () => this.getScripts());

    ipcMain.handle('browser:create-script', (_, script) => {
      return this.createScript(script);
    });

    ipcMain.handle('browser:delete-script', (_, id: string) => {
      return { success: this.deleteScript(id) };
    });
  }
}

export const browserManager = new BrowserManager();
export default browserManager;
