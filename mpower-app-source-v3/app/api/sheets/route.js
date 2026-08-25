// API ทดสอบ + อ่าน/เขียน Google Sheet ผ่าน connector ปลอดภัย
// GET  /api/sheets                → เช็คว่าตั้ง env แล้วหรือยัง
// GET  /api/sheets?tab=A-Card     → อ่านตัวอย่างจากแท็บ (ทดสอบการเชื่อม)
// POST /api/sheets  {action:"append"|"update", ...}
import { isConfigured, getRows, appendRow, updateRow, ensureTab } from "@/lib/sheets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isConfigured()) {
    return Response.json({ configured: false, hint: "ยังไม่ได้ตั้ง env: GOOGLE_SA_EMAIL, GOOGLE_SA_KEY, MPOWER_SHEET_ID บน Vercel" });
  }
  const tab = new URL(req.url).searchParams.get("tab");
  if (!tab) return Response.json({ configured: true, ok: true, hint: "ใส่ ?tab=ชื่อแท็บ เพื่อทดสอบอ่าน (เช่น ?tab=A-Card)" });
  try {
    const { headers, rows } = await getRows(tab);
    return Response.json({ configured: true, tab, count: rows.length, headers, rows, sample: rows.slice(0, 3) });
  } catch (e) {
    return Response.json({ configured: true, error: String(e).slice(0, 220) }, { status: 502 });
  }
}

export async function POST(req) {
  if (!isConfigured()) return Response.json({ error: "ยังไม่ได้ตั้ง env" }, { status: 400 });
  try {
    const b = await req.json();
    if (b.action === "append") return Response.json({ ok: true, row: await appendRow(b.tab, b.obj, { required: b.required, idField: b.idField }) });
    if (b.action === "update") return Response.json({ ok: true, row: await updateRow(b.tab, b.idField, b.idValue, b.patch) });
    if (b.action === "ensureTab") return Response.json({ ok: true, result: await ensureTab(b.tab, b.headers, b.note) });
    return Response.json({ error: "action ต้องเป็น append หรือ update" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: String(e).slice(0, 220) }, { status: 502 });
  }
}
