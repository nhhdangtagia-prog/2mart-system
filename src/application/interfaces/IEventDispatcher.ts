import { IDomainEvent } from '../../domain/events/OrderCreatedEvent.ts';

export interface IEventDispatcher {
  publish(events: IDomainEvent[]): Promise<void>;
}
