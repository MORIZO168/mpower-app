"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sb, portalConfigured } from "@/lib/supabaseBrowser";

export const dynamic = "force-dynamic";

export default function PortalLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ready = portalConfigured();

  useEffect(() => {
    const client = sb();
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      if (data?.session) router.replace("/portal");
    });
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const client = sb();
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) { setErr(mapErr(error.message)); return; }
    router.replace("/portal");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true"><g fill="#F5821F">
            <path d="M11 8 h13 l-4 12 h-13 z" /><path d="M27 8 h13 l-4 12 h-13 z" />
            <path d="M8 24 h13 l-4 12 h-13 z" /><path d="M24 24 h13 l-4 12 h-13 z" /></g></svg>
          <div>
            <div className="font-semibold tracking-[0.14em] leading-none text-[#1d1d1f]">M POWER</div>
            <div className="text-[10px] tracking-[0.28em] text-[#a1a1a6] mt-1">พอร์ทัลช่าง</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8e8ed] p-6 shadow-sm">
          <h1 className="text-lg font-bold text-[#1d1d1f] mb-1">เข้าสู่ระบบช่าง</h1>
          <p className="text-[13px] text-[#6e6e73] mb-4">รับใบสั่งงาน · ส่งรูปติดตั้ง · ขอเบิกเงิน</p>

          {!ready ? (
            <div className="text-sm text-[#a13b3b] bg-[#fdf2f2] rounded-lg p-3">
              ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_ANON_KEY บน Vercel — แจ้งแอดมินเพื่อเปิดใช้งาน
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-[12px] text-[#6e6e73] mb-1">อีเมล</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username" inputMode="email"
                  className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm bg-white" />
              </div>
              <div>
                <label className="block text-[12px] text-[#6e6e73] mb-1">รหัสผ่าน</label>
                <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm bg-white" />
              </div>
              {err && <div className="text-[13px] text-[#c0392b]">{err}</div>}
              <button type="submit" disabled={busy}
                className="w-full bg-[#F5821F] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
              </button>
            </form>
          )}
          <p className="text-[12px] text-[#6e6e73] mt-4 text-center">ยังไม่มีบัญชี? <Link href="/portal/register" className="text-[#F5821F] font-medium">สมัครใช้งาน</Link></p>
        </div>
      </div>
    </div>
  );
}

function mapErr(m) {
  const s = String(m || "").toLowerCase();
  if (s.includes("invalid login")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (s.includes("email not confirmed")) return "บัญชียังไม่ยืนยัน — แจ้งแอดมิน";
  return m;
}
