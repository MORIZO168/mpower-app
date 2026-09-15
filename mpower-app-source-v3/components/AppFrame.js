"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { sb, portalConfigured } from "@/lib/supabaseBrowser";

// อีเมลที่เป็นแอดมิน (เข้าหน้าแอดมินได้) — ตั้งเพิ่มได้ที่ env NEXT_PUBLIC_ADMIN_EMAILS (คั่นด้วย ,)
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "nutnathon.mos@gmail.com")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

// /portal/* + /booth/scan = หน้าไม่ต้องมี Sidebar แอดมิน
// Role guard: ถ้ามี session ช่าง (ไม่ใช่แอดมิน) เข้ามาหน้าแอดมิน → เด้งไป /portal
export default function AppFrame({ children }) {
  const path = usePathname() || "";
  const router = useRouter();
  const bare = path.startsWith("/portal") || path.startsWith("/booth/scan");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (bare || !portalConfigured()) return;
    const client = sb();
    if (!client) return;
    let alive = true;
    client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const email = (data?.session?.user?.email || "").toLowerCase();
      if (email && !ADMIN_EMAILS.includes(email)) { setBlocked(true); router.replace("/portal"); }
    });
    return () => { alive = false; };
  }, [path, bare, router]);

  if (bare) return <main className="min-h-screen bg-[#f5f5f7]">{children}</main>;
  if (blocked) return <main className="min-h-screen grid place-items-center text-sm text-[#6e6e73]">กำลังพาไปพอร์ทัลช่าง…</main>;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}
