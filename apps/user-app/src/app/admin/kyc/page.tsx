"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// import KycCard from "../components/KycCard";

export default async function KycPage() {
  const [requests, setRequests] = useState([]);
  const router = useRouter();

 useEffect(() => {
    const fetchKycRequests = async () => {
      try {
        const res = await fetch("/api/admin/kyc");

        if (res.status === 401) {
          router.push("/auth/signin");
          return;
        }

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to load merchants");
        }

        const data = await res.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching KYC requests:", error);
      }
    };

    fetchKycRequests();
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">KYC Pending Review</h1>

      {/* <div className="space-y-4">
        {requests.length === 0 && (
          <p className="text-gray-600">No pending KYC requests.</p>
        )}

        {requests.map(req => (
          <KycCard key={req.id} merchant={req} />
        ))}
      </div> */}
    </div>
  );
}
