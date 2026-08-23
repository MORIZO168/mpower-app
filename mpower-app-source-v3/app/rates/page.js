"use client";
import { useState } from "react";
import { RATE_CATEGORIES, baht } from "@/lib/rates";

// ต้นทุนอ้างอิง 5 kWp: แผง 8 แผง, รายการอื่นอย่างละ 1
const refQty = (k) => (k === "panel_650" ? 8 : 1);

export default function RatesPage() {
  const init = {};
  RATE_CATEGORIES.forEach((c) => c.items.forEach((i) => (init[i.k] = i.v)));
  const [vals, setVals] = useState(init);
  const set = (k, v) => setVals((s) => ({ ...s, [k]: +v || 0 }));

  const catTotal = (c) => c.items.reduce((s, i) => s + vals[i.k] * refQty(i.k), 0);
  const grand = RATE_CATEGORIES.reduce((s, c) => s + catTotal(c), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ตั้งค่าราคา (Rate Master)</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">เรตมาตรฐานทุกหมวด · แก้ได้เอง · ป้อนเป็นต้นทุนใน Quote Engine</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-[#6e6e73]">ต้นทุนอ้างอิง 5 kWp</div>
          <div className="text-2xl font-bold text-[#F5821F]">{baht(grand)}</div>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {RATE_CATEGORIES.map((c) => (
          <div key={c.key} className="card p-5">
            <div className="flex items-center mb-3">
              <div className="font-semibold text-[#1d1d1f]">{c.name}</div>
              <div className="ml-auto text-sm text-[#6e6e73]">รวม <b className="text-[#1d1d1f]">{baht(catTotal(c))}</b></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-[#a1a1a6] text-xs border-b border-[#eee]">
                <th className="text-left py-1.5">รายการ</th><th className="text-left w-20">หน่วย</th><th className="text-right w-32">ราคา</th>
              </tr></thead>
              <tbody>
                {c.items.map((i) => (
                  <tr key={i.k} className="border-b border-[#f4f4f6]">
                    <td className="py-2">{i.label}{i.note && <div className="text-[11px] text-[#a1a1a6]">{i.note}</div>}</td>
                    <td className="text-[#6e6e73]">{i.unit}</td>
                    <td className="text-right">
                      <input type="number" value={vals[i.k]} onChange={(e) => set(i.k, e.target.value)}
                        className="w-28 px-2 py-1 border border-[#d2d2d7] rounded-lg text-sm text-right bg-white" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button className="bg-[#1a3c6e] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">บันทึกเรต</button>
        <span className="text-xs text-[#8593a8]">เฟสถัดไป: บันทึกลง Google Sheets แท็บ Rates + ให้ Quote ดึงไปใช้อัตโนมัติ</span>
      </div>
    </div>
  );
}
