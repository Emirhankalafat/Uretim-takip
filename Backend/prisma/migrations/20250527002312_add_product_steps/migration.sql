-- CreateTable
CREATE TABLE "product_steps" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Product_id" BIGINT NOT NULL,
    "Step_number" INTEGER NOT NULL,
    "Responsible_User" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_steps_Product_id_Step_number_key" ON "product_steps"("Product_id", "Step_number");

-- AddForeignKey
ALTER TABLE "product_steps" ADD CONSTRAINT "product_steps_Product_id_fkey" FOREIGN KEY ("Product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_steps" ADD CONSTRAINT "product_steps_Responsible_User_fkey" FOREIGN KEY ("Responsible_User") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
