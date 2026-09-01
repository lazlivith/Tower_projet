-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "description" TEXT,
ADD COLUMN     "meeting_url" VARCHAR(500),
ADD COLUMN     "provider" VARCHAR(20) DEFAULT 'jitsi';

-- CreateTable
CREATE TABLE "class_messages" (
    "id" UUID NOT NULL,
    "classroom_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_messages_classroom_id_created_at_idx" ON "class_messages"("classroom_id", "created_at");

-- AddForeignKey
ALTER TABLE "class_messages" ADD CONSTRAINT "class_messages_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_messages" ADD CONSTRAINT "class_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
