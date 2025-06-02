-- CreateTable
CREATE TABLE "user_cards" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "card_user_key" TEXT NOT NULL,
    "card_token" TEXT NOT NULL,
    "card_alias" TEXT NOT NULL,
    "bin_number" TEXT NOT NULL,
    "last_four" TEXT NOT NULL,
    "card_type" TEXT NOT NULL,
    "association" TEXT,
    "card_family" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "basket_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_cards_user_id_card_token_key" ON "user_cards"("user_id", "card_token");

-- AddForeignKey
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
