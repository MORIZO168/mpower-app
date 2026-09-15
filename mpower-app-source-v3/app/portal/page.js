"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sb, portalConfigured } from "@/lib/supabaseBrowser";

export const dynamic = "force-dynamic";

export default function PortalHome() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!portalConfigured()) { setLoading(false); router.replace("/portal/login"); return; }
    const client = sb();
    (async () => {
      const { data: sess } = await client.auth.getSession();
      if (!sess?.session) { router.replace("/portal/login"); return; }
      setEmail(sess.session.user.email || "");
      const { data, error } = await client
        .from("jobs")
        .select("job_id,customer_name,province,kwp,phase,inverter_model,actual_install_date,pea_status,handover_status,sub_team")
        .order("actual_install_date", { ascending: false });
      if (error) setErr(error.message);
      setJobs(data || []);
      setLoading(false);
    })();
  }, [router]);

  async function signOut() {
    await sb().auth.signOut();
    router.replace("/portal/login");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <header className="flex items-center gap-2 mb-4">
        <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true"><g fill="#F5821F">
          <path d="M11 8 h13 l-4 12 h-13 z" /><path d="M27 8 h13 l-4 12 h-13 z" />
          <path d="M8 24 h13 l-4 12 h-13 z" /><path d="M24 24 h13 l-4 12 h-13 z" /></g></svg>
        <div className="leading-tight">
          <div className="font-semibold tracking-[0.1em] text-[#1d1d1f] text-sm">M POWER · ช่าง</div>
          <div className="text-[11px] text-[#a1a1a6]">{email}</div>
        </div>
        <button onClick={signOut} className="ml-auto text-[12px] text-[#6e6e73] border border-[#d2d2d7] rounded-lg px-3 py-1.5">
          ออกจากระบบ
        </button>
      </header>

      <h1 className="text-lg font-bold text-[#1d1d1f] mb-1">งานของฉัน</h1>
      <p className="text-[13px] text-[#6e6e73] mb-4">แตะที่งานเพื่อดูรายละเอียด ส่งรูปติดตั้ง และขอเบิก</p>

      {loading && <div className="text-sm text-[#a1a1a6] py-8 text-center">กำลังโหลด…</div>}
      {err && <div className="text-sm text-[#a13b3b] bg-[#fdf2f2] rounded-lg p-3 mb-3">โหลดงานไม่สำเร็จ: {err}</div>}
      {!loading && jobs.length === 0 && !err && (
        <div className="bg-white rounded-2xl border border-[#e8e8ed] p-6 text-center text-sm text-[#6e6e73]">
          ยังไม่มีงานที่มอบหมายให้ทีมคุณ — ติดต่อออฟฟิศเพื่อรับใบสั่งงาน
        </div>
      )}

      <div className="space-y-2.5">
        {jobs.map((j) => (
          <Link key={j.job_id} href={`/portal/${encodeURIComponent(j.job_id)}`}
            className="block bg-white rounded-2xl border border-[#e8e8ed] p-4 active:bg-[#fafafa]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#6e6e73] font-mono">{j.job_id}</span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[#fff5ec] text-[#F5821F] font-medium">
                {j.pea_status || "รอดำเนินการ"}
              </span>
            </div>
            <div className="font-semibold text-[#1d1d1f] mt-1">{j.customer_name || "—"}</div>
            <div className="text-[12px] text-[#6e6e73] mt-0.5">
              {[j.province, j.kwp && `${j.kwp} kWp`, j.phase, j.inverter_model].filter(Boolean).join(" · ")}
            </div>
            <div className="text-[11px] text-[#a1a1a6] mt-1">
              ติดตั้ง: {String(j.actual_install_date || "").slice(0, 10) || "—"} · ส่งมอบ: {j.handover_status || "—"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
