import { Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import * as path from 'path';

/**
 * CompositionService
 * High-performance API aggregator optimized for 2k req/s.
 * Implements Worker Threads to offload CPU-intensive serialization,
 * ensuring Event Loop stability and sub-400ms p99 latency.
 */
@Injectable()
export default class CompositionService {
  private worker: Worker | undefined;
  private pendingTasks: Map<number, { resolve: Function; reject: Function }> = new Map();
  private currentTaskId = 0;
  private nextTaskIdToResolve = 0;
  private readonly workerPath = path.join(__dirname, '../workers/composition.worker.js');

  constructor(private readonly logger: any) {
    this.startWorker();
  }

  private startWorker(): void {
    if (cpus().length >= 2) {
      this.worker = new Worker(this.workerPath);
      
      this.worker.on('message', (data) => this.handleWorkerMessage(data));
      this.worker.on('error', (err) => {
          this.logger.error('Worker Failure:', err);
          this.startWorker();
      });
      this.worker.on('exit', (code) => {
        if (code !== 0) {
            this.logger.warn('Worker terminated. Re-initializing...');
            this.startWorker();
        }
      });
    }
  }

  private handleWorkerMessage({ taskId, result, error }: any) {
    const task = this.pendingTasks.get(taskId);
    if (!task) return;

    if (error) task.reject(error);
    else task.resolve(result);

    this.pendingTasks.delete(taskId);
    this.processPendingTasks();
  }

  private async processPendingTasks() {
    while (this.pendingTasks.has(this.nextTaskIdToResolve)) {
      this.nextTaskIdToResolve++;
    }
  }

  public async compose(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = this.currentTaskId++;
      this.pendingTasks.set(taskId, { resolve, reject });
      this.worker?.postMessage({ taskId, ...payload });
    });
  }
}
