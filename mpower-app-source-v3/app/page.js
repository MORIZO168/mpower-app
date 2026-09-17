import Link from "next/link";
import { isConfigured, getRows } from "@/lib/db";
import { siteFromRow, overview } from "@/lib/service";

export const dynamic = "force-dynamic";

const baht = (n) => "฿" + Number(n || 0).toLocaleString("th-TH");
const stageOf = (r) => {
  const s = (r.Status || "").toLowerCase();
  return s === "customer" ? "customer" : s === "booked" ? "booked" : "lead";
};

function Stat({ label, value, tone, href }) {
  const col = tone === "bad" ? "text-[#c0392b]" : tone === "warn" ? "text-[#b7791f]" : tone === "ok" ? "text-[#1a7d3a]" : "text-[#1d1d1f]";
  const inner = (
    <div className="card p-3.5 h-full">
      <div className={`text-xl md:text-2xl font-bold ${col}`}>{value}</div>
      <div className="text-xs text-[#6e6e73] mt-0.5">{label}</div>
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export default async function Dashboard() {
  let acard = [];
  let sites = [];
  let configured = false;
  try {
    configured = isConfigured();
    if (configured) {
      try { acard = (await getRows("A-Card")).rows || []; } catch (e) { acard = []; }
      try { const r = await getRows("Installed_Base"); sites = (r.rows || []).map(siteFromRow); } catch (e) { sites = []; }
    }
  } catch (e) { /* ignore */ }

  const leads = acard.filter((r) => stageOf(r) === "lead");
  const booked = acard.filter((r) => stageOf(r) === "booked");
  const customers = acard.filter((r) => stageOf(r) === "customer");
  const hot = leads.filter((r) => (r.Grade || "") === "Hot").length;
  const now = new Date();
  const o = overview(sites, now);

  // แถบภาพรวมโครงการ (ตัวเลขจริง)
  const funnel = [
    { label: "A-Card (ลีด)", n: leads.length, href: "/leads" },
    { label: "รอติดตั้ง", n: booked.length, href: "/leads" },
    { label: "ลูกค้า CRM", n: customers.length, href: "/leads" },
    { label: "ดูแลหลังติดตั้ง", n: sites.length, href: "/service" },
  ];
  const mx = Math.max(...funnel.map((f) => f.n), 1);

  // สรุปสั้น (คำนวณจากข้อมูลจริง)
  const brief = [];
  if (booked.length) brief.push({ tone: "warn", text: `${booked.length} งานรอติดตั้ง — ยืนยันวันนัดกับลูกค้า` });
  if (hot) brief.push({ tone: "bad", text: `${hot} ลีด Hot ยังไม่นัดติดตั้ง — รีบตามต่อ` });
  if (o.maDue) brief.push({ tone: "warn", text: `${o.maDue} ไซต์ถึงเวลานัดล้างแผง` });
  if (o.expiring) brief.push({ tone: "bad", text: `${o.expiring} รายการประกันใกล้หมด/หมดแล้ว` });
  if (o.tickets) brief.push({ tone: "bad", text: `${o.tickets} เคสแจ้งซ่อมเปิดอยู่` });
  if (leads.length) brief.push({ tone: "ok", text: `${leads.length} ลีดในมือ — ดูแลไม่ให้หลุด` });
  if (brief.length === 0) brief.push({ tone: "ok", text: "ไม่มีรายการเร่งด่วน — เพิ่มลีดใหม่เพื่อเริ่มไปป์ไลน์ได้เลย" });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ภาพรวม</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">ไปป์ไลน์การขาย · งานติดตั้ง · การดูแลหลังการขาย</p>
        </div>
        <span className={`ml-auto pill pill-${configured ? "ok" : "mut"}`}>{configured ? "ข้อมูลจริง" : "ยังไม่เชื่อมข้อมูล"}</span>
      </div>

      {/* สรุปรอบ (AI) */}
      <div className="card p-4 mb-4" style={{ background: "linear-gradient(180deg,#fffaf4,#ffffff)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-lg bg-[#F5821F] text-white flex items-center justify-center text-xs font-bold">AI</span>
          <div className="font-semibold text-[#1d1d1f] text-sm">สรุปสิ่งที่ต้องโฟกัส</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1.5">
          {brief.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className={`w-2 h-2 rounded-full shrink-0 ${it.tone === "bad" ? "bg-[#c0392b]" : it.tone === "warn" ? "bg-[#F5821F]" : "bg-[#1a7d3a]"}`} />
              <span className="text-[#1d1d1f]">{it.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ตัวเลขจริง */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="ลีดในมือ (A-Card)" value={leads.length} tone="mut" href="/leads" />
        <Stat label="รอติดตั้ง" value={booked.length} tone={booked.length ? "warn" : "mut"} href="/leads" />
        <Stat label="ลูกค้าดูแลอยู่" value={sites.length} tone="ok" href="/service" />
        <Stat label="ต้องนัดล้างแผง" value={o.maDue} tone={o.maDue ? "warn" : "mut"} href="/service" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ภาพรวมโครงการ */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center mb-4">
            <div className="font-semibold text-[#1d1d1f]">ภาพรวมไปป์ไลน์</div>
            <Link href="/leads" className="ml-auto text-xs text-[#F5821F] font-semibold">จัดการ A-Card →</Link>
          </div>
          <div className="space-y-2.5">
            {funnel.map((f) => (
              <Link key={f.label} href={f.href} className="flex items-center gap-3 group">
                <span className="w-28 text-[12px] text-[#6e6e73] shrink-0 truncate group-hover:text-[#1d1d1f]">{f.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[#f0f0f2] overflow-hidden">
                  <div className="h-full bg-[#F5821F]" style={{ width: (f.n / mx) * 100 + "%" }} />
                </div>
                <span className="w-8 text-right text-[13px] font-semibold text-[#1d1d1f]">{f.n}</span>
              </Link>
            ))}
          </div>
          {acard.length === 0 && (
            <div className="mt-4 text-[13px] text-[#6e6e73] bg-[#f5f5f7] rounded-xl p-3">
              ยังไม่มีลีดในระบบ — เริ่มที่ <Link href="/leads" className="text-[#F5821F] font-medium">เพิ่ม A-Card ใหม่</Link> หรือรับจากบูธ/สแกน QR
            </div>
          )}
        </div>

        {/* ทางลัด */}
        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">ทางลัด</div>
          <div className="space-y-2">
            {[
              ["เพิ่ม A-Card ใหม่", "/leads", "รับลีดเข้าไปป์ไลน์"],
              ["ออกบูธ / สแกน QR", "/booth", "รับลีดจากอีเวนต์"],
              ["ใบเสนอราคา / BOQ", "/quote", "ทำใบเสนอให้ลูกค้า"],
              ["ดูแลหลังติดตั้ง", "/service", `${sites.length} ไซต์ · นัดล้างแผง`],
              ["ระบบที่ติดตั้ง (Fleet)", "/fleet", "ผลผลิตรวมทุกไซต์"],
            ].map(([label, href, sub]) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-xl border border-[#eceef2] p-3 hover:bg-[#f5f5f7]">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[#1d1d1f]">{label}</div>
                  <div className="text-[11px] text-[#a1a1a6] truncate">{sub}</div>
                </div>
                <span className="text-[#c7c9cd]">›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
