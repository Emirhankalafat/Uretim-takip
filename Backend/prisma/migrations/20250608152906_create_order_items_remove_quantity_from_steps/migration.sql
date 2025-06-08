/*
  Warnings:

  - You are about to drop the column `quantity` on the `order_steps` table. All the data in the column will be lost.

*/

-- CreateTable first
CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "Order_id" BIGINT NOT NULL,
    "Product_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_items_Order_id_Product_id_key" ON "order_items"("Order_id", "Product_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_Order_id_fkey" FOREIGN KEY ("Order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_Product_id_fkey" FOREIGN KEY ("Product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing quantity data from order_steps to order_items
INSERT INTO "order_items" ("Order_id", "Product_id", "quantity", "created_at", "updated_at")
SELECT DISTINCT 
    "Order_id", 
    "Product_id", 
    MAX("quantity") as quantity, -- Her product için maksimum quantity'yi al
    NOW() as created_at,
    NOW() as updated_at
FROM "order_steps" 
WHERE "quantity" IS NOT NULL
GROUP BY "Order_id", "Product_id"
ON CONFLICT ("Order_id", "Product_id") DO NOTHING;

-- Now safely drop the quantity column
ALTER TABLE "order_steps" DROP COLUMN "quantity";
