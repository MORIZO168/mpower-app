import { impact, INSTALLED } from "@/lib/impact";
import { getSites } from "@/lib/atmoce";

export const dynamic = "force-dynamic";

function fmt(n, d = 0) { return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }

export default async function ImpactPage() {
  const im = impact(INSTALLED.kwp);
  const sites = await getSites();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-5xl mx-auto px-6 py-16">

        <div className="text-center">
          <div className="text-xs tracking-[0.14em] uppercase text-[#6e6e73] font-medium">ติดตั้งสะสมถึงวันนี้</div>
          <div className="mt-4 text-[clamp(52px,10vw,104px)] font-semibold leading-none tracking-[-0.04em] tabular-nums"
            style={{ background: "linear-gradient(92deg,#1a3c6e,#1a7d3a)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {im.mwp.toFixed(2)}<span className="text-[0.3em] font-normal text-[#6e6e73]"> เมกะวัตต์</span>
          </div>
          <p className="mt-5 text-lg text-[#6e6e73] font-light max-w-xl mx-auto">พลังงานสะอาดที่วัดผลได้จริง — จาก {fmt(INSTALLED.projects)} หลังคาที่ M Power ติดตั้ง</p>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 rounded-3xl overflow-hidden border border-[#e5e5ea] bg-[#e5e5ea] gap-px">
          {[
            { n: fmt(INSTALLED.projects), l: "หลังคาที่ติดตั้ง", c: "text-[#1a3c6e]" },
            { n: im.gwhYr.toFixed(2), l: "GWh ต่อปี", c: "" },
            { n: fmt(im.tco2Yr), l: "ตัน CO₂ / ปี ที่ลด", c: "text-[#1a7d3a]" },
            { n: fmt(im.trees), l: "ต้นไม้เทียบเท่า / ปี", c: "text-[#1a7d3a]" },
          ].map((x, i) => (
            <div key={i} className="bg-white px-6 py-9 text-center">
              <div className={`text-[clamp(30px,4vw,44px)] font-semibold tracking-[-0.03em] tabular-nums ${x.c}`}>{x.n}</div>
              <div className="text-sm text-[#6e6e73] mt-2">{x.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card label="บ้านที่จ่ายไฟได้" value={fmt(im.homes)} note="เทียบครัวเรือนไทย 4,200 kWh/ปี" color="#1a3c6e" />
          <Card label="รถยนต์ที่หายจากถนน" value={fmt(im.cars)} note="เทียบ 2.4 ตัน CO₂/คัน/ปี" />
          <Card label="ค่าไฟที่ลูกค้าประหยัด" value={`฿${(im.bahtSavedYr / 1e6).toFixed(1)}M`} note="อัตรา 4.2 บาท/kWh · ต่อปี" color="#1a7d3a" />
        </div>

        <div className="mt-16">
          <div className="text-xs tracking-[0.14em] uppercase text-[#6e6e73] font-medium">เชื่อม Atmoce Cloud</div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] mt-3 mb-1">กำลังผลิตเรียลไทม์</h2>
          <p className="text-[#6e6e73] font-light mb-6">ดึงจากอินเวอร์เตอร์ทุกไซต์ — เห็นทุกหลังคาผลิตไฟอยู่เท่าไหร่ตอนนี้</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((s) => (
              <div key={s.id} className="bg-white border border-[#e5e5ea] rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-[#6e6e73] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1a7d3a] inline-block" />{s.online ? "ออนไลน์" : "ออฟไลน์"}
                  </span>
                </div>
                <div className="text-3xl font-semibold tracking-[-0.02em] mt-3 tabular-nums">
                  {s.nowKw}<span className="text-base text-[#6e6e73] font-normal"> kW ตอนนี้</span>
                </div>
                <div className="text-sm text-[#6e6e73] mt-1">วันนี้ {s.todayKwh} kWh · ระบบ {s.kwp} kWp</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#a1a1a8] font-light mt-4">โหมดสาธิต — เมื่อได้ API token จาก Atmoce Cloud เสียบเข้าได้ทันที (ดู lib/atmoce.js)</p>
        </div>

      </div>
    </div>
  );
}

function Card({ label, value, note, color }) {
  return (
    <div className="bg-white border border-[#e5e5ea] rounded-3xl p-7">
      <div className="text-sm text-[#6e6e73] font-medium">{label}</div>
      <div className="text-[38px] font-semibold tracking-[-0.03em] mt-2 tabular-nums" style={color ? { color } : {}}>{value}</div>
      <div className="text-[13px] text-[#6e6e73] font-light mt-2">{note}</div>
    </div>
  );
}
