import { PageHeader, Stat, Pill } from "@/components/ui";
import { pricing, baht } from "@/lib/data";
import { getRows } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

async function load() {
  try {
    const [stockRes, unitRes] = await Promise.all([
      getRows("Stock"),
      getRows("Equipment_Units"),
    ]);
    return { stock: stockRes.rows, units: unitRes.rows, live: true, err: "" };
  } catch (e) {
    return { stock: [], units: [], live: false, err: String(e).slice(0, 160) };
  }
}

export default async function SupplyPage() {
  const { stock, units, live, err } = await load();

  // ---- สต็อกแบบนับจำนวน (bulk) ----
  const lowStock = stock.filter((s) => num(s.On_Hand) <= num(s.Reorder_Point));
  const stockValue = stock.reduce(
    (a, s) => a + num(s.On_Hand) * num(s.Unit_Cost_THB),
    0
  );

  // ---- อุปกรณ์รายชิ้น (serial) — คงคลังที่ยังไม่ติดตั้ง ----
  const onHandUnits = units.filter((u) => {
    const st = String(u.Status || "").toLowerCase();
    return st === "in_stock" || st === "instock" || st === "" || st === "รับเข้า";
  });
  const installedUnits = units.filter((u) =>
    String(u.Status || "").toLowerCase().includes("install")
  );

  // จัดกลุ่มคงคลังรายชิ้นตาม ประเภท+รุ่น
  const groupMap = new Map();
  for (const u of onHandUnits) {
    const key = `${u.Equip_Type || "-"}|${u.Brand || ""}|${u.Model || "-"}`;
    if (!groupMap.has(key))
      groupMap.set(key, {
        type: u.Equip_Type || "-",
        brand: u.Brand || "",
        model: u.Model || "-",
        qty: 0,
      });
    groupMap.get(key).qty += 1;
  }
  const groups = [...groupMap.values()].sort((a, b) =>
    (a.type + a.model).localeCompare(b.type + b.model, "th")
  );

  const p = pricing(10);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Supply / สต็อก"
        subtitle="สต็อกจริงจาก Supabase — นับจำนวน + รายชิ้น (serial)"
        right={
          live ? (
            <Pill tone="ok">เชื่อมฐานข้อมูลจริง</Pill>
          ) : (
            <Pill tone="bad">ต่อฐานข้อมูลไม่ได้</Pill>
          )
        }
      />

      {!live && (
        <div className="card p-4 mb-4 text-sm text-[#a13b3b] bg-[#fdf2f2]">
          ดึงข้อมูลจากฐานข้อมูลไม่สำเร็จ — {err || "ตรวจสอบ env บน Vercel"}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="รายการสต็อก (SKU)" value={stock.length} />
        <Stat
          label="ต่ำกว่าจุดสั่งซื้อ"
          value={lowStock.length}
          tone={lowStock.length ? "bad" : "ok"}
        />
        <Stat label="อุปกรณ์รายชิ้นคงคลัง" value={onHandUnits.length} sub={`ติดตั้งแล้ว ${installedUnits.length}`} />
        <Stat label="มูลค่าสต็อก (โดยประมาณ)" value={baht(stockValue)} />
      </div>

      {/* ===== สต็อกนับจำนวน ===== */}
      <div className="card p-5 mb-4">
        <div className="font-semibold mb-3 text-[#1a3c6e]">
          สต็อกแบบนับจำนวน — แผง / อุปกรณ์ทั่วไป
        </div>
        {stock.length === 0 ? (
          <div className="text-sm text-[#8593a8]">ยังไม่มีข้อมูลสต็อก</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#5a6a86] border-b border-[#e6ebf3]">
                <th className="py-2">SKU</th>
                <th>ประเภท</th>
                <th>รุ่น</th>
                <th>คงเหลือ</th>
                <th>จุดสั่งซื้อ</th>
                <th>ผู้ขาย</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s) => {
                const low = num(s.On_Hand) <= num(s.Reorder_Point);
                return (
                  <tr key={s._row || s.SKU} className="border-b border-[#f0f3f8]">
                    <td className="py-2 font-medium">{s.SKU}</td>
                    <td>{s.Type}</td>
                    <td>{s.Model}</td>
                    <td className={low ? "text-[#c0392b] font-semibold" : ""}>
                      {s.On_Hand}
                    </td>
                    <td className="text-[#8593a8]">{s.Reorder_Point}</td>
                    <td className="text-[#5a6a86]">{s.Supplier}</td>
                    <td>
                      {low ? (
                        <Pill tone="bad">สั่งเพิ่ม</Pill>
                      ) : (
                        <Pill tone="ok">พอ</Pill>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== อุปกรณ์รายชิ้น (serial) ===== */}
      <div className="card p-5 mb-4">
        <div className="font-semibold mb-1 text-[#1a3c6e]">
          อุปกรณ์รายชิ้น (serial) — คงคลังที่ยังไม่ผูกโปรเจ็ค
        </div>
        <p className="text-xs text-[#8593a8] mb-3">
          แผง · ไมโครอินเวอร์เตอร์ · Combiner · Battery — สแกน QR เข้าสต็อก แล้วแมทเข้าโปรเจ็คตอนติดตั้ง → ไหลเข้าสู่ SLD
        </p>
        {groups.length === 0 ? (
          <div className="text-sm text-[#8593a8]">
            ยังไม่มีอุปกรณ์รายชิ้นในคงคลัง — เริ่มสแกน serial เข้าระบบได้เลย
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#5a6a86] border-b border-[#e6ebf3]">
                <th className="py-2">ประเภท</th>
                <th>แบรนด์</th>
                <th>รุ่น</th>
                <th>คงคลัง (ชิ้น)</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={i} className="border-b border-[#f0f3f8]">
                  <td className="py-2 font-medium">{g.type}</td>
                  <td>{g.brand}</td>
                  <td>{g.model}</td>
                  <td className="font-semibold">{g.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== โครงสร้างราคา (อ้างอิง) ===== */}
      <div className="card p-5">
        <div className="font-semibold mb-1 text-[#1a3c6e]">
          โครงสร้างราคา · ตัวอย่างระบบ 10 kW
        </div>
        <p className="text-xs text-[#8593a8] mb-3">
          M Power เตรียม 2 อย่าง · ที่เหลือช่างซับเหมา all-in
        </p>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-[#f0f3f8]">
              <td className="py-2">แผงโซลาร์ ({p.panels} แผ่น · 5฿/W)</td>
              <td className="text-right font-medium">{baht(p.panelCost)}</td>
            </tr>
            <tr className="border-b border-[#f0f3f8]">
              <td className="py-2">อินเวอร์เตอร์ {p.inverter.model}</td>
              <td className="text-right font-medium">{baht(p.inverter.cost)}</td>
            </tr>
            <tr className="border-b border-[#f0f3f8]">
              <td className="py-2 text-[#5a6a86]">ช่างซับเหมา all-in (6฿/W)</td>
              <td className="text-right font-medium">{baht(p.labor)}</td>
            </tr>
            <tr className="border-b border-[#f0f3f8]">
              <td className="py-2 text-[#5a6a86]">ต้นทุนรวม</td>
              <td className="text-right font-medium">{baht(p.cost)}</td>
            </tr>
            <tr className="border-b border-[#f0f3f8]">
              <td className="py-2 text-[#5a6a86]">กำไรเป้า ≥30%</td>
              <td className="text-right font-medium text-[#1a7d3a]">
                +{baht(p.profit)}
              </td>
            </tr>
            <tr>
              <td className="py-2 font-semibold">ราคาขาย</td>
              <td className="text-right font-bold text-[#1a3c6e]">
                {baht(p.sell)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
