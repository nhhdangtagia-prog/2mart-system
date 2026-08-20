export interface IDomainEvent {
  eventName: string;
  occurredOn: Date;
}

export class OrderCreatedEvent implements IDomainEvent {
  public readonly eventName = 'OrderCreated';
  public readonly occurredOn: Date;

  constructor(
    public readonly orderId: string,
    public readonly branchId: string,
    public readonly totalAmount: number,
    occurredOn?: Date
  ) {
    this.occurredOn = occurredOn || new Date();
  }
}
