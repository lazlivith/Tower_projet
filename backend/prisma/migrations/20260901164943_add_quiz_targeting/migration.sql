-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "assigned_to_id" UUID,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "due_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "quizzes_classroom_id_assigned_to_id_idx" ON "quizzes"("classroom_id", "assigned_to_id");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
