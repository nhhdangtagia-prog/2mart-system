export interface ICommand<TResponse = void> {
  readonly type: string;
  readonly _res?: TResponse;
}

export interface ICommandHandler<TCommand extends ICommand<TResponse>, TResponse = void> {
  handle(command: TCommand): Promise<TResponse> | TResponse;
}

export interface ICommandBus {
  register<TCommand extends ICommand<TResponse>, TResponse>(
    commandType: string,
    handler: ICommandHandler<TCommand, TResponse>
  ): void;
  execute<TResponse>(command: ICommand<TResponse>): Promise<TResponse>;
}

export class ClientCommandBus implements ICommandBus {
  private handlers: Map<string, ICommandHandler<any, any>> = new Map();

  register<TCommand extends ICommand<TResponse>, TResponse>(
    commandType: string,
    handler: ICommandHandler<TCommand, TResponse>
  ): void {
    if (this.handlers.has(commandType)) {
      console.warn(`[CommandBus] Handler for command ${commandType} is being overwritten.`);
    }
    this.handlers.set(commandType, handler);
  }

  async execute<TResponse>(command: ICommand<TResponse>): Promise<TResponse> {
    console.log(`[CommandBus] Executing command: ${command.type}`, command);
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`[CommandBus] No handler registered for command type: ${command.type}`);
    }
    return await handler.handle(command);
  }
}

export const commandBus = new ClientCommandBus();
