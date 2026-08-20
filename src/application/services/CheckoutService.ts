import { Order } from '../../domain/entities/Order.ts';
import { IUnitOfWork } from '../interfaces/IUnitOfWork.ts';
import { IEventDispatcher } from '../interfaces/IEventDispatcher.ts';
import { Result } from '../../shared/Result.ts';
import { IIdGenerator } from '../../shared/IIdGenerator.ts';

// Giả lập Interface Repository
interface IOrderRepository {
  save(order: Order): Promise<void>;
}
interface IInventoryRepository {
  reserve(productId: string, qty: number): Promise<void>;
}

export class CheckoutService {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly orderRepo: IOrderRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly idGenerator: IIdGenerator
  ) {}

  public async execute(branchId: string, items: any[]): Promise<Result<string>> {
    try {
      // Bắt đầu Transaction
      const orderId = await this.unitOfWork.execute(async () => {
        // 1. Tạo Entity
        const newOrderId = this.idGenerator.generate();
        const order = Order.create(newOrderId, branchId, 'HD_NEW', 100000);

        // 2. Gọi Repository (Ghi DB)
        await this.orderRepo.save(order);
        
        for (const item of items) {
          await this.inventoryRepo.reserve(item.productId, item.quantity);
        }

        // 3. Gom Domain Events nạp vào UoW
        this.unitOfWork.commitDomainEvents(order.domainEvents);

        return newOrderId;
      });

      // Nếu Transaction commit thành công, Dispatch Event vào Outbox
      // (Lưu ý: Nếu UoW.execute throw error -> Rollback, đoạn này không chạy)
      // Trong thực tế, việc lưu Outbox thường nằm chung Transaction ở UoW.execute 
      // để đảm bảo ACID. Đoạn code này chỉ mô phỏng pattern.

      return Result.ok(orderId);

    } catch (error: any) {
      return Result.fail(error.message);
    }
  }
}
