export interface IQuery<TResult = any> {
  readonly type: string;
  readonly _res?: TResult;
}

export interface IQueryHandler<TQuery extends IQuery<TResult>, TResult> {
  execute(query: TQuery): Promise<TResult> | TResult;
}

export interface IQueryBus {
  register<TQuery extends IQuery<TResult>, TResult>(
    queryType: string,
    handler: IQueryHandler<TQuery, TResult>
  ): void;
  ask<TResult>(query: IQuery<TResult>): Promise<TResult>;
}

export class ClientQueryBus implements IQueryBus {
  private handlers: Map<string, IQueryHandler<any, any>> = new Map();

  register<TQuery extends IQuery<TResult>, TResult>(
    queryType: string,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler);
  }

  async ask<TResult>(query: IQuery<TResult>): Promise<TResult> {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`[QueryBus] No handler registered for query type: ${query.type}`);
    }
    return await handler.execute(query);
  }
}

export const queryBus = new ClientQueryBus();
