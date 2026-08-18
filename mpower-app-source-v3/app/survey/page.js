import { PageHeader, Pill } from "@/components/ui";

function Field({ label, ph, hint, wide }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="block text-xs text-[#5a6a86] mb-1">{label}</label>
      <input placeholder={ph} className="w-full px-3 py-2 border border-[#cdd6e5] rounded-lg text-sm bg-white" />
      {hint && <div className="text-[11px] text-[#8593a8] mt-1">{hint}</div>}
    </div>
  );
}

export default function SurveyPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="สำรวจหน้างาน" subtitle="เลขงานออกอัตโนมัติ · GPS · บิลค่าไฟ · รูปหน้างาน"
        right={<Pill tone="ok">เลขงานถัดไป · S-202608-001</Pill>} />

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1a3c6e] mb-3">ข้อมูลลูกค้า</div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="ชื่อลูกค้า" ph="คุณ..." />
          <Field label="เบอร์โทร / LINE" ph="08x-xxx-xxxx" />
          <Field label="ที่อยู่ / พิกัด GPS" ph="ปักหมุด หรือวางลิงก์ Google Maps" hint="วางพิกัดแล้วเห็นหลังคาจากดาวเทียม" wide />
          <Field label="ประเภท" ph="บ้าน / ร้านค้า / โรงงาน" />
          <Field label="การไฟฟ้า" ph="PEA / MEA" />
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1a3c6e] mb-3">ข้อมูลไฟฟ้า (จากบิลค่าไฟ)</div>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="ค่าไฟเฉลี่ย/เดือน (บาท)" ph="เช่น 4,500" hint="อ่านจากรูปบิลอัตโนมัติ (OCR)" />
          <Field label="หน่วยใช้/เดือน (kWh)" ph="เช่น 1,050" />
          <Field label="อัตรา TOU?" ph="ใช่ / ไม่ใช่" />
          <Field label="ขนาดมิเตอร์ / เฟส" ph="15(45)A · 1 เฟส" />
          <Field label="พื้นที่หลังคา (ตร.ม.)" ph="ประมาณ" />
          <Field label="ทิศ/ความชัน" ph="ใต้ · 15°" />
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1a3c6e] mb-3">รูปหน้างาน</div>
        <div className="border-2 border-dashed border-[#cdd6e5] rounded-xl p-8 text-center text-sm text-[#8593a8]">
          ลากรูป/ถ่ายรูป — หลังคา · ตู้ไฟ · มิเตอร์ · บิลค่าไฟ (เพิ่มภายหลังได้)
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-[#1a3c6e] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">บันทึกสำรวจ → ส่งต่อ Pre-qualify</button>
        <span className="text-xs text-[#8593a8]">บันทึกลงชีต + สร้างงานในระบบ (ต่อจริงเฟสถัดไป)</span>
      </div>
    </div>
  );
}
