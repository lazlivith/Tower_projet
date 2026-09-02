-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('SERVICE', 'AMO');

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "kind" "ServiceKind" NOT NULL DEFAULT 'SERVICE',
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "image_url" VARCHAR(500),
    "objective" TEXT,
    "scope" JSONB,
    "deliverables" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_kind_order_idx" ON "services"("kind", "order");

