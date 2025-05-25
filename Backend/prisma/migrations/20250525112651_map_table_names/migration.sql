/*
  Warnings:

  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConfirmToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users_Permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConfirmToken" DROP CONSTRAINT "ConfirmToken_user_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_company_id_fkey";

-- DropForeignKey
ALTER TABLE "Users_Permissions" DROP CONSTRAINT "Users_Permissions_Permission_id_fkey";

-- DropForeignKey
ALTER TABLE "Users_Permissions" DROP CONSTRAINT "Users_Permissions_User_id_fkey";

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "ConfirmToken";

-- DropTable
DROP TABLE "Permissions";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Users_Permissions";

-- CreateTable
CREATE TABLE "companies" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Max_User" INTEGER NOT NULL,
    "Suspscription_package" TEXT NOT NULL,
    "Sub_end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Mail" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_confirm" BOOLEAN NOT NULL DEFAULT false,
    "is_SuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" BIGINT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Type" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_permissions" (
    "id" BIGSERIAL NOT NULL,
    "User_id" BIGINT NOT NULL,
    "Permission_id" BIGINT NOT NULL,

    CONSTRAINT "users_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirm_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "confirm_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_Mail_key" ON "users"("Mail");

-- CreateIndex
CREATE UNIQUE INDEX "confirm_tokens_token_key" ON "confirm_tokens"("token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_User_id_fkey" FOREIGN KEY ("User_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_Permission_id_fkey" FOREIGN KEY ("Permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirm_tokens" ADD CONSTRAINT "confirm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
