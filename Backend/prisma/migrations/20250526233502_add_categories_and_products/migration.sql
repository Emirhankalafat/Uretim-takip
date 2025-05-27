-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "Company_id" BIGINT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "Category_id" BIGINT NOT NULL,
    "Company_id" BIGINT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_Company_id_fkey" FOREIGN KEY ("Company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_Category_id_fkey" FOREIGN KEY ("Category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_Company_id_fkey" FOREIGN KEY ("Company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
