// GET /api/health → เช็คว่าตั้ง env + เชื่อม Supabase ได้จริง (นับแถวบางตาราง)
import { isConfigured, getRows } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured()) {
    return Response.json({ ok: false, configured: false, hint: "ยังไม่ได้ตั้ง env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY" }, { status: 200 });
  }
  try {
    const counts = {};
    for (const tab of ["Jobs", "Stock", "A-Card", "Packages", "Equipment_Catalog"]) {
      const { rows } = await getRows(tab);
      counts[tab] = rows.length;
    }
    return Response.json({ ok: true, configured: true, db: "supabase", counts });
  } catch (e) {
    return Response.json({ ok: false, configured: true, error: String(e).slice(0, 220) }, { status: 502 });
  }
}
