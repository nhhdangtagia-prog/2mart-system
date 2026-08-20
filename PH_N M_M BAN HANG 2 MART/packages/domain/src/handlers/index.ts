import { commandBus, type ICommandHandler } from "@2mart/core";
import { CreateOrderCommand, AdjustInventoryCommand, ReceiveGoodsCommand } from "../commands";
import { CreateOrderUseCase, AdjustInventoryUseCase, ReceiveGoodsUseCase } from "../usecases";

export class CreateOrderCommandHandler implements ICommandHandler<CreateOrderCommand, { orderId: string; code: string }> {
  private useCase = new CreateOrderUseCase();
  async handle(command: CreateOrderCommand): Promise<{ orderId: string; code: string }> {
    return await this.useCase.execute(command);
  }
}

export class AdjustInventoryCommandHandler implements ICommandHandler<AdjustInventoryCommand, void> {
  private useCase = new AdjustInventoryUseCase();
  async handle(command: AdjustInventoryCommand): Promise<void> {
    return await this.useCase.execute(command);
  }
}

export class ReceiveGoodsCommandHandler implements ICommandHandler<ReceiveGoodsCommand, void> {
  private useCase = new ReceiveGoodsUseCase();
  async handle(command: ReceiveGoodsCommand): Promise<void> {
    return await this.useCase.execute(command);
  }
}

/**
 * Đăng ký toàn bộ Command Handlers vào CommandBus
 */
export function registerCommandHandlers(): void {
  commandBus.register("CreateOrderCommand", new CreateOrderCommandHandler());
  commandBus.register("AdjustInventoryCommand", new AdjustInventoryCommandHandler());
  commandBus.register("ReceiveGoodsCommand", new ReceiveGoodsCommandHandler());
  console.log("[Domain] Registered all Command Handlers successfully.");
}
