"use client";

import { useEffect, useState } from "react";
import { SidebarItem } from "./SidebarItem";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const [pendingDisputes, setPendingDisputes] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/disputes");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setPendingDisputes(
            data.filter((d: { status: string }) => d.status === "PENDING").length,
          );
        }
      } catch {
        // badge is optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 sm:hidden" onClick={onClose} />
      )}
      <div
        className={`absolute sm:static top-16 left-0 h-full sm:h-auto transition-transform duration-300 z-40 border-slate-300 bg-white
        ${isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"} sm:w-72 border-r border-slate-300 min-h-screen sm:pr-4 pr-2 pt-28`}
      >
        <div className="sm:w-52 w-28">
          <SidebarItem href="/admin/dashboard" icon={<HomeIcon />} title="Dashboard" />
          <SidebarItem href="/admin/kyc" icon={<KycIcon />} title="KYC" />
          <div className="relative">
            <SidebarItem href="/admin/disputes" icon={<DisputesIcon />} title="Disputes" />
            {pendingDisputes > 0 && (
              <span
                className="absolute top-3 left-6 sm:left-7 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
                aria-label={`${pendingDisputes} pending disputes`}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="sm:size-6 size-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function KycIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="sm:size-6 size-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function DisputesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="sm:size-6 size-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}
