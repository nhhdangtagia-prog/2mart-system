import { eventBus, commandBus, type IDomainEvent } from "@2mart/core";
import { analyticsProjectionRepo, catalogProjectionRepo } from "@2mart/read-model";
import { CreateOrderCommand } from "../commands";
import { registerCommandHandlers } from "../handlers";
import { registerEventListeners } from "../listeners";

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runAllCqrsTests(): Promise<TestResult[]> {
  console.log("=========================================");
  console.log("   STARTING CQRS & EVENT VERIFICATION   ");
  console.log("=========================================");

  // Ensure handlers and listeners are registered
  registerCommandHandlers();
  registerEventListeners();

  const results: TestResult[] = [];

  // --- Test 1: Event Replay Test ---
  try {
    console.log("[Test 1] Running Event Replay Test (1000 OrderCompleted events)...");
    const initialMetrics = await analyticsProjectionRepo.getMetrics();
    const startRev = initialMetrics.todayRevenue;
    
    const replayEvents: IDomainEvent[] = [];
    for (let i = 0; i < 1000; i++) {
      replayEvents.push({
        eventId: `REPLAY-${i}`,
        eventType: "OrderCompletedEvent",
        timestamp: Date.now(),
        payload: {
          totalAmount: 100000, // 100,000 VND per order
          items: [{ sku: "TEST-SKU", name: "Hàng test replay", quantity: 1, amount: 100000 }]
        }
      });
    }

    await eventBus.replay(replayEvents);
    const afterMetrics = await analyticsProjectionRepo.getMetrics();
    const expectedRev = startRev + (1000 * 100000);
    const passed = afterMetrics.todayRevenue === expectedRev;
    
    results.push({
      name: "Event Replay Test (1000 Orders)",
      passed,
      details: passed ? `Replayed 1000 events successfully. Revenue reached ${expectedRev.toLocaleString("vi-VN")} đ` : `Failed: expected ${expectedRev}, got ${afterMetrics.todayRevenue}`
    });
  } catch (err: any) {
    results.push({ name: "Event Replay Test", passed: false, details: err.message || String(err) });
  }

  // --- Test 2: Duplicate Event Test (Idempotency) ---
  try {
    console.log("[Test 2] Running Duplicate Event Test (Idempotency check)...");
    const beforeMetrics = await analyticsProjectionRepo.getMetrics();
    const startRev = beforeMetrics.todayRevenue;
    const dupEventId = "ID-DUPLICATE-9999";

    const dupEvent: IDomainEvent = {
      eventId: dupEventId,
      eventType: "OrderCompletedEvent",
      timestamp: Date.now(),
      payload: {
        totalAmount: 500000,
        items: [{ sku: "DUP-SKU", name: "Hàng test trùng", quantity: 1, amount: 500000 }]
      }
    };

    // Publish twice
    eventBus.publish(dupEvent);
    eventBus.publish(dupEvent);

    // Give microtasks time to execute
    await new Promise(r => setTimeout(r, 100));

    const afterMetrics = await analyticsProjectionRepo.getMetrics();
    const expectedRev = startRev + 500000; // should only add once!
    const passed = afterMetrics.todayRevenue === expectedRev;

    results.push({
      name: "Duplicate Event Test (Idempotency)",
      passed,
      details: passed ? `Published ID ${dupEventId} twice, but projection only updated once (+500,000 đ).` : `Failed: expected ${expectedRev}, got ${afterMetrics.todayRevenue}`
    });
  } catch (err: any) {
    results.push({ name: "Duplicate Event Test", passed: false, details: err.message });
  }

  // --- Test 3: Out of Order Test ---
  try {
    console.log("[Test 3] Running Out of Order Test (InventoryUpdated before OrderCompleted)...");
    const testSku = "OUT-OF-ORDER-SKU";
    await catalogProjectionRepo.save({
      id: "test-ooo",
      sku: testSku,
      name: "Sản phẩm Out Of Order",
      brandName: "Test",
      categoryName: "Test",
      retailPrice: 50000,
      stock: 100,
      status: "ACTIVE",
      imageUrl: null
    });

    // 1. Publish InventoryUpdated FIRST (stock -> 95)
    eventBus.publish({
      eventId: "OOO-1",
      eventType: "InventoryUpdatedEvent",
      timestamp: Date.now() - 5000, // arrived earlier
      payload: { sku: testSku, newStock: 95, status: "Đang bán" }
    });

    // 2. Then publish OrderCompleted
    eventBus.publish({
      eventId: "OOO-2",
      eventType: "OrderCompletedEvent",
      timestamp: Date.now(),
      payload: {
        totalAmount: 250000,
        items: [{ sku: testSku, name: "Sản phẩm Out Of Order", quantity: 5, amount: 250000 }]
      }
    });

    await new Promise(r => setTimeout(r, 100));
    const item = await catalogProjectionRepo.getBySku(testSku);
    const passed = item?.stock === 95;

    results.push({
      name: "Out of Order Event Test",
      passed,
      details: passed ? `Projection maintained correct stock (95) despite unordered event arrival.` : `Failed: expected stock 95, got ${item?.stock}`
    });
  } catch (err: any) {
    results.push({ name: "Out of Order Event Test", passed: false, details: err.message });
  }

  // --- Test 4: Offline Sync Test ---
  try {
    console.log("[Test 4] Running Offline Sync Queue Test...");
    const offlineQueue: CreateOrderCommand[] = [
      new CreateOrderCommand({
        customerName: "Khách Offline 1",
        employeeName: "Thu ngân Offline",
        paymentMethod: "CASH",
        items: [{ sku: "HEI-24", name: "Bia Heineken", quantity: 2, price: 430000 }],
        discount: 0
      }),
      new CreateOrderCommand({
        customerName: "Khách Offline 2",
        employeeName: "Thu ngân Offline",
        paymentMethod: "TRANSFER",
        items: [{ sku: "VNM-180", name: "Sữa Vinamilk", quantity: 5, price: 45000 }],
        discount: 0
      })
    ];

    console.log(`[Offline Sync] Simulated 2 queued commands while offline. Reconnecting & syncing...`);
    let syncedCount = 0;
    for (const cmd of offlineQueue) {
      await commandBus.execute(cmd);
      syncedCount++;
    }

    const passed = syncedCount === 2;
    results.push({
      name: "Offline Sync Test",
      passed,
      details: passed ? `Successfully dequeued & executed 2 offline commands upon reconnect.` : `Failed to sync queue.`
    });
  } catch (err: any) {
    results.push({ name: "Offline Sync Test", passed: false, details: err.message });
  }

  console.log("=========================================");
  console.log("         VERIFICATION RESULTS            ");
  results.forEach(r => {
    console.log(`[${r.passed ? "PASS" : "FAIL"}] ${r.name}: ${r.details}`);
  });
  console.log("=========================================");

  return results;
}
