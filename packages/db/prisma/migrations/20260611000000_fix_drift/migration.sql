-- Columns that exist in DB but are missing from migration history
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "addressProofPublicId" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "addressProofUrl" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "businessLicensePublicId" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "businessLicenseUrl" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "cnicBackPublicId" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "cnicFrontPublicId" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "idDocumentPublicId" TEXT;
ALTER TABLE "MerchantProfile" ADD COLUMN IF NOT EXISTS "idDocumentUrl" TEXT;