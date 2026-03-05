/**
 * Gateway 管理模块
 * 负责 OpenClaw Gateway 进程的启动、停止、重启、状态监控、日志和配置管理
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { app, ipcMain, BrowserWindow } from 'electron';
import { notificationManager } from './notification.js';

// Gateway 状态类型
export type GatewayStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

// Gateway 配置接口
export interface GatewayConfig {
  // 基本配置
  port: number;
  host: string;
  
  // 日志配置
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logPath: string;
  maxLogSize: number; // MB
  maxLogFiles: number;
  
  // 性能配置
  maxWorkers: number;
  requestTimeout: number; // ms
  
  // 功能开关
  enableBrowser: boolean;
  enableChannels: boolean;
  enableSkills: boolean;
  
  // 自定义环境变量
  env: Record<string, string>;
}

// Gateway 健康状态
export interface GatewayHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
  lastCheck: Date;
  checks: {
    process: boolean;
    http: boolean;
    websocket: boolean;
  };
}

// 日志条目
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source: 'gateway' | 'system';
}

// 默认配置
const DEFAULT_CONFIG: GatewayConfig = {
  port: 3000,
  host: '127.0.0.1',
  logLevel: 'info',
  logPath: '',
  maxLogSize: 100,
  maxLogFiles: 5,
  maxWorkers: 4,
  requestTimeout: 30000,
  enableBrowser: true,
  enableChannels: true,
  enableSkills: true,
  env: {},
};

// Gateway 管理器类
export class GatewayManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private status: GatewayStatus = 'stopped';
  private config: GatewayConfig;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealth: GatewayHealth | null = null;
  private configPath: string;
  private logFileStream: fs.WriteStream | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    super();
    
    // 初始化配置路径
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'gateway-config.json');
    
    // 加载或创建默认配置
    this.config = this.loadConfig();
    
    // 设置默认日志路径
    if (!this.config.logPath) {
      this.config.logPath = path.join(userDataPath, 'logs');
    }
    
    // 确保日志目录存在
    this.ensureLogDirectory();
    
    // 设置 IPC 处理器
    this.setupIpcHandlers();
    
    // 应用退出时停止 Gateway
    app.on('before-quit', () => {
      this.stop();
    });
  }

  /**
   * 设置主窗口引用（用于发送状态更新）
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): GatewayConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const saved = JSON.parse(data);
        return { ...DEFAULT_CONFIG, ...saved };
      }
    } catch (error) {
      this.addLog('error', `Failed to load config: ${error}`, 'system');
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 保存配置文件
   */
  saveConfig(config?: Partial<GatewayConfig>): GatewayConfig {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      this.addLog('info', 'Configuration saved', 'system');
    } catch (error) {
      this.addLog('error', `Failed to save config: ${error}`, 'system');
    }
    
    return this.config;
  }

  /**
   * 获取当前配置
   */
  getConfig(): GatewayConfig {
    return { ...this.config };
  }

  /**
   * 重置配置为默认值
   */
  resetConfig(): GatewayConfig {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
    this.addLog('info', 'Configuration reset to defaults', 'system');
    return this.config;
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.config.logPath)) {
        fs.mkdirSync(this.config.logPath, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * 获取 Gateway 可执行文件路径
   */
  private getGatewayExecutable(): string {
    // 开发环境：使用项目中的 openclaw
    const devPath = path.join(process.cwd(), '..', '..', 'node_modules', '.bin', 'openclaw');
    
    // 生产环境：使用打包后的路径
    const prodPath = path.join(process.resourcesPath || '', 'openclaw');
    
    // 检查开发路径
    if (fs.existsSync(devPath)) {
      return devPath;
    }
    
    // 检查生产路径
    if (fs.existsSync(prodPath)) {
      return prodPath;
    }
    
    // 尝试使用全局安装的 openclaw
    return 'openclaw';
  }

  /**
   * 启动 Gateway 进程
   */
  async start(): Promise<void> {
    if (this.status === 'running' || this.status === 'starting') {
      throw new Error('Gateway is already running');
    }

    this.setStatus('starting');
    this.addLog('info', 'Starting Gateway...', 'system');

    try {
      const executable = this.getGatewayExecutable();
      
      // 准备环境变量
      const env = {
        ...process.env,
        ...this.config.env,
        OPENCLAW_PORT: this.config.port.toString(),
        OPENCLAW_HOST: this.config.host,
        OPENCLAW_LOG_LEVEL: this.config.logLevel,
        NODE_ENV: app.isPackaged ? 'production' : 'development',
      };

      // 启动进程
      this.process = spawn(executable, ['gateway', 'start'], {
        env,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // 处理标准输出
      this.process.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
          if (line) {
            this.parseAndAddLog(line, 'info');
          }
        });
      });

      // 处理标准错误
      this.process.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
          if (line) {
            this.parseAndAddLog(line, 'error');
          }
        });
      });

      // 处理进程退出
      this.process.on('exit', (code) => {
        this.handleProcessExit(code);
      });

      this.process.on('error', (error) => {
        this.addLog('error', `Process error: ${error.message}`, 'system');
        this.setStatus('error');
      });

      // 等待进程启动
      await this.waitForStartup();
      
      // 启动健康检查
      this.startHealthCheck();
      
      this.addLog('info', 'Gateway started successfully', 'system');
      this.setStatus('running');
      
      // 发送成功通知
      notificationManager.success('Gateway 已启动', `Gateway 服务正在运行在端口 ${this.config.port}`, {
        source: 'gateway',
        data: { port: this.config.port, host: this.config.host }
      });
      
    } catch (error) {
      this.addLog('error', `Failed to start Gateway: ${error}`, 'system');
      this.setStatus('error');
      
      // 发送错误通知
      notificationManager.error('Gateway 启动失败', String(error), {
        source: 'gateway',
        priority: 'high'
      });
      
      throw error;
    }
  }

  /**
   * 等待 Gateway 启动完成
   */
  private waitForStartup(timeout: number = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        // 检查进程是否还在运行
        if (!this.process || this.process.killed) {
          clearInterval(checkInterval);
          reject(new Error('Process exited unexpectedly'));
          return;
        }
        
        // 检查是否超时
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Startup timeout'));
          return;
        }
        
        // 尝试连接 Gateway HTTP 端口
        this.checkHttpHealth().then((healthy) => {
          if (healthy) {
            clearInterval(checkInterval);
            resolve();
          }
        }).catch(() => {
          // 继续等待
        });
      }, 1000);
    });
  }

  /**
   * 停止 Gateway 进程
   */
  async stop(): Promise<void> {
    if (this.status === 'stopped' || this.status === 'stopping') {
      return;
    }

    this.setStatus('stopping');
    this.addLog('info', 'Stopping Gateway...', 'system');

    // 停止健康检查
    this.stopHealthCheck();

    if (this.process) {
      // 尝试优雅关闭
      this.process.kill('SIGTERM');
      
      // 等待进程退出
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // 强制终止
          this.process?.kill('SIGKILL');
          resolve();
        }, 5000);
        
        this.process?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      this.process = null;
    }

    this.addLog('info', 'Gateway stopped', 'system');
    this.setStatus('stopped');
    
    // 发送停止通知
    notificationManager.info('Gateway 已停止', 'Gateway 服务已停止运行', {
      source: 'gateway'
    });
  }

  /**
   * 重启 Gateway 进程
   */
  async restart(): Promise<void> {
    this.addLog('info', 'Restarting Gateway...', 'system');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.start();
  }

  /**
   * 处理进程退出
   */
  private handleProcessExit(code: number | null) {
    this.process = null;
    this.stopHealthCheck();
    
    if (code !== 0 && code !== null) {
      this.addLog('error', `Gateway exited with code ${code}`, 'system');
      this.setStatus('error');
      
      // 发送异常退出通知
      notificationManager.error('Gateway 异常退出', `进程退出码: ${code}，请检查日志`, {
        source: 'gateway',
        priority: 'high'
      });
    } else {
      this.setStatus('stopped');
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): GatewayStatus {
    return this.status;
  }

  /**
   * 设置状态并通知渲染进程
   */
  private setStatus(status: GatewayStatus) {
    this.status = status;
    this.emit('statusChange', status);
    
    // 通过 IPC 通知渲染进程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('gateway:status-change', status);
    }
  }

  /**
   * 添加日志条目
   */
  private addLog(level: LogEntry['level'], message: string, source: LogEntry['source']) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message: message.trim(),
      source,
    };
    
    this.logs.push(entry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // 写入日志文件
    this.writeToLogFile(entry);
    
    // 通知渲染进程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('gateway:log', entry);
    }
    
    this.emit('log', entry);
  }

  /**
   * 解析日志行并添加
   */
  private parseAndAddLog(line: string, defaultLevel: LogEntry['level']) {
    // 尝试解析日志级别
    let level = defaultLevel;
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('[error]') || lowerLine.includes('error:')) {
      level = 'error';
    } else if (lowerLine.includes('[warn]') || lowerLine.includes('warning:')) {
      level = 'warn';
    } else if (lowerLine.includes('[debug]')) {
      level = 'debug';
    } else if (lowerLine.includes('[info]')) {
      level = 'info';
    }
    
    this.addLog(level, line, 'gateway');
  }

  /**
   * 写入日志文件
   */
  private writeToLogFile(entry: LogEntry) {
    try {
      if (!this.logFileStream) {
        const logFile = path.join(this.config.logPath, `gateway-${this.getDateString()}.log`);
        this.logFileStream = fs.createWriteStream(logFile, { flags: 'a' });
        
        // 清理旧日志文件
        this.cleanupOldLogs();
      }
      
      const line = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] ${entry.message}\n`;
      this.logFileStream.write(line);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * 获取日期字符串（用于日志文件名）
   */
  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * 清理旧日志文件
   */
  private cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.config.logPath)
        .filter(f => f.startsWith('gateway-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.config.logPath, f),
          stat: fs.statSync(path.join(this.config.logPath, f)),
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
      
      // 删除超出保留数量的旧日志
      if (files.length > this.config.maxLogFiles) {
        files.slice(this.config.maxLogFiles).forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            // 忽略删除错误
          }
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * 获取日志列表
   */
  getLogs(options?: { 
    level?: LogEntry['level']; 
    limit?: number; 
    source?: LogEntry['source'];
  }): LogEntry[] {
    let logs = [...this.logs];
    
    if (options?.level) {
      logs = logs.filter(l => l.level === options.level);
    }
    
    if (options?.source) {
      logs = logs.filter(l => l.source === options.source);
    }
    
    if (options?.limit) {
      logs = logs.slice(-options.limit);
    }
    
    return logs;
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
    this.addLog('info', 'Logs cleared', 'system');
  }

  /**
   * 导出日志到文件
   */
  exportLogs(targetPath: string): boolean {
    try {
      const content = this.logs
        .map(l => `[${l.timestamp.toISOString()}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`)
        .join('\n');
      
      fs.writeFileSync(targetPath, content);
      return true;
    } catch (error) {
      this.addLog('error', `Failed to export logs: ${error}`, 'system');
      return false;
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck() {
    if (this.healthCheckInterval) {
      return;
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000); // 每 10 秒检查一次
    
    // 立即执行一次检查
    this.performHealthCheck();
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.lastHealth = null;
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck() {
    const health: GatewayHealth = {
      status: 'unknown',
      uptime: 0,
      memory: { used: 0, total: 0 },
      cpu: 0,
      lastCheck: new Date(),
      checks: {
        process: false,
        http: false,
        websocket: false,
      },
    };

    // 检查进程状态
    health.checks.process = this.process !== null && !this.process.killed;

    // 检查 HTTP 健康
    try {
      health.checks.http = await this.checkHttpHealth();
    } catch {
      health.checks.http = false;
    }

    // 检查 WebSocket
    try {
      health.checks.websocket = await this.checkWebSocketHealth();
    } catch {
      health.checks.websocket = false;
    }

    // 获取进程资源使用
    if (this.process && health.checks.process) {
      try {
        const usage = process.resourceUsage?.();
        if (usage) {
          health.memory.used = usage.maxRSS * 1024; // 转换为字节
        }
      } catch {
        // 忽略资源使用获取错误
      }
    }

    // 确定整体状态
    if (health.checks.process && health.checks.http) {
      health.status = 'healthy';
    } else if (!health.checks.process) {
      health.status = 'unhealthy';
    } else {
      health.status = 'unknown';
    }

    this.lastHealth = health;
    
    // 通知渲染进程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('gateway:health', health);
    }
    
    this.emit('health', health);
  }

  /**
   * 检查 HTTP 健康
   */
  private async checkHttpHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      const http = require('http');
      
      const req = http.get(`http://${this.config.host}:${this.config.port}/health`, {
        timeout: 5000,
      }, (res: any) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * 检查 WebSocket 健康
   */
  private async checkWebSocketHealth(): Promise<boolean> {
    // 简化实现：如果 HTTP 健康，假设 WebSocket 也健康
    // 实际实现可以连接 WebSocket 并发送 ping
    return this.checkHttpHealth();
  }

  /**
   * 获取健康状态
   */
  getHealth(): GatewayHealth | null {
    return this.lastHealth;
  }

  /**
   * 测试配置是否有效
   */
  async testConfig(config: Partial<GatewayConfig>): Promise<{ valid: boolean; error?: string }> {
    try {
      // 检查端口是否可用
      if (config.port) {
        const isAvailable = await this.isPortAvailable(config.port);
        if (!isAvailable && config.port !== this.config.port) {
          return { valid: false, error: `Port ${config.port} is already in use` };
        }
      }
      
      // 检查日志路径
      if (config.logPath) {
        try {
          fs.accessSync(config.logPath, fs.constants.W_OK);
        } catch {
          return { valid: false, error: `Log path ${config.logPath} is not writable` };
        }
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  /**
   * 检查端口是否可用
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(port, this.config.host);
    });
  }

  /**
   * 设置 IPC 处理器
   */
  private setupIpcHandlers() {
    // 启动 Gateway
    ipcMain.handle('gateway:start', async () => {
      await this.start();
      return { success: true };
    });

    // 停止 Gateway
    ipcMain.handle('gateway:stop', async () => {
      await this.stop();
      return { success: true };
    });

    // 重启 Gateway
    ipcMain.handle('gateway:restart', async () => {
      await this.restart();
      return { success: true };
    });

    // 获取状态
    ipcMain.handle('gateway:get-status', () => {
      return this.getStatus();
    });

    // 获取配置
    ipcMain.handle('gateway:get-config', () => {
      return this.getConfig();
    });

    // 保存配置
    ipcMain.handle('gateway:save-config', (_, config: Partial<GatewayConfig>) => {
      return this.saveConfig(config);
    });

    // 重置配置
    ipcMain.handle('gateway:reset-config', () => {
      return this.resetConfig();
    });

    // 测试配置
    ipcMain.handle('gateway:test-config', async (_, config: Partial<GatewayConfig>) => {
      return this.testConfig(config);
    });

    // 获取日志
    ipcMain.handle('gateway:get-logs', (_, options) => {
      return this.getLogs(options);
    });

    // 清空日志
    ipcMain.handle('gateway:clear-logs', () => {
      this.clearLogs();
      return { success: true };
    });

    // 导出日志
    ipcMain.handle('gateway:export-logs', (_, targetPath: string) => {
      return { success: this.exportLogs(targetPath) };
    });

    // 获取健康状态
    ipcMain.handle('gateway:get-health', () => {
      return this.getHealth();
    });

    // 获取日志文件路径
    ipcMain.handle('gateway:get-log-path', () => {
      return this.config.logPath;
    });
  }
}

// 导出单例实例
export const gatewayManager = new GatewayManager();
export default gatewayManager;
