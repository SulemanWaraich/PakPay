"use client"
import { useState } from "react";
import { SidebarItem } from "../../components/SidebarItem";
import { AppbarClient } from "../../components/AppbarClient";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static flex child on desktop */}
      <div
        className={`
          fixed sm:sticky sm:top-0 top-16
          h-[calc(100vh-4rem)] sm:h-screen
          transition-transform duration-300 z-40
          bg-white border-r border-slate-300
          w-50 sm:w-52 md:w-60
          sm:translate-x-0 sm:flex-shrink-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          sm:pr-4 pr-2 pt-28
        `}
      >
        <div className="sm:w-52 w-48">
          <SidebarItem href={"/user/dashboard"} icon={<HomeIcon />} title="Home" />
          <SidebarItem href={"/user/transfer"} icon={<TransferIcon />} title="Transfer" />
          <SidebarItem href={"/user/transactions"} icon={<TransactionsIcon />} title="Transactions" />
          <SidebarItem href={"/user/p2p-transfer"} icon={<P2PTransferIcon />} title="P2P Transfer" />
          <SidebarItem href={"/user/disputes"} icon={<DisputeIcon />} title="Disputes" />
        </div>

        {/* Arrow toggle — mobile only, attached to sidebar right edge */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            sm:hidden
            absolute -right-6 top-1/2 -translate-y-1/2
            w-8 h-8 rounded-full
            bg-green-600 text-white shadow-md
            flex items-center justify-center
            transition-transform duration-300
            z-50
          `}
          aria-label="Toggle sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 ">
        {children}
      </main>
    </div>
  );
}

// Icons Fetched from https://heroicons.com/
function HomeIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="sm:size-6 size-5">
    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
}
function TransferIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="sm:size-6 size-5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
}

function TransactionsIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="sm:size-6 size-5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
  
}

function P2PTransferIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="sm:size-6 size-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
</svg>
}

function DisputeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="sm:size-6 size-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
}