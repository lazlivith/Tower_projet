-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "format" VARCHAR(255),
ADD COLUMN     "objectives" JSONB,
ADD COLUMN     "prerequisites" TEXT,
ADD COLUMN     "price_label" VARCHAR(120),
ADD COLUMN     "syllabus" JSONB;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "challenge" TEXT,
ADD COLUMN     "location" VARCHAR(160),
ADD COLUMN     "missions" TEXT,
ADD COLUMN     "solution" TEXT,
ADD COLUMN     "surface" VARCHAR(80);
