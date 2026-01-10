"use client"
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export const SidebarItem = ({ href, title, icon }: { href: string; title: string; icon: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname()
    const selected = pathname === href

    return <div className={`flex sm:flex-row flex-col items-center flex-wrap text-center   ${selected ? "text-green-600" : "text-slate-500"} cursor-pointer  p-2 sm:pl-8 pl-2`} onClick={() => {
        router.push(href);
    }}>
        <div className="sm:pr-2 pr-1">
            {icon}
        </div>
        <div className={`font-bold sm:text-base text-sm ${selected ? "text-green-600" : "text-slate-500"}`}>
            {title}
        </div>
    </div>
}