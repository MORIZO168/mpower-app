import { PageHeader, Pill } from "@/components/ui";
import { PROJECTS, baht } from "@/lib/projects";

// mock รายเดือน (ต่อ Google Sheets แท็บ Sales/Purchases ภายหลัง)
const MONTHS = [
  { m: "มี.ค. 69", rev: 520000, cost: 375000 },
  { m: "เม.ย. 69", rev: 680000, cost: 486000 },
  { m: "พ.ค. 69", rev: 445000, cost: 322000 },
  { m: "มิ.ย. 69", rev: 795000, cost: 561000 },
  { m: "ก.ค. 69", rev: 610000, cost: 430000 },
  { m: "ส.ค. 69", rev: 738000, cost: 519000 },
];

const COST_BREAKDOWN = [
  { k: "แผงโซลาร์", pct: 38 },
  { k: "อินเวอร์เตอร์ (Atmoce / Sigenergy)", pct: 22 },
  { k: "ค่าแรงทีมซับ", pct: 20 },
  { k: "BOS (ราง / สาย / ท่อ / กราวด์)", pct: 10 },
  { k: "Permit / Service", pct: 6 },
  { k: "ขนส่ง / อื่นๆ", pct: 4 },
];

const VAT = 0.07;
const pct = (n) => (n * 100).toFixed(1) + "%";

function Kpi({ label, value, sub, tone }) {
  const c = tone === "ok" ? "text-[#1a7d3a]" : tone === "orange" ? "text-[#F5821F]" : "text-[#1d1d1f]";
  return (
    <div className="card p-4">
      <div className={`text-2xl font-bold ${c}`}>{value}</div>
      <div className="text-xs text-[#6e6e73] mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-[#a1a1a6] mt-1">{sub}</div>}
    </div>
  );
}

export default function FinancePage() {
  const totRev = MONTHS.reduce((s, x) => s + x.rev, 0);
  const totCost = MONTHS.reduce((s, x) => s + x.cost, 0);
  const gp = totRev - totCost;
  const margin = gp / totRev;
  const outVat = Math.round(totRev * VAT);
  const inVat = Math.round(totCost * VAT);
  const vatPay = outVat - inVat;
  const maxRev = Math.max(...MONTHS.map((x) => x.rev));

  const jobs = PROJECTS.map((p) => {
    const cost = p.detail.boq.cost;
    return { name: p.customer, type: p.jobType, sell: p.value, cost, profit: p.value - cost };
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="การเงิน — กำไรขาดทุน (P&L)" subtitle="รายรับ-รายจ่าย · กำไรขั้นต้น · VAT ซื้อ-ขาย · กำไรจริงต่องาน"
        right={<Pill tone="mut">ข้อมูลตัวอย่าง · 6 เดือน</Pill>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi label="รายรับรวม (ก่อน VAT)" value={baht(totRev)} />
        <Kpi label="ต้นทุนรวม" value={baht(totCost)} />
        <Kpi label="กำไรขั้นต้น" value={baht(gp)} tone="ok" />
        <Kpi label="อัตรากำไรขั้นต้น" value={pct(margin)} tone="orange" sub="เป้า ≥30%" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">รายรับ-รายจ่ายรายเดือน</div>
          <table className="w-full text-sm">
            <thead><tr className="text-[#a1a1a6] text-xs border-b border-[#eee]">
              <th className="text-left py-1.5">เดือน</th><th className="text-right">รายรับ</th><th className="text-right">ต้นทุน</th><th className="text-right">กำไร</th><th className="text-right">มาร์จิน</th>
            </tr></thead>
            <tbody>
              {MONTHS.map((x) => {
                const g = x.rev - x.cost;
                return (
                  <tr key={x.m} className="border-b border-[#f4f4f6]">
                    <td className="py-2">{x.m}</td>
                    <td className="text-right">{x.rev.toLocaleString()}</td>
                    <td className="text-right text-[#6e6e73]">{x.cost.toLocaleString()}</td>
                    <td className="text-right font-medium text-[#1a7d3a]">{g.toLocaleString()}</td>
                    <td className="text-right text-[#F5821F]">{pct(g / x.rev)}</td>
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <td className="py-2">รวม</td>
                <td className="text-right">{totRev.toLocaleString()}</td>
                <td className="text-right">{totCost.toLocaleString()}</td>
                <td className="text-right text-[#1a7d3a]">{gp.toLocaleString()}</td>
                <td className="text-right text-[#F5821F]">{pct(margin)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">รายรับรายเดือน (กราฟ)</div>
          <div className="space-y-2.5 mb-5">
            {MONTHS.map((x) => (
              <div key={x.m} className="flex items-center gap-2 text-xs">
                <span className="w-14 text-[#6e6e73]">{x.m}</span>
                <div className="flex-1 h-4 rounded bg-[#f0f0f2] overflow-hidden"><div className="h-full bg-[#F5821F]" style={{ width: (x.rev / maxRev) * 100 + "%" }} /></div>
                <span className="w-16 text-right text-[#1d1d1f]">{Math.round(x.rev / 1000)}k</span>
              </div>
            ))}
          </div>
          <div className="font-semibold text-[#1d1d1f] mb-2">สัดส่วนต้นทุน</div>
          <div className="space-y-1.5">
            {COST_BREAKDOWN.map((c) => (
              <div key={c.k} className="flex items-center gap-2 text-xs">
                <span className="flex-1 text-[#6e6e73]">{c.k}</span>
                <div className="w-24 h-2 rounded-full bg-[#f0f0f2] overflow-hidden"><div className="h-full bg-[#1d1d1f]" style={{ width: c.pct + "%" }} /></div>
                <span className="w-9 text-right">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-3">กำไรจริงต่องาน (ขาย vs ต้นทุน)</div>
        <table className="w-full text-sm">
          <thead><tr className="text-[#a1a1a6] text-xs border-b border-[#eee]">
            <th className="text-left py-1.5">งาน</th><th className="text-left">ประเภท</th><th className="text-right">ขาย</th><th className="text-right">ต้นทุน</th><th className="text-right">กำไร</th><th className="text-right">มาร์จิน</th>
          </tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.name} className="border-b border-[#f4f4f6]">
                <td className="py-2 truncate max-w-[200px]">{j.name}</td>
                <td><span className={`pill pill-${j.type === "Subcontract" ? "warn" : "ok"}`}>{j.type === "Subcontract" ? "รับซับ" : "EPC"}</span></td>
                <td className="text-right">{j.sell.toLocaleString()}</td>
                <td className="text-right text-[#6e6e73]">{j.cost.toLocaleString()}</td>
                <td className="text-right font-medium text-[#1a7d3a]">{j.profit.toLocaleString()}</td>
                <td className="text-right text-[#F5821F]">{pct(j.profit / j.sell)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="VAT ขาย (output)" value={baht(outVat)} sub="เก็บจากลูกค้า" />
        <Kpi label="VAT ซื้อ (input)" value={baht(inVat)} sub="จ่ายตอนซื้อของ" />
        <Kpi label="VAT ต้องนำส่ง" value={baht(vatPay)} tone="orange" sub="output − input" />
      </div>

      <p className="text-[11px] text-[#a1a1a6] mt-4">* ตัวเลขเป็นข้อมูลตัวอย่าง · เมื่อต่อ Google Sheets จะดึงจากแท็บ Sales / Purchases จริง (กำไรฐาน 30% · VAT 7% ตามสูตร SRP)</p>
    </div>
  );
}
