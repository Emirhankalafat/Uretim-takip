-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_Customer_id_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "Customer_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_Customer_id_fkey" FOREIGN KEY ("Customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
