"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import Roof3D from "@/components/Roof3D";
import {
  areaM2, edgeLengths, centroid, suggestAzimuth, azimuthLabel,
  toPvgisAspect, parsePanelSpec, parseInverterSpec, buildLayout, seedArray,
  offlineAnnual, OPTIMAL_FLAT, BKK,
} from "@/lib/solar";

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const num = (n) => Number(n || 0).toLocaleString("th-TH");
const isInverter = (t) => /อินเวอร์|inverter|inv\b|hybrid|ไฮบริด/i.test(String(t || ""));

export default function DesignClient({ panels = [], inverters = [], center }) {
  const start = center && center.lat ? center : BKK;
  const mapEl = useRef(null);
  const map = useRef(null);
  const L = useRef(null);
  const polyLayer = useRef(null);
  const vertLayer = useRef(null);
  const panelLayer = useRef(null);
  const handleLayer = useRef(null);
  const drawingRef = useRef(false);
  const ptsRef = useRef([]);
  const arraysRef = useRef([]);
  const selRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [pts, setPts] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [roofType, setRoofType] = useState("pitched");
  const [tilt, setTilt] = useState(15);
  const [az, setAz] = useState(180);
  const [azLocked, setAzLocked] = useState(false);
  const [loss, setLoss] = useState(14);
  const [panelIdx, setPanelIdx] = useState(0);
  const [manual, setManual] = useState(false);
  const [mWatt, setMWatt] = useState(600);
  const [mW, setMW] = useState(1.134);
  const [mH, setMH] = useState(2.278);
  // arrays (กรอบวางแผง)
  const [arrays, setArrays] = useState([]);
  const [selId, setSelId] = useState(null);
  // inverter
  const [invIdx, setInvIdx] = useState(0);
  const [invManual, setInvManual] = useState(false);
  const [invManKw, setInvManKw] = useState(5);
  const [invQty, setInvQty] = useState(1);
  const [sysType, setSysType] = useState("ongrid");
  // ui
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState("2d");
  const [shadeFactor, setShadeFactor] = useState(1);

  const panelSpec = useMemo(() => {
    if (manual || !panels.length) return { watt: mWatt, w: mW, h: mH, parsed: { watt: true, dim: true } };
    const p = panels[panelIdx] || panels[0];
    return parsePanelSpec(p?.Spec || p?.spec || "");
  }, [manual, mWatt, mW, mH, panels, panelIdx]);

  const area = useMemo(() => areaM2(pts), [pts]);
  const edges = useMemo(() => edgeLengths(pts), [pts]);

  const ref = useMemo(
    () => (pts.length >= 3 ? centroid(pts) : (arrays[0] ? arrays[0].center : start)),
    [pts, arrays, start]
  );
  const layoutOpts = useMemo(
    () => ({ gap: 0.02, rowGap: roofType === "flat" ? panelSpec.h * 0.4 : 0 }),
    [roofType, panelSpec.h]
  );
  const layout = useMemo(
    () => buildLayout(arrays, { w: panelSpec.w, h: panelSpec.h }, panelSpec.watt, az, ref, layoutOpts),
    [arrays, panelSpec, az, ref, layoutOpts]
  );
  const kwp = layout.kwp || 0;

  // inverter derived
  const invSpec = useMemo(() => {
    if (invManual || !inverters.length) return { acKw: invManKw };
    const iv = inverters[invIdx] || inverters[0];
    const p = parseInverterSpec(iv?.Spec || iv?.spec || "");
    return { acKw: p.acKw || invManKw };
  }, [invManual, invManKw, inverters, invIdx]);
  const totalAc = +(((invSpec.acKw || 0) * (invQty || 0)).toFixed(2));
  const dcac = totalAc > 0 ? +(kwp / totalAc).toFixed(2) : 0;

  // ---- Leaflet init ----
  useEffect(() => {
    let alive = true;
    (async () => {
      const leaflet = await import("leaflet");
      if (!alive) return;
      L.current = leaflet.default || leaflet;
      const m = L.current.map(mapEl.current, { center: [start.lat, start.lng], zoom: 19, zoomControl: true, attributionControl: true });
      L.current.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 21, maxNativeZoom: 19, attribution: "Tiles © Esri",
      }).addTo(m);
      polyLayer.current = L.current.layerGroup().addTo(m);
      panelLayer.current = L.current.layerGroup().addTo(m);
      handleLayer.current = L.current.layerGroup().addTo(m);
      vertLayer.current = L.current.layerGroup().addTo(m);
      m.on("click", (e) => {
        if (!drawingRef.current) return;
        const next = [...ptsRef.current, { lat: e.latlng.lat, lng: e.latlng.lng }];
        ptsRef.current = next;
        setPts(next);
      });
      map.current = m;
      setReady(true);
    })();
    return () => { alive = false; if (map.current) { map.current.remove(); map.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { drawingRef.current = drawing; }, [drawing]);
  useEffect(() => { ptsRef.current = pts; }, [pts]);
  useEffect(() => { arraysRef.current = arrays; }, [arrays]);
  useEffect(() => { selRef.current = selId; }, [selId]);

  // ---- roof polygon + vertices ----
  useEffect(() => {
    if (!ready || !L.current) return;
    const Ll = L.current;
    polyLayer.current.clearLayers();
    vertLayer.current.clearLayers();
    if (pts.length >= 2) {
      const line = pts.map((p) => [p.lat, p.lng]);
      Ll.polygon(line, { color: "#F5821F", weight: 2, fillColor: "#F5821F", fillOpacity: 0.10 }).addTo(polyLayer.current);
    }
    if (drawing) {
      pts.forEach((p, i) => {
        const icon = Ll.divIcon({
          className: "", html: '<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #F5821F;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>',
          iconSize: [14, 14], iconAnchor: [7, 7],
        });
        const mk = Ll.marker([p.lat, p.lng], { icon, draggable: true }).addTo(vertLayer.current);
        mk.on("drag", (e) => {
          const ll = e.target.getLatLng();
          const next = ptsRef.current.slice();
          next[i] = { lat: ll.lat, lng: ll.lng };
          ptsRef.current = next; setPts(next);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, ready, drawing]);

  // ---- panels (จาก array frames) + center handles ----
  useEffect(() => {
    if (!ready || !L.current) return;
    const Ll = L.current;
    panelLayer.current.clearLayers();
    handleLayer.current.clearLayers();
    const cba = layout.cellsByArray || {};
    for (const a of arrays) {
      const cells = cba[a.id] || [];
      const sel = a.id === selId;
      cells.forEach((cell) => {
        const poly = Ll.polygon(cell.corners.map((c) => [c.lat, c.lng]), {
          color: cell.disabled ? "#9aa0a6" : (sel ? "#0b3d91" : "#12408f"),
          weight: 1,
          dashArray: cell.disabled ? "3 3" : null,
          fillColor: cell.disabled ? "#c9ccd1" : "#1e5bd6",
          fillOpacity: cell.disabled ? 0.18 : (sel ? 0.78 : 0.6),
        }).addTo(panelLayer.current);
        poly.on("click", (e) => {
          if (Ll.DomEvent) Ll.DomEvent.stop(e);
          setSelId(a.id);
          toggleCell(a.id, cell.r, cell.c);
        });
      });
      // center drag handle
      const hicon = Ll.divIcon({
        className: "",
        html: `<div style="width:26px;height:26px;border-radius:50%;background:${sel ? "#F5821F" : "rgba(0,0,0,.55)"};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px">✥</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13],
      });
      const hm = Ll.marker([a.center.lat, a.center.lng], { icon: hicon, draggable: true, zIndexOffset: 1000 }).addTo(handleLayer.current);
      hm.on("mousedown", () => setSelId(a.id));
      hm.on("drag", (e) => {
        const ll = e.target.getLatLng();
        const next = arraysRef.current.map((x) => (x.id === a.id ? { ...x, center: { lat: ll.lat, lng: ll.lng } } : x));
        arraysRef.current = next; setArrays(next);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, arrays, selId, ready]);

  // ---- auto azimuth ----
  useEffect(() => {
    if (roofType === "flat") { if (!azLocked) setAz(OPTIMAL_FLAT.az); return; }
    if (!azLocked && pts.length >= 3) setAz(suggestAzimuth(pts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, roofType]);

  const selArray = arrays.find((a) => a.id === selId) || null;

  function startDraw() {
    setPts([]); ptsRef.current = []; setResult(null); setSaved(false);
    setArrays([]); arraysRef.current = []; setSelId(null);
    setDrawing(true);
  }
  function finishDraw() {
    setDrawing(false);
    if (arraysRef.current.length === 0 && ptsRef.current.length >= 3) {
      const a = seedArray(ptsRef.current, { w: panelSpec.w, h: panelSpec.h }, azLocked ? az : suggestAzimuth(ptsRef.current), layoutOpts);
      arraysRef.current = [a]; setArrays([a]); setSelId(a.id);
    }
  }
  function clearAll() {
    setDrawing(false); setPts([]); ptsRef.current = [];
    setArrays([]); arraysRef.current = []; setSelId(null);
    setResult(null); setSaved(false);
  }
  function undoPt() { const n = ptsRef.current.slice(0, -1); ptsRef.current = n; setPts(n); }

  function addArray() {
    const c = map.current ? map.current.getCenter() : start;
    const seedPts = pts.length >= 3 ? pts : [];
    const a = seedArray(seedPts, { w: panelSpec.w, h: panelSpec.h }, az, { ...layoutOpts, center: { lat: c.lat, lng: c.lng } });
    if (pts.length < 3) a.center = { lat: c.lat, lng: c.lng };
    const next = [...arraysRef.current, a];
    arraysRef.current = next; setArrays(next); setSelId(a.id); setSaved(false);
  }
  function removeArray(id) {
    const next = arraysRef.current.filter((a) => a.id !== id);
    arraysRef.current = next; setArrays(next);
    if (selId === id) setSelId(next[0]?.id || null);
    setSaved(false);
  }
  function updateSel(patch) {
    const next = arraysRef.current.map((a) => (a.id === selId ? { ...a, ...patch } : a));
    arraysRef.current = next; setArrays(next); setSaved(false);
  }
  function bump(field, d) {
    if (!selArray) return;
    const v = Math.max(1, Math.min(40, (selArray[field] | 0) + d));
    updateSel({ [field]: v, off: [] });
  }
  function toggleCell(id, r, c) {
    const next = arraysRef.current.map((a) => {
      if (a.id !== id) return a;
      const off = new Set(a.off || []);
      const key = `${r},${c}`;
      off.has(key) ? off.delete(key) : off.add(key);
      return { ...a, off: [...off] };
    });
    arraysRef.current = next; setArrays(next); setSaved(false);
  }

  function switchView(v) {
    setView(v);
    if (v === "2d") setTimeout(() => { try { map.current && map.current.invalidateSize(); } catch (e) {} }, 60);
  }

  function extractLatLng(s) {
    const m =
      s.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/) ||
      s.match(/[?&]q=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/) ||
      s.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/) ||
      s.match(/(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/);
    if (m) {
      const lat = +m[1], lng = +m[2];
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
    return null;
  }

  async function search() {
    const q = query.trim();
    if (!q) return;
    const ll = extractLatLng(q);
    if (ll && map.current) { map.current.setView([ll.lat, ll.lng], 20); return; }
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=th&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
      const d = await r.json();
      if (d && d[0] && map.current) map.current.setView([+d[0].lat, +d[0].lon], 20);
    } catch (e) { /* noop */ }
    setSearching(false);
  }

  const prodCenter = pts.length >= 3 ? centroid(pts) : (arrays[0] ? arrays[0].center : start);

  async function calcProduction() {
    if (kwp <= 0) return;
    setLoading(true); setResult(null);
    const c = prodCenter;
    const aspect = toPvgisAspect(az);
    try {
      const r = await fetch(`/api/pvgis?lat=${c.lat.toFixed(5)}&lon=${c.lng.toFixed(5)}&kwp=${kwp}&tilt=${tilt}&az=${aspect}&loss=${loss}`);
      const d = await r.json();
      if (d && d.annual) setResult({ annual: d.annual, monthly: d.monthly, source: d.source });
      else setResult({ annual: offlineAnnual(kwp, tilt, az), monthly: null, source: "ประมาณการออฟไลน์ (PVGIS ไม่ตอบ)" });
    } catch (e) {
      setResult({ annual: offlineAnnual(kwp, tilt, az), monthly: null, source: "ประมาณการออฟไลน์ (เชื่อมต่อไม่ได้)" });
    }
    setLoading(false);
  }

  function saveDesign() {
    const c = prodCenter;
    const iv = !invManual && inverters.length ? (inverters[invIdx] || inverters[0]) : null;
    const design = {
      at: new Date().toISOString(), area: Math.round(area), panels: layout.count, kwp,
      panelWatt: panelSpec.watt, arrays: arrays.map((a) => ({ rows: a.rows, cols: a.cols, orientation: a.orientation, off: (a.off || []).length })),
      roofType, tilt, azimuth: az, lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6),
      inverter: iv ? [iv.Brand || iv.brand, iv.Model || iv.model].filter(Boolean).join(" ") : (invManual ? `กำหนดเอง ${invManKw}kW` : ""),
      inverterAcKw: invSpec.acKw, inverterQty: invQty, totalAcKw: totalAc, dcac, systemType: sysType,
      annual: result?.annual || offlineAnnual(kwp, tilt, az),
      shadeFactor: +shadeFactor.toFixed(3),
      annualNet: Math.round((result?.annual || offlineAnnual(kwp, tilt, az)) * shadeFactor),
    };
    try { localStorage.setItem("mpower_design", JSON.stringify(design)); setSaved(true); } catch (e) {}
  }

  const specYield = result && kwp ? Math.round(result.annual / kwp) : 0;
  const annualNet = result ? Math.round(result.annual * shadeFactor) : 0;
  const hasRoof = pts.length >= 3;
  const dcacColor = dcac === 0 ? "#6e6e73" : dcac < 1.0 ? "#c86a1a" : dcac <= 1.35 ? "#1a7d3a" : "#c0392b";

  return (
    <div className="p-3 md:p-5 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ออกแบบหลังคา</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">วาดหลังคา · วางกรอบแผงเอง (ลาก/หมุน/เพิ่มลบแผง) · เลือกอินเวอร์เตอร์ · คำนวณจากแดดจริง</p>
        </div>
        <span className="ml-auto pill pill-mut">Phase 2</span>
      </div>

      {/* ค้นหา */}
      <div className="flex gap-2 mb-3">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="ค้นหาที่อยู่ · วางพิกัด (13.88, 100.28) · วางลิงก์ Google Maps"
          className="flex-1 rounded-xl border border-[#e8e8ed] px-3 py-2 text-sm outline-none focus:border-[#F5821F]"
        />
        <button onClick={search} disabled={searching} className="rounded-xl bg-[#1d1d1f] text-white text-sm px-4 font-medium disabled:opacity-50">
          {searching ? "…" : "ค้นหา"}
        </button>
      </div>

      {/* 2D/3D */}
      {hasRoof && (
        <div className="flex gap-2 mb-3">
          {[["2d", "🗺️ แผนที่ 2D"], ["3d", "🧊 3D + เงา"]].map(([k, lb]) => (
            <button key={k} onClick={() => switchView(k)}
              className={`rounded-xl px-4 py-1.5 text-[13px] font-medium border ${view === k ? "border-[#F5821F] bg-[#fff6ef] text-[#F5821F]" : "border-[#e8e8ed] text-[#6e6e73]"}`}>
              {lb}
            </button>
          ))}
        </div>
      )}

      {view === "3d" && hasRoof && (
        <div className="mb-3">
          <Roof3D pts={pts} tilt={tilt} az={az} rects={layout.rects} center={centroid(pts)} roofType={roofType} onShading={setShadeFactor} />
        </div>
      )}

      {/* แผนที่ */}
      <div className="card overflow-hidden mb-3 relative" style={{ display: view === "3d" ? "none" : "block" }}>
        <div ref={mapEl} style={{ height: "52vh", minHeight: 320, width: "100%" }} />
        <div className="absolute z-[500] left-3 top-3 flex gap-2 flex-wrap">
          {!drawing ? (
            <button onClick={startDraw} className="rounded-full bg-[#F5821F] text-white text-sm px-4 py-2 font-semibold shadow-lg">
              {hasRoof ? "วาดใหม่" : "＋ เริ่มวาดหลังคา"}
            </button>
          ) : (
            <>
              <button onClick={finishDraw} disabled={pts.length < 3} className="rounded-full bg-[#1a7d3a] text-white text-sm px-4 py-2 font-semibold shadow-lg disabled:opacity-50">
                ✓ เสร็จ ({pts.length} มุม)
              </button>
              <button onClick={undoPt} disabled={!pts.length} className="rounded-full bg-white text-[#1d1d1f] text-sm px-3 py-2 font-medium shadow-lg disabled:opacity-40">ย้อน</button>
            </>
          )}
          {hasRoof && !drawing && (
            <button onClick={addArray} className="rounded-full bg-[#12408f] text-white text-sm px-4 py-2 font-semibold shadow-lg">＋ เพิ่มแผงโซลาร์</button>
          )}
          {pts.length > 0 && !drawing && (
            <button onClick={clearAll} className="rounded-full bg-white text-[#c0392b] text-sm px-3 py-2 font-medium shadow-lg">ล้าง</button>
          )}
        </div>
        {drawing && (
          <div className="absolute z-[500] left-1/2 -translate-x-1/2 bottom-3 bg-black/75 text-white text-[13px] px-3 py-1.5 rounded-full">
            แตะมุมหลังคาทีละมุม → ครบแล้วกด “เสร็จ”
          </div>
        )}
        {hasRoof && !drawing && arrays.length > 0 && (
          <div className="absolute z-[500] left-1/2 -translate-x-1/2 bottom-3 bg-black/75 text-white text-[12px] px-3 py-1.5 rounded-full">
            ลาก ✥ เพื่อย้ายกรอบ · แตะแผงเพื่อเพิ่ม/ลบ · ปรับแถว-คอลัมน์ที่การ์ด “แผง”
          </div>
        )}
      </div>

      {!hasRoof && !drawing && (
        <div className="card p-5 text-center text-sm text-[#6e6e73]">
          เลื่อนแผนที่ไปที่บ้านลูกค้า แล้วกด <b className="text-[#F5821F]">＋ เริ่มวาดหลังคา</b> แตะไปตามมุมหลังคา · เสร็จแล้ววางกรอบแผงเองได้
        </div>
      )}

      {hasRoof && (
        <>
          <div className="grid md:grid-cols-3 gap-3">
            {/* หลังคา + ทิศ */}
            <div className="card p-4 space-y-3">
              <div className="font-semibold text-[#1d1d1f]">หลังคา</div>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="พื้นที่" value={`${num(Math.round(area))} ตร.ม.`} />
                <Metric label="มุม" value={`${pts.length} จุด`} />
              </div>
              <div className="text-[12px] text-[#6e6e73]">ด้าน: {edges.map((e) => e.toFixed(1)).join(" · ")} ม.</div>

              <div>
                <div className="text-[12px] text-[#6e6e73] mb-1">ชนิดหลังคา</div>
                <div className="flex gap-2">
                  {[["pitched", "หลังคาลาด"], ["flat", "ดาดฟ้า (ตั้งแร็ค)"]].map(([k, lb]) => (
                    <button key={k} onClick={() => setRoofType(k)}
                      className={`flex-1 rounded-xl border px-2 py-1.5 text-[13px] ${roofType === k ? "border-[#F5821F] bg-[#fff6ef] text-[#F5821F] font-semibold" : "border-[#e8e8ed] text-[#6e6e73]"}`}>
                      {lb}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#6e6e73]">มุมเอียง</span>
                  <span className="font-semibold text-[#1d1d1f]">{tilt}°</span>
                </div>
                <input type="range" min="0" max="45" value={tilt} onChange={(e) => setTilt(+e.target.value)} className="w-full accent-[#F5821F]" />
                <div className="flex gap-1 mt-1">
                  {[5, 10, 15, 20, 25].map((t) => (
                    <button key={t} onClick={() => setTilt(t)} className={`text-[11px] rounded-md px-2 py-0.5 border ${tilt === t ? "border-[#F5821F] text-[#F5821F]" : "border-[#e8e8ed] text-[#6e6e73]"}`}>{t}°</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#6e6e73]">ทิศ/แนววางแผง</span>
                  <span className="font-semibold text-[#1d1d1f]">{azimuthLabel(az)} · {az}°</span>
                </div>
                <input type="range" min="0" max="359" value={az} onChange={(e) => { setAz(+e.target.value); setAzLocked(true); }} className="w-full accent-[#F5821F]" />
                <div className="flex gap-1 mt-1">
                  {[["ใต้", 180], ["ต.อ.", 90], ["ต.ต.", 270], ["เหนือ", 0]].map(([lb, v]) => (
                    <button key={v} onClick={() => { setAz(v); setAzLocked(true); }} className={`text-[11px] rounded-md px-2 py-0.5 border ${az === v ? "border-[#F5821F] text-[#F5821F]" : "border-[#e8e8ed] text-[#6e6e73]"}`}>{lb}</button>
                  ))}
                  <button onClick={() => setAzLocked(false)} className="text-[11px] rounded-md px-2 py-0.5 border border-[#e8e8ed] text-[#1d1d1f] ml-auto">↺ ระบบเดา</button>
                </div>
              </div>
            </div>

            {/* แผง + array */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#1d1d1f]">แผง</div>
                <button onClick={addArray} className="text-[12px] rounded-lg bg-[#12408f] text-white px-2 py-1 font-medium">＋ กรอบแผง</button>
              </div>
              {panels.length > 0 && !manual ? (
                <select value={panelIdx} onChange={(e) => setPanelIdx(+e.target.value)} className="w-full rounded-xl border border-[#e8e8ed] px-2 py-2 text-[13px]">
                  {panels.map((p, i) => (
                    <option key={i} value={i}>{[p.Brand || p.brand, p.Model || p.model].filter(Boolean).join(" ") || (p.Part_No || p.part_no) || `แผง #${i + 1}`}</option>
                  ))}
                </select>
              ) : (
                <div className="text-[12px] text-[#6e6e73]">กรอกสเปคแผงเอง (ยังไม่มีในฐานอุปกรณ์)</div>
              )}
              <label className="flex items-center gap-2 text-[12px] text-[#6e6e73]">
                <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} className="accent-[#F5821F]" />
                กรอกสเปคเอง
              </label>
              {manual ? (
                <div className="grid grid-cols-3 gap-2">
                  <NumIn label="วัตต์" value={mWatt} onChange={setMWatt} />
                  <NumIn label="กว้าง(ม.)" value={mW} step="0.001" onChange={setMW} />
                  <NumIn label="ยาว(ม.)" value={mH} step="0.001" onChange={setMH} />
                </div>
              ) : (
                <div className="text-[12px] text-[#6e6e73] bg-[#f7f7f8] rounded-lg p-2">
                  {panelSpec.watt}W · {panelSpec.w}×{panelSpec.h} ม.
                  {(!panelSpec.parsed?.watt || !panelSpec.parsed?.dim) && (
                    <span className="text-[#c86a1a]"> · อ่านสเปคไม่ครบ ใช้ค่ามาตรฐาน</span>
                  )}
                </div>
              )}

              {/* array chips */}
              {arrays.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {arrays.map((a, i) => {
                    const cnt = (layout.per.find((p) => p.id === a.id) || {}).count || 0;
                    return (
                      <button key={a.id} onClick={() => setSelId(a.id)}
                        className={`text-[12px] rounded-lg px-2 py-1 border ${a.id === selId ? "border-[#F5821F] bg-[#fff6ef] text-[#F5821F] font-semibold" : "border-[#e8e8ed] text-[#6e6e73]"}`}>
                        กรอบ {i + 1} · {cnt} แผง
                      </button>
                    );
                  })}
                </div>
              )}

              {/* selected array controls */}
              {selArray ? (
                <div className="rounded-xl border border-[#e8e8ed] p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Stepper label="แถว" value={selArray.rows} onDec={() => bump("rows", -1)} onInc={() => bump("rows", 1)} />
                    <Stepper label="คอลัมน์" value={selArray.cols} onDec={() => bump("cols", -1)} onInc={() => bump("cols", 1)} />
                  </div>
                  <div className="flex gap-1">
                    {[["portrait", "แนวตั้ง"], ["landscape", "แนวนอน"]].map(([k, lb]) => (
                      <button key={k} onClick={() => updateSel({ orientation: k })}
                        className={`flex-1 text-[12px] rounded-lg border px-2 py-1 ${selArray.orientation === k ? "border-[#F5821F] text-[#F5821F] font-semibold" : "border-[#e8e8ed] text-[#6e6e73]"}`}>{lb}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6e6e73]">
                    <span>แตะแผงบนแผนที่เพื่อเพิ่ม/ลบทีละแผง</span>
                    <button onClick={() => removeArray(selArray.id)} className="text-[#c0392b] font-medium">ลบกรอบนี้</button>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-[#6e6e73] text-center py-2">กด <b>＋ เพิ่มแผงโซลาร์</b> บนแผนที่เพื่อวางกรอบแผง</div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Metric label="จำนวนแผง" value={num(layout.count)} big />
                <Metric label="ขนาดติดตั้ง" value={`${num(kwp)} kWp`} big accent />
              </div>
            </div>

            {/* อินเวอร์เตอร์ */}
            <div className="card p-4 space-y-3">
              <div className="font-semibold text-[#1d1d1f]">อินเวอร์เตอร์ / ระบบ</div>
              {inverters.length > 0 && !invManual ? (
                <select value={invIdx} onChange={(e) => setInvIdx(+e.target.value)} className="w-full rounded-xl border border-[#e8e8ed] px-2 py-2 text-[13px]">
                  {inverters.map((iv, i) => (
                    <option key={i} value={i}>{[iv.Brand || iv.brand, iv.Model || iv.model].filter(Boolean).join(" ") || (iv.Part_No || iv.part_no) || `อินเวอร์เตอร์ #${i + 1}`}</option>
                  ))}
                </select>
              ) : (
                <div className="text-[12px] text-[#6e6e73]">กรอกขนาดอินเวอร์เตอร์เอง (ยังไม่มีในฐานอุปกรณ์)</div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-[12px] text-[#6e6e73]">
                  <input type="checkbox" checked={invManual} onChange={(e) => setInvManual(e.target.checked)} className="accent-[#F5821F]" />
                  กรอกเอง
                </label>
                {invManual && <NumIn label="AC (kW)/ตัว" value={invManKw} step="0.1" onChange={setInvManKw} />}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Stepper label="จำนวนตัว" value={invQty} onDec={() => setInvQty(Math.max(1, invQty - 1))} onInc={() => setInvQty(invQty + 1)} />
                <div>
                  <div className="text-[11px] text-[#6e6e73] mb-0.5">AC รวม</div>
                  <div className="rounded-lg border border-[#e8e8ed] px-2 py-1.5 text-[13px] font-semibold text-[#1d1d1f]">{totalAc} kW</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[#6e6e73] mb-1">ชนิดระบบ</div>
                <div className="flex gap-1">
                  {[["ongrid", "ออนกริด"], ["hybrid", "ไฮบริด"], ["offgrid", "ออฟกริด"]].map(([k, lb]) => (
                    <button key={k} onClick={() => setSysType(k)}
                      className={`flex-1 text-[12px] rounded-lg border px-1.5 py-1 ${sysType === k ? "border-[#F5821F] text-[#F5821F] font-semibold" : "border-[#e8e8ed] text-[#6e6e73]"}`}>{lb}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[#f7f7f8] px-2.5 py-2">
                <span className="text-[12px] text-[#6e6e73]">DC/AC ratio</span>
                <span className="text-[15px] font-bold" style={{ color: dcacColor }}>{dcac || "—"}</span>
              </div>
              <div className="text-[11px]" style={{ color: dcacColor }}>
                {dcac === 0 ? "ใส่ขนาดอินเวอร์เตอร์เพื่อดูอัตราส่วน"
                  : dcac < 1.0 ? "อินเวอร์เตอร์ใหญ่เกินแผง (ราคาสูงเกินจำเป็น)"
                  : dcac <= 1.35 ? "อัตราส่วนเหมาะสม (1.0–1.35)"
                  : "แผงเยอะเกินอินเวอร์เตอร์ — เพิ่มตัว/ขนาด หรือถอดแผง"}
              </div>
            </div>
          </div>

          {/* ผลผลิต */}
          <div className="card p-4 mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[#1d1d1f]">ผลผลิตต่อปี</div>
              <div className="text-[12px] text-[#6e6e73]">{num(layout.count)} แผง · {num(kwp)} kWp · DC/AC {dcac || "—"}</div>
            </div>
            <button onClick={calcProduction} disabled={loading || kwp <= 0}
              className="w-full rounded-xl bg-[#F5821F] text-white text-sm py-2.5 font-semibold disabled:opacity-50">
              {loading ? "กำลังคำนวณจากแดดจริง…" : "☀︎ คำนวณผลผลิต"}
            </button>
            {result ? (
              <div className="grid md:grid-cols-2 gap-4 items-center">
                <div>
                  <div className="text-center py-1">
                    <div className="text-3xl font-bold text-[#1d1d1f]">{num(result.annual)}</div>
                    <div className="text-[12px] text-[#6e6e73]">kWh / ปี · {num(specYield)} kWh/kWp</div>
                  </div>
                  {shadeFactor < 0.999 && (
                    <div className="text-center rounded-xl bg-[#fff6ef] py-2 mt-1">
                      <div className="text-xl font-bold text-[#F5821F]">{num(annualNet)}</div>
                      <div className="text-[11px] text-[#6e6e73]">kWh / ปี หลังหักเงา ({((1 - shadeFactor) * 100).toFixed(0)}% เสียเงา)</div>
                    </div>
                  )}
                  <div className="text-[11px] text-[#a1a1a6] mt-1">{result.source}</div>
                  <button onClick={saveDesign} className="w-full rounded-xl border border-[#e8e8ed] text-[13px] py-2 font-medium text-[#1d1d1f] mt-2">
                    {saved ? "✓ บันทึกแล้ว" : "บันทึกดีไซน์"}
                  </button>
                  {saved && <a href="/quote" className="block text-center text-[12px] text-[#F5821F] font-semibold mt-1">ไปทำใบเสนอราคา →</a>}
                </div>
                {result.monthly && <MonthlyChart data={result.monthly} />}
              </div>
            ) : (
              <div className="text-[12px] text-[#6e6e73] text-center py-3">กดปุ่มเพื่อดึงข้อมูลแดดจริงของพิกัดนี้ (PVGIS)</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, big, accent }) {
  return (
    <div>
      <div className={`font-bold ${big ? "text-xl" : "text-base"} ${accent ? "text-[#F5821F]" : "text-[#1d1d1f]"}`}>{value}</div>
      <div className="text-[11px] text-[#6e6e73]">{label}</div>
    </div>
  );
}
function Stepper({ label, value, onDec, onInc }) {
  return (
    <div>
      <div className="text-[11px] text-[#6e6e73] mb-0.5">{label}</div>
      <div className="flex items-center rounded-lg border border-[#e8e8ed] overflow-hidden">
        <button onClick={onDec} className="px-2.5 py-1 text-[#1d1d1f] hover:bg-[#f2f2f4]">−</button>
        <div className="flex-1 text-center text-[14px] font-semibold text-[#1d1d1f]">{value}</div>
        <button onClick={onInc} className="px-2.5 py-1 text-[#1d1d1f] hover:bg-[#f2f2f4]">＋</button>
      </div>
    </div>
  );
}
function NumIn({ label, value, onChange, step }) {
  return (
    <div>
      <div className="text-[11px] text-[#6e6e73] mb-0.5">{label}</div>
      <input type="number" step={step || "1"} value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)}
        className="w-full rounded-lg border border-[#e8e8ed] px-2 py-1.5 text-[13px] outline-none focus:border-[#F5821F]" />
    </div>
  );
}
function MonthlyChart({ data }) {
  const mx = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-28 pt-1">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-t bg-[#F5821F]" style={{ height: `${(v / mx) * 100}%`, minHeight: 2 }} title={`${MONTHS[i]}: ${v} kWh`} />
          <div className="text-[8px] text-[#a1a1a6]">{MONTHS[i][0]}</div>
        </div>
      ))}
    </div>
  );
}
