/*
  Warnings:

  - You are about to drop the `oauth_authorization_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "oauth_authorization_codes" DROP CONSTRAINT "oauth_authorization_codes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "oauth_tokens" DROP CONSTRAINT "oauth_tokens_user_id_fkey";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "api_key" TEXT;

-- DropTable
DROP TABLE "oauth_authorization_codes";

-- DropTable
DROP TABLE "oauth_tokens";
