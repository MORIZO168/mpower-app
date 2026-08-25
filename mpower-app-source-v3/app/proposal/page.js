"use client";
import { useState, useEffect } from "react";
import { PACKAGES, buildSystem, suggestPackage } from "@/lib/packages";
import { summarize, recommend } from "@/lib/loadprofile";
import LoadProfileChart from "@/components/LoadProfileChart";
import { FLAT_RATE, TOU, BATT_EFF, DEGRADE, ESCALATION, DAYS, MONTHS_TH, SAMPLE_PROD } from "@/lib/tariff";

const baht = (n) => "฿" + Math.round(n).toLocaleString("th-TH");
const f1 = (n) => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 1 });
const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";

export default function ProposalPage() {
  const [customer, setCustomer] = useState("คุณลูกค้า ตัวอย่าง");
  const [bill, setBill] = useState(7000);
  const [pctDay, setPctDay] = useState(45);
  const [eveShare, setEveShare] = useState(40);
  const [pkgId, setPkgId] = useState("M");
  const [extraPanels, setExtraPanels] = useState(0);
  const [battCount, setBattCount] = useState(1);
  const [backup, setBackup] = useState(false);
  const [warranty, setWarranty] = useState(15);

  const sys = buildSystem(pkgId, { extraPanels, battCount, backup, warranty });
  const [annual, setAnnual] = useState(Math.round(sys.kwp * 1450));

  const [lp, setLp] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mpower_lp");
      if (!raw) return;
      const d = JSON.parse(raw);
      const rows = d.rows || d;
      if (!rows || !rows.length) return;
      setLp({ sm: summarize(rows) });
      const rec = recommend(rows, "off_night");
      const pkg = suggestPackage(rec.kwp);
      setPkgId(pkg.id);
      setBattCount(rec.battModules);
      const s = buildSystem(pkg.id, { extraPanels: 0, battCount: rec.battModules, backup: false, warranty: 15 });
      setAnnual(Math.round(s.kwp * 1450));
      if (d.customer) setCustomer(d.customer);
    } catch (e) {}
  }, []);

  const totalDaily = lp ? lp.sm.total : bill / FLAT_RATE / 30;
  const dayUse = lp ? lp.sm.dayLoad : totalDaily * (pctDay / 100);
  const nightUse = lp ? lp.sm.offLoad : totalDaily * (1 - pctDay / 100);

  const shapeSum = SAMPLE_PROD.reduce((a, b) => a + b, 0);
  const prod = SAMPLE_PROD.map((s) => (annual * s) / shapeSum);

  const { onPeak, offPeak } = TOU;
  let saveFlatYr = 0, saveTouYr = 0;
  prod.forEach((pm, i) => {
    const perDay = pm / DAYS[i];
    const solarToDay = Math.min(perDay, dayUse);
    const excess = Math.max(0, perDay - dayUse);
    const toBatt = sys.battery > 0 ? Math.min(excess, sys.battery) : 0;
    const battOut = Math.min(toBatt * BATT_EFF, nightUse);
    saveFlatYr += (solarToDay + battOut) * DAYS[i] * FLAT_RATE;
    const evPeak = nightUse * (eveShare / 100);
    const offP = nightUse * (1 - eveShare / 100);
    const before = dayUse * onPeak + evPeak * onPeak + offP * offPeak;
    const coverEv = Math.min(battOut, evPeak);
    const coverOff = Math.min(battOut - coverEv, offP);
    const after = (dayUse - solarToDay) * onPeak + (evPeak - coverEv) * onPeak + (offP - coverOff) * offPeak;
    saveTouYr += (before - after) * DAYS[i];
  });
  const baseSave = saveTouYr;

  const YEARS = 15;
  let cum = 0, payback = 0;
  const flow = [];
  for (let y = 1; y <= YEARS; y++) {
    const yr = baseSave * Math.pow(1 + ESCALATION, y - 1) * Math.pow(1 - DEGRADE, y - 1);
    const prev = cum; cum += yr;
    if (payback === 0 && cum >= sys.price) payback = y - 1 + (sys.price - prev) / yr;
    flow.push({ y, yr, cum });
  }
  const life15 = cum;

  const preVat = sys.price / 1.07;
  const vat = sys.price - preVat;
  const savePct = bill ? (baseSave / (bill * 12)) * 100 : 0;
  const pctBand = (v) => (totalDaily ? Math.round((v / totalDaily) * 100) : 0);

  const Section = ({ n, title, children }) => (
    <div className="card p-6 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-6 h-6 rounded-full bg-[#F5821F] text-white flex items-center justify-center text-xs font-bold">{n}</span>
        <div className="font-bold text-[#1d1d1f]">{title}</div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="card p-5 mb-5 print:hidden">
        <div className="font-semibold text-[#1d1d1f] mb-3">ตั้งค่าข้อเสนอ</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">ชื่อลูกค้า</label><input className={inCls} value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">ค่าไฟ/เดือน (฿)</label><input type="number" className={inCls} value={bill} onChange={(e) => setBill(+e.target.value || 0)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">% ใช้ไฟกลางวัน</label><input type="number" className={inCls} value={pctDay} onChange={(e) => setPctDay(+e.target.value || 0)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">แพคเกจ</label>
            <select className={inCls} value={pkgId} onChange={(e) => { setPkgId(e.target.value); setAnnual(Math.round(buildSystem(e.target.value, { extraPanels, battCount, backup, warranty }).kwp * 1450)); }}>
              {PACKAGES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">+ แผงเพิ่ม (แผ่น)</label><input type="number" className={inCls} value={extraPanels} onChange={(e) => setExtraPanels(+e.target.value || 0)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">+ แบต (ก้อน 7kWh)</label><input type="number" className={inCls} value={battCount} onChange={(e) => setBattCount(+e.target.value || 0)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">ประกัน (ปี)</label><select className={inCls} value={warranty} onChange={(e) => setWarranty(+e.target.value)}><option value={15}>15</option><option value={20}>20</option><option value={25}>25</option></select></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">ผลิต/ปี (kWh)</label><input type="number" className={inCls} value={annual} onChange={(e) => setAnnual(+e.target.value || 0)} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#1d1d1f] mt-3">
          <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="w-4 h-4 accent-[#F5821F]" /> + Backup box (ใช้ไฟตอนไฟดับ)
        </label>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => window.print()} className="bg-[#1d1d1f] text-white rounded-lg px-5 py-2 text-sm font-semibold">🖨 พิมพ์ / เสนอลูกค้า (PDF)</button>
          <span className="text-xs text-[#a1a1a6]">จากภาระไฟกลางวัน ~{f1(dayUse)} kWh/วัน แนะนำแพคเกจ {suggestPackage((dayUse / 4) * 1.1).name}</span>
        </div>
      </div>

      <div className="text-center mb-5">
        <div className="font-bold text-2xl tracking-wide text-[#1d1d1f]">M POWER <span className="text-[#F5821F]">NATURE ENERGY</span></div>
        <div className="text-sm text-[#6e6e73] mt-1">ข้อเสนอระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ · สำหรับ {customer}</div>
      </div>

      <Section n={1} title="สรุปผู้บริหาร (Executive Summary)">
        <p className="text-[13px] text-[#6e6e73] leading-relaxed mb-4">
          ระบบโซลาร์ขนาด <b className="text-[#1d1d1f]">{sys.kwp} kWp</b>{sys.battery ? ` พร้อมแบตเตอรี่ ${sys.battery} kWh` : ""} สำหรับ {customer} ·
          ลดค่าไฟได้ประมาณ <b className="text-[#1a7d3a]">{savePct.toFixed(0)}%</b> คืนทุนใน <b className="text-[#F5821F]">{f1(payback)} ปี</b> และประหยัดสะสม 15 ปีราว <b className="text-[#1d1d1f]">{baht(life15)}</b>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["ขนาดระบบ", sys.kwp + " kWp"], ["ผลิตไฟ/ปี", annual.toLocaleString("th-TH") + " kWh"], ["ประหยัด/ปี", baht(baseSave)], ["คืนทุน", f1(payback) + " ปี"]].map(([k, v]) => (
            <div key={k} className="bg-[#f5f5f7] rounded-xl p-3 text-center"><div className="text-lg font-bold text-[#F5821F]">{v}</div><div className="text-[11px] text-[#6e6e73]">{k}</div></div>
          ))}
        </div>
      </Section>

      <Section n={2} title="ใบเสนอราคา">
        <table className="w-full text-[13px]">
          <tbody>
            {sys.lines.map((l, i) => (
              <tr key={i} className="border-b border-[#f4f4f6]"><td className="py-2">{l.label}<div className="text-[11px] text-[#a1a1a6]">{l.detail}</div></td><td className="text-right align-top py-2">{baht(l.amount)}</td></tr>
            ))}
            <tr><td className="py-1.5 text-[#6e6e73]">ราคาก่อน VAT</td><td className="text-right text-[#6e6e73]">{baht(preVat)}</td></tr>
            <tr><td className="py-1.5 text-[#6e6e73]">VAT 7%</td><td className="text-right text-[#6e6e73]">{baht(vat)}</td></tr>
            <tr className="border-t border-[#1d1d1f] font-bold"><td className="py-2">รวมทั้งสิ้น (รวม VAT)</td><td className="text-right text-[#F5821F] text-lg">{baht(sys.price)}</td></tr>
          </tbody>
        </table>
        <div className="text-[11px] text-[#a1a1a6] mt-2">เงื่อนไขชำระ: มัดจำ 50% · ก่อนติดตั้ง 30% · ปิดงาน 20% · ประกันระบบ {sys.warranty} ปี</div>
      </Section>

      <Section n={3} title="พฤติกรรมการใช้ไฟของลูกค้า (Load Profile)">
        <div className="text-[13px] text-[#6e6e73] mb-3">ใช้ไฟรวม ~<b className="text-[#1d1d1f]">{f1(totalDaily)} kWh/วัน</b> · {lp ? "จาก Load Profile ที่ลูกค้าทำ" : "จากบิลเฉลี่ย " + baht(bill) + "/เดือน"}</div>
        {lp ? (
          <LoadProfileChart hours={lp.sm.h} kwp={sys.kwp} height={150} />
        ) : (
          [["กลางวัน 09–16 น. (โซลาร์จ่ายตรง)", dayUse, "#F5821F"], ["หัวค่ำ+กลางคืน (แบต/กริด)", nightUse, "#6e6e73"]].map(([lab, v, col]) => (
            <div key={lab} className="mb-2">
              <div className="flex justify-between text-[12px] mb-1"><span className="text-[#1d1d1f]">{lab}</span><span className="font-medium">{f1(v)} kWh ({pctBand(v)}%)</span></div>
              <div className="h-2.5 rounded-full bg-[#f0f0f2] overflow-hidden"><div style={{ width: pctBand(v) + "%", background: col }} className="h-full" /></div>
            </div>
          ))
        )}
        <div className="text-[11px] text-[#a1a1a6] mt-2">{lp ? "เส้นส้ม = ผลิตจากแดดของระบบที่เสนอ · เส้นดำ = การใช้ไฟจริงของลูกค้า" : "ยิ่งใช้ไฟกลางวันเยอะ โซลาร์ยิ่งคุ้ม · ส่วนหัวค่ำ/กลางคืนแบตเตอรี่ช่วยเก็บไฟไว้ใช้"}</div>
      </Section>

      <Section n={4} title="แพคเกจที่นำเสนอ">
        <div className="rounded-xl border border-[#ffe4cc] bg-[#fffaf4] p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#1d1d1f] text-lg">{sys.pkg.name}</span>
            <span className="pill pill-warn">{sys.kwp} kWp</span>
            {sys.battery > 0 && <span className="pill pill-ok">Hybrid + แบต {sys.battery} kWh</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[12px]">
            <div><span className="text-[#6e6e73]">แผง</span> <b>{sys.panels} แผ่น (650W)</b></div>
            <div><span className="text-[#6e6e73]">อินเวอร์เตอร์</span> <b>{sys.inverter}</b></div>
            <div><span className="text-[#6e6e73]">แบตเตอรี่</span> <b>{sys.battery ? sys.battery + " kWh" : "—"}</b></div>
            <div><span className="text-[#6e6e73]">ประกัน</span> <b>{sys.warranty} ปี</b></div>
          </div>
        </div>
        <div className="text-[12px] text-[#6e6e73] mt-3 leading-relaxed">
          <b className="text-[#1d1d1f]">รวมในแพคเกจ:</b> แผงโซลาร์ + ไมโครอินเวอร์เตอร์ Atmoce + โครงสร้าง Antai + เดินสาย/กราวด์ + ติดตั้ง + ขออนุญาต PEA/MEA + กกพ. + monitoring + ล้างแผงฟรี 3 ปี ·
          <b className="text-[#1d1d1f]"> เพิ่มได้:</b> +แผง +แบต +Backup box +ขยายประกัน
        </div>
      </Section>

      <Section n={5} title="ผลตอบแทน 15 ปี (ROI)">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[["คืนทุน", f1(payback) + " ปี"], ["ประหยัดสะสม 15 ปี", baht(life15)], ["กำไรสุทธิ", baht(life15 - sys.price)]].map(([k, v]) => (
            <div key={k} className="bg-[#f2faf4] rounded-xl p-3 text-center border border-[#cdeed6]"><div className="text-base font-bold text-[#1a7d3a]">{v}</div><div className="text-[11px] text-[#6e6e73]">{k}</div></div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-28">
          {flow.map((r) => {
            const h = Math.max(4, (r.cum / life15) * 100);
            const paid = r.cum >= sys.price;
            return (
              <div key={r.y} className="flex-1 flex flex-col items-center justify-end" title={`ปีที่ ${r.y}: สะสม ${baht(r.cum)}`}>
                <div className="w-full rounded-t" style={{ height: h + "%", background: paid ? "#1a7d3a" : "#F5821F" }} />
                <div className="text-[9px] text-[#a1a1a6] mt-1">{r.y}</div>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-[#a1a1a6] mt-2">แท่งส้ม = ยังไม่คืนทุน · เขียว = คืนทุนแล้ว (สะสมกำไร) · คิดค่าไฟขึ้น {ESCALATION * 100}%/ปี + แผงเสื่อม {DEGRADE * 100}%/ปี ที่อัตรา TOU</div>
      </Section>

      <div className="text-center text-[12px] text-[#a1a1a6] mt-4 mb-8 print:mt-8">
        M POWER NATURE ENERGY 168 · โทร 099-629-9355 · ข้อเสนอนี้ยืนราคา 30 วัน
      </div>
    </div>
  );
}
