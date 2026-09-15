// Server component — บัญชี/การเงินจริง อ่าน sales/purchases/payment_schedule จาก Supabase
import { PageHeader, Pill } from "@/components/ui";
import { isConfigured, getRows } from "@/lib/db";
import FinanceEntry from "@/components/FinanceEntry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const baht = (n) => "฿" + Math.round(Number(n) || 0).toLocaleString("th-TH");
const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const isPaid = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "paid", "ใช่", "จ่ายแล้ว", "ชำระแล้ว", "รับแล้ว"].includes(s);
};
const pct = (n) => (isFinite(n) ? (n * 100).toFixed(1) : "0") + "%";
const ym = (d) => String(d ?? "").slice(0, 7);

function Kpi({ label, value, sub, tone }) {
  const c = tone === "ok" ? "text-[#1a7d3a]" : tone === "orange" ? "text-[#F5821F]" : tone === "bad" ? "text-[#c0392b]" : "text-[#1d1d1f]";
  return (
    <div className="card p-4">
      <div className={`text-2xl font-bold ${c}`}>{value}</div>
      <div className="text-xs text-[#6e6e73] mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-[#a1a1a6] mt-1">{sub}</div>}
    </div>
  );
}

async function load() {
  try {
    const [s, p, sch] = await Promise.all([
      getRows("Sales"), getRows("Purchases"), getRows("Payment_Schedule"),
    ]);
    return { sales: s.rows, purchases: p.rows, schedule: sch.rows, live: true, err: "" };
  } catch (e) {
    return { sales: [], purchases: [], schedule: [], live: false, err: String(e).slice(0, 160) };
  }
}

export default async function FinancePage() {
  const { sales, purchases, schedule, live, err } = await load();

  // ---- รายเดือน ----
  const months = {};
  const bucket = (m) => (months[m] = months[m] || { rev: 0, cost: 0, vatOut: 0, vatIn: 0 });
  sales.forEach((r) => { const b = bucket(ym(r.Date)); b.rev += num(r.Amount_ExVAT); b.vatOut += num(r["VAT_7%"]); });
  purchases.forEach((r) => { const b = bucket(ym(r.Date)); b.cost += num(r.Amount_ExVAT); b.vatIn += num(r["VAT_7%"]); });
  const monthRows = Object.entries(months).filter(([m]) => m).sort((a, b) => a[0].localeCompare(b[0]));

  const totRev = sales.reduce((s, r) => s + num(r.Amount_ExVAT), 0);
  const totCost = purchases.reduce((s, r) => s + num(r.Amount_ExVAT), 0);
  const gp = totRev - totCost;
  const margin = totRev ? gp / totRev : 0;
  const vatOut = sales.reduce((s, r) => s + num(r["VAT_7%"]), 0);
  const vatIn = purchases.reduce((s, r) => s + num(r["VAT_7%"]), 0);
  const vatPay = vatOut - vatIn;
  const maxRev = Math.max(1, ...monthRows.map(([, v]) => v.rev));

  // ---- ลูกหนี้ (AR) / เจ้าหนี้ (AP) ----
  const ar = sales.filter((r) => !isPaid(r.Paid)).reduce((s, r) => s + (num(r.Amount_IncVAT) || num(r.Amount_ExVAT) * 1.07), 0);
  const ap = purchases.filter((r) => !isPaid(r.Paid)).reduce((s, r) => s + (num(r.Amount_IncVAT) || num(r.Amount_ExVAT) * 1.07), 0);
  const dueUnpaid = schedule.filter((r) => !isPaid(r.Paid));
  const dueSum = dueUnpaid.reduce((s, r) => s + num(r.Amount_THB), 0);

  // ---- กำไรต่องาน ----
  const jobMap = {};
  sales.forEach((r) => { const j = r.Job_ID || "-"; (jobMap[j] = jobMap[j] || { job: j, customer: r.Customer_Name || "", rev: 0, cost: 0 }).rev += num(r.Amount_ExVAT); });
  purchases.forEach((r) => { const j = r.Job_ID || "-"; (jobMap[j] = jobMap[j] || { job: j, customer: "", rev: 0, cost: 0 }).cost += num(r.Amount_ExVAT); });
  const jobs = Object.values(jobMap).filter((j) => j.job !== "-").sort((a, b) => (b.rev - b.cost) - (a.rev - a.cost));

  const empty = sales.length === 0 && purchases.length === 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="การเงิน — กำไรขาดทุน (P&L)"
        subtitle="รายรับ-รายจ่าย · กำไรขั้นต้น · VAT ซื้อ-ขาย · ลูกหนี้/เจ้าหนี้ · กำไรต่องาน"
        right={live ? <Pill tone="ok">ข้อมูลจริง</Pill> : <Pill tone="bad">ต่อ DB ไม่ได้</Pill>}
      />

      {live && <FinanceEntry />}
      {!live && <div className="card p-4 mb-4 text-sm text-[#a13b3b] bg-[#fdf2f2]">ดึงข้อมูลไม่สำเร็จ — {err}</div>}
      {live && empty && <div className="card p-4 mb-4 text-sm text-[#6e6e73]">ยังไม่มีรายการขาย/ซื้อในระบบ — เริ่มบันทึกได้ที่หน้าขาย/จัดซื้อ แล้วตัวเลขจะขึ้นที่นี่</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi label="รายรับรวม (ก่อน VAT)" value={baht(totRev)} />
        <Kpi label="ต้นทุนรวม" value={baht(totCost)} />
        <Kpi label="กำไรขั้นต้น" value={baht(gp)} tone="ok" />
        <Kpi label="อัตรากำไรขั้นต้น" value={pct(margin)} tone="orange" sub="เป้า ≥30%" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">รายรับ-รายจ่ายรายเดือน</div>
          {monthRows.length === 0 ? (
            <div className="text-sm text-[#a1a1a6]">ยังไม่มีข้อมูล</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-[#a1a1a6] text-xs border-b border-[#eee]">
                <th className="text-left py-1.5">เดือน</th><th className="text-right">รายรับ</th><th className="text-right">ต้นทุน</th><th className="text-right">กำไร</th><th className="text-right">มาร์จิน</th>
              </tr></thead>
              <tbody>
                {monthRows.map(([m, v]) => {
                  const g = v.rev - v.cost;
                  return (
                    <tr key={m} className="border-b border-[#f4f4f6]">
                      <td className="py-2">{m}</td>
                      <td className="text-right">{Math.round(v.rev).toLocaleString()}</td>
                      <td className="text-right text-[#6e6e73]">{Math.round(v.cost).toLocaleString()}</td>
                      <td className="text-right font-medium text-[#1a7d3a]">{Math.round(g).toLocaleString()}</td>
                      <td className="text-right text-[#F5821F]">{pct(v.rev ? g / v.rev : 0)}</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold">
                  <td className="py-2">รวม</td>
                  <td className="text-right">{Math.round(totRev).toLocaleString()}</td>
                  <td className="text-right">{Math.round(totCost).toLocaleString()}</td>
                  <td className="text-right text-[#1a7d3a]">{Math.round(gp).toLocaleString()}</td>
                  <td className="text-right text-[#F5821F]">{pct(margin)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">รายรับรายเดือน (กราฟ)</div>
          {monthRows.length === 0 ? (
            <div className="text-sm text-[#a1a1a6]">ยังไม่มีข้อมูล</div>
          ) : (
            <div className="space-y-2.5">
              {monthRows.map(([m, v]) => (
                <div key={m} className="flex items-center gap-2 text-xs">
                  <span className="w-16 text-[#6e6e73]">{m}</span>
                  <div className="flex-1 h-4 rounded bg-[#f0f0f2] overflow-hidden"><div className="h-full bg-[#F5821F]" style={{ width: (v.rev / maxRev) * 100 + "%" }} /></div>
                  <span className="w-16 text-right text-[#1d1d1f]">{Math.round(v.rev / 1000)}k</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi label="ลูกหนี้ค้างรับ (AR)" value={baht(ar)} tone="orange" sub="บิลขายที่ยังไม่รับเงิน" />
        <Kpi label="เจ้าหนี้ค้างจ่าย (AP)" value={baht(ap)} tone="bad" sub="บิลซื้อที่ยังไม่จ่าย" />
        <Kpi label="งวดที่ยังไม่เก็บ" value={baht(dueSum)} sub={`${dueUnpaid.length} งวด (payment schedule)`} />
        <Kpi label="เงินสดสุทธิคงค้าง" value={baht(ar - ap)} tone={ar - ap >= 0 ? "ok" : "bad"} sub="AR − AP" />
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-3">กำไรต่องาน (ขาย vs ต้นทุน)</div>
        {jobs.length === 0 ? (
          <div className="text-sm text-[#a1a1a6]">ยังไม่มีรายการที่ผูก Job_ID</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-[#a1a1a6] text-xs border-b border-[#eee]">
              <th className="text-left py-1.5">Job</th><th className="text-left">ลูกค้า</th><th className="text-right">ขาย</th><th className="text-right">ต้นทุน</th><th className="text-right">กำไร</th><th className="text-right">มาร์จิน</th>
            </tr></thead>
            <tbody>
              {jobs.map((j) => {
                const profit = j.rev - j.cost;
                return (
                  <tr key={j.job} className="border-b border-[#f4f4f6]">
                    <td className="py-2 text-[#6e6e73]">{j.job}</td>
                    <td className="truncate max-w-[200px]">{j.customer}</td>
                    <td className="text-right">{Math.round(j.rev).toLocaleString()}</td>
                    <td className="text-right text-[#6e6e73]">{Math.round(j.cost).toLocaleString()}</td>
                    <td className="text-right font-medium text-[#1a7d3a]">{Math.round(profit).toLocaleString()}</td>
                    <td className="text-right text-[#F5821F]">{pct(j.rev ? profit / j.rev : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="VAT ขาย (output)" value={baht(vatOut)} sub="เก็บจากลูกค้า" />
        <Kpi label="VAT ซื้อ (input)" value={baht(vatIn)} sub="จ่ายตอนซื้อของ" />
        <Kpi label="VAT ต้องนำส่ง" value={baht(vatPay)} tone="orange" sub="output − input" />
      </div>

      <p className="text-[11px] text-[#a1a1a6] mt-4">* ดึงจากตาราง Sales / Purchases / Payment_Schedule จริง · VAT 7% · "จ่ายแล้ว/รับแล้ว" นับจากช่อง Paid</p>
    </div>
  );
}
