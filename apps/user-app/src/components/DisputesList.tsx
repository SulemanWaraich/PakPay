"use client";

import { useEffect, useState } from "react";
import { Card } from "@repo/ui";

interface Dispute {
  id: number;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  transaction: {
    amount: number;
    merchant: {
      user: {
        name: string;
      };
    };
  };
}

export const DisputesList = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await fetch("/api/disputes");
        if (res.ok) {
          const data = await res.json();
          setDisputes(data.disputes);
        }
      } catch (error) {
        console.error("Failed to fetch disputes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Your Disputes" className="p-4">
      {disputes.length === 0 ? (
        <p className="text-gray-500 text-sm">No disputes filed yet.</p>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm">
                    Dispute #{dispute.id} - {dispute.transaction.merchant.user.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Amount: ${dispute.transaction.amount} | Reason: {dispute.reason}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  dispute.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  dispute.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                  dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {dispute.status}
                </span>
              </div>
              {dispute.description && (
                <p className="text-xs text-gray-600 mb-2">{dispute.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Filed on {new Date(dispute.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};