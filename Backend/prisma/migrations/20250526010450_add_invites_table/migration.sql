-- CreateTable
CREATE TABLE "invites" (
    "id" BIGSERIAL NOT NULL,
    "Company_id" BIGINT NOT NULL,
    "mail" TEXT NOT NULL,
    "is_confirm" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invite_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_invite_token_key" ON "invites"("invite_token");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_Company_id_fkey" FOREIGN KEY ("Company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
