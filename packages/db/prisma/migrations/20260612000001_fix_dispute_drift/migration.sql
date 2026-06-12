-- Reassign any OPEN/CLOSED values to PENDING
UPDATE "Dispute" SET "status" = 'PENDING' WHERE "status"::text IN ('OPEN', 'CLOSED');

-- Recreate enum without OPEN and CLOSED
ALTER TYPE "DisputeStatus" RENAME TO "DisputeStatus_old";
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
ALTER TABLE "Dispute" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Dispute" ALTER COLUMN "status" TYPE "DisputeStatus" USING "status"::text::"DisputeStatus";
ALTER TABLE "Dispute" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"DisputeStatus";
DROP TYPE "DisputeStatus_old";

-- Drop updatedAt column
ALTER TABLE "Dispute" DROP COLUMN IF EXISTS "updatedAt";