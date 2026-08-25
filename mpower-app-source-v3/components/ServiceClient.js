"use client";
import { useState } from "react";
import { warranties, maintenance, overview, BRAND_TONE, MA_INTERVAL_MONTHS, nextSiteId, todayISO } from "@/lib/service";

const TONE = {
  bad: "text-[#c0392b] bg-[#fdece9]",
  warn: "text-[#b7791f] bg-[#fff4e0]",
  ok: "text-[#1a7d3a] bg-[#e8f7ee]",
};
const wPill = (st) => (st === "expired" ? TONE.bad : st === "expiring" ? TONE.warn : TONE.ok);
const wLabel = (st, dl) => (st === "expired" ? "หมดแล้ว" : st === "expiring" ? "เหลือ " + dl + " วัน" : "ปกติ");
const maPill = (st) => (st === "overdue" ? TONE.bad : st === "due" ? TONE.warn : TONE.ok);
const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";

function Stat({ label, value, tone }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#ececed]">
      <div className="text-[13px] text-[#6e6e73]">{label}</div>
      <div className={"text-3xl font-bold tracking-tight mt-1 " + (tone || "text-[#1d1d1f]")}>{value}</div>
    </div>
  );
}

export default function ServiceClient({ sites = [], configured, error, sample }) {
  const now = new Date();
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(false);
  const [tIssue, setTIssue] = useState("");
  const empty = { Customer_Name: "", Area: "", Brand: "Atmoce", kWp: "", Battery_kWh: "", Install_Date: todayISO() };
  const [f, setF] = useState(empty);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const o = overview(sites, now);

  const canWrite = configured && !sample;

  async function api(body) {
    const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }
  async function addSite() {
    if (!f.Customer_Name.trim()) { setMsg({ t: "bad", m: "กรอกชื่อลูกค้าก่อน" }); return; }
    setBusy(true); setMsg(null);
    const obj = {
      Site_ID: nextSiteId(sites), Customer_Name: f.Customer_Name, Area: f.Area, Brand: f.Brand,
      kWp: f.kWp, Battery_kWh: f.Battery_kWh, Install_Date: f.Install_Date, Last_Service_Date: f.Install_Date,
      Ticket_Issue: "", Ticket_Status: "",
    };
    const d = await api({ action: "append", tab: "Installed_Base", obj, idField: "Site_ID", required: ["Customer_Name"] });
    if (d.ok) { setMsg({ t: "ok", m: "เพิ่มแล้ว → " + obj.Site_ID }); setF(empty); setTimeout(() => window.location.reload(), 800); }
    else { setMsg({ t: "bad", m: d.error || "บันทึกไม่สำเร็จ" }); setBusy(false); }
  }
  async function recordService(id) {
    setBusy(true);
    const d = await api({ action: "update", tab: "Installed_Base", idField: "Site_ID", idValue: id, patch: { Last_Service_Date: todayISO() } });
    if (d.ok) window.location.reload(); else { setMsg({ t: "bad", m: d.error || "ไม่สำเร็จ" }); setBusy(false); }
  }
  async function openTicket(id) {
    if (!tIssue.trim()) return;
    setBusy(true);
    const d = await api({ action: "update", tab: "Installed_Base", idField: "Site_ID", idValue: id, patch: { Ticket_Issue: tIssue, Ticket_Status: "open" } });
    if (d.ok) window.location.reload(); else { setMsg({ t: "bad", m: d.error || "ไม่สำเร็จ" }); setBusy(false); }
  }
  async function closeTicket(id) {
    setBusy(true);
    const d = await api({ action: "update", tab: "Installed_Base", idField: "Site_ID", idValue: id, patch: { Ticket_Status: "closed" } });
    if (d.ok) window.location.reload(); else { setMsg({ t: "bad", m: d.error || "ไม่สำเร็จ" }); setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="text-[13px] text-[#F5821F] font-semibold tracking-wide">M POWER · บริการหลังการขาย</div>
            <span className={"ml-auto text-[11px] px-2 py-0.5 rounded-full " + (canWrite ? TONE.ok : TONE.warn)}>{canWrite ? "เชื่อมชีตแล้ว" : sample ? "โหมดตัวอย่าง (ยังไม่มีแท็บ Installed_Base)" : "ยังไม่เชื่อมชีต"}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mt-2 leading-tight">ดูแลลูกค้า {o.count} ไซต์</h1>
          <p className="text-[#6e6e73] mt-3 text-lg">ทะเบียนงานที่ติดตั้งไปแล้ว · ประกัน · รอบบำรุงรักษา · เคสแจ้งซ่อม</p>
        </div>

        {error && <div className="bg-white rounded-xl p-3 mb-4 text-sm text-[#c0392b] border border-[#f4d5d0]">อ่านชีตไม่สำเร็จ: {error}</div>}
        {sample && (
          <div className="bg-white rounded-2xl p-4 mb-6 border border-[#ffe4cc] text-[13px] text-[#6e6e73]">
            <b className="text-[#1d1d1f]">ยังไม่มีข้อมูลจริง</b> — สร้างแท็บชื่อ <b>Installed_Base</b> ในชีต โดยวางหัวคอลัมน์ที่ <b>แถว 2</b> (แถว 1 เป็นหัวเรื่อง) ตามนี้:
            <div className="mt-2 font-mono text-[11px] bg-[#f5f5f7] rounded-lg p-2 break-all">Site_ID · Customer_Name · Area · Brand · kWp · Battery_kWh · Install_Date · Last_Service_Date · Ticket_Issue · Ticket_Status</div>
            <div className="mt-1">วันที่ใช้รูปแบบ YYYY-MM-DD · จากนั้นกด “เพิ่มไซต์” ด้านล่างเพื่อเริ่มบันทึกได้เลย</div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Stat label="ไซต์ในการดูแล" value={o.count} />
          <Stat label="ประกันใกล้หมด/หมด" value={o.expiring} tone={o.expiring ? "text-[#c0392b]" : "text-[#1d1d1f]"} />
          <Stat label="ถึงกำหนดล้าง/เช็ก" value={o.maDue} tone={o.maDue ? "text-[#b7791f]" : "text-[#1d1d1f]"} />
          <Stat label="เคสเปิดอยู่" value={o.tickets} tone={o.tickets ? "text-[#c0392b]" : "text-[#1d1d1f]"} />
        </div>

        <div className="bg-white rounded-2xl border border-[#ececed] p-5 mb-10">
          <button onClick={() => setOpen((v) => !v)} className="bg-[#F5821F] text-white rounded-lg px-4 py-2 text-sm font-semibold">{open ? "ปิดฟอร์ม" : "+ เพิ่มไซต์ที่ติดตั้ง"}</button>
          {open && (
            <div className="mt-4">
              {!canWrite && <div className="text-[12px] text-[#b7791f] mb-3">ต้องสร้างแท็บ Installed_Base ในชีตก่อน ถึงจะบันทึกได้</div>}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className="block text-[11px] text-[#6e6e73] mb-1">ชื่อลูกค้า *</label><input className={inCls} value={f.Customer_Name} onChange={(e) => upd("Customer_Name", e.target.value)} /></div>
                <div><label className="block text-[11px] text-[#6e6e73] mb-1">พื้นที่/จังหวัด</label><input className={inCls} value={f.Area} onChange={(e) => upd("Area", e.target.value)} /></div>
                <div><label className="block text-[11px] text-[#6e6e73] mb-1">แบรนด์</label><select className={inCls} value={f.Brand} onChange={(e) => upd("Brand", e.target.value)}><option>Atmoce</option><option>Sigenergy</option><option>อื่นๆ</option></select></div>
                <div><label className="block text-[11px] text-[#6e6e73] mb-1">ขนาด (kWp)</label><input type="number" className={inCls} value={f.kWp} onChange={(e) => upd("kWp", e.target.value)} /></div>
                <div><label className="block text-[11px] text-[#6e6e73] mb-1">แบต (kWh)</label><input type="number" className={inCls} value={f.Battery_kWh} onChange={(e) => upd("Battery_kWh", e.target.value)} /></div>
                <div><label className="block text-[11px] text-[#6e6e73] mb-1">วันติดตั้ง</label><input type="date" className={inCls} value={f.Install_Date} onChange={(e) => upd("Install_Date", e.target.value)} /></div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={addSite} disabled={busy || !canWrite} className="bg-[#1d1d1f] text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "บันทึกเข้าชีต"}</button>
                {msg && <span className={"text-sm " + (msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]")}>{msg.m}</span>}
                <span className="text-[11px] text-[#a1a1a6] ml-auto">Site_ID ออกอัตโนมัติ</span>
              </div>
            </div>
          )}
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">สิ่งที่ต้องจัดการ</h2>
          <p className="text-[#6e6e73] mb-5">เรียงตามความเร่งด่วน · แตะเพื่อไปที่ไซต์</p>
          <div className="space-y-2">
            {o.alerts.length === 0 && <div className="bg-white rounded-2xl p-6 border border-[#ececed] text-center text-[#6e6e73]">ไม่มีรายการค้าง 🎉</div>}
            {o.alerts.map((a, i) => (
              <button key={i} onClick={() => setSel(a.site.id)} className="w-full text-left bg-white rounded-xl border border-[#ececed] p-4 flex items-center gap-3">
                <span className={"text-[11px] px-2 py-0.5 rounded-full shrink-0 " + TONE[a.tone]}>{a.type === "warranty" ? "ประกัน" : a.type === "ma" ? "บำรุงรักษา" : "แจ้งซ่อม"}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[#1d1d1f] text-sm">{a.site.name} <span className="text-[#a1a1a6] text-[12px]">· {a.site.area}</span></div>
                  <div className="text-[13px] text-[#6e6e73]">{a.label} — {a.detail}</div>
                </div>
                <span className="text-[#c7c9cd] shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">ทะเบียนไซต์ที่ติดตั้ง</h2>
          <p className="text-[#6e6e73] mb-5">แตะเพื่อดูประกันแต่ละชิ้นส่วนและจัดการงาน</p>
          <div className="space-y-3">
            {sites.map((s) => {
              const m = maintenance(s, now);
              const flags = warranties(s, now).filter((w) => w.status !== "ok").length;
              const isOpen = sel === s.id;
              return (
                <div key={s.id || s.name} className="bg-white rounded-2xl border border-[#ececed] overflow-hidden">
                  <button onClick={() => { setSel(isOpen ? null : s.id); setTIssue(""); }} className="w-full text-left p-5 flex items-center gap-4">
                    <div className="w-2.5 h-10 rounded-full shrink-0" style={{ background: BRAND_TONE[s.brand] || "#999" }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1d1d1f] text-lg">{s.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ background: BRAND_TONE[s.brand] || "#999" }}>{s.brand}</span>
                        {s.ticket && s.ticket.status === "open" && <span className={"text-[11px] px-2 py-0.5 rounded-full " + TONE.bad}>มีเคสเปิด</span>}
                      </div>
                      <div className="text-[13px] text-[#6e6e73] mt-0.5">{s.id} · {s.area} · {s.kwp} kWp · ติดตั้ง {s.installDate || "—"}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={"text-[11px] px-2 py-0.5 rounded-full " + maPill(m.status)}>{m.status === "overdue" ? "MA เกินกำหนด" : m.status === "due" ? "ใกล้ถึง MA" : "MA ปกติ"}</span>
                      {flags > 0 && <div className="text-[11px] text-[#c0392b] mt-1">ประกัน {flags} รายการต้องดู</div>}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-[#f4f4f6] space-y-4">
                      <div>
                        <div className="text-[12px] font-semibold text-[#6e6e73] mb-2 mt-3">ประกันแต่ละชิ้นส่วน</div>
                        {warranties(s, now).length === 0 && <div className="text-[13px] text-[#a1a1a6]">ยังไม่มีวันติดตั้ง</div>}
                        <div className="space-y-1.5">
                          {warranties(s, now).map((w) => (
                            <div key={w.label} className="flex items-center gap-2 text-[13px]">
                              <span className="text-[#1d1d1f] flex-1">{w.label} <span className="text-[#a1a1a6]">({w.years} ปี)</span></span>
                              <span className="text-[#6e6e73]">ถึง {w.end}</span>
                              <span className={"text-[11px] px-2 py-0.5 rounded-full " + wPill(w.status)}>{wLabel(w.status, w.daysLeft)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">แบตเตอรี่</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{s.battKwh ? s.battKwh + " kWh" : "ไม่มี"}</div></div>
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">ล้าง/เช็กล่าสุด</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{s.lastServiceDate || "—"}</div></div>
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">รอบถัดไป</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{m.next}</div></div>
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">เคส</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{s.ticket ? "เปิด" : "ไม่มี"}</div></div>
                      </div>
                      {s.ticket && <div className="text-[13px] text-[#c0392b] bg-[#fdece9] rounded-xl p-3">เคสแจ้งซ่อม: {s.ticket.issue}</div>}

                      {canWrite ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => recordService(s.id)} disabled={busy} className="text-[12px] px-3 py-1.5 rounded-lg bg-[#1d1d1f] text-white disabled:opacity-50">บันทึกว่าไปดูแลแล้ว (วันนี้)</button>
                            {s.ticket ? (
                              <button onClick={() => closeTicket(s.id)} disabled={busy} className="text-[12px] px-3 py-1.5 rounded-lg border border-[#e2e2e7] text-[#6e6e73]">ปิดเคส</button>
                            ) : null}
                          </div>
                          {!s.ticket && (
                            <div className="flex gap-2">
                              <input className={inCls + " flex-1"} placeholder="เปิดเคสแจ้งซ่อม: อาการเสีย…" value={tIssue} onChange={(e) => setTIssue(e.target.value)} />
                              <button onClick={() => openTicket(s.id)} disabled={busy || !tIssue.trim()} className="text-[12px] px-3 py-1.5 rounded-lg bg-[#c0392b] text-white disabled:opacity-40 shrink-0">เปิดเคส</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 opacity-50">
                          <span className="text-[12px] px-3 py-1.5 rounded-lg bg-[#1d1d1f] text-white">บันทึกการดูแล</span>
                          <span className="text-[12px] px-3 py-1.5 rounded-lg border border-[#e2e2e7] text-[#6e6e73]">เปิดเคส</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-[#a1a1a6] text-center mt-10">รอบบำรุงรักษาทุก {MA_INTERVAL_MONTHS} เดือน · ประกันแผง 25 ปี / อินเวอร์เตอร์-แบต 10 ปี / ค่าแรง 1 ปี</p>
      </div>
    </div>
  );
}
