-- AlterTable
ALTER TABLE "public"."MerchantProfile" ADD COLUMN     "addressProofPublicId" TEXT,
ADD COLUMN     "addressProofUrl" TEXT,
ADD COLUMN     "businessLicensePublicId" TEXT,
ADD COLUMN     "businessLicenseUrl" TEXT,
ADD COLUMN     "idDocumentPublicId" TEXT,
ADD COLUMN     "idDocumentUrl" TEXT;
