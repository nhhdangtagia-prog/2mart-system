import { IDomainEvent } from '../../domain/events/OrderCreatedEvent.ts';

export interface IUnitOfWork {
  execute<T>(work: () => Promise<T>): Promise<T>;
  commitDomainEvents(events: IDomainEvent[]): void;
}
