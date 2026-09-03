-- Octets du PDF stockés en base, servis par GET /api/documents/file/:number.
ALTER TABLE "generated_documents" ADD COLUMN "content" BYTEA;
