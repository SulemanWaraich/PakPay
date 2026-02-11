"use client"; // MUST be client

import MerchantNotificationListener from "./MerchantNotificationListener";

export default function MerchantDashboardClientWrapper({ merchantId }: { merchantId: number }) {
  return (
    <>
      <MerchantNotificationListener merchantId={merchantId} />
    </>
  );
}
