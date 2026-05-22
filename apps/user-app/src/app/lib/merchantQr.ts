import { buildMerchantPayUrl, qrPayloadNeedsRefresh } from "./publicBaseUrl";
import { isApprovedPaymentQrPayload } from "./kyc";

type MerchantQrRow = {
  id: number;
  kycStatus: string;
  qrPayload: string | null;
};

type MerchantQrDb = {
  merchantProfile: {
    update: (args: {
      where: { id: number };
      data: { qrPayload: string };
    }) => Promise<unknown>;
  };
};

/**
 * Returns the canonical payment URL for verified merchants and
 * updates the DB when an old localhost (or wrong host) URL is stored.
 */
export async function resolveMerchantQrPayload(
  prisma: MerchantQrDb,
  merchant: MerchantQrRow,
): Promise<string | null> {
  if (merchant.kycStatus !== "VERIFIED") {
    return merchant.qrPayload;
  }

  const canonical = buildMerchantPayUrl(merchant.id);
  const stale =
    qrPayloadNeedsRefresh(merchant.qrPayload) ||
    !isApprovedPaymentQrPayload(merchant.qrPayload);

  if (stale && merchant.qrPayload !== canonical) {
    await prisma.merchantProfile.update({
      where: { id: merchant.id },
      data: { qrPayload: canonical },
    });
  }

  return canonical;
}
