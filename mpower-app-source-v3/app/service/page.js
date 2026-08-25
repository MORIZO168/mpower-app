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
      const rows = (r.rows || []).map(siteFromRow).filter((s) => s.id || (s.name && s.name !== "(ไม่มีชื่อ)"));
      if (rows.length) { sites = rows; sample = false; }
    } catch (e) {
      error = String(e).slice(0, 180);
    }
  }
  return <ServiceClient sites={sites} configured={configured} error={error} sample={sample} />;
}
