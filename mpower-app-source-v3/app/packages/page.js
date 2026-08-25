"use client";
import { useState, useEffect } from "react";
import { PACKAGES, ADDON, rowToPackage, packageToRow } from "@/lib/packages";

const HEADERS = ["Pkg_ID", "Name", "kWp", "Panels", "Inverter", "Price", "Phase"];
const inCls = "w-full px-2 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const money = (n) => Number(n || 0).toLocaleString("th-TH");

export default function PackagesPage() {
  const [pkgs, setPkgs] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [tabExists, setTabExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await (await fetch("/api/sheets?tab=Packages")).json();
      if (r.configured === false) { setConfigured(false); setLoading(false); return; }
      setConfigured(true);
      if (r.rows) { setTabExists(true); setPkgs(r.rows.map(rowToPackage).filter((p) => p.id)); }
      else { setTabExists(false); }
    } catch (e) { setMsg({ t: "bad", m: String(e).slice(0, 120) }); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function api(body) {
    const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }
  async function createSeed() {
    setBusy(true); setMsg(null);
    await api({ action: "ensureTab", tab: "Packages", headers: HEADERS, note: "แพคเกจการขาย — M POWER" });
    for (const p of PACKAGES) {
      await api({ action: "append", tab: "Packages", obj: packageToRow(p), idField: "Pkg_ID", required: ["Pkg_ID"] });
    }
    setBusy(false); load();
  }
  const upd = (id, k, v) => setPkgs((s) => s.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
  async function saveRow(p) {
    setBusy(true); setMsg(null);
    const d = await api({ action: "update", tab: "Packages", idField: "Pkg_ID", idValue: p.id, patch: packageToRow(p) });
    setBusy(false);
    setMsg(d.ok ? { t: "ok", m: "บันทึก " + p.id + " แล้ว" } : { t: "bad", m: d.error || "ไม่สำเร็จ" });
    if (d.ok) { try { localStorage.removeItem("mpower_pkgs"); } catch (e) {} }
  }
  async function addPkg() {
    setBusy(true);
    const id = "P" + String(Date.now()).slice(-4);
    const np = { id, name: "แพคเกจใหม่", kwp: 5, panels: 8, inverter: "Atmoce 5kW", price: 150000, phase: 1 };
    const d = await api({ action: "append", tab: "Packages", obj: packageToRow(np), idField: "Pkg_ID", required: ["Pkg_ID"] });
    setBusy(false);
    if (d.ok) load(); else setMsg({ t: "bad", m: d.error || "ไม่สำเร็จ" });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">แพคเกจการขาย</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">แก้ไขราคา/สเปกแพคเกจ — บันทึกลง Google Sheet · ทุกหน้า (บูธ/ใบเสนอ) ดึงไปใช้อัตโนมัติ</p>
        </div>
        <span className={"ml-auto pill pill-" + (configured && tabExists ? "ok" : "mut")}>{!configured ? "ยังไม่เชื่อมชีต" : tabExists ? "เชื่อมชีตแล้ว" : "ยังไม่มีแท็บ"}</span>
      </div>

      {loading && <div className="card p-6 text-center text-[#a1a1a6]">กำลังโหลด…</div>}

      {!loading && !configured && <div className="card p-4 text-sm text-[#6e6e73]">ยังไม่ได้ตั้งค่าเชื่อม Google Sheet</div>}

      {!loading && configured && !tabExists && (
        <div className="card p-6 text-center">
          <div className="text-[#6e6e73] text-sm mb-3">ยังไม่มีแท็บ <b>Packages</b> ในชีต — กดปุ่มด้านล่างเพื่อสร้างและใส่แพคเกจเริ่มต้น (S/M/L/XL) ให้อัตโนมัติ</div>
          <button onClick={createSeed} disabled={busy} className="bg-[#F5821F] text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังสร้าง…" : "สร้างแท็บ + ใส่แพคเกจเริ่มต้น"}</button>
        </div>
      )}

      {!loading && configured && tabExists && (
        <>
          <div className="space-y-3">
            {pkgs.map((p) => (
              <div key={p.id} className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="pill pill-warn">{p.id}</span>
                  <span className="font-semibold text-[#1d1d1f]">{p.name}</span>
                  <span className="ml-auto text-[13px] text-[#6e6e73]">ราคา {money(p.price)} ฿</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><label className="block text-[11px] text-[#6e6e73] mb-1">ชื่อแพคเกจ</label><input className={inCls} value={p.name} onChange={(e) => upd(p.id, "name", e.target.value)} /></div>
                  <div><label className="block text-[11px] text-[#6e6e73] mb-1">ขนาด (kWp)</label><input type="number" className={inCls} value={p.kwp} onChange={(e) => upd(p.id, "kwp", +e.target.value || 0)} /></div>
                  <div><label className="block text-[11px] text-[#6e6e73] mb-1">จำนวนแผง</label><input type="number" className={inCls} value={p.panels} onChange={(e) => upd(p.id, "panels", +e.target.value || 0)} /></div>
                  <div><label className="block text-[11px] text-[#6e6e73] mb-1">อินเวอร์เตอร์</label><input className={inCls} value={p.inverter} onChange={(e) => upd(p.id, "inverter", e.target.value)} /></div>
                  <div><label className="block text-[11px] text-[#6e6e73] mb-1">ราคา (฿ รวม VAT)</label><input type="number" className={inCls} value={p.price} onChange={(e) => upd(p.id, "price", +e.target.value || 0)} /></div>
                  <div><label className="block text-[11px] text-[#6e6e73] mb-1">เฟส (1/3)</label><input type="number" className={inCls} value={p.phase} onChange={(e) => upd(p.id, "phase", +e.target.value || 1)} /></div>
                </div>
                <div className="mt-3"><button onClick={() => saveRow(p)} disabled={busy} className="bg-[#1d1d1f] text-white rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-50">บันทึก</button></div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={addPkg} disabled={busy} className="bg-[#F5821F] text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">+ เพิ่มแพคเกจ</button>
            {msg && <span className={"text-sm " + (msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]")}>{msg.m}</span>}
          </div>

          <div className="card p-4 mt-5 text-[12px] text-[#6e6e73]">
            <div className="font-semibold text-[#1d1d1f] text-sm mb-2">ราคา Add-on (แก้ในโค้ด lib/packages ได้ · ทำหน้าแก้ทีหลังได้)</div>
            แบตเตอรี่ 7 kWh: {money(ADDON.battery)} ฿ · แผงเพิ่ม/แผ่น: {money(ADDON.panel)} ฿ · Backup box: {money(ADDON.backup)} ฿ · ขยายประกัน 20 ปี: {money(ADDON.war20)} ฿ · 25 ปี: {money(ADDON.war25)} ฿
          </div>
        </>
      )}
    </div>
  );
}
