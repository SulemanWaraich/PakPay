// "use client";

// import { useEffect, useState } from "react";
// import KycCard from "../components/KycCard";

// export default function KycPage() {
//   const [requests, setRequests] = useState([]);

//   useEffect(() => {
//     fetch("/api/admin/kyc")
//       .then(res => res.json())
//       .then(data => setRequests(data));
//   }, []);

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-6">KYC Pending Review</h1>

//       <div className="space-y-4">
//         {requests.length === 0 && (
//           <p className="text-gray-600">No pending KYC requests.</p>
//         )}

//         {requests.map(req => (
//           <KycCard key={req.id} merchant={req} />
//         ))}
//       </div>
//     </div>
//   );
// }
