"use client";
import { useState } from "react";
import { DEALS, installStatus, money } from "@/lib/pipeline";

// SOP M Power — เช็คลิสต์ตรวจรับหน้างานโดยโฟร์แมน
const CHECKLIST = [
  "โครงสร้างหลังคารับน้ำหนักได้ / สภาพดี",
  "ติดตั้ง Mounting ตามระยะแป-จันทัน",
  "จำนวนแผง + รุ่นตรงสเปค",
  "อินเวอร์เตอร์ รุ่น/จำนวน ตรงสเปค",
  "เดินสาย DC/AC ร้อยท่อตามมาตรฐาน",
  "ปักกราวด์ + วัดค่าความต้านทานดิน",
  "ตั้งค่าอินเวอร์เตอร์ + เชื่อม monitoring",
  "ทดสอบระบบ + วัดค่าไฟเข้า",
  "เก็บงาน / ทำความสะอาดพื้นที่",
  "ถ่ายรูปส่งมอบครบทุกจุด",
];

const WODEALS = DEALS.filter((d) => d.install || ["รอติดตั้ง", "ติดตั้ง", "ขอขนานไฟ"].includes(d.stage));

export default function WorkOrderPage() {
  const [sel, setSel] = useState(WODEALS[0]?.id);
  const d = WODEALS.find((x) => x.id === sel) || WODEALS[0];
  const [ins, setIns] = useState(d?.install || { date: "", customerOk: false, installerOk: false, ownerApproved: false, team: "" });
  const [checks, setChecks] = useState({});

  function pick(id) {
    const nd = WODEALS.find((x) => x.id === id);
    setSel(id);
    setIns(nd?.install || { date: "", customerOk: false, installerOk: false, ownerApproved: false, team: "" });
    setChecks({});
  }

  if (!d) return <div className="p-6">ยังไม่มีงานสำหรับออกใบสั่งงาน</div>;
  const st = installStatus(ins);
  const mapLink = d.pin ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.pin)}` : "";
  const doneChecks = Object.values(checks).filter(Boolean).length;

  const Step = ({ ok, label, sub, onToggle }) => (
    <button onClick={onToggle} className={`flex-1 rounded-xl border p-3 text-left transition-colors ${ok ? "border-[#1a7d3a] bg-[#f2faf4]" : "border-[#e2e2e7] bg-white"}`}>
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] ${ok ? "bg-[#1a7d3a]" : "bg-[#c8c8cd]"}`}>{ok ? "✓" : ""}</span>
        <span className="text-sm font-medium text-[#1d1d1f]">{label}</span>
      </div>
      <div className="text-[11px] text-[#a1a1a6] mt-1 ml-7">{sub}</div>
    </button>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1d1d1f]">ใบสั่งงานติดตั้ง</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">สร้างจากใบเสนอที่ลูกค้าตอบรับ · สเปค + พิกัด + วันนัด 3 ฝ่าย + เช็คลิสต์โฟร์แมน</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {WODEALS.map((x) => (
          <button key={x.id} onClick={() => pick(x.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${sel === x.id ? "bg-[#1d1d1f] text-white border-[#1d1d1f]" : "bg-white text-[#6e6e73] border-[#e2e2e7]"}`}>
            {x.id} · {x.customer.slice(0, 12)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-lg text-[#1d1d1f]">{d.customer}</div>
                <div className="text-[13px] text-[#6e6e73]">{d.id} · {d.area} · {d.phone}</div>
              </div>
              <span className="pill pill-ok">{d.stage}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[["ขนาดระบบ", d.kwp + " kWp"], ["แผง", d.panels + " แผ่น"], ["อินเวอร์เตอร์", d.inverter], ["แบตเตอรี่", d.battery ? d.battery + " kWh" : "—"]].map(([k, v]) => (
                <div key={k} className="bg-[#f5f5f7] rounded-lg p-3"><div className="text-sm font-bold text-[#1d1d1f]">{v}</div><div className="text-[11px] text-[#6e6e73]">{k}</div></div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[13px]">
              <span className="text-[#6e6e73]">มูลค่างาน</span><b className="text-[#F5821F]">{money(d.value)}</b>
              {mapLink && <a href={mapLink} target="_blank" rel="noreferrer" className="ml-auto text-[#F5821F] font-medium">📍 เปิดพิกัดหน้างาน ({d.pin}) →</a>}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center mb-3">
              <div className="font-semibold text-[#1d1d1f]">วันนัดติดตั้ง</div>
              <span className={`ml-auto pill pill-${st.tone}`}>{st.label}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[13px] text-[#6e6e73]">วันที่</label>
              <input type="date" value={ins.date} onChange={(e) => setIns({ ...ins, date: e.target.value })} className="px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white" />
              <input value={ins.team} onChange={(e) => setIns({ ...ins, team: e.target.value })} placeholder="ทีมช่าง" className="px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white flex-1" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Step ok={ins.customerOk} label="ลูกค้ายืนยัน" sub="ลูกค้าตกลงวันเข้าติดตั้ง" onToggle={() => setIns({ ...ins, customerOk: !ins.customerOk })} />
              <Step ok={ins.installerOk} label="ทีมช่างยืนยัน" sub="ช่างว่าง+รับงานวันนี้" onToggle={() => setIns({ ...ins, installerOk: !ins.installerOk })} />
              <Step ok={ins.ownerApproved} label="เราอนุมัติ" sub="ยืนยันคิว+เบิกของ" onToggle={() => setIns({ ...ins, ownerApproved: !ins.ownerApproved })} />
            </div>
            <div className="text-[11px] text-[#a1a1a6] mt-2">ต้องครบทั้ง 3 ฝ่ายก่อนล็อกคิว · ถ้าติดค้างฝั่งไหน AI ผู้ช่วยจะเตือนในสรุปเช้า/เย็น</div>
          </div>

          <div className="card p-5">
            <div className="flex items-center mb-3">
              <div className="font-semibold text-[#1d1d1f]">เช็คลิสต์ตรวจรับหน้างาน (SOP โฟร์แมน)</div>
              <div className="ml-auto text-sm text-[#6e6e73]"><b className={doneChecks === CHECKLIST.length ? "text-[#1a7d3a]" : "text-[#F5821F]"}>{doneChecks}/{CHECKLIST.length}</b></div>
            </div>
            <div className="space-y-1.5">
              {CHECKLIST.map((c, i) => (
                <label key={i} className="flex items-center gap-2.5 py-1 cursor-pointer">
                  <input type="checkbox" checked={!!checks[i]} onChange={(e) => setChecks({ ...checks, [i]: e.target.checked })} className="w-4 h-4 accent-[#F5821F]" />
                  <span className={`text-sm ${checks[i] ? "text-[#a1a1a6] line-through" : "text-[#1d1d1f]"}`}>{c}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="font-semibold text-[#1d1d1f] mb-3">สถานะงาน</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6e6e73]">นัด 3 ฝ่าย</span><span className={`font-medium ${st.tone === "ok" ? "text-[#1a7d3a]" : "text-[#F5821F]"}`}>{st.label}</span></div>
              <div className="flex justify-between"><span className="text-[#6e6e73]">ตรวจรับ SOP</span><span className="font-medium">{doneChecks}/{CHECKLIST.length}</span></div>
              <div className="flex justify-between"><span className="text-[#6e6e73]">ถัดไป</span><span className="font-medium text-[#1d1d1f] text-right">{d.nextAction}</span></div>
            </div>
          </div>
          <button className="w-full bg-[#1d1d1f] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">พิมพ์ใบสั่งงาน / ส่งให้ทีมช่าง</button>
          <div className="card p-5 text-[12px] text-[#6e6e73] leading-relaxed">
            <div className="font-semibold text-[#1d1d1f] mb-1 text-sm">ต่อไป</div>
            เมื่อครบ 3 ฝ่าย + เช็คลิสต์ผ่าน → ปิดงานติดตั้ง → เข้าขั้น "ขอขนานไฟ PEA" อัตโนมัติ (เฟสถัดไปเชื่อม Google Sheet)
          </div>
        </div>
      </div>
    </div>
  );
}
