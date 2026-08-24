"use client";
import { useState } from "react";
import { FLAT_RATE, TOU, BATT_EFF, DEGRADE, ESCALATION, LIFETIME, DAYS, MONTHS_TH, SAMPLE_PROD } from "@/lib/tariff";

const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const baht = (n) => "฿" + Math.round(n).toLocaleString("th-TH");
const f1 = (n) => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 1 });

export default function RoiPage() {
  const [bill, setBill] = useState(7000);
  const [flat, setFlat] = useState(FLAT_RATE);
  const [onPeak, setOnPeak] = useState(TOU.onPeak);
  const [offPeak, setOffPeak] = useState(TOU.offPeak);
  const [pctDay, setPctDay] = useState(40);
  const [eveShare, setEveShare] = useState(40);
  const [battery, setBattery] = useState(7);
  const [price, setPrice] = useState(290000);
  const [esc, setEsc] = useState(ESCALATION * 100);
  const [deg, setDeg] = useState(DEGRADE * 100);
  const [prod, setProd] = useState(SAMPLE_PROD.slice());
  const [tariff, setTariff] = useState("tou");

  const [geo, setGeo] = useState({ lat: 13.75, lon: 100.5, kwp: 8.71, tilt: 15, az: 0 });
  const [pvStatus, setPvStatus] = useState("");
  async function fetchPVGIS() {
    setPvStatus("กำลังดึงจาก PVGIS…");
    try {
      const q = new URLSearchParams({ lat: geo.lat, lon: geo.lon, kwp: geo.kwp, tilt: geo.tilt, az: geo.az });
      const r = await fetch("/api/pvgis?" + q.toString());
      const d = await r.json();
      if (d.monthly && d.monthly.length === 12) { setProd(d.monthly); setPvStatus("ดึงสำเร็จ ✓ ผลิต " + d.annual.toLocaleString("th-TH") + " kWh/ปี (" + d.source + ")"); }
      else setPvStatus("ไม่สำเร็จ: " + (d.error || "ข้อมูลไม่ครบ"));
    } catch (e) { setPvStatus("เรียกไม่สำเร็จ: " + String(e).slice(0, 80)); }
  }

  const totalDaily = bill / flat / 30;
  const dayUse = totalDaily * (pctDay / 100);
  const nightUse = totalDaily * (1 - pctDay / 100);

  const months = prod.map((pm, i) => {
    const days = DAYS[i];
    const perDay = pm / days;
    const solarToDay = Math.min(perDay, dayUse);
    const excess = Math.max(0, perDay - dayUse);
    const toBatt = battery > 0 ? Math.min(excess, battery) : 0;
    const battOut = Math.min(toBatt * BATT_EFF, nightUse);
    const stillDay = Math.max(0, dayUse - solarToDay);
    const stillNight = Math.max(0, nightUse - battOut);
    const exportKwh = Math.max(0, excess - toBatt);

    const saveFlat = (solarToDay + battOut) * days * flat;

    const evPeak = nightUse * (eveShare / 100);
    const offP = nightUse * (1 - eveShare / 100);
    const beforeDaily = dayUse * onPeak + evPeak * onPeak + offP * offPeak;
    const coverEv = Math.min(battOut, evPeak);
    const coverOff = Math.min(battOut - coverEv, offP);
    const stillEv = evPeak - coverEv;
    const stillOff = offP - coverOff;
    const afterDaily = stillDay * onPeak + stillEv * onPeak + stillOff * offPeak;
    const saveTou = (beforeDaily - afterDaily) * days;
    const beforeTouMonth = beforeDaily * days;

    return { i, days, pm, perDay, solarToDay, battOut, stillDay, stillNight, exportKwh, saveFlat, saveTou, beforeTouMonth };
  });

  const annualProd = prod.reduce((a, b) => a + b, 0);
  const saveFlatYr = months.reduce((a, m) => a + m.saveFlat, 0);
  const saveTouYr = months.reduce((a, m) => a + m.saveTou, 0);
  const billFlatYr = bill * 12;
  const billTouYr = months.reduce((a, m) => a + m.beforeTouMonth, 0);

  const baseSave = tariff === "tou" ? saveTouYr : saveFlatYr;
  const baseBill = tariff === "tou" ? billTouYr : billFlatYr;
  const pctSave = baseBill ? (baseSave / baseBill) * 100 : 0;

  let cum = 0, payback = 0, lifetime = 0;
  const flow = [];
  for (let y = 1; y <= LIFETIME; y++) {
    const yr = baseSave * Math.pow(1 + esc / 100, y - 1) * Math.pow(1 - deg / 100, y - 1);
    const prev = cum;
    cum += yr;
    lifetime += yr;
    if (payback === 0 && cum >= price) payback = y - 1 + (price - prev) / yr;
    flow.push({ y, yr, cum });
  }
  const simplePayback = baseSave ? price / baseSave : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1d1d1f]">ROI / คำนวณประหยัดค่าไฟ</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">เทียบ Flat vs TOU · cashflow 25 ปี (ค่าไฟขึ้น + แผงเสื่อม) · ดึง production จาก PVGIS ได้เลย</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="font-semibold text-[#1d1d1f] mb-3">ข้อมูลลูกค้า (จากบิล)</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ค่าไฟรวม/เดือน (฿)</label><input type="number" className={inCls} value={bill} onChange={(e) => setBill(+e.target.value || 0)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">เรต Flat (฿/หน่วย)</label><input type="number" step="0.01" className={inCls} value={flat} onChange={(e) => setFlat(+e.target.value || 0)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">% ใช้ไฟกลางวัน</label><input type="number" className={inCls} value={pctDay} onChange={(e) => setPctDay(+e.target.value || 0)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">แบตเตอรี่ (kWh)</label><input type="number" className={inCls} value={battery} onChange={(e) => setBattery(+e.target.value || 0)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ราคาระบบ (฿ รวม VAT)</label><input type="number" step="1000" className={inCls} value={price} onChange={(e) => setPrice(+e.target.value || 0)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">% ใช้ไฟหัวค่ำ (16–22)</label><input type="number" className={inCls} value={eveShare} onChange={(e) => setEveShare(+e.target.value || 0)} /></div>
            </div>
            <div className="text-[11px] text-[#a1a1a6] mt-2">ใช้ไฟรวม ~{f1(totalDaily)} kWh/วัน · กลางวัน {f1(dayUse)} · กลางคืน {f1(nightUse)}</div>
          </div>

          <div className="card p-5">
            <div className="flex items-center mb-3">
              <div className="font-semibold text-[#1d1d1f]">Annual Production รายเดือน (kWh)</div>
              <div className="ml-auto text-sm text-[#6e6e73]">รวม <b className="text-[#F5821F]">{annualProd.toLocaleString("th-TH")}</b> /ปี</div>
            </div>
            <div className="rounded-xl bg-[#f8f9fb] border border-[#eceef2] p-3 mb-3">
              <div className="text-[12px] font-medium text-[#1d1d1f] mb-2">ดึงอัตโนมัติจาก PVGIS (แทน OpenSolar)</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div><label className="block text-[10px] text-[#6e6e73]">lat</label><input type="number" step="0.0001" className={inCls} value={geo.lat} onChange={(e) => setGeo({ ...geo, lat: e.target.value })} /></div>
                <div><label className="block text-[10px] text-[#6e6e73]">lon</label><input type="number" step="0.0001" className={inCls} value={geo.lon} onChange={(e) => setGeo({ ...geo, lon: e.target.value })} /></div>
                <div><label className="block text-[10px] text-[#6e6e73]">kWp</label><input type="number" step="0.01" className={inCls} value={geo.kwp} onChange={(e) => setGeo({ ...geo, kwp: e.target.value })} /></div>
                <div><label className="block text-[10px] text-[#6e6e73]">ชัน°</label><input type="number" className={inCls} value={geo.tilt} onChange={(e) => setGeo({ ...geo, tilt: e.target.value })} /></div>
                <div><label className="block text-[10px] text-[#6e6e73]">ทิศ(0=ใต้)</label><input type="number" className={inCls} value={geo.az} onChange={(e) => setGeo({ ...geo, az: e.target.value })} /></div>
              </div>
              <button onClick={fetchPVGIS} className="mt-2 bg-[#1d1d1f] text-white rounded-lg px-4 py-1.5 text-sm font-semibold">ดึง Production</button>
              {pvStatus && <div className="text-[11px] text-[#6e6e73] mt-1.5">{pvStatus}</div>}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {prod.map((v, i) => (
                <div key={i}>
                  <label className="block text-[10px] text-[#a1a1a6] text-center">{MONTHS_TH[i]}</label>
                  <input type="number" className={`${inCls} text-center px-1`} value={v} onChange={(e) => setProd(prod.map((x, j) => (j === i ? +e.target.value || 0 : x)))} />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 overflow-x-auto">
            <div className="font-semibold text-[#1d1d1f] mb-3">ประหยัดรายเดือน</div>
            <table className="w-full text-[12px] min-w-[460px]">
              <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee]">
                <th className="py-1.5">เดือน</th><th className="text-right">ผลิต</th><th className="text-right">โซลาร์+แบตใช้</th><th className="text-right">ประหยัด Flat</th><th className="text-right">ประหยัด TOU</th>
              </tr></thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.i} className="border-b border-[#f4f4f6]">
                    <td className="py-1.5">{MONTHS_TH[m.i]}</td>
                    <td className="text-right text-[#6e6e73]">{m.pm}</td>
                    <td className="text-right text-[#6e6e73]">{f1((m.solarToDay + m.battOut) * m.days)}</td>
                    <td className="text-right">{baht(m.saveFlat)}</td>
                    <td className="text-right text-[#F5821F] font-medium">{baht(m.saveTou)}</td>
                  </tr>
                ))}
                <tr className="font-semibold border-t border-[#ddd]">
                  <td className="py-1.5" colSpan={3}>รวมทั้งปี</td>
                  <td className="text-right">{baht(saveFlatYr)}</td>
                  <td className="text-right text-[#F5821F]">{baht(saveTouYr)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex gap-1 p-1 bg-[#f0f0f2] rounded-lg mb-4">
              {[["flat", "Flat 4.79"], ["tou", "TOU"]].map(([k, lab]) => (
                <button key={k} onClick={() => setTariff(k)} className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${tariff === k ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"}`}>{lab}</button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="bg-[#f2faf4] rounded-xl p-3 border border-[#cdeed6]">
                <div className="text-2xl font-bold text-[#1a7d3a]">{baht(baseSave / 12)}</div>
                <div className="text-[12px] text-[#6e6e73]">ประหยัด/เดือน (เฉลี่ยปีแรก) · {f1(pctSave)}% ของบิล</div>
              </div>
              <div className="bg-[#fff8f1] rounded-xl p-3 border border-[#ffe4cc]">
                <div className="text-2xl font-bold text-[#F5821F]">{payback ? f1(payback) : f1(simplePayback)} ปี</div>
                <div className="text-[12px] text-[#6e6e73]">คืนทุน (รวมค่าไฟขึ้น {f1(esc)}% + แผงเสื่อม {f1(deg)}%/ปี)</div>
              </div>
              <div className="bg-[#f5f5f7] rounded-xl p-3">
                <div className="text-lg font-bold text-[#1d1d1f]">{baht(lifetime)}</div>
                <div className="text-[12px] text-[#6e6e73]">ประหยัดสะสม 25 ปี · กำไรสุทธิ {baht(lifetime - price)}</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="font-semibold text-[#1d1d1f] mb-3 text-sm">เทียบ Flat vs TOU (ประหยัด/ปี)</div>
            {[["Flat", saveFlatYr, "#6e6e73"], ["TOU", saveTouYr, "#F5821F"]].map(([lab, val, col]) => {
              const mx = Math.max(saveFlatYr, saveTouYr) || 1;
              return (
                <div key={lab} className="mb-2">
                  <div className="flex justify-between text-[12px] mb-1"><span>{lab}</span><span className="font-medium">{baht(val)}</span></div>
                  <div className="h-2.5 rounded-full bg-[#f0f0f2] overflow-hidden"><div style={{ width: (val / mx) * 100 + "%", background: col }} className="h-full" /></div>
                </div>
              );
            })}
            <div className="text-[11px] text-[#a1a1a6] mt-2">
              TOU ดีกว่า {saveTouYr > saveFlatYr ? baht(saveTouYr - saveFlatYr) : "—"}/ปี เพราะโซลาร์+แบตชดเชยช่วง on-peak (5.80) · เทียบบิลเดิม TOU {baht(billTouYr)}/ปี
            </div>
          </div>

          <div className="card p-5">
            <div className="font-semibold text-[#1d1d1f] mb-2 text-sm">ปรับพารามิเตอร์</div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-[10px] text-[#6e6e73]">On-peak ฿</label><input type="number" step="0.0001" className={inCls} value={onPeak} onChange={(e) => setOnPeak(+e.target.value || 0)} /></div>
              <div><label className="block text-[10px] text-[#6e6e73]">Off-peak ฿</label><input type="number" step="0.0001" className={inCls} value={offPeak} onChange={(e) => setOffPeak(+e.target.value || 0)} /></div>
              <div><label className="block text-[10px] text-[#6e6e73]">ค่าไฟขึ้น %/ปี</label><input type="number" step="0.5" className={inCls} value={esc} onChange={(e) => setEsc(+e.target.value || 0)} /></div>
              <div><label className="block text-[10px] text-[#6e6e73]">แผงเสื่อม %/ปี</label><input type="number" step="0.1" className={inCls} value={deg} onChange={(e) => setDeg(+e.target.value || 0)} /></div>
            </div>
            <div className="text-[11px] text-[#a1a1a6] mt-2">เรตฐาน 2568 ยังไม่รวม Ft+VAT · แบต round-trip {BATT_EFF * 100}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
