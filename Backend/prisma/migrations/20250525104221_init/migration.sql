-- CreateTable
CREATE TABLE "Company" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Max_User" INTEGER NOT NULL,
    "Suspscription_package" TEXT NOT NULL,
    "Sub_end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Mail" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_confirm" BOOLEAN NOT NULL DEFAULT false,
    "is_SuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" BIGINT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Type" TEXT NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users_Permissions" (
    "id" BIGSERIAL NOT NULL,
    "User_id" BIGINT NOT NULL,
    "Permission_id" BIGINT NOT NULL,

    CONSTRAINT "Users_Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Mail_key" ON "User"("Mail");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users_Permissions" ADD CONSTRAINT "Users_Permissions_User_id_fkey" FOREIGN KEY ("User_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users_Permissions" ADD CONSTRAINT "Users_Permissions_Permission_id_fkey" FOREIGN KEY ("Permission_id") REFERENCES "Permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
