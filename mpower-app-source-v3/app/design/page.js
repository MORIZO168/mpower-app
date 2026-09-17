import DesignClient from "@/components/DesignClient";
import { isConfigured, getRows } from "@/lib/db";

export const dynamic = "force-dynamic";

const BKK = { lat: 13.7563, lng: 100.5018 };
const isPanel = (t) => /แผง|panel|module|pv|โซลาร์/i.test(String(t || ""));
const isInverter = (t) => /อินเวอร์|inverter|inv\b|hybrid|ไฮบริด/i.test(String(t || ""));

export default async function Page() {
  let panels = [], inverters = [];
  try {
    if (isConfigured()) {
      const { rows } = await getRows("Equipment_Catalog");
      const all = rows || [];
      const onlyP = all.filter((r) => isPanel(r.Equip_Type));
      panels = onlyP.length ? onlyP : all; // ถ้าแยกชนิดไม่ได้ ส่งทั้งหมดให้เลือกเอง
      inverters = all.filter((r) => isInverter(r.Equip_Type));
    }
  } catch (e) {
    panels = []; inverters = [];
  }
  return <DesignClient panels={panels} inverters={inverters} center={BKK} />;
}
