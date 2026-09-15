"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// /portal/* = พอร์ทัลช่างซับ → ไม่โชว์เมนูแอดมิน (เต็มจอ, มือถือเป็นหลัก)
// ที่เหลือ = แอปแอดมิน → มี Sidebar ปกติ
export default function AppFrame({ children }) {
  const path = usePathname() || "";
  const isPortal = path.startsWith("/portal");

  if (isPortal) {
    return <main className="min-h-screen bg-[#f5f5f7]">{children}</main>;
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
