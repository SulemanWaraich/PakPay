"use client";

import { useState } from "react";
import { AdminSidebar } from "../../components/AdminSidebar";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex">
      <button
        type="button"
        className="sm:hidden px-3 py-1 absolute top-16 left-0 z-50 bg-green-600 text-white rounded-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>
      <AdminSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {children}
    </div>
  );
}
