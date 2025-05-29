-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "Customer_id" BIGINT NOT NULL,
    "Company_id" BIGINT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_steps" (
    "id" BIGSERIAL NOT NULL,
    "Order_id" BIGINT NOT NULL,
    "Product_id" BIGINT NOT NULL,
    "step_name" TEXT NOT NULL,
    "step_description" TEXT,
    "step_number" INTEGER NOT NULL,
    "assigned_user" BIGINT,
    "status" "StepStatus" NOT NULL DEFAULT 'WAITING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "order_steps_Order_id_Product_id_step_number_key" ON "order_steps"("Order_id", "Product_id", "step_number");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_Customer_id_fkey" FOREIGN KEY ("Customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_Company_id_fkey" FOREIGN KEY ("Company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_steps" ADD CONSTRAINT "order_steps_Order_id_fkey" FOREIGN KEY ("Order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_steps" ADD CONSTRAINT "order_steps_Product_id_fkey" FOREIGN KEY ("Product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_steps" ADD CONSTRAINT "order_steps_assigned_user_fkey" FOREIGN KEY ("assigned_user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
