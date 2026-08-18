"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "ภาพรวม", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/projects", label: "โครงการ", icon: "M4 6h16M4 6v12h16V6M4 10h6M4 14h4" },
  { href: "/impact", label: "ผลกระทบ / โชว์ลูกค้า", icon: "M12 3v18M5 21c0-6 3-9 7-9M19 21c0-4-2-6-5-6M12 3c2 2 3 4 3 6" },
  { href: "/leads", label: "ลูกค้า / A-Card", icon: "M3 5h18M3 12h18M3 19h12" },
  { href: "/survey", label: "สำรวจหน้างาน", icon: "M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zM12 11a2 2 0 100-4 2 2 0 000 4z" },
  { href: "/design", label: "ออกแบบหลังคา", icon: "M4 20V6l8-3 8 3v14M4 20h16M9 20v-6h6v6" },
  { href: "/quote", label: "ใบเสนอ / BOQ", icon: "M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6" },
  { href: "/supply", label: "Supply / สต็อก", icon: "M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10" },
  { href: "/pipeline", label: "Pipeline งาน", icon: "M4 6h16M4 12h10M4 18h6" },
  { href: "/pea", label: "ขอขนานไฟ (PEA)", icon: "M13 2L3 14h7l-1 8 10-12h-7z" },
  { href: "/handover", label: "ส่งมอบงาน", icon: "M9 12l2 2 4-4M7 3h10l4 4v14H3V7z" },
  { href: "/forecast", label: "Forecast", icon: "M4 19l5-5 4 4 7-8M14 6h4v4" },
  { href: "/finance", label: "การเงิน", icon: "M3 6h18v12H3zM3 10h18M7 15h4" },
];

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" aria-hidden="true">
      <g fill="#F5821F">
        <path d="M11 8 h13 l-4 12 h-13 z" />
        <path d="M27 8 h13 l-4 12 h-13 z" />
        <path d="M8 24 h13 l-4 12 h-13 z" />
        <path d="M24 24 h13 l-4 12 h-13 z" />
      </g>
    </svg>
  );
}

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-[#e8e8ed] text-[#1d1d1f]">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-[#f0f0f2]">
        <Logo />
        <div>
          <div className="font-semibold tracking-[0.14em] leading-none text-[#1d1d1f]">M POWER</div>
          <div className="text-[10px] tracking-[0.3em] text-[#a1a1a6] mt-1">NATURE ENERGY</div>
        </div>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${active ? "bg-[#fff5ec] text-[#1d1d1f] font-semibold border-[#F5821F]" : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] border-transparent"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#F5821F" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-3 border-t border-[#f0f0f2] text-[11px] text-[#a1a1a6]">
        v0.3 · ต่อ Google Sheets
      </div>
    </aside>
  );
}
