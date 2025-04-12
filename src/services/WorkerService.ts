// src/services/WorkerService.ts
type WorkerResponse<T> = {
  success: boolean;
  result?: T;
  error?: string;
};

export class WorkerService {
  private static workers: Map<string, Worker> = new Map();

  /**
   * Get or create a worker instance
   */
  static getWorker(workerName: string): Worker {
    if (!this.workers.has(workerName)) {
      const worker = new Worker(`/workers/${workerName}.ts`,
        { type: 'module' }
      );
      this.workers.set(workerName, worker);
    }
    return this.workers.get(workerName)!;
  }

  /**
   * Execute a task in a worker
   */
  static executeTask<T, R>(
    workerName: string,
    data: T
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker(workerName);

      const handleMessage = (event: MessageEvent<WorkerResponse<R>>) => {
        worker.removeEventListener('message', handleMessage);

        if (event.data.success) {
          resolve(event.data.result!);
        } else {
          reject(new Error(event.data.error));
        }
      };

      worker.addEventListener('message', handleMessage);
      worker.postMessage(data);
    });
  }

  /**
   * Terminate all workers
   */
  static terminateAll(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
  }
}
