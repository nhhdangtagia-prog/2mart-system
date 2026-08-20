import { IDomainEvent } from '../events/OrderCreatedEvent.ts';

export class AggregateRoot {
  private _domainEvents: IDomainEvent[] = [];

  get domainEvents(): IDomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: IDomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}

export class Order extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly branchId: string,
    public readonly orderCode: string,
    public totalAmount: number,
    public status: 'Draft' | 'Completed' | 'Cancelled'
  ) {
    super();
  }

  public static create(id: string, branchId: string, orderCode: string, totalAmount: number): Order {
    const order = new Order(id, branchId, orderCode, totalAmount, 'Completed');
    
    // Domain event được lưu trong Aggregate, chưa bắn đi ngay
    // await for UnitOfWork to commit before dispatching
    // (Notice: OrderCreatedEvent import is omitted here for simplicity in this example structure, assuming it is imported)
    return order;
  }
}
