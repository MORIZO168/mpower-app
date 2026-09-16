"use client";
import { useState } from "react";

// ===== ค่าคงที่สำหรับคำนวณผลกระทบ (แก้ได้) =====
const RATE = 4.79;      // ฿/kWh ค่าไฟเฉลี่ยไทย
const CO2_KG = 0.50;    // kg CO2 ต่อ kWh (กริดไทย · TGO)
const COAL_KG = 0.35;   // kg ถ่านหินมาตรฐาน ต่อ kWh
const TREE_KG = 21.77;  // kg CO2 ที่ต้นไม้ดูดซับ ต่อต้น/ปี

const BRAND_TONE = { Sigenergy: "#0a84ff", "Aiko / Atmoce": "#F5821F", Atmoce: "#F5821F" };
const STATUS = {
  normal: { label: "ปกติ", cls: "text-[#1a7d3a] bg-[#e8f7ee]" },
  offline: { label: "ออฟไลน์", cls: "text-[#6e6e73] bg-[#eeeef0]" },
  alert: { label: "แจ้งเตือน", cls: "text-[#c0392b] bg-[#fdece9]" },
};

const nf = (n, d = 2) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: d });
const baht = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

function impactOf(mwh) {
  const kwh = mwh * 1000;
  return { money: kwh * RATE, co2t: (kwh * CO2_KG) / 1000, coalt: (kwh * COAL_KG) / 1000, trees: (kwh * CO2_KG) / TREE_KG };
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

export default function FleetView({ sites = [], syncedAt = "" }) {
  const [brand, setBrand] = useState("all");
  const [sel, setSel] = useState(null);
  const [sort, setSort] = useState("prod"); // prod | today | date

  const brands = ["all", ...Array.from(new Set(sites.map((s) => s.brand)))];
  let list = sites.filter((s) => brand === "all" || s.brand === brand);
  list = [...list].sort((a, b) =>
    sort === "today" ? b.todayKwh - a.todayKwh :
    sort === "date" ? String(b.installDate).localeCompare(String(a.installDate)) :
    b.prodMwh - a.prodMwh
  );

  const totalProd = list.reduce((a, s) => a + s.prodMwh, 0);
  const totalToday = list.reduce((a, s) => a + s.todayKwh, 0);
  const totalKwp = list.reduce((a, s) => a + s.kwp, 0);
  const totalBatt = list.reduce((a, s) => a + s.battKwh, 0);
  const onlineN = list.filter((s) => s.online).length;
  const imp = impactOf(totalProd);
  const maxProd = Math.max(0.001, ...list.map((s) => s.prodMwh));

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-[13px] text-[#F5821F] font-semibold tracking-wide">M POWER · ภาพรวมระบบที่ติดตั้ง</div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mt-2 leading-tight">
            ผลิตไฟสะอาดไปแล้ว {nf(totalProd, 1)} MWh
          </h1>
          <p className="text-[#6e6e73] mt-3 text-lg">
            จาก {list.length} ระบบ · ออนไลน์ {onlineN} · วันนี้ผลิตรวม {nf(totalToday, 0)} หน่วย · คิดเป็นเงินสะสม {baht(imp.money)} บาท
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
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
          <div className="ml-auto flex items-center gap-1 text-[12px]">
            <span className="text-[#a1a1a6] mr-1">เรียงตาม</span>
            {[["prod", "ผลิตสะสม"], ["today", "วันนี้"], ["date", "ติดตั้งล่าสุด"]].map(([v, l]) => (
              <button key={v} onClick={() => setSort(v)}
                className={"px-2.5 py-1 rounded-lg border " + (sort === v ? "bg-[#F5821F] text-white border-[#F5821F]" : "bg-white text-[#6e6e73] border-[#e2e2e7]")}>{l}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <Stat label="ไซต์ที่ติดตั้ง" value={list.length} unit="ระบบ" sub={"กำลังติดตั้งรวม " + nf(totalKwp, 1) + " kWp"} />
          <Stat label="ผลิตสะสม" value={nf(totalProd, 1)} unit="MWh" sub="ตั้งแต่เริ่มติดตั้ง" />
          <Stat label="ผลิตวันนี้" value={nf(totalToday, 0)} unit="หน่วย" sub={"ออนไลน์ " + onlineN + "/" + list.length + " ระบบ"} />
          <Stat label="แบตเตอรี่รวม" value={nf(totalBatt, 0)} unit="kWh" sub="ในระบบที่ติดตั้ง" />
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
            {list.map((s, i) => {
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
                      <div className="text-[13px] text-[#6e6e73] mt-0.5">
                        {s.kwp} kWp{s.battKwh ? " · แบต " + s.battKwh + " kWh" : ""}{s.installDate ? " · ติดตั้ง " + s.installDate : ""}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-[#f0f0f2] overflow-hidden">
                        <div style={{ width: (s.prodMwh / maxProd) * 100 + "%", background: BRAND_TONE[s.brand] || "#999" }} className="h-full" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-[#1d1d1f]">{nf(s.prodMwh, 2)}</div>
                      <div className="text-[11px] text-[#a1a1a6]">MWh สะสม</div>
                    </div>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#f4f4f6]">
                      {[
                        { l: "กำลังติดตั้ง", v: s.kwp + " kWp" },
                        { l: "แบตเตอรี่", v: s.battKwh ? s.battKwh + " kWh" : "ไม่มี" },
                        { l: "ผลิตวันนี้", v: nf(s.todayKwh, 1) + " หน่วย" },
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

        <p className="text-[11px] text-[#a1a1a6] text-center mt-8">
          ข้อมูล Atmoce = ดึงจริงจาก Atmoce Cloud ({sites.filter((s) => s.brand.includes("Atmoce")).length} ระบบ){syncedAt ? " · ซิงค์ล่าสุด " + syncedAt : ""}
          {" "}· ผลกระทบคำนวณที่ {CO2_KG} kgCO₂/kWh, {RATE} ฿/หน่วย, {TREE_KG} kgCO₂/ต้น/ปี
        </p>
      </div>
    </div>
  );
}
