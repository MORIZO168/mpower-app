import { PageHeader, Pill } from "@/components/ui";
import { pricing } from "@/lib/data";

const JOB = { id: "S-202607-004", customer: "หจก. รุ่งเรืองพานิช", addr: "ต.บางพลี อ.บางพลี จ.สมุทรปราการ", kw: 10, inverter: "Atmoce 10kW", meter: "PEA · 3 เฟส 15(45)A" };

const DOCS = [
  "แบบคำขอเชื่อมต่อ/ขนานไฟ (PEA)",
  "แผนภาพเส้นเดียว (Single Line Diagram)",
  "แคตตาล็อก/ใบรับรองอินเวอร์เตอร์ (มี certificate ตามที่ กฟภ. รับรอง)",
  "สเปกแผงโซลาร์",
  "สำเนาบัตร ปชช. / ทะเบียนบ้าน / หนังสือรับรองนิติบุคคล",
  "ผังการติดตั้ง + ภาพถ่าย",
  "หนังสือรับรองวิศวกร (กว.) ลงนาม",
];

export default function PeaPage() {
  const p = pricing(JOB.kw);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="ขอขนานไฟ (PEA)" subtitle="รวมชุดเอกสารขอเชื่อมต่อระบบ หลังติดตั้งเสร็จ"
        right={<Pill tone="mut">งาน {JOB.id}</Pill>} />

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1a3c6e] mb-3">สรุปคำขอ (ดึงจากข้อมูลงานอัตโนมัติ)</div>
        <table className="w-full text-sm">
          <tbody>
            <Row k="ผู้ขอ" v={JOB.customer} />
            <Row k="สถานที่ติดตั้ง" v={JOB.addr} />
            <Row k="ขนาดระบบ" v={`${JOB.kw} kWp · ${p.panels} แผง`} />
            <Row k="อินเวอร์เตอร์" v={`${JOB.inverter} (on-grid)`} />
            <Row k="จุดเชื่อมต่อ / มิเตอร์" v={JOB.meter} />
            <Row k="ประเภทการขนาน" v="ระบบผลิตไฟฟ้าเชื่อมต่อโครงข่าย (ไม่จ่ายไฟย้อน/ตามเงื่อนไข)" />
          </tbody>
        </table>
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1a3c6e] mb-3">เอกสารที่ต้องแนบ</div>
        <div className="space-y-2">
          {DOCS.map((d, i) => (
            <label key={i} className="flex items-center gap-3 text-sm">
              <input type="checkbox" defaultChecked={i < 5} className="w-4 h-4 accent-[#1a3c6e]" />
              <span>{d}</span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-[#8593a8] mt-3">ระบบเช็กว่าครบไหมก่อนยื่น · SLD สร้างจากสเปกที่ออกแบบไว้</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-[#1a3c6e] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">รวมชุดเอกสาร PDF</button>
        <span className="text-xs text-[#8593a8]">สร้างไฟล์รวม + แบบฟอร์มกรอกอัตโนมัติ (ต่อจริงเฟสถัดไป)</span>
      </div>
    </div>
  );
}
function Row({ k, v }) {
  return <tr className="border-b border-[#f0f3f8]"><td className="py-2 text-[#5a6a86] w-44 align-top">{k}</td><td className="py-2">{v}</td></tr>;
}
