"use client";
import { useState } from "react";

// ===== ค่าคงที่สำหรับคำนวณผลกระทบ (แก้ได้) =====
const RATE = 4.79;      // ฿/kWh ค่าไฟเฉลี่ยไทย
const CO2_KG = 0.50;    // kg CO2 ต่อ kWh (กริดไทย · TGO)
const COAL_KG = 0.35;   // kg ถ่านหินมาตรฐาน ต่อ kWh
const TREE_KG = 21.77;  // kg CO2 ที่ต้นไม้ดูดซับ ต่อต้น/ปี

// ===== ไซต์ (รวมทุกแบรนด์) — เชื่อม API Sigenergy/Atmoce ภายหลัง =====
// Sigenergy = ข้อมูลจริงจากบัญชี Sigen Cloud · Atmoce = ตัวอย่าง (รอต่อ API)
const SITES = [
  { id: "santi", name: "Santi TMT", area: "นครปฐม", brand: "Sigenergy", kwp: 10, battKwh: 20, devices: 4, prodMwh: 2.98, status: "normal", x: 44, y: 52 },
  { id: "isarawan", name: "Isarawan TMT", area: "นครปฐม", brand: "Sigenergy", kwp: 5, battKwh: 0, devices: 2, prodMwh: 1.53, status: "normal", x: 52, y: 60 },
  { id: "am01", name: "ร้านกาแฟบ้านสวน", area: "นครปฐม", brand: "Atmoce", kwp: 5.2, battKwh: 7, devices: 3, prodMwh: 0.9, status: "normal", x: 38, y: 64 },
  { id: "am02", name: "คุณสมชาย (บ้านพัก)", area: "ราชบุรี", brand: "Atmoce", kwp: 10.4, battKwh: 14, devices: 3, prodMwh: 1.4, status: "normal", x: 34, y: 72 },
];

const MONTHLY = [
  { m: "มี.ค.", v: 0 }, { m: "เม.ย.", v: 0.2 }, { m: "พ.ค.", v: 0.9 },
  { m: "มิ.ย.", v: 1.6 }, { m: "ก.ค.", v: 2.4 }, { m: "ส.ค.", v: 1.9 },
];

const BRAND_TONE = {
  Sigenergy: "#0a84ff",
  Atmoce: "#F5821F",
};
const STATUS = {
  normal: { label: "ปกติ", cls: "text-[#1a7d3a] bg-[#e8f7ee]" },
  offline: { label: "ออฟไลน์", cls: "text-[#6e6e73] bg-[#eeeef0]" },
  alert: { label: "แจ้งเตือน", cls: "text-[#c0392b] bg-[#fdece9]" },
};

const nf = (n, d = 2) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: d });
const baht = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

function impactOf(mwh) {
  const kwh = mwh * 1000;
  return {
    money: kwh * RATE,
    co2t: (kwh * CO2_KG) / 1000,
    coalt: (kwh * COAL_KG) / 1000,
    trees: (kwh * CO2_KG) / TREE_KG,
  };
}

function Stat({ label, value, unit, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#ececed]">
      <div className="text-[13px] text-[#6e6e73]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[#1d1d1f] tracking-tight">{value}</span>
        {unit && <span className="text-sm text-[#6e6e73]">{unit}</span>}
      </div>
      {sub && <div className="text-[12px] text-[#a1a1a6] mt-1">{sub}</div>}
    </div>
  );
}

export default function FleetPage() {
  const [brand, setBrand] = useState("all");
  const [sel, setSel] = useState(null);

  const brands = ["all", ...Array.from(new Set(SITES.map((s) => s.brand)))];
  const sites = SITES.filter((s) => brand === "all" || s.brand === brand);

  const totalProd = sites.reduce((a, s) => a + s.prodMwh, 0);
  const totalDev = sites.reduce((a, s) => a + s.devices, 0);
  const totalKwp = sites.reduce((a, s) => a + s.kwp, 0);
  const totalBatt = sites.reduce((a, s) => a + s.battKwh, 0);
  const imp = impactOf(totalProd);

  const maxM = Math.max(0.001, ...MONTHLY.map((x) => x.v));
  const maxProd = Math.max(0.001, ...sites.map((s) => s.prodMwh));

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-[13px] text-[#F5821F] font-semibold tracking-wide">M POWER · ภาพรวมระบบที่ติดตั้ง</div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mt-2 leading-tight">
            ผลิตไฟสะอาดไปแล้ว {nf(totalProd)} MWh
          </h1>
          <p className="text-[#6e6e73] mt-3 text-lg">
            จาก {sites.length} ระบบ · {totalDev} อุปกรณ์ · คิดเป็นเงิน {baht(imp.money)} บาท
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {brands.map((b) => {
            const on = brand === b;
            const label = b === "all" ? "ทุกแบรนด์" : b;
            return (
              <button key={b} onClick={() => { setBrand(b); setSel(null); }}
                className={"px-4 py-1.5 rounded-full text-sm font-semibold border transition " + (on ? "bg-[#1d1d1f] text-white border-[#1d1d1f]" : "bg-white text-[#6e6e73] border-[#e2e2e7]")}>
                {b !== "all" && <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: BRAND_TONE[b] || "#999" }} />}
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <Stat label="ไซต์ที่ติดตั้ง" value={sites.length} unit="ระบบ" sub={"กำลังติดตั้งรวม " + nf(totalKwp, 1) + " kWp"} />
          <Stat label="ผลิตสะสม" value={nf(totalProd)} unit="MWh" sub="ตั้งแต่เริ่มติดตั้ง" />
          <Stat label="มูลค่าที่ผลิตได้" value={baht(imp.money)} unit="฿" sub={"ที่ค่าไฟ " + RATE + " ฿/หน่วย"} />
          <Stat label="แบตเตอรี่รวม" value={nf(totalBatt, 0)} unit="kWh" sub={totalDev + " อุปกรณ์"} />
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">เราช่วยโลกไปแล้วเท่าไหร่</h2>
          <p className="text-[#6e6e73] mb-5">คำนวณจากพลังงานสะอาดที่ระบบของลูกค้าผลิตได้ทั้งหมด</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-[#1a7d3a] to-[#2aa757] text-white rounded-2xl p-5">
              <div className="text-[13px] opacity-80">ลดก๊าซ CO₂</div>
              <div className="text-3xl font-bold mt-1">{nf(imp.co2t, 1)}</div>
              <div className="text-[12px] opacity-80">ตัน</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#ececed]">
              <div className="text-[13px] text-[#6e6e73]">เทียบการปลูกต้นไม้</div>
              <div className="text-3xl font-bold text-[#1a7d3a] mt-1">{nf(imp.trees, 0)}</div>
              <div className="text-[12px] text-[#a1a1a6]">ต้น/ปี</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#ececed]">
              <div className="text-[13px] text-[#6e6e73]">ประหยัดถ่านหิน</div>
              <div className="text-3xl font-bold text-[#1d1d1f] mt-1">{nf(imp.coalt, 1)}</div>
              <div className="text-[12px] text-[#a1a1a6]">ตัน</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#ececed]">
              <div className="text-[13px] text-[#6e6e73]">คิดเป็นค่าไฟที่ประหยัด</div>
              <div className="text-3xl font-bold text-[#F5821F] mt-1">{baht(imp.money)}</div>
              <div className="text-[12px] text-[#a1a1a6]">บาท</div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">ไซต์ที่ติดตั้ง</h2>
          <p className="text-[#6e6e73] mb-5">แตะที่ไซต์เพื่อดูรายละเอียด</p>
          <div className="space-y-3">
            {sites.map((s, i) => {
              const st = STATUS[s.status] || STATUS.normal;
              const open = sel === s.id;
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-[#ececed] overflow-hidden">
                  <button onClick={() => setSel(open ? null : s.id)} className="w-full text-left p-5 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 text-white" style={{ background: BRAND_TONE[s.brand] || "#999" }}>{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1d1d1f] text-lg">{s.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ background: BRAND_TONE[s.brand] || "#999" }}>{s.brand}</span>
                        <span className={"text-[11px] px-2 py-0.5 rounded-full " + st.cls}>{st.label}</span>
                      </div>
                      <div className="text-[13px] text-[#6e6e73] mt-0.5">{s.area} · {s.kwp} kWp</div>
                      <div className="mt-2 h-1.5 rounded-full bg-[#f0f0f2] overflow-hidden">
                        <div style={{ width: (s.prodMwh / maxProd) * 100 + "%", background: BRAND_TONE[s.brand] || "#999" }} className="h-full" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-[#1d1d1f]">{nf(s.prodMwh)}</div>
                      <div className="text-[11px] text-[#a1a1a6]">MWh</div>
                    </div>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#f4f4f6]">
                      {[
                        { l: "กำลังติดตั้ง", v: s.kwp + " kWp" },
                        { l: "แบตเตอรี่", v: s.battKwh ? s.battKwh + " kWh" : "ไม่มี" },
                        { l: "อุปกรณ์", v: s.devices + " ตัว" },
                        { l: "มูลค่าที่ผลิต", v: baht(impactOf(s.prodMwh).money) + " ฿" },
                      ].map((x) => (
                        <div key={x.l} className="bg-[#f5f5f7] rounded-xl p-3">
                          <div className="text-[11px] text-[#6e6e73]">{x.l}</div>
                          <div className="font-semibold text-[#1d1d1f] mt-0.5">{x.v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-5">แนวโน้มการผลิต <span className="text-[#a1a1a6] text-base font-normal">(MWh/เดือน · รวมทุกแบรนด์)</span></h2>
          <div className="bg-white rounded-2xl p-6 border border-[#ececed]">
            <div className="flex items-end gap-3 h-48">
              {MONTHLY.map((x) => (
                <div key={x.m} className="flex-1 flex flex-col items-center justify-end gap-2">
                  <div className="text-[12px] font-semibold text-[#1d1d1f]">{x.v ? nf(x.v, 1) : ""}</div>
                  <div style={{ height: (x.v / maxM) * 100 + "%" }} className="w-full max-w-[46px] rounded-t-lg bg-gradient-to-t from-[#F5821F] to-[#ffb066] min-h-[3px]" />
                  <div className="text-[12px] text-[#6e6e73]">{x.m}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">แผนที่การติดตั้ง</h2>
          <p className="text-[#6e6e73] mb-5">ตำแหน่งไซต์งาน (เชื่อมพิกัด GPS จากหน้าสำรวจได้ภายหลัง)</p>
          <div className="relative bg-white rounded-2xl border border-[#ececed] overflow-hidden" style={{ height: "340px", backgroundImage: "radial-gradient(#eef0f2 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
            <div className="absolute top-4 left-5 text-[12px] text-[#a1a1a6]">ประเทศไทย · ภาคกลาง</div>
            {sites.map((s) => {
              const active = sel === s.id;
              return (
                <button key={s.id} onClick={() => setSel(active ? null : s.id)}
                  className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center" style={{ left: s.x + "%", top: s.y + "%" }}>
                  <div className={"px-2.5 py-1 rounded-lg text-[12px] font-semibold shadow-sm mb-1 whitespace-nowrap " + (active ? "bg-[#1d1d1f] text-white" : "bg-white text-[#1d1d1f] border border-[#ececed]")}>
                    {s.name} · {nf(s.prodMwh, 1)} MWh
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ background: BRAND_TONE[s.brand] || "#999" }} />
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-[#a1a1a6] text-center mt-8">
          Sigenergy = ข้อมูลจริงจากบัญชี Sigen Cloud · Atmoce = ตัวอย่าง (รอเชื่อม API) · ผลกระทบคำนวณที่ {CO2_KG} kgCO₂/kWh, {RATE} ฿/หน่วย, {TREE_KG} kgCO₂/ต้น/ปี
        </p>
      </div>
    </div>
  );
}
