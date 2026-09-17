import DesignClient from "@/components/DesignClient";
import { isConfigured, getRows } from "@/lib/db";

export const dynamic = "force-dynamic";

const BKK = { lat: 13.7563, lng: 100.5018 };
const isPanel = (t) => /แผง|panel|module|pv|โซลาร์/i.test(String(t || ""));

export default async function Page() {
  let panels = [];
  try {
    if (isConfigured()) {
      const { rows } = await getRows("Equipment_Catalog");
      const all = rows || [];
      const only = all.filter((r) => isPanel(r.Equip_Type));
      panels = only.length ? only : all; // ถ้าแยกชนิดไม่ได้ ส่งทั้งหมดให้เลือกเอง
    }
  } catch (e) {
    panels = [];
  }
  return <DesignClient panels={panels} center={BKK} />;
}
