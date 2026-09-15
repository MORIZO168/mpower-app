"use client";
import { useMemo, useState } from "react";

const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const TYPES = ["panel", "microinverter", "combiner", "battery"];
const TYPE_TH = { panel: "แผงโซลาร์", microinverter: "ไมโครอินเวอร์เตอร์", combiner: "คอมไบเนอร์", battery: "แบตเตอรี่" };

// ---- ถอดรหัส QR/บาร์โค้ดอุปกรณ์ ----
// Atmoce = ISO/IEC 15434 "[)>06" + DI 'S'=serial '1P'=part_no (สแกนครั้งเดียวได้ทั้งคู่)
// Aiko(แผง) = บาร์โค้ด Code128 เก็บ serial อย่างเดียว (รุ่นเลือกเอง/จาก packing list)
function parseQR(raw) {
  if (!raw) return { serial: "", part_no: "" };
  let s = String(raw).trim().replace(/[\x00-\x1f]/g, ""); // ตัด RS/GS/EOT
  const hadEnv = /^\[\)>\s*0?6/.test(s);
  s = s.replace(/^\[\)>\s*0?6/, "");
  let serial = "", part = "";
  const m = s.match(/S(.+?)1P(.+)$/); // S<serial>1P<part>
  if (m) { serial = m[1]; part = m[2]; }
  else if (hadEnv && s.startsWith("S")) serial = s.slice(1);
  else serial = s; // serial ล้วน (Aiko)
  serial = serial.replace(/-PV\d+$/i, ""); // ตัด suffix ไมโคร -PV1/-PV2
  return { serial: serial.trim(), part_no: part.trim() };
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default function IntakeClient({ units = [], catalog = [], configured, error }) {
  const catByPart = useMemo(() => {
    const m = {};
    catalog.forEach((c) => { if (c.Part_No) m[c.Part_No] = c; });
    return m;
  }, [catalog]);
  const models = useMemo(
    () => [...new Set(catalog.map((c) => c.Model).filter(Boolean))],
    [catalog]
  );

  const empty = { raw: "", serial: "", part_no: "", equip_type: "", brand: "", model: "", intake_ref: "", note: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [added, setAdded] = useState([]); // เพิ่งสแกนรอบนี้
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  // ป้อน/วาง raw QR แล้วแยกข้อมูลอัตโนมัติ + เดารุ่นจาก part_no
  function applyRaw(raw) {
    const { serial, part_no } = parseQR(raw);
    setF((s) => {
      const next = { ...s, raw, serial: serial || s.serial, part_no: part_no || s.part_no };
      const cat = part_no && catByPart[part_no];
      if (cat) {
        next.equip_type = cat.Equip_Type || next.equip_type;
        next.brand = cat.Brand || next.brand;
        next.model = cat.Model || next.model;
      }
      return next;
    });
  }
  // เลือกรุ่นเอง (กรณี Aiko serial ล้วน) → เติมประเภท/แบรนด์จาก catalog
  function applyModel(model) {
    const cat = catalog.find((c) => c.Model === model);
    setF((s) => ({
      ...s, model,
      equip_type: cat?.Equip_Type || s.equip_type,
      brand: cat?.Brand || s.brand,
      part_no: s.part_no || cat?.Part_No || "",
    }));
  }

  async function submit() {
    if (!f.serial.trim()) { setMsg({ t: "bad", m: "ยังไม่มี Serial — สแกน/วาง QR หรือพิมพ์เอง" }); return; }
    setBusy(true); setMsg(null);
    const obj = {
      Serial: f.serial.trim(),
      Part_No: f.part_no.trim(),
      Equip_Type: f.equip_type,
      Brand: f.brand,
      Model: f.model,
      Status: "in_stock",
      Received_At: new Date().toISOString(),
      Raw_QR: f.raw.trim(),
      Intake_Ref: f.intake_ref.trim(),
      Note: f.note.trim(),
    };
    try {
      const res = await fetch("/api/sheets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", tab: "Equipment_Units", obj, idField: "Serial", required: ["Serial"] }),
      });
      const d = await res.json();
      if (d.ok) {
        setMsg({ t: "ok", m: `รับเข้าแล้ว → ${obj.Serial}${obj.Model ? " · " + obj.Model : ""}` });
        setAdded((a) => [{ ...obj }, ...a]);
        setF(empty);
      } else {
        const dup = /duplicate|unique|already exists/i.test(d.error || "");
        setMsg({ t: "bad", m: dup ? `Serial นี้มีในระบบแล้ว: ${obj.Serial}` : (d.error || "บันทึกไม่สำเร็จ") });
      }
    } catch (e) { setMsg({ t: "bad", m: String(e).slice(0, 120) }); }
    setBusy(false);
  }

  function exportCSV() {
    const cols = ["Serial", "Part_No", "Equip_Type", "Brand", "Model", "Status", "Job_ID", "Received_At", "Installed_At", "Intake_Ref", "Note"];
    const lines = [cols.join(",")];
    units.forEach((u) => lines.push(cols.map((c) => csvCell(u[c])).join(",")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipment_units_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const onHand = units.filter((u) => String(u.Status || "").toLowerCase() === "in_stock");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">รับของเข้าสต็อก — สแกน Serial</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">
            สแกน/วาง QR อุปกรณ์ → เก็บเป็นสต็อกรายชิ้น (equipment_units) · Atmoce ได้รุ่นอัตโนมัติจาก part_no · แผง Aiko เลือกรุ่นเอง
          </p>
        </div>
        <span className={`ml-auto pill pill-${configured ? "ok" : "mut"}`}>{configured ? "เชื่อมฐานข้อมูลจริง" : "ยังไม่เชื่อม DB"}</span>
      </div>

      {error && <div className="card p-3 mb-4 text-sm text-[#c0392b]">อ่านข้อมูลไม่สำเร็จ: {error}</div>}

      <div className="card p-5 mb-4">
        <label className="block text-[11px] text-[#6e6e73] mb-1">วาง/สแกน QR ที่นี่ (แล้วระบบแยก Serial + รุ่นให้)</label>
        <div className="flex gap-2 mb-3">
          <input
            className={inCls}
            value={f.raw}
            onChange={(e) => applyRaw(e.target.value)}
            placeholder="เช่น [)>06SES25B21BFF81P81031007  หรือ  serial แผง Aiko"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">Serial *</label><input className={inCls} value={f.serial} onChange={(e) => upd("serial", e.target.value)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">Part No</label><input className={inCls} value={f.part_no} onChange={(e) => upd("part_no", e.target.value)} placeholder="Atmoce ได้อัตโนมัติ" /></div>
          <div>
            <label className="block text-[11px] text-[#6e6e73] mb-1">ประเภท</label>
            <select className={inCls} value={f.equip_type} onChange={(e) => upd("equip_type", e.target.value)}>
              <option value="">เลือก…</option>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_TH[t]} ({t})</option>)}
            </select>
          </div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">แบรนด์</label><input className={inCls} value={f.brand} onChange={(e) => upd("brand", e.target.value)} /></div>
          <div>
            <label className="block text-[11px] text-[#6e6e73] mb-1">รุ่น (แผง Aiko เลือกเอง)</label>
            <input className={inCls} value={f.model} onChange={(e) => applyModel(e.target.value)} list="model-list" placeholder="พิมพ์/เลือกรุ่น" />
            <datalist id="model-list">{models.map((m) => <option key={m} value={m} />)}</datalist>
          </div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">อ้างอิงล็อต/PO (เช่น pallet)</label><input className={inCls} value={f.intake_ref} onChange={(e) => upd("intake_ref", e.target.value)} placeholder="เช่น A226612606" /></div>
          <div className="md:col-span-3"><label className="block text-[11px] text-[#6e6e73] mb-1">หมายเหตุ</label><input className={inCls} value={f.note} onChange={(e) => upd("note", e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={submit} disabled={busy} className="bg-[#1d1d1f] text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "รับเข้าสต็อก"}</button>
          <button onClick={() => { setF(empty); setMsg(null); }} className="text-sm text-[#6e6e73] px-3 py-2">ล้างฟอร์ม</button>
          {msg && <span className={`text-sm ${msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{msg.m}</span>}
          <span className="text-[11px] text-[#a1a1a6] ml-auto">Status = in_stock · Received = ตอนนี้</span>
        </div>

        {added.length > 0 && (
          <div className="mt-4 border-t border-[#f0f0f2] pt-3">
            <div className="text-[12px] text-[#6e6e73] mb-2">เพิ่งรับเข้ารอบนี้ ({added.length})</div>
            <div className="flex flex-wrap gap-2">
              {added.map((a, i) => (
                <span key={i} className="pill pill-ok">{a.Serial}{a.Model ? " · " + a.Model : ""}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="font-semibold text-[#1d1d1f]">อุปกรณ์รายชิ้นในระบบ ({units.length}) · คงคลัง {onHand.length}</div>
          <button onClick={exportCSV} disabled={units.length === 0} className="ml-auto text-sm border border-[#d2d2d7] rounded-lg px-3 py-1.5 disabled:opacity-40">↓ Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee]">
              <th className="py-1.5">Serial</th><th>ประเภท</th><th>แบรนด์</th><th>รุ่น</th><th>Part No</th><th>สถานะ</th><th>โปรเจ็ค</th><th>รับเข้า</th>
            </tr></thead>
            <tbody>
              {units.map((u) => (
                <tr key={u._row || u.Serial} className="border-b border-[#f4f4f6]">
                  <td className="py-2 font-medium text-[#1d1d1f]">{u.Serial}</td>
                  <td className="text-[#6e6e73]">{TYPE_TH[u.Equip_Type] || u.Equip_Type}</td>
                  <td className="text-[#6e6e73]">{u.Brand}</td>
                  <td className="text-[#6e6e73]">{u.Model}</td>
                  <td className="text-[#6e6e73]">{u.Part_No}</td>
                  <td>{String(u.Status).toLowerCase() === "in_stock"
                    ? <span className="pill pill-ok">คงคลัง</span>
                    : <span className="pill pill-mut">{u.Status}</span>}</td>
                  <td className="text-[#6e6e73]">{u.Job_ID || "—"}</td>
                  <td className="text-[#a1a1a6] text-[11px]">{String(u.Received_At || "").slice(0, 10)}</td>
                </tr>
              ))}
              {units.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-[#a1a1a6]">ยังไม่มีอุปกรณ์รายชิ้น — สแกน QR เพื่อเริ่มรับเข้า</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
