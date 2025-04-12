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
      try {
        // First try to load the worker using the import.meta.url approach (works in dev)
        let workerUrl;
        try {
          workerUrl = new URL(`../workers/${workerName}.js`, import.meta.url).href;
        } catch (e) {
          // If URL constructor fails, fall back to a relative path (for production/SPA)
          const baseUrl = window.location.origin;
          workerUrl = `${baseUrl}/assets/workers/${workerName}.js`;
          console.log(`Using fallback worker URL: ${workerUrl}`);
        }

        // Try to create the worker
        const worker = new Worker(workerUrl, { type: 'module' });
        
        // Add error handling for worker initialization
        worker.onerror = (error) => {
          console.error(`Error initializing ${workerName} worker:`, error);
          // Try alternative path if the first one fails
          if (!workerUrl.includes('/assets/')) {
            const baseUrl = window.location.origin;
            const altWorkerUrl = `${baseUrl}/assets/workers/${workerName}.js`;
            console.log(`Trying alternative worker URL: ${altWorkerUrl}`);
            const altWorker = new Worker(altWorkerUrl, { type: 'module' });
            this.workers.set(workerName, altWorker);
          }
        };
        
        this.workers.set(workerName, worker);
      } catch (error) {
        console.error(`Failed to initialize ${workerName} worker:`, error);
        throw new Error(`Failed to initialize ${workerName} worker: ${error.message}`);
      }
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
      try {
        const worker = this.getWorker(workerName);

        const handleMessage = (event: MessageEvent<WorkerResponse<R>>) => {
          if (event.data && event.data.action === "ready") {
            console.log('WorkerService.says', event.action);
            return;
          }
          worker.removeEventListener('message', handleMessage);

          if (event.data.success) {
            resolve(event.data.result!);
          } else {
            reject(new Error(event.data.error));
          }
        };

        const handleError = (error: ErrorEvent) => {
          console.error(`Error in ${workerName} worker:`, error);
          worker.removeEventListener('error', handleError);
          reject(new Error(`Worker error: ${error.message}`));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        worker.postMessage(data);
      } catch (error) {
        console.error('Failed to execute worker task:', error);
        reject(error);
      }
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
