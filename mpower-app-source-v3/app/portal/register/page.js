"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sb, portalConfigured } from "@/lib/supabaseBrowser";

export const dynamic = "force-dynamic";

export default function PortalRegister() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", email: "", pw: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // 'session' | 'confirm'
  const ready = portalConfigured();
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (f.pw.length < 6) { setErr("รหัสผ่านอย่างน้อย 6 ตัวอักษร"); return; }
    setBusy(true);
    const client = sb();
    const { data, error } = await client.auth.signUp({
      email: f.email.trim(), password: f.pw,
      options: { data: { full_name: f.name.trim(), phone: f.phone.trim() } },
    });
    setBusy(false);
    if (error) { setErr(mapErr(error.message)); return; }
    if (data?.session) { router.replace("/portal"); return; }   // สมัคร+ล็อกอินเลย (ถ้าปิด confirm email)
    setDone("confirm");                                          // ต้องยืนยันอีเมลก่อน
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
            <div className="text-[10px] tracking-[0.28em] text-[#a1a1a6] mt-1">สมัครช่าง</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e8e8ed] p-6 shadow-sm">
          {done === "confirm" ? (
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <h1 className="text-lg font-bold text-[#1d1d1f] mb-1">สมัครเรียบร้อย</h1>
              <p className="text-[13px] text-[#6e6e73]">บัญชีถูกสร้างแล้ว — แจ้งออฟฟิศเพื่อผูกทีมและเปิดใช้งาน จากนั้นเข้าสู่ระบบได้เลย</p>
              <Link href="/portal/login" className="inline-block mt-4 bg-[#F5821F] text-white rounded-xl px-5 py-2.5 text-sm font-semibold">ไปหน้าเข้าสู่ระบบ</Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-[#1d1d1f] mb-1">สมัครใช้งาน (ช่าง)</h1>
              <p className="text-[13px] text-[#6e6e73] mb-4">สร้างบัญชีเพื่อรับงาน · ส่งรูปติดตั้ง · ขอเบิก</p>

              {!ready ? (
                <div className="text-sm text-[#a13b3b] bg-[#fdf2f2] rounded-lg p-3">ยังไม่ได้ตั้งค่าระบบ (ANON_KEY) — แจ้งแอดมิน</div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <label className="block text-[12px] text-[#6e6e73] mb-1">ชื่อ-นามสกุล</label>
                    <input required value={f.name} onChange={(e) => upd("name", e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6e6e73] mb-1">เบอร์โทร</label>
                    <input inputMode="tel" value={f.phone} onChange={(e) => upd("phone", e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6e6e73] mb-1">อีเมล</label>
                    <input type="email" required value={f.email} onChange={(e) => upd("email", e.target.value)}
                      autoComplete="username" inputMode="email"
                      className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6e6e73] mb-1">รหัสผ่าน (≥ 6 ตัว)</label>
                    <input type="password" required value={f.pw} onChange={(e) => upd("pw", e.target.value)}
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm bg-white" />
                  </div>
                  {err && <div className="text-[13px] text-[#c0392b]">{err}</div>}
                  <button type="submit" disabled={busy}
                    className="w-full bg-[#F5821F] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                    {busy ? "กำลังสมัคร…" : "สมัครใช้งาน"}
                  </button>
                </form>
              )}
              <p className="text-[12px] text-[#6e6e73] mt-4 text-center">มีบัญชีแล้ว? <Link href="/portal/login" className="text-[#F5821F] font-medium">เข้าสู่ระบบ</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function mapErr(m) {
  const s = String(m || "").toLowerCase();
  if (s.includes("already registered") || s.includes("already exists")) return "อีเมลนี้สมัครไว้แล้ว — ไปที่เข้าสู่ระบบ";
  if (s.includes("password")) return "รหัสผ่านไม่ผ่านเกณฑ์ (อย่างน้อย 6 ตัว)";
  return m;
}
