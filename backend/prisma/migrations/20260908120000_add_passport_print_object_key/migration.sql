-- Print-optimized passport JPEG stored in object storage for ID card PDFs.
ALTER TABLE "Enrollment" ADD COLUMN "passportPrintObjectKey" TEXT;
