// Server component — ภาพรวมระบบที่ติดตั้ง (Fleet / O&M)
// ดึง installed_base จริง (นำเข้า 33 ระบบจาก Atmoce Cloud) + ระบบ Sigenergy ที่กรอกเอง
import { getRows } from "@/lib/db";
import FleetView from "@/components/FleetView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const num = (v) => { const n = Number(String(v ?? "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };
const truthy = (v) => v === true || ["true", "t", "1", "yes", "y"].includes(String(v ?? "").trim().toLowerCase());

// ระบบ Sigenergy (กรอกมือจาก Sigen Cloud) — คงไว้จนกว่าจะต่อ API Sigenergy
const SIGEN = [
  { id: "santi", name: "Santi TMT", brand: "Sigenergy", kwp: 10, battKwh: 20, prodMwh: 2.98, todayKwh: 0, installDate: "", online: true, status: "normal" },
  { id: "isarawan", name: "Isarawan TMT", brand: "Sigenergy", kwp: 5, battKwh: 0, prodMwh: 1.53, todayKwh: 0, installDate: "", online: true, status: "normal" },
];

async function load() {
  try {
    const { rows } = await getRows("Installed_Base");
    const atmoce = rows
      .filter((r) => String(r.Site_ID || "").startsWith("ATM-") || String(r.Brand || "").includes("Atmoce"))
      .map((r) => {
        const online = truthy(r.Online);
        return {
          id: r.Site_ID,
          name: r.Customer_Name || r.Site_ID,
          brand: r.Brand || "Aiko / Atmoce",
          kwp: num(r.kWp),
          battKwh: num(r.Battery_kWh),
          prodMwh: num(r.Lifetime_kWh) / 1000,
          todayKwh: num(r.Today_kWh),
          installDate: r.Install_Date || "",
          online,
          status: online ? "normal" : "offline",
        };
      });
    let synced = "";
    for (const r of rows) { if (r.Synced_At) { synced = String(r.Synced_At).slice(0, 10); break; } }
    return { sites: [...SIGEN, ...atmoce], synced, err: "" };
  } catch (e) {
    return { sites: SIGEN, synced: "", err: String(e).slice(0, 160) };
  }
}

export default async function FleetPage() {
  const { sites, synced } = await load();
  return <FleetView sites={sites} syncedAt={synced} />;
}
