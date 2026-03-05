import { ipcMain, app } from 'electron';
import { spawn } from 'child_process';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';

// 定时任务接口
export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  description?: string;
  agentId: string;
  prompt: string;
  enabled: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  notification: {
    onSuccess: boolean;
    onFailure: boolean;
    channels: string[];
  };
}

// Cron 预设
export const CRON_PRESETS = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每5分钟', value: '*/5 * * * *' },
  { label: '每15分钟', value: '*/15 * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天', value: '0 0 * * *' },
  { label: '每周', value: '0 0 * * 0' },
  { label: '每月', value: '0 0 1 * *' },
];

class CronManager {
  private jobs: Map<string, CronJob> = new Map();
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'cron-jobs.json');
    this.loadJobs();
    this.setupIpcHandlers();
  }

  private loadJobs() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'));
        data.jobs?.forEach((job: CronJob) => {
          this.jobs.set(job.id, job);
          if (job.enabled) {
            this.scheduleJob(job);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load cron jobs:', error);
    }
  }

  private saveJobs() {
    try {
      const data = { jobs: Array.from(this.jobs.values()) };
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save cron jobs:', error);
    }
  }

  createJob(jobData: Omit<CronJob, 'id' | 'createdAt' | 'runCount'>): CronJob {
    const job: CronJob = {
      ...jobData,
      id: Date.now().toString(),
      createdAt: new Date(),
      runCount: 0,
    };

    if (!cron.validate(job.schedule)) {
      throw new Error('Invalid cron expression');
    }

    this.jobs.set(job.id, job);
    this.saveJobs();

    if (job.enabled) {
      this.scheduleJob(job);
    }

    return job;
  }

  private scheduleJob(job: CronJob) {
    this.unscheduleJob(job.id);

    const task = cron.schedule(job.schedule, async () => {
      console.log(`Executing cron job: ${job.name}`);
      // 调用 Gateway API 执行
    }, { scheduled: true });

    this.tasks.set(job.id, task);
  }

  private unscheduleJob(id: string) {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
    }
  }

  getJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  private setupIpcHandlers() {
    ipcMain.handle('cron:get-jobs', () => this.getJobs());
    ipcMain.handle('cron:create-job', (_, job) => this.createJob(job));
    ipcMain.handle('cron:delete-job', (_, id) => {
      this.unscheduleJob(id);
      this.jobs.delete(id);
      this.saveJobs();
      return { success: true };
    });
    ipcMain.handle('cron:toggle-job', (_, { id, enabled }) => {
      const job = this.jobs.get(id);
      if (job) {
        job.enabled = enabled;
        this.saveJobs();
        if (enabled) this.scheduleJob(job);
        else this.unscheduleJob(id);
      }
      return job;
    });
  }
}

export const cronManager = new CronManager();
export default cronManager;
