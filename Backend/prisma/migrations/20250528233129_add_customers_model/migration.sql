-- CreateTable
CREATE TABLE "customers" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Company_Id" BIGINT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
