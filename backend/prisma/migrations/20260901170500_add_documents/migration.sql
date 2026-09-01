-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CERTIFICATE', 'INVOICE', 'QUOTE', 'ENROLLMENT_ATTESTATION');

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "amount" DECIMAL(12,2),
ADD COLUMN     "reference" VARCHAR(40),
ADD COLUMN     "valid_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "number" VARCHAR(40) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "user_id" UUID,
    "course_id" UUID,
    "quote_id" UUID,
    "payment_id" UUID,
    "meta" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_number_key" ON "generated_documents"("number");

-- CreateIndex
CREATE INDEX "generated_documents_type_created_at_idx" ON "generated_documents"("type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_reference_key" ON "quotes"("reference");

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

