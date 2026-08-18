import { PageHeader, Stat, Pill } from "@/components/ui";
import { baht } from "@/lib/data";

const TXN = [
  { date: "2026-07-28", desc: "รับเงินงวด 2 · S-202607-002", cat: "รายรับงาน", amt: 88000 },
  { date: "2026-07-27", desc: "ซื้อแผง 24 แผ่น (VeroLink)", cat: "ต้นทุนของ", amt: -66000 },
  { date: "2026-07-26", desc: "จ่ายช่างซับ · S-202607-001", cat: "ค่าแรงซับ", amt: -60000 },
  { date: "2026-07-25", desc: "บัตรเครดิตกรรมการ · น้ำมัน/ทางด่วน", cat: "ค่าใช้จ่ายจิปาถะ", amt: -3200 },
  { date: "2026-07-24", desc: "รับเงินมัดจำ · S-202607-005", cat: "รายรับงาน", amt: 45000 },
];

export default function FinancePage() {
  const income = TXN.filter((t) => t.amt > 0).reduce((a, t) => a + t.amt, 0);
  const expense = TXN.filter((t) => t.amt < 0).reduce((a, t) => a - t.amt, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="การเงิน" subtitle="เงินสด · WHT · กำไรต่องาน · บัตร/เงินยืมกรรมการ"
        right={<Pill tone="mut">เดือน ก.ค. 2026</Pill>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="เงินเข้า" value={baht(income)} tone="ok" />
        <Stat label="เงินออก" value={baht(expense)} tone="bad" />
        <Stat label="กระแสเงินสดสุทธิ" value={baht(income - expense)} />
        <Stat label="กำไรเฉลี่ย/งาน" value="30%" tone="ok" sub="เตือนถ้าต่ำกว่าเป้า" />
      </div>

      <div className="card p-5">
        <div className="flex items-center mb-3">
          <div className="font-semibold text-[#1a3c6e]">รายการล่าสุด</div>
          <span className="ml-auto text-xs text-[#8593a8]">ดึงจากชีตบัญชีเดิม + สลิป/OCR (เฟสถัดไป)</span>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[#5a6a86] border-b border-[#e6ebf3]">
            <th className="py-2">วันที่</th><th>รายการ</th><th>หมวด</th><th className="text-right">จำนวน</th></tr></thead>
          <tbody>
            {TXN.map((t, i) => (
              <tr key={i} className="border-b border-[#f0f3f8]">
                <td className="py-2 text-[#8593a8]">{t.date}</td>
                <td>{t.desc}</td>
                <td><Pill tone="mut">{t.cat}</Pill></td>
                <td className={`text-right font-medium ${t.amt > 0 ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{t.amt > 0 ? "+" : "−"}{baht(Math.abs(t.amt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="card p-5"><div className="font-semibold text-[#1a3c6e] mb-1">บัตรเครดิตกรรมการ</div><p className="text-sm text-[#5a6a86]">แยกหมวด + กระทบยอด statement อัตโนมัติ</p></div>
        <div className="card p-5"><div className="font-semibold text-[#1a3c6e] mb-1">เงินยืม/คืนกรรมการ</div><p className="text-sm text-[#5a6a86]">ledger เจ้าหนี้/ลูกหนี้กรรมการ</p></div>
        <div className="card p-5"><div className="font-semibold text-[#1a3c6e] mb-1">ปิดเดือน</div><p className="text-sm text-[#5a6a86]">สรุป P&L ต่องาน + export PDF/CSV</p></div>
      </div>
    </div>
  );
}
