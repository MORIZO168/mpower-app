"use client";
import { useState } from "react";

// ===== ราคาอุปกรณ์ Atmoce (จาก Price List / SRP) — ex VAT =====
const PL = {
  MI1250: 4750, P5: 880, P10: 1760,
  MC100L: 10900, MC100: 15900, MC100T: 20900,
  ACCABLE: 605,            // MW-025025-A (2.5m)
  JUNC1P: 640, JUNC3P: 1050, // MT-04003-A / MT-03205-A
  BATT7: 72900,            // MS-7K-U
  BACKUP1P: 15900, BACKUP3P: 22900, // MU100S / MU100T
};

// ===== แปลงตัวเลขเป็นข้อความภาษาไทย (บาท) =====
function bahtText(amount) {
  amount = Math.round(amount * 100) / 100;
  const bahtStr = Math.floor(amount).toString();
  const satang = Math.round((amount - Math.floor(amount)) * 100);
  const digits = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const places = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];
  function readGroup(s) {
    let out = ""; const len = s.length;
    for (let i = 0; i < len; i++) {
      const d = +s[i]; const p = len - 1 - i;
      if (d === 0) continue;
      if (p === 1 && d === 1) out += "สิบ";
      else if (p === 1 && d === 2) out += "ยี่สิบ";
      else if (p === 0 && d === 1 && len > 1) out += "เอ็ด";
      else out += digits[d] + places[p];
    }
    return out;
  }
  function readInt(s) {
    if (s === "0") return "ศูนย์";
    const groups = [];
    while (s.length > 6) { groups.unshift(s.slice(-6)); s = s.slice(0, -6); }
    groups.unshift(s);
    let out = "";
    for (let g = 0; g < groups.length; g++) {
      const part = readGroup(groups[g].replace(/^0+/, "") || "0");
      if (part && part !== "ศูนย์") out += part;
      if (g < groups.length - 1) out += "ล้าน";
    }
    return out || "ศูนย์";
  }
  let text = readInt(bahtStr) + "บาท";
  text += satang === 0 ? "ถ้วน" : readGroup(satang.toString().padStart(2, "0")) + "สตางค์";
  return text;
}

const num = (n) => Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = (n) => Number(n).toLocaleString("th-TH");

export default function QuotePage() {
  const [customer, setCustomer] = useState("Swerb Speciality");
  // ==== เริ่มจากแผงก่อน ====
  const [panelW, setPanelW] = useState(665);
  const [panelCount, setPanelCount] = useState(30);
  const [phase, setPhase] = useState(3);
  const [batteryKwh, setBatteryKwh] = useState(0);
  const [backup, setBackup] = useState(false);
  const [warranty, setWarranty] = useState(15);
  // ต้นทุนส่วนเพิ่ม (แก้ได้ — อิง SRP)
  const [panelBahtW, setPanelBahtW] = useState(4.3);
  const [cMount, setCMount] = useState(1);
  const [cBos, setCBos] = useState(3);
  const [cInstall, setCInstall] = useState(2);
  const [service, setService] = useState(30000);
  const [permit, setPermit] = useState(50000);
  // ราคา
  const [margin, setMargin] = useState(30);
  const [discount, setDiscount] = useState(0);
  const [roundNet, setRoundNet] = useState(true);

  // ==== คำนวณจากแผง (ตามสูตร Resi_Mi-1250) ====
  const W = panelW * panelCount;
  const dcKwp = W / 1000;
  const acKwac = (panelCount * 1250) / 2 / 1000;
  const dcac = acKwac ? dcKwp / acKwac : 0;
  const inv = Math.ceil(panelCount / 2);
  const combiner = phase === 1
    ? (inv < 5 ? { n: "MC100L", p: PL.MC100L } : { n: "MC100", p: PL.MC100 })
    : { n: "MC100T", p: PL.MC100T };
  const combQty = phase === 1 ? 1 : Math.max(1, Math.ceil(inv / 30));
  const junc = phase === 1
    ? { n: "MT-04003-A", p: PL.JUNC1P, q: panelCount < 9 ? 1 : panelCount < 17 ? 2 : panelCount < 25 ? 3 : 4 }
    : { n: "MT-03205-A", p: PL.JUNC3P, q: inv < 13 ? 1 : inv < 25 ? 2 : 3 };
  const waAddon = warranty === 20 ? { n: "MI-1250-P5", p: PL.P5, q: inv }
    : warranty === 25 ? { n: "MI-1250-P10", p: PL.P10, q: inv } : null;
  const battQty = Math.round((batteryKwh || 0) / 7);
  const backupBox = backup ? (phase === 1 ? { n: "MU100S", p: PL.BACKUP1P } : { n: "MU100T", p: PL.BACKUP3P }) : null;

  const bom = [
    { sku: "MI-1250", desc: "Micro Inverter 1,250W", q: inv, p: PL.MI1250 },
    ...(waAddon ? [{ sku: waAddon.n, desc: `รับประกันเพิ่ม (${warranty} ปี)`, q: waAddon.q, p: waAddon.p }] : []),
    { sku: combiner.n, desc: "M-Combiner", q: combQty, p: combiner.p },
    { sku: "MW-025025-A", desc: "AC Cable 2.5m", q: inv, p: PL.ACCABLE },
    { sku: junc.n, desc: "Junction Adapter", q: junc.q, p: junc.p },
    ...(battQty > 0 ? [{ sku: "MS-7K-U", desc: "M-Battery 7kWh", q: battQty, p: PL.BATT7 }] : []),
    ...(backupBox ? [{ sku: backupBox.n, desc: "Backup Box", q: 1, p: backupBox.p }] : []),
  ];
  const atmoceTotal = bom.reduce((s, x) => s + x.q * x.p, 0);

  const panelCost = W * panelBahtW;
  const mounting = W * cMount;
  const bos = W * cBos;
  const install = W * cInstall;
  const totalCost = atmoceTotal + panelCost + mounting + bos + install + service + permit;

  const priceBeforeDiscount = totalCost * (1 + margin / 100);
  const afterDiscount = priceBeforeDiscount - discount;
  let preVat, vat, grand, shownDiscount;
  if (roundNet) {
    grand = Math.round((afterDiscount * 1.07) / 100) * 100;
    preVat = Math.round((grand / 1.07) * 100) / 100;
    vat = Math.round((grand - preVat) * 100) / 100;
    shownDiscount = Math.round((priceBeforeDiscount - preVat) * 100) / 100;
  } else {
    preVat = Math.round(afterDiscount * 100) / 100;
    vat = Math.round(preVat * 0.07 * 100) / 100;
    grand = Math.round((preVat + vat) * 100) / 100;
    shownDiscount = discount;
  }
  const perW = grand / W;

  // Proposal
  const annualKwh = Math.round(dcKwp * 1450);
  const savingYr = Math.round(annualKwh * 4.2);
  const payback = savingYr ? (grand / savingYr).toFixed(1) : "-";

  const subItems = [
    `แผงโซล่าเซลล์ (PV) ${panelW}W จำนวน ${panelCount} แผง`,
    `Atmoce Micro inverter MI-1250 ${inv} ชุด`,
    `Atmoce ${combiner.n}${combQty > 1 ? ` ${combQty} ตัว` : ""}`,
    ...(battQty > 0 ? [`Atmoce M-Battery 7kWh ${battQty} ก้อน${backupBox ? " + Backup Box" : ""}`] : []),
    `"Antai" PV Mounting Structure + Inverter Support`,
    `"Local" AC/DC Cable, Raceway & Grounding System`,
  ];
  const freeItems = [
    "ค่าแรงติดตั้ง ตรวจสอบ และทดสอบระบบก่อนใช้งาน",
    "อุปกรณ์ติดตามผลการผลิตไฟฟ้า (Cloud + TV/Smartphone)",
    "ออกแบบ วาง Layout + ประเมินกำลังผลิต (HelioScope)",
    "จัดทำเอกสารและขออนุญาต PEA/MEA + กกพ. (เซ็นรับรองโดยสามัญวิศวกร)",
    "ดูแลบำรุงรักษา + ล้างแผง 1 ครั้ง/ปี ตลอดประกัน 3 ปี",
  ];

  const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
  const Field = ({ label, children }) => (
    <div><label className="block text-[11px] text-[#6e6e73] mb-1">{label}</label>{children}</div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1d1d1f]">Quote Engine — สร้างใบเสนอราคา</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">เริ่มจากเลือกแผง → ระบบคิด DC/AC/อินเวอร์เตอร์ + อุปกรณ์ Atmoce ให้อัตโนมัติ</p>
      </div>

      {/* 1) เลือกแผง */}
      <div className="card p-5 mb-5">
        <div className="font-semibold text-[#1d1d1f] mb-3">1) เลือกแผง (เริ่มจากตรงนี้)</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Field label="ชื่อลูกค้า"><input className={inCls} value={customer} onChange={(e) => setCustomer(e.target.value)} /></Field>
          <Field label="ขนาดแผง (Wp)"><input type="number" className={inCls} value={panelW} onChange={(e) => setPanelW(+e.target.value || 1)} /></Field>
          <Field label="จำนวนแผง"><input type="number" className={inCls} value={panelCount} onChange={(e) => setPanelCount(+e.target.value || 1)} /></Field>
          <Field label="เฟส"><select className={inCls} value={phase} onChange={(e) => setPhase(+e.target.value)}><option value={1}>1 เฟส</option><option value={3}>3 เฟส</option></select></Field>
          <Field label="แบตเตอรี่ (kWh)"><input type="number" step="7" className={inCls} value={batteryKwh} onChange={(e) => setBatteryKwh(+e.target.value || 0)} /></Field>
          <Field label="ประกัน (ปี)"><select className={inCls} value={warranty} onChange={(e) => setWarranty(+e.target.value)}><option value={15}>15</option><option value={20}>20</option><option value={25}>25</option></select></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#1d1d1f] mt-3">
          <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} className="w-4 h-4 accent-[#F5821F]" />
          ต้องการ Backup ตอนไฟดับ (เพิ่ม Backup Box)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#f0f0f2]">
          <div className="bg-[#f5f5f7] rounded-lg p-3"><div className="text-lg font-bold text-[#1d1d1f]">{dcKwp.toFixed(2)}</div><div className="text-[11px] text-[#6e6e73]">DC kWp</div></div>
          <div className="bg-[#f5f5f7] rounded-lg p-3"><div className="text-lg font-bold text-[#1d1d1f]">{acKwac.toFixed(2)}</div><div className="text-[11px] text-[#6e6e73]">AC kWac</div></div>
          <div className="bg-[#f5f5f7] rounded-lg p-3"><div className="text-lg font-bold text-[#F5821F]">{dcac.toFixed(2)}</div><div className="text-[11px] text-[#6e6e73]">DC/AC ratio</div></div>
          <div className="bg-[#f5f5f7] rounded-lg p-3"><div className="text-lg font-bold text-[#1d1d1f]">{inv}</div><div className="text-[11px] text-[#6e6e73]">MI-1250 (ชุด)</div></div>
        </div>
      </div>

      {/* 2) BOM Atmoce + ต้นทุนส่วนเพิ่ม */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">2) อุปกรณ์ Atmoce (auto จาก Price List)</div>
          <table className="w-full text-[13px]">
            <thead><tr className="text-[#a1a1a6] text-[11px]"><th className="text-left py-1">SKU</th><th className="text-right">จำนวน</th><th className="text-right">ราคา/หน่วย</th><th className="text-right">รวม</th></tr></thead>
            <tbody>
              {bom.map((x, i) => (
                <tr key={i} className="border-b border-[#f4f4f6]"><td className="py-1.5">{x.sku}<div className="text-[10px] text-[#a1a1a6]">{x.desc}</div></td><td className="text-right">{x.q}</td><td className="text-right text-[#6e6e73]">{int(x.p)}</td><td className="text-right">{int(x.q * x.p)}</td></tr>
              ))}
              <tr className="font-semibold"><td className="py-1.5" colSpan={3}>รวมอุปกรณ์ Atmoce</td><td className="text-right text-[#F5821F]">{int(atmoceTotal)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">3) ต้นทุนส่วนเพิ่ม (แก้ได้)</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="แผงโซลาร์ ฿/W"><input type="number" step="0.1" className={inCls} value={panelBahtW} onChange={(e) => setPanelBahtW(+e.target.value || 0)} /></Field>
            <Field label="Mounting ฿/W"><input type="number" step="0.1" className={inCls} value={cMount} onChange={(e) => setCMount(+e.target.value || 0)} /></Field>
            <Field label="BOS/สาย/ท่อ/กราวด์ ฿/W"><input type="number" step="0.1" className={inCls} value={cBos} onChange={(e) => setCBos(+e.target.value || 0)} /></Field>
            <Field label="ติดตั้ง ฿/W"><input type="number" step="0.1" className={inCls} value={cInstall} onChange={(e) => setCInstall(+e.target.value || 0)} /></Field>
            <Field label="Service (บาท)"><input type="number" step="1000" className={inCls} value={service} onChange={(e) => setService(+e.target.value || 0)} /></Field>
            <Field label="Permit (บาท)"><input type="number" step="1000" className={inCls} value={permit} onChange={(e) => setPermit(+e.target.value || 0)} /></Field>
          </div>
        </div>
      </div>

      {/* 4) กำไร + ส่วนลด + สรุป */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">4) กำไร + ส่วนลด</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="กำไร (%) — ปรับได้"><input type="number" className={inCls} value={margin} onChange={(e) => setMargin(+e.target.value || 0)} /></Field>
            <Field label="ส่วนลด (บาท ก่อน VAT)"><input type="number" step="100" className={inCls} value={discount} onChange={(e) => setDiscount(+e.target.value || 0)} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#1d1d1f]">
            <input type="checkbox" checked={roundNet} onChange={(e) => setRoundNet(e.target.checked)} className="w-4 h-4 accent-[#F5821F]" />
            ปัดยอดรวมทั้งสิ้น (รวม VAT) เป็นเลขเน็ท หลักร้อย
          </label>
          <div className="mt-3 text-xs text-[#6e6e73]">ต้นทุน ฿{(totalCost / W).toFixed(2)}/W · ราคาขาย <b className="text-[#F5821F]">฿{perW.toFixed(2)}/W</b></div>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">สรุปราคา</div>
          <table className="w-full text-sm"><tbody>
            <tr className="text-[#6e6e73]"><td className="py-0.5">อุปกรณ์ Atmoce</td><td className="text-right">{int(atmoceTotal)}</td></tr>
            <tr className="text-[#6e6e73]"><td className="py-0.5">แผงโซลาร์</td><td className="text-right">{int(Math.round(panelCost))}</td></tr>
            <tr className="text-[#6e6e73]"><td className="py-0.5">Mounting + BOS + ติดตั้ง</td><td className="text-right">{int(Math.round(mounting + bos + install))}</td></tr>
            <tr className="text-[#6e6e73]"><td className="py-0.5">Service + Permit</td><td className="text-right">{int(service + permit)}</td></tr>
            <tr className="border-t border-[#eee] font-medium"><td className="py-1">ต้นทุนรวม</td><td className="text-right">{int(Math.round(totalCost))}</td></tr>
            <tr><td className="py-0.5">+ กำไร {margin}%</td><td className="text-right">{int(Math.round(priceBeforeDiscount - totalCost))}</td></tr>
            <tr className="text-[#c0392b]"><td className="py-0.5">ส่วนลดพิเศษ</td><td className="text-right">{shownDiscount > 0 ? "-" + num(shownDiscount) : "-"}</td></tr>
            <tr className="font-medium"><td className="py-1">รวมราคา (ก่อน VAT)</td><td className="text-right">{num(preVat)}</td></tr>
            <tr><td className="py-0.5">VAT 7%</td><td className="text-right">{num(vat)}</td></tr>
            <tr className="border-t border-[#1d1d1f] font-bold"><td className="py-1">รวมทั้งสิ้น</td><td className="text-right text-[#F5821F]">{int(grand)}</td></tr>
          </tbody></table>
        </div>
      </div>

      {/* เทมเพลตใบเสนอราคา */}
      <div className="font-semibold text-[#1d1d1f] mb-2">เทมเพลตใบเสนอราคา (ตัวอย่าง)</div>
      <div className="bg-white border border-[#d2d2d7] rounded-xl p-8 text-[#1d1d1f]" style={{ fontSize: 13 }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-bold text-lg tracking-wide">M POWER <span className="text-[#F5821F]">NATURE ENERGY</span></div>
            <div className="text-[11px] text-[#6e6e73] mt-1">บริษัท เอ็ม พาวเวอร์ เนเจอร์ เอเนอร์จี 168 จำกัด<br />40/456 หมู่ 4 ต.คลองโยง อ.พุทธมณฑล นครปฐม 73170<br />โทร 099-629-9355 · เลขภาษี 0735569003146</div>
          </div>
          <div className="text-right"><div className="font-bold">ใบเสนอราคา</div><div className="text-[11px] text-[#6e6e73] mt-1">สำนักงานใหญ่</div></div>
        </div>

        <div className="grid grid-cols-4 gap-3 bg-[#f5f5f7] rounded-lg p-3 mb-4 text-[12px]">
          <div><div className="text-[#6e6e73]">ขนาดระบบ</div><div className="font-semibold">{dcKwp.toFixed(2)} kWp · {phase} เฟส</div></div>
          <div><div className="text-[#6e6e73]">ผลิตไฟ/ปี</div><div className="font-semibold">{int(annualKwh)} kWh</div></div>
          <div><div className="text-[#6e6e73]">ประหยัด/ปี</div><div className="font-semibold text-[#1a7d3a]">{int(savingYr)} ฿</div></div>
          <div><div className="text-[#6e6e73]">คืนทุน</div><div className="font-semibold text-[#F5821F]">{payback} ปี</div></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3 text-[12px]">
          <div><span className="text-[#6e6e73]">ชื่อลูกค้า:</span> <b>{customer}</b></div>
          <div><span className="text-[#6e6e73]">เลขที่ใบเสนอราคา:</span> QT-2608-001</div>
          <div><span className="text-[#6e6e73]">วันที่:</span> ____________</div>
          <div><span className="text-[#6e6e73]">เงื่อนไขชำระ:</span> มัดจำ 50% / 30% / ปิดงาน</div>
        </div>

        <table className="w-full text-[12px] border-t border-b border-[#e8e8ed]">
          <thead><tr className="text-[#6e6e73] text-[11px]"><th className="text-left py-1.5">รายละเอียด</th><th className="text-center">จำนวน</th><th className="text-right">ราคา/หน่วย</th><th className="text-right">จำนวนเงิน</th></tr></thead>
          <tbody>
            <tr className="border-t border-[#f0f0f2]">
              <td className="py-2 font-medium">ค่าอุปกรณ์ระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์ ขนาด {dcKwp.toFixed(2)} kW</td>
              <td className="text-center">1 ชุด</td><td className="text-right">{num(afterDiscount)}</td><td className="text-right">{num(afterDiscount)}</td>
            </tr>
            {subItems.map((s, i) => (
              <tr key={i} className="text-[#6e6e73]"><td className="py-0.5 pl-4" colSpan={4}>{i + 1}. {s}</td></tr>
            ))}
            <tr><td className="pt-3 pb-1 font-medium text-[#F5821F]" colSpan={4}>ฟรี</td></tr>
            {freeItems.map((s, i) => (
              <tr key={i} className="text-[#6e6e73]"><td className="py-0.5 pl-4" colSpan={4}>{i + 1}. {s}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-3">
          <table className="text-[12px] w-72"><tbody>
            <tr><td className="py-0.5 text-[#6e6e73]">ราคา</td><td className="text-right">{num(priceBeforeDiscount)}</td></tr>
            <tr><td className="py-0.5 text-[#6e6e73]">ส่วนลดพิเศษ</td><td className="text-right text-[#c0392b]">{shownDiscount > 0 ? "-" + num(shownDiscount) : "-"}</td></tr>
            <tr><td className="py-0.5 text-[#6e6e73]">รวมราคา</td><td className="text-right">{num(preVat)}</td></tr>
            <tr><td className="py-0.5 text-[#6e6e73]">ภาษีมูลค่าเพิ่ม 7%</td><td className="text-right">{num(vat)}</td></tr>
            <tr className="border-t border-[#1d1d1f] font-bold"><td className="py-1">รวมราคาทั้งสิ้น</td><td className="text-right">{int(grand)}.00</td></tr>
          </tbody></table>
        </div>
        <div className="text-center text-[12px] text-[#6e6e73] mt-2 mb-4">( {bahtText(grand)} )</div>

        <div className="grid grid-cols-3 gap-4 text-center text-[11px] text-[#8593a8] pt-6">
          <div className="border-t border-[#cdd6e5] pt-2">สั่งซื้อโดย</div>
          <div className="border-t border-[#cdd6e5] pt-2">ผู้เสนอราคา</div>
          <div className="border-t border-[#cdd6e5] pt-2">(นาย ณัฏฐ์ณธรณ์ จันทรจุติกุล)<br />กรรมการผู้มีอำนาจ</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button className="bg-[#1a3c6e] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">พิมพ์ / บันทึก PDF</button>
        <span className="text-xs text-[#8593a8]">ต่อจริง: ออกเลขใบเสนอ + บันทึกลงชีต + แนบ Proposal เต็ม (เฟสถัดไป)</span>
      </div>
    </div>
  );
}
