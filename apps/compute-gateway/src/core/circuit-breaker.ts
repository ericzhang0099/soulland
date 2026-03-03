import { CircuitBreakerConfig } from '../types';

/**
 * 熔断器 - 防止级联故障
 */
export class CircuitBreaker {
  private name: string;
  private config: CircuitBreakerConfig;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private halfOpenCalls = 0;
  private lastFailureTime?: Date;
  private results: boolean[] = [];

  constructor(name: string, config: CircuitBreakerConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * 执行受保护的调用
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitBreakerOpenError(`Circuit breaker '${this.name}' is OPEN`);
    }

    try {
      const result = await fn();
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    if (this.state === 'closed') return true;

    if (this.state === 'open') {
      if (this.lastFailureTime) {
        const elapsed = (Date.now() - this.lastFailureTime.getTime()) / 1000;
        if (elapsed >= this.config.timeout) {
          console.log(`Circuit '${this.name}' transitioning to HALF_OPEN`);
          this.state = 'half-open';
          this.halfOpenCalls = 0;
          this.successCount = 0;
          return true;
        }
      }
      return false;
    }

    if (this.state === 'half-open') {
      if (this.halfOpenCalls < this.config.halfOpenMaxCalls) {
        this.halfOpenCalls++;
        return true;
      }
      return false;
    }

    return false;
  }

  private async onSuccess(): Promise<void> {
    this.recordResult(true);

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        console.log(`Circuit '${this.name}' transitioning to CLOSED`);
        this.reset();
      }
    }
  }

  private async onFailure(): Promise<void> {
    this.recordResult(false);
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'half-open') {
      console.warn(`Circuit '${this.name}' transitioning to OPEN (half-open failure)`);
      this.state = 'open';
    } else if (this.state === 'closed') {
      const errorRate = this.calculateErrorRate();
      if (this.failureCount >= this.config.failureThreshold || 
          errorRate >= this.config.errorRateThreshold) {
        console.warn(`Circuit '${this.name}' transitioning to OPEN`);
        this.state = 'open';
      }
    }
  }

  private recordResult(success: boolean): void {
    this.results.push(success);
    if (this.results.length > 100) this.results.shift();
  }

  private calculateErrorRate(): number {
    if (this.results.length === 0) return 0;
    return this.results.filter(r => !r).length / this.results.length;
  }

  private reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.results = [];
  }

  get isOpen(): boolean {
    return this.state === 'open';
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      errorRate: this.calculateErrorRate(),
      lastFailure: this.lastFailureTime?.toISOString(),
    };
  }
}

/**
 * 熔断器打开错误
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * 熔断器管理器
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60,
    errorRateThreshold: 0.5,
    halfOpenMaxCalls: 3,
  };

  getBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config || this.defaultConfig));
    }
    return this.breakers.get(name)!;
  }

  healthCheck(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  resetAll(): void {
    this.breakers.clear();
  }
}
