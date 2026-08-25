// Server component — อ่านทะเบียน Installed_Base จาก Google Sheet → ส่งให้ ServiceClient
import { isConfigured, getRows } from "@/lib/sheets";
import { SAMPLE, siteFromRow } from "@/lib/service";
import ServiceClient from "@/components/ServiceClient";

export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const configured = isConfigured();
  let sites = SAMPLE, sample = true, error = null;
  if (configured) {
    try {
      const r = await getRows("Installed_Base");
      sample = false; // แท็บมีอยู่แล้ว → โหมดจริง (เพิ่ม/แก้ได้ แม้ยังไม่มีข้อมูล)
      sites = (r.rows || []).map(siteFromRow).filter((s) => s.id || (s.name && s.name !== "(ไม่มีชื่อ)"));
    } catch (e) {
      const m = String(e);
      if (m.indexOf("Unable to parse range") < 0) error = m.slice(0, 180); // ไม่โชว์ error ตอนแค่ยังไม่มีแท็บ
    }
  }
  return <ServiceClient sites={sites} configured={configured} error={error} sample={sample} />;
}
