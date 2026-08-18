import { PageHeader, Pill } from "@/components/ui";

export default function ComingSoon({ title, desc }) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title={title} right={<Pill tone="mut">กำลังพัฒนา</Pill>} />
      <div className="card p-8 text-center">
        <div className="text-[#8593a8]">{desc || "โมดูลนี้อยู่ในแผนพัฒนา — จะเชื่อมกับ Google Sheets เดิม"}</div>
      </div>
    </div>
  );
}
