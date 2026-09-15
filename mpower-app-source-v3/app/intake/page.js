// Server component — รับของเข้าสต็อกด้วยการสแกน serial (equipment_units)
import { isConfigured, getRows } from "@/lib/db";
import IntakeClient from "@/components/IntakeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const configured = isConfigured();
  let units = [], catalog = [], error = null;
  if (configured) {
    try {
      const [u, c] = await Promise.all([
        getRows("Equipment_Units"),
        getRows("Equipment_Catalog"),
      ]);
      units = u.rows;
      catalog = c.rows;
    } catch (e) {
      error = String(e).slice(0, 200);
    }
  }
  // เรียงล่าสุดขึ้นก่อน
  units = [...units].sort((a, b) => String(b.Received_At || "").localeCompare(String(a.Received_At || "")));
  return <IntakeClient units={units} catalog={catalog} configured={configured} error={error} />;
}
