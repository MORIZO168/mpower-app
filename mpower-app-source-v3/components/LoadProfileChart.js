"use client";
import { productionCurve } from "@/lib/loadprofile";

// กราฟ Load Profile กลาง — ใช้ร่วมกันทุกหน้า (บูธ/Pre-qualify/ใบเสนอ/สำรวจ)
// overlay: เส้นการผลิตรูประฆัง (โค้งแดด) ของแพคเกจ + การใช้ไฟรายชั่วโมงของลูกค้า
export default function LoadProfileChart({ hours = [], kwp = 0, height = 150, showLegend = true }) {
  const cons = hours.length === 24 ? hours : new Array(24).fill(0);
  const prod = productionCurve(kwp);
  const W = 480, H = height;
  const max = Math.max(0.001, ...cons, ...prod);
  const x = (i) => (i / 23) * W;
  const y = (v) => H - (v / max) * H;

  const areaPath = (arr) => {
    let d = "M " + x(0) + " " + H;
    for (let i = 0; i < 24; i++) d += " L " + x(i).toFixed(1) + " " + y(arr[i]).toFixed(1);
    d += " L " + x(23) + " " + H + " Z";
    return d;
  };
  const linePath = (arr) => {
    let d = "M " + x(0).toFixed(1) + " " + y(arr[0]).toFixed(1);
    for (let i = 1; i < 24; i++) d += " L " + x(i).toFixed(1) + " " + y(arr[i]).toFixed(1);
    return d;
  };

  const ticks = [0, 6, 12, 18, 23];

  return (
    <div>
      <svg viewBox={"0 0 " + W + " " + H} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
        <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="#e8e8ed" strokeWidth="1" />
        <path d={areaPath(prod)} fill="#F5821F" fillOpacity="0.18" />
        <path d={linePath(prod)} fill="none" stroke="#F5821F" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={areaPath(cons)} fill="#1d1d1f" fillOpacity="0.08" />
        <path d={linePath(cons)} fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[9px] text-[#a1a1a6] mt-1 px-0.5">
        {ticks.map((t) => <span key={t}>{t}:00</span>)}
      </div>
      {showLegend && (
        <div className="flex items-center gap-4 mt-2 text-[12px]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-[#F5821F]" /> ผลิตจากแดด</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-[#1d1d1f]" /> การใช้ไฟของคุณ</span>
        </div>
      )}
    </div>
  );
}
