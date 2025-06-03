/*
  Warnings:

  - A unique constraint covering the columns `[Name]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "unique_permission_name" ON "permissions"("Name");
