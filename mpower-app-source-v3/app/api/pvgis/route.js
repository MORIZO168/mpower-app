// Serverless: ดึง production รายเดือนจาก PVGIS (EU JRC) — ฟรี ไม่ต้อง API key
// เรียก: /api/pvgis?lat=13.75&lon=100.5&kwp=8.71&tilt=15&az=0&loss=14
// az (aspect) แบบ PVGIS: 0=ใต้, 90=ตะวันตก, -90=ตะวันออก, 180=เหนือ

export const dynamic = "force-dynamic";

export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const lat = p.get("lat");
  const lon = p.get("lon");
  const kwp = p.get("kwp") || "1";
  const tilt = p.get("tilt") || "15";
  const az = p.get("az") || "0";
  const loss = p.get("loss") || "14";

  if (!lat || !lon) {
    return Response.json({ error: "ต้องมี lat และ lon" }, { status: 400 });
  }

  const url =
    `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lon}` +
    `&peakpower=${kwp}&loss=${loss}&angle=${tilt}&aspect=${az}` +
    `&mountingplace=building&outputformat=json`;

  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) {
      const txt = await r.text();
      return Response.json({ error: `PVGIS ${r.status}`, detail: txt.slice(0, 200) }, { status: 502 });
    }
    const data = await r.json();
    const monthly = data?.outputs?.monthly?.fixed || [];
    const kwhByMonth = Array(12).fill(0);
    monthly.forEach((m) => { if (m.month >= 1 && m.month <= 12) kwhByMonth[m.month - 1] = Math.round(m.E_m); });
    const annual = Math.round(data?.outputs?.totals?.fixed?.E_y || kwhByMonth.reduce((a, b) => a + b, 0));
    return Response.json({ monthly: kwhByMonth, annual, source: "PVGIS v5.2 / EU JRC" });
  } catch (e) {
    return Response.json({ error: "เรียก PVGIS ไม่สำเร็จ", detail: String(e).slice(0, 200) }, { status: 502 });
  }
}
