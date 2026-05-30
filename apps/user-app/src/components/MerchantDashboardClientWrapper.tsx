"use client"; // MUST be client

import MerchantNotificationListener from "./MerchantNotificationListener";

export default function MerchantDashboardClientWrapper({
  merchantUserId,
  merchantProfileId,
}: {
  merchantUserId: number;
  merchantProfileId: number;
}) {
  return (
    <>
      <MerchantNotificationListener
        merchantUserId={merchantUserId}
        merchantProfileId={merchantProfileId}
      />
    </>
  );
}
