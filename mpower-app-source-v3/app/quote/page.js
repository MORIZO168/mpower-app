"use client";
import { useState } from "react";

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
  const [kwp, setKwp] = useState(19.95);
  const [phase, setPhase] = useState(3);
  const [panelW, setPanelW] = useState(665);
  // ต้นทุนต่อวัตต์ (แก้ได้)
  const [cPanel, setCPanel] = useState(5.5);
  const [cInv, setCInv] = useState(3.8);
  const [cBos, setCBos] = useState(4.0);
  const [cLabor, setCLabor] = useState(4.55);
  const [margin, setMargin] = useState(30);   // กำหนดกำไรเองได้
  const [discount, setDiscount] = useState(0); // ส่วนลด (บาท ก่อน VAT)
  const [roundNet, setRoundNet] = useState(true);

  const W = kwp * 1000;
  const panels = Math.ceil(W / panelW);
  const inverters = Math.ceil(panels / 2);
  const items = [
    { k: "แผงโซลาร์เซลล์", v: cPanel * W },
    { k: "Micro Inverter (Atmoce MI-1250)", v: cInv * W },
    { k: "Combiner + Balance of System", v: cBos * W },
    { k: "ค่าติดตั้ง / Permit / Service", v: cLabor * W },
  ];
  const totalCost = items.reduce((s, x) => s + x.v, 0);
  const priceBeforeDiscount = totalCost * (1 + margin / 100);   // ราคาขายก่อน VAT (ก่อนส่วนลด)
  const afterDiscount = priceBeforeDiscount - discount;         // รวมราคา (ก่อน VAT)

  let preVat, vat, grand, shownDiscount;
  if (roundNet) {
    // ปัดยอดรวมทั้งสิ้น (รวม VAT) ให้เป็นเลขกลมหลักร้อย แล้วถอดกลับ
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
  const profit = preVat - totalCost;
  const marginActual = preVat > 0 ? (profit / preVat) * 100 : 0;
  const perW = grand / W;

  // Proposal (จาก Peak)
  const annualKwh = Math.round(kwp * 1450);
  const savingYr = Math.round(annualKwh * 4.2);
  const payback = (grand / savingYr).toFixed(1);

  const combiner = phase === 3 ? "Atmoce Combiner MC100T" : "Atmoce Combiner MC100";
  const subItems = [
    `แผงโซล่าเซลล์ (PV) "Aiko Solar" ${panelW}W จำนวน ${panels} แผง`,
    `Atmoce Micro inverter 1250w ${inverters} ชุด`,
    combiner,
    `"Antai" PV Mounting Structure + Inverter Support`,
    `"Local" DC/AC Combiner Box`,
    `"Local" AC DC Cable and Raceway & Grounding System`,
  ];
  const freeItems = [
    "ค่าแรงติดตั้ง ตรวจสอบ และทดสอบระบบก่อนใช้งาน",
    "อุปกรณ์ติดตามผลและแสดงผลการผลิตไฟฟ้า (Cloud + TV/Smartphone)",
    "ออกแบบ วาง Layout + ประเมินกำลังผลิตด้วย HelioScope",
    "จัดทำเอกสารและขออนุญาตการไฟฟ้า PEA/MEA (เซ็นรับรองโดยสามัญวิศวกร)",
    "จัดทำเอกสารและขออนุญาต กกพ.",
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
        <p className="text-sm text-[#6e6e73] mt-0.5">คิดจาก Peak (kWp) · กำหนดกำไรเองได้ · ใส่ส่วนลด · ยอดรวม VAT ปัดเป็นเลขเน็ท</p>
      </div>

      {/* ==== แผงคำนวณ ==== */}
      <div className="card p-5 mb-5">
        <div className="font-semibold text-[#1d1d1f] mb-3">1) ข้อมูล + ต้นทุน</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Field label="ชื่อลูกค้า"><input className={inCls} value={customer} onChange={(e) => setCustomer(e.target.value)} /></Field>
          <Field label="ขนาด (kWp DC)"><input type="number" step="0.01" className={inCls} value={kwp} onChange={(e) => setKwp(+e.target.value || 0)} /></Field>
          <Field label="วัตต์/แผง"><input type="number" className={inCls} value={panelW} onChange={(e) => setPanelW(+e.target.value || 1)} /></Field>
          <Field label="เฟส"><select className={inCls} value={phase} onChange={(e) => setPhase(+e.target.value)}><option value={1}>1 เฟส</option><option value={3}>3 เฟส</option></select></Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="แผง ฿/W"><input type="number" step="0.1" className={inCls} value={cPanel} onChange={(e) => setCPanel(+e.target.value || 0)} /></Field>
          <Field label="อินเวอร์เตอร์ ฿/W"><input type="number" step="0.1" className={inCls} value={cInv} onChange={(e) => setCInv(+e.target.value || 0)} /></Field>
          <Field label="BOS/Combiner ฿/W"><input type="number" step="0.1" className={inCls} value={cBos} onChange={(e) => setCBos(+e.target.value || 0)} /></Field>
          <Field label="ติดตั้ง/Permit ฿/W"><input type="number" step="0.1" className={inCls} value={cLabor} onChange={(e) => setCLabor(+e.target.value || 0)} /></Field>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">2) กำไร + ส่วนลด</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label={`กำไร (%) — ปรับได้`}><input type="number" step="1" className={inCls} value={margin} onChange={(e) => setMargin(+e.target.value || 0)} /></Field>
            <Field label="ส่วนลด (บาท ก่อน VAT)"><input type="number" step="100" className={inCls} value={discount} onChange={(e) => setDiscount(+e.target.value || 0)} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#1d1d1f]">
            <input type="checkbox" checked={roundNet} onChange={(e) => setRoundNet(e.target.checked)} className="w-4 h-4 accent-[#F5821F]" />
            ปัดยอดรวมทั้งสิ้น (รวม VAT) เป็นเลขเน็ท หลักร้อย
          </label>
          <div className="mt-3 text-xs text-[#6e6e73]">แผง {panels} แผง · อินเวอร์เตอร์ {inverters} ชุด · กำไรจริง <b className="text-[#F5821F]">{marginActual.toFixed(1)}%</b> · ฿{perW.toFixed(2)}/W</div>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">3) สรุปราคา</div>
          <table className="w-full text-sm">
            <tbody>
              {items.map((x) => (
                <tr key={x.k} className="text-[#6e6e73]"><td className="py-0.5">{x.k}</td><td className="text-right">{int(Math.round(x.v))}</td></tr>
              ))}
              <tr className="border-t border-[#eee] font-medium"><td className="py-1">ต้นทุนรวม</td><td className="text-right">{int(Math.round(totalCost))}</td></tr>
              <tr><td className="py-0.5">+ กำไร {margin}%</td><td className="text-right">{int(Math.round(priceBeforeDiscount - totalCost))}</td></tr>
              <tr><td className="py-0.5">ราคา (ก่อนส่วนลด)</td><td className="text-right">{num(priceBeforeDiscount)}</td></tr>
              <tr className="text-[#c0392b]"><td className="py-0.5">ส่วนลดพิเศษ</td><td className="text-right">{shownDiscount > 0 ? "-" + num(shownDiscount) : "-"}</td></tr>
              <tr className="font-medium"><td className="py-1">รวมราคา (ก่อน VAT)</td><td className="text-right">{num(preVat)}</td></tr>
              <tr><td className="py-0.5">VAT 7%</td><td className="text-right">{num(vat)}</td></tr>
              <tr className="border-t border-[#1d1d1f] font-bold text-[#1d1d1f]"><td className="py-1">รวมทั้งสิ้น</td><td className="text-right text-[#F5821F]">{int(grand)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ==== เทมเพลตใบเสนอราคา ==== */}
      <div className="font-semibold text-[#1d1d1f] mb-2">เทมเพลตใบเสนอราคา (ตัวอย่าง)</div>
      <div className="bg-white border border-[#d2d2d7] rounded-xl p-8 text-[#1d1d1f]" style={{ fontSize: 13 }}>
        {/* Proposal / Executive summary */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-bold text-lg tracking-wide">M POWER <span className="text-[#F5821F]">NATURE ENERGY</span></div>
            <div className="text-[11px] text-[#6e6e73] mt-1">บริษัท เอ็ม พาวเวอร์ เนเจอร์ เอเนอร์จี 168 จำกัด<br />40/456 หมู่ 4 ต.คลองโยง อ.พุทธมณฑล นครปฐม 73170<br />โทร 099-629-9355 · เลขภาษี 0735569003146</div>
          </div>
          <div className="text-right"><div className="font-bold">ใบเสนอราคา</div><div className="text-[11px] text-[#6e6e73] mt-1">สำนักงานใหญ่</div></div>
        </div>

        <div className="grid grid-cols-4 gap-3 bg-[#f5f5f7] rounded-lg p-3 mb-4 text-[12px]">
          <div><div className="text-[#6e6e73]">ขนาดระบบ</div><div className="font-semibold">{kwp} kWp · {phase} เฟส</div></div>
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
              <td className="py-2 font-medium">ค่าอุปกรณ์ระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์ ขนาด {kwp} kW</td>
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
          <table className="text-[12px] w-72">
            <tbody>
              <tr><td className="py-0.5 text-[#6e6e73]">ราคา</td><td className="text-right">{num(priceBeforeDiscount)}</td></tr>
              <tr><td className="py-0.5 text-[#6e6e73]">ส่วนลดพิเศษ</td><td className="text-right text-[#c0392b]">{shownDiscount > 0 ? "-" + num(shownDiscount) : "-"}</td></tr>
              <tr><td className="py-0.5 text-[#6e6e73]">รวมราคา</td><td className="text-right">{num(preVat)}</td></tr>
              <tr><td className="py-0.5 text-[#6e6e73]">ภาษีมูลค่าเพิ่ม 7%</td><td className="text-right">{num(vat)}</td></tr>
              <tr className="border-t border-[#1d1d1f] font-bold"><td className="py-1">รวมราคาทั้งสิ้น</td><td className="text-right">{int(grand)}.00</td></tr>
            </tbody>
          </table>
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
