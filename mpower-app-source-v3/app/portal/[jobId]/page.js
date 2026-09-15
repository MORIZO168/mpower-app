"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { sb, portalConfigured, PHOTO_BUCKET } from "@/lib/supabaseBrowser";
import { CHECKLIST_GROUPS, PHOTO_CHECKLIST } from "@/lib/portal";

export const dynamic = "force-dynamic";
const baht = (n) => "฿" + Number(n || 0).toLocaleString("th-TH");

export default function JobDetail() {
  const router = useRouter();
  const params = useParams();
  const jobId = decodeURIComponent(params.jobId || "");
  const client = portalConfigured() ? sb() : null;

  const [email, setEmail] = useState("");
  const [job, setJob] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [disb, setDisb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState("");   // checklist_key ที่กำลังอัป
  const [amount, setAmount] = useState("");
  const [dnote, setDnote] = useState("");
  const [dbusy, setDbusy] = useState(false);
  const [dmsg, setDmsg] = useState(null);

  const refresh = useCallback(async () => {
    const [p, d] = await Promise.all([
      client.from("work_photos").select("*").eq("job_id", jobId).order("created_at", { ascending: false }),
      client.from("disbursement_requests").select("*").eq("job_id", jobId).order("requested_at", { ascending: false }),
    ]);
    setPhotos(p.data || []);
    setDisb(d.data || []);
  }, [client, jobId]);

  useEffect(() => {
    if (!client) { router.replace("/portal/login"); return; }
    (async () => {
      const { data: sess } = await client.auth.getSession();
      if (!sess?.session) { router.replace("/portal/login"); return; }
      setEmail(sess.session.user.email || "");
      const { data: jrows, error } = await client.from("jobs").select("*").eq("job_id", jobId).limit(1);
      if (error) setErr(error.message);
      setJob((jrows && jrows[0]) || null);
      await refresh();
      setLoading(false);
    })();
  }, [client, jobId, router, refresh]);

  const byKey = useMemo(() => {
    const m = {};
    photos.forEach((ph) => (m[ph.checklist_key] = m[ph.checklist_key] || []).push(ph));
    return m;
  }, [photos]);

  const requiredKeys = PHOTO_CHECKLIST.filter((c) => c.required).map((c) => c.key);
  const doneCount = requiredKeys.filter((k) => (byKey[k] || []).length > 0).length;

  async function onPick(key, file) {
    if (!file) return;
    setErr(""); setUploading(key);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${jobId}/${key}/${Date.now()}.${ext}`;
      const up = await client.storage.from(PHOTO_BUCKET).upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
      if (up.error) throw up.error;
      const { data: pub } = client.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      const ins = await client.from("work_photos").insert({
        job_id: jobId, checklist_key: key, photo_url: pub.publicUrl, uploaded_by: email,
      });
      if (ins.error) throw ins.error;
      await refresh();
    } catch (e) {
      setErr("อัปโหลดไม่สำเร็จ: " + (e.message || e));
    }
    setUploading("");
  }

  async function submitDisb(e) {
    e.preventDefault();
    const amt = Number(String(amount).replace(/[^0-9.]/g, ""));
    if (!amt) { setDmsg({ t: "bad", m: "กรอกจำนวนเงินก่อน" }); return; }
    setDbusy(true); setDmsg(null);
    const ins = await client.from("disbursement_requests").insert({
      job_id: jobId, sub_team: job?.sub_team || null, amount: amt, note: dnote || null, requested_by: email,
    });
    setDbusy(false);
    if (ins.error) { setDmsg({ t: "bad", m: ins.error.message }); return; }
    setAmount(""); setDnote(""); setDmsg({ t: "ok", m: "ส่งคำขอเบิกแล้ว รอตรวจสอบ" });
    refresh();
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-sm text-[#a1a1a6]">กำลังโหลด…</div>;

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <div className="text-sm text-[#6e6e73] mb-3">ไม่พบงานนี้ หรือไม่ได้มอบหมายให้ทีมคุณ</div>
        <Link href="/portal" className="text-[#F5821F] text-sm font-medium">← กลับหน้างานของฉัน</Link>
      </div>
    );
  }

  const info = [
    ["จังหวัด", job.province], ["ขนาด", job.kwp && `${job.kwp} kWp`], ["เฟส", job.phase],
    ["ขายไฟคืน", job.sellback_mode], ["เมนเบรกเกอร์", job.main_breaker_a && `${job.main_breaker_a} A`],
    ["เบรกเกอร์คอมไบเนอร์", job.combiner_breaker_a && `${job.combiner_breaker_a} A`],
    ["แบตเตอรี่", job.battery_kwh && `${job.battery_kwh} kWh`],
    ["แผง", [job.panel_model, job.panel_qty && `x${job.panel_qty}`].filter(Boolean).join(" ")],
    ["อินเวอร์เตอร์", job.inverter_model], ["ติดตั้ง", String(job.actual_install_date || "").slice(0, 10)],
  ].filter(([, v]) => v);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <Link href="/portal" className="text-[13px] text-[#6e6e73]">← งานของฉัน</Link>

      <div className="bg-white rounded-2xl border border-[#e8e8ed] p-4 mt-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#6e6e73]">{job.job_id}</span>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[#fff5ec] text-[#F5821F] font-medium">{job.pea_status || "รอดำเนินการ"}</span>
        </div>
        <div className="font-bold text-[#1d1d1f] text-lg mt-1">{job.customer_name || "—"}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
          {info.map(([k, v]) => (
            <div key={k} className="text-[13px]"><span className="text-[#a1a1a6]">{k}: </span><span className="text-[#1d1d1f]">{v}</span></div>
          ))}
        </div>
        {job.note && <div className="text-[12px] text-[#6e6e73] mt-3 border-t border-[#f0f0f2] pt-2">หมายเหตุ: {job.note}</div>}
      </div>

      {err && <div className="text-sm text-[#a13b3b] bg-[#fdf2f2] rounded-lg p-3 mt-3">{err}</div>}

      {/* Checklist รูป */}
      <div className="flex items-center gap-2 mt-5 mb-2">
        <h2 className="font-bold text-[#1d1d1f]">รูปการติดตั้ง</h2>
        <span className="text-[12px] text-[#6e6e73]">บังคับ {doneCount}/{requiredKeys.length}</span>
        <div className="ml-auto w-24 h-1.5 rounded-full bg-[#eee] overflow-hidden">
          <div className="h-full bg-[#1a7d3a]" style={{ width: (doneCount / requiredKeys.length) * 100 + "%" }} />
        </div>
      </div>

      {Object.entries(CHECKLIST_GROUPS).map(([group, items]) => (
        <div key={group} className="mb-3">
          <div className="text-[11px] font-semibold tracking-wide text-[#b0b0b6] uppercase px-1 mb-1.5">{group}</div>
          <div className="space-y-2">
            {items.map((c) => {
              const shots = byKey[c.key] || [];
              const done = shots.length > 0;
              return (
                <div key={c.key} className="bg-white rounded-xl border border-[#e8e8ed] p-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${done ? "bg-[#1a7d3a] text-white" : "bg-[#f0f0f2] text-[#a1a1a6]"}`}>
                      {done ? "✓" : ""}
                    </span>
                    <span className="text-[14px] text-[#1d1d1f]">{c.label}</span>
                    {!c.required && <span className="text-[10px] text-[#a1a1a6]">(ถ้ามี)</span>}
                    <label className="ml-auto text-[12px] font-medium text-[#F5821F] border border-[#F5821F] rounded-lg px-3 py-1.5 cursor-pointer">
                      {uploading === c.key ? "กำลังอัป…" : (done ? "+ เพิ่ม" : "ถ่าย/อัปโหลด")}
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        disabled={uploading === c.key}
                        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; onPick(c.key, f); }} />
                    </label>
                  </div>
                  {shots.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {shots.map((ph) => (
                        <a key={ph.id} href={ph.photo_url} target="_blank" rel="noreferrer"
                          className="block w-16 h-16 rounded-lg overflow-hidden border border-[#eee] bg-[#f5f5f7]">
                          <img src={ph.photo_url} alt={c.label} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ขอเบิก */}
      <h2 className="font-bold text-[#1d1d1f] mt-6 mb-2">ขอเบิกเงิน</h2>
      <div className="bg-white rounded-2xl border border-[#e8e8ed] p-4">
        <form onSubmit={submitDisb} className="space-y-2.5">
          <div>
            <label className="block text-[12px] text-[#6e6e73] mb-1">จำนวนเงิน (บาท)</label>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm" placeholder="เช่น 15000" />
          </div>
          <div>
            <label className="block text-[12px] text-[#6e6e73] mb-1">หมายเหตุ</label>
            <input value={dnote} onChange={(e) => setDnote(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm" placeholder="เช่น ค่าแรงติดตั้งงวดที่ 1" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={dbusy} className="bg-[#1d1d1f] text-white rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
              {dbusy ? "กำลังส่ง…" : "ส่งคำขอเบิก"}
            </button>
            {dmsg && <span className={`text-[13px] ${dmsg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{dmsg.m}</span>}
          </div>
        </form>

        {disb.length > 0 && (
          <div className="mt-4 border-t border-[#f0f0f2] pt-3 space-y-2">
            {disb.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold text-[#1d1d1f]">{baht(d.amount)}</span>
                <span className="text-[#6e6e73] truncate">{d.note}</span>
                <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full ${statusCls(d.status)}`}>{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}

function statusCls(s) {
  if (s === "อนุมัติ") return "bg-[#eaf7ee] text-[#1a7d3a]";
  if (s === "ปฏิเสธ") return "bg-[#fdecec] text-[#c0392b]";
  return "bg-[#fff5ec] text-[#F5821F]";
}
