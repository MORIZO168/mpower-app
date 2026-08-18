import { PageHeader, Pill } from "@/components/ui";
import { pricing } from "@/lib/data";

const JOB = { id: "S-202607-004", customer: "หจก. รุ่งเรืองพานิช", kw: 10, inverter: "Atmoce 10kW", sn: "ATM10-2607-0448", installed: "2026-07-30", peaRef: "PEA-SP-2607-1123" };

export default function HandoverPage() {
  const p = pricing(JOB.kw);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="เอกสารส่งมอบงาน" subtitle="สรุป as-built + รับประกัน + ผลทดสอบ + เซ็นรับ"
        right={<Pill tone="ok">ติดตั้งเสร็จ {JOB.installed}</Pill>} />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold text-[#1a3c6e] mb-3">ข้อมูลระบบ (as-built)</div>
          <table className="w-full text-sm"><tbody>
            <Row k="ลูกค้า" v={JOB.customer} />
            <Row k="ขนาดระบบ" v={`${JOB.kw} kWp`} />
            <Row k="แผงโซลาร์" v={`${p.panels} แผง × 555W`} />
            <Row k="อินเวอร์เตอร์" v={JOB.inverter} />
            <Row k="Serial อินเวอร์เตอร์" v={JOB.sn} />
            <Row k="วันติดตั้ง" v={JOB.installed} />
            <Row k="เลขอนุมัติ PEA" v={JOB.peaRef} />
          </tbody></table>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-[#1a3c6e] mb-3">การรับประกัน</div>
          <table className="w-full text-sm"><tbody>
            <Row k="แผงโซลาร์" v="25 ปี (ประสิทธิภาพ)" />
            <Row k="อินเวอร์เตอร์" v="ตามผู้ผลิต Atmoce" />
            <Row k="งานติดตั้ง" v="รับประกันฝีมือ" />
            <Row k="ล้างแผง" v="ฟรี 3 ปี (โดยทีมซับ)" />
          </tbody></table>
          <div className="font-semibold text-[#1a3c6e] mt-4 mb-2">ผลทดสอบ commissioning</div>
          <table className="w-full text-sm"><tbody>
            <Row k="แรงดัน string" v="ผ่านเกณฑ์" />
            <Row k="ค่าฉนวน (insulation)" v="ผ่าน" />
            <Row k="ทดสอบขนานไฟ" v="ผ่าน · จ่ายไฟปกติ" />
          </tbody></table>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <div className="font-semibold text-[#1a3c6e] mb-3">ภาพประกอบ + การเซ็นรับ</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {["หลังคา","อินเวอร์เตอร์","ตู้ไฟ/เบรกเกอร์","มิเตอร์"].map((x) => (
            <div key={x} className="aspect-video bg-[#f6f8fc] rounded-lg flex items-center justify-center text-xs text-[#8593a8]">{x}</div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border-t border-[#cdd6e5] pt-2 text-center text-[#8593a8]">ลูกค้าเซ็นรับมอบ</div>
          <div className="border-t border-[#cdd6e5] pt-2 text-center text-[#8593a8]">วิศวกร (กว.) M Power</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button className="bg-[#1a3c6e] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">สร้างชุดส่งมอบ PDF</button>
        <span className="text-xs text-[#8593a8]">รวม as-built + รับประกัน + คู่มือ + สเปก + ภาพ (ต่อจริงเฟสถัดไป)</span>
      </div>
    </div>
  );
}
function Row({ k, v }) {
  return <tr className="border-b border-[#f0f3f8]"><td className="py-2 text-[#5a6a86] w-40 align-top">{k}</td><td className="py-2">{v}</td></tr>;
}
