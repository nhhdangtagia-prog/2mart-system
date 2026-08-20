import type { IDomainEvent } from "./EventBus";

export interface IEventStore {
  append(event: IDomainEvent): Promise<void>;
  getEvents(filter?: { eventType?: string; afterTimestamp?: number }): Promise<IDomainEvent[]>;
  clear(): Promise<void>;
}

export class LocalEventStore implements IEventStore {
  private readonly STORAGE_KEY = "kiot_event_store";

  async append(event: IDomainEvent): Promise<void> {
    const events = await this.getEvents();
    events.push(event);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
  }

  async getEvents(filter?: { eventType?: string; afterTimestamp?: number }): Promise<IDomainEvent[]> {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return [];
    try {
      let events: IDomainEvent[] = JSON.parse(raw);
      if (filter?.eventType) {
        events = events.filter(e => e.eventType === filter.eventType);
      }
      if (filter?.afterTimestamp) {
        events = events.filter(e => e.timestamp > filter.afterTimestamp!);
      }
      return events;
    } catch {
      return [];
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const eventStore = new LocalEventStore();
