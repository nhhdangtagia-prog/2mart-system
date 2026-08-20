import os

schema_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\api\prisma\schema.prisma'

new_models = """

model Product {
  id           String        @id @default(uuid())
  sku          String        @unique
  name         String
  brandName    String?
  categoryName String?
  retailPrice  Float
  costPrice    Float?
  status       String        @default("ACTIVE")
  imageUrl     String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  branchStocks BranchStock[]
}

model BranchStock {
  id         String   @id @default(uuid())
  productSku String
  product    Product  @relation(fields: [productSku], references: [sku], onDelete: Cascade)
  branch     String
  stock      Int      @default(0)
  @@unique([productSku, branch])
}

model Order {
  id             String      @id @default(uuid())
  code           String      @unique
  customerName   String
  employeeName   String
  employeeCode   String?
  totalAmount    Float
  paymentMethod  String
  cashAmount     Float?
  transferAmount Float?
  cardAmount     Float?
  branch         String?
  status         String      @default("COMPLETED")
  itemsCount     Int
  items          OrderItem[]
  createdAt      DateTime    @default(now())
  createdAtMs    BigInt?
  updatedAt      DateTime    @updatedAt
}

model OrderItem {
  id       String @id @default(uuid())
  orderId  String
  order    Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  sku      String
  name     String
  quantity Int
  price    Float
}

model PurchaseOrder {
  id             String              @id @default(uuid())
  code           String              @unique
  timestamp      String
  importDate     String
  branch         String
  supplierName   String
  supplierCode   String
  totalQuantity  Int
  grossAmount    Float?
  itemsDiscount  Float?
  totalAmount    Float
  discount       Float
  discountValue  Float?
  discountType   String?
  amountPaid     Float?
  amountDue      Float?
  status         String
  note           String?
  expectedDate   String?
  creator        String
  items          PurchaseOrderItem[]
  logs           PurchaseOrderLog[]
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
}

model PurchaseOrderItem {
  id              String        @id @default(uuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  sku             String
  name            String
  quantity        Int
  costPrice       Float
  discountValue   Float?
  discountType    String?
  discountAmount  Float?
  amount          Float
}

model PurchaseOrderLog {
  id              String        @id @default(uuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  timestamp       String
  action          String
  actor           String
  detail          String
}

model TransferOrder {
  id            String              @id @default(uuid())
  code          String              @unique
  timestamp     String
  fromBranch    String
  toBranch      String
  totalQuantity Int
  creator       String
  note          String?
  status        String
  items         TransferOrderItem[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
}

model TransferOrderItem {
  id              String        @id @default(uuid())
  transferOrderId String
  transferOrder   TransferOrder @relation(fields: [transferOrderId], references: [id], onDelete: Cascade)
  sku             String
  name            String
  quantity        Int
}
"""

with open(schema_path, 'a', encoding='utf-8') as f:
    f.write(new_models)

print("Schema appended successfully.")
