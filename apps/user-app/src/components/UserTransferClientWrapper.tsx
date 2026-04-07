"use client"; // MUST be client

import UserNotificationListener from "./UserNotificationListener";

export default function MerchantDashboardClientWrapper({ userId }: { userId: number }) {
  return (
    <>
      <UserNotificationListener userId={userId} />
    </>
  );
}
