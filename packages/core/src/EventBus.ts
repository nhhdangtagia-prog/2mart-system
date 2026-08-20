export interface IDomainEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: number;
  payload: T;
}

type EventCallback<T = any> = (event: IDomainEvent<T>) => void | Promise<void>;

export interface IEventBus {
  publish<T>(event: IDomainEvent<T>): void;
  subscribe<T>(eventType: string, callback: EventCallback<T>): () => void;
  replay<T>(events: IDomainEvent<T>[]): Promise<void>;
}

export class ClientEventBus implements IEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  publish<T>(event: IDomainEvent<T>): void {
    console.log(`[EventBus] Publishing event: ${event.eventType}`, event);
    const handlers = this.listeners.get(event.eventType);
    if (handlers) {
      handlers.forEach(cb => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EventBus] Error handling event ${event.eventType}:`, err);
        }
      });
    }
  }

  subscribe<T>(eventType: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);
    
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.delete(callback as EventCallback);
      }
    };
  }

  async replay<T>(events: IDomainEvent<T>[]): Promise<void> {
    console.log(`[EventBus] Replaying ${events.length} events...`);
    for (const event of events) {
      const handlers = this.listeners.get(event.eventType);
      if (handlers) {
        for (const cb of handlers) {
          await cb(event);
        }
      }
    }
  }
}

export const eventBus = new ClientEventBus();
