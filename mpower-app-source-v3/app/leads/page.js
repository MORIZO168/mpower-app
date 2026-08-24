// Server component — อ่าน A-Card จาก Google Sheet แล้วส่งให้ฟอร์ม (client)
import { isConfigured, getRows } from "@/lib/sheets";
import LeadsClient from "@/components/LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const configured = isConfigured();
  let rows = [], error = null;
  if (configured) {
    try {
      const r = await getRows("A-Card");
      rows = r.rows;
    } catch (e) {
      error = String(e).slice(0, 200);
    }
  }
  return <LeadsClient rows={rows} configured={configured} error={error} />;
}
