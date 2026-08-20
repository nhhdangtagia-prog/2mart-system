export interface IScheduler {
  scheduleTask(name: string, intervalMs: number, task: () => void | Promise<void>): () => void;
  executeOnce(name: string, delayMs: number, task: () => void | Promise<void>): () => void;
}

export class ClientScheduler implements IScheduler {
  private timers: Map<string, any> = new Map();

  scheduleTask(name: string, intervalMs: number, task: () => void | Promise<void>): () => void {
    if (this.timers.has(name)) {
      clearInterval(this.timers.get(name));
    }
    const timer = setInterval(async () => {
      try {
        await task();
      } catch (err) {
        console.error(`[Scheduler] Error in task ${name}:`, err);
      }
    }, intervalMs);
    this.timers.set(name, timer);

    return () => {
      clearInterval(timer);
      this.timers.delete(name);
    };
  }

  executeOnce(name: string, delayMs: number, task: () => void | Promise<void>): () => void {
    const timer = setTimeout(async () => {
      try {
        await task();
      } catch (err) {
        console.error(`[Scheduler] Error in once task ${name}:`, err);
      } finally {
        this.timers.delete(name);
      }
    }, delayMs);
    this.timers.set(name, timer);

    return () => {
      clearTimeout(timer);
      this.timers.delete(name);
    };
  }
}

export const scheduler = new ClientScheduler();
