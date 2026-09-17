"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import Roof3D from "@/components/Roof3D";
import {
  areaM2, edgeLengths, centroid, suggestAzimuth, azimuthLabel,
  toPvgisAspect, packPanels, parsePanelSpec, offlineAnnual, OPTIMAL_FLAT, BKK,
} from "@/lib/solar";

const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const num = (n) => Number(n || 0).toLocaleString("th-TH");

export default function DesignClient({ panels = [], center }) {
  const start = center && center.lat ? center : BKK;
  const mapEl = useRef(null);
  const map = useRef(null);
  const L = useRef(null);
  const polyLayer = useRef(null);
  const vertLayer = useRef(null);
  const panelLayer = useRef(null);
  const drawingRef = useRef(false);
  const ptsRef = useRef([]);

  const [ready, setReady] = useState(false);
  const [pts, setPts] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [roofType, setRoofType] = useState("pitched"); // pitched | flat
  const [tilt, setTilt] = useState(15);
  const [az, setAz] = useState(180);
  const [azLocked, setAzLocked] = useState(false);
  const [loss, setLoss] = useState(14);
  const [panelIdx, setPanelIdx] = useState(0);
  const [manual, setManual] = useState(false);
  const [mWatt, setMWatt] = useState(600);
  const [mW, setMW] = useState(1.134);
  const [mH, setMH] = useState(2.278);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState("2d"); // 2d | 3d
  const [shadeFactor, setShadeFactor] = useState(1);

  // ---- สเปคแผงปัจจุบัน ----
  const panelSpec = useMemo(() => {
    if (manual || !panels.length) return { watt: mWatt, w: mW, h: mH, parsed: { watt: true, dim: true } };
    const p = panels[panelIdx] || panels[0];
    return parsePanelSpec(p?.Spec || p?.spec || "");
  }, [manual, mWatt, mW, mH, panels, panelIdx]);

  // ---- เรขาคณิตหลังคา ----
  const area = useMemo(() => areaM2(pts), [pts]);
  const edges = useMemo(() => edgeLengths(pts), [pts]);
  const layout = useMemo(() => {
    if (pts.length < 3) return { count: 0, kwp: 0, orientation: "portrait", rects: [] };
    return packPanels(pts, { w: panelSpec.w, h: panelSpec.h }, panelSpec.watt, {
      setback: 0.3, rowGap: roofType === "flat" ? panelSpec.h * 0.4 : 0,
    });
  }, [pts, panelSpec, roofType]);

  // ---- โหลด Leaflet + สร้างแผนที่ ----
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

  // ---- sync refs ----
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);
  useEffect(() => { ptsRef.current = pts; }, [pts]);

  // ---- วาด polygon + จุดมุม (ลากปรับได้) ----
  useEffect(() => {
    if (!ready || !L.current) return;
    const Ll = L.current;
    polyLayer.current.clearLayers();
    vertLayer.current.clearLayers();
    if (pts.length >= 2) {
      const line = pts.map((p) => [p.lat, p.lng]);
      Ll.polygon(line, { color: "#F5821F", weight: 2, fillColor: "#F5821F", fillOpacity: 0.12 }).addTo(polyLayer.current);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, ready]);

  // ---- วาดแผงบนหลังคา ----
  useEffect(() => {
    if (!ready || !L.current) return;
    panelLayer.current.clearLayers();
    layout.rects.forEach((r) => {
      L.current.polygon(r.map((c) => [c.lat, c.lng]), {
        color: "#0b3d91", weight: 1, fillColor: "#1e5bd6", fillOpacity: 0.72,
      }).addTo(panelLayer.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, ready]);

  // ---- auto azimuth เมื่อยังไม่ล็อก + หลังคาลาด ----
  useEffect(() => {
    if (roofType === "flat") { if (!azLocked) setAz(OPTIMAL_FLAT.az); return; }
    if (!azLocked && pts.length >= 3) setAz(suggestAzimuth(pts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts, roofType]);

  const kwp = layout.kwp || 0;

  function startDraw() {
    setPts([]); ptsRef.current = []; setResult(null); setSaved(false);
    setDrawing(true);
  }
  function finishDraw() { setDrawing(false); }
  function clearAll() { setDrawing(false); setPts([]); ptsRef.current = []; setResult(null); setSaved(false); }
  function undoPt() { const n = ptsRef.current.slice(0, -1); ptsRef.current = n; setPts(n); }
  function switchView(v) {
    setView(v);
    if (v === "2d") setTimeout(() => { try { map.current && map.current.invalidateSize(); } catch (e) {} }, 60);
  }

  function extractLatLng(s) {
    // รองรับ: "13.88, 100.28" หรือ ลิงก์ Google Maps (@lat,lng / q=lat,lng / !3dlat!4dlng)
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
    // พิกัด / ลิงก์ Google Maps → กระโดดไปเลย
    const ll = extractLatLng(q);
    if (ll && map.current) { map.current.setView([ll.lat, ll.lng], 20); return; }
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=th&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
      const d = await r.json();
      if (d && d[0] && map.current) map.current.setView([+d[0].lat, +d[0].lon], 20);
    } catch (e) { /* ปล่อยให้ผู้ใช้เลื่อนแผนที่เอง */ }
    setSearching(false);
  }

  async function calcProduction() {
    if (kwp <= 0) return;
    setLoading(true); setResult(null);
    const c = centroid(pts);
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
    const c = centroid(pts);
    const design = {
      at: new Date().toISOString(), area: Math.round(area), panels: layout.count, kwp,
      panelWatt: panelSpec.watt, orientation: layout.orientation, roofType, tilt, azimuth: az,
      lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6),
      annual: result?.annual || offlineAnnual(kwp, tilt, az),
      shadeFactor: +shadeFactor.toFixed(3),
      annualNet: Math.round((result?.annual || offlineAnnual(kwp, tilt, az)) * shadeFactor),
    };
    try { localStorage.setItem("mpower_design", JSON.stringify(design)); setSaved(true); } catch (e) {}
  }

  const specYield = result && kwp ? Math.round(result.annual / kwp) : 0;
  const annualNet = result ? Math.round(result.annual * shadeFactor) : 0;
  const canDraw = pts.length >= 3;

  return (
    <div className="p-3 md:p-5 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ออกแบบหลังคา</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">วาดหลังคาบนภาพดาวเทียม · จัดแผงอัตโนมัติ · คำนวณผลผลิตจากแดดจริง</p>
        </div>
        <span className="ml-auto pill pill-mut">Phase 1</span>
      </div>

      {/* ค้นหาที่อยู่ */}
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

      {/* สลับมุมมอง 2D/3D */}
      {pts.length >= 3 && (
        <div className="flex gap-2 mb-3">
          {[["2d", "🗺️ แผนที่ 2D"], ["3d", "🧊 3D + เงา"]].map(([k, lb]) => (
            <button key={k} onClick={() => switchView(k)}
              className={`rounded-xl px-4 py-1.5 text-[13px] font-medium border ${view === k ? "border-[#F5821F] bg-[#fff6ef] text-[#F5821F]" : "border-[#e8e8ed] text-[#6e6e73]"}`}>
              {lb}
            </button>
          ))}
        </div>
      )}

      {/* มุมมอง 3D */}
      {view === "3d" && pts.length >= 3 && (
        <div className="mb-3">
          <Roof3D pts={pts} tilt={tilt} az={az} rects={layout.rects} center={centroid(pts)} roofType={roofType} onShading={setShadeFactor} />
        </div>
      )}

      {/* แผนที่ */}
      <div className="card overflow-hidden mb-3 relative" style={{ display: view === "3d" ? "none" : "block" }}>
        <div ref={mapEl} style={{ height: "52vh", minHeight: 320, width: "100%" }} />
        {/* แถบเครื่องมือวาด ลอยบนแผนที่ */}
        <div className="absolute z-[500] left-3 top-3 flex gap-2">
          {!drawing ? (
            <button onClick={startDraw} className="rounded-full bg-[#F5821F] text-white text-sm px-4 py-2 font-semibold shadow-lg">
              {pts.length ? "วาดใหม่" : "＋ เริ่มวาดหลังคา"}
            </button>
          ) : (
            <>
              <button onClick={finishDraw} disabled={pts.length < 3} className="rounded-full bg-[#1a7d3a] text-white text-sm px-4 py-2 font-semibold shadow-lg disabled:opacity-50">
                ✓ เสร็จ ({pts.length} มุม)
              </button>
              <button onClick={undoPt} disabled={!pts.length} className="rounded-full bg-white text-[#1d1d1f] text-sm px-3 py-2 font-medium shadow-lg disabled:opacity-40">ย้อน</button>
            </>
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
      </div>

      {/* เมื่อยังไม่วาด */}
      {pts.length < 3 && !drawing && (
        <div className="card p-5 text-center text-sm text-[#6e6e73]">
          เริ่มจากเลื่อนแผนที่ไปที่บ้านลูกค้า แล้วกด <b className="text-[#F5821F]">＋ เริ่มวาดหลังคา</b> แตะไปตามมุมหลังคาทีละมุม
        </div>
      )}

      {/* แผงควบคุม + ผลลัพธ์ */}
      {pts.length >= 3 && (
        <div className="grid md:grid-cols-3 gap-3">
          {/* ซ้าย: ค่าหลังคา */}
          <div className="card p-4 space-y-3">
            <div className="font-semibold text-[#1d1d1f]">หลังคา</div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="พื้นที่" value={`${num(Math.round(area))} ตร.ม.`} />
              <Metric label="มุม" value={`${pts.length} จุด`} />
            </div>
            <div className="text-[12px] text-[#6e6e73]">
              ด้าน: {edges.map((e) => e.toFixed(1)).join(" · ")} ม.
            </div>

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

            {/* มุมเอียง */}
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

            {/* ทิศ */}
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-[#6e6e73]">ทิศที่แผงหัน</span>
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

          {/* กลาง: แผง + การจัดวาง */}
          <div className="card p-4 space-y-3">
            <div className="font-semibold text-[#1d1d1f]">แผงและการจัดวาง</div>
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
                  <span className="text-[#c86a1a]"> · อ่านสเปคไม่ครบ ใช้ค่ามาตรฐาน — แนะนำกรอกเอง</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Metric label="จำนวนแผง" value={num(layout.count)} big />
              <Metric label="ขนาดติดตั้ง" value={`${num(kwp)} kWp`} big accent />
            </div>
            <div className="text-[12px] text-[#6e6e73]">
              วาง{layout.orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"} · เว้นขอบ 0.3 ม.{roofType === "flat" ? " · เว้นแถวกันเงา" : " · แนบระนาบหลังคา"}
            </div>
          </div>

          {/* ขวา: ผลผลิต */}
          <div className="card p-4 space-y-3">
            <div className="font-semibold text-[#1d1d1f]">ผลผลิตต่อปี</div>
            <button onClick={calcProduction} disabled={loading || kwp <= 0}
              className="w-full rounded-xl bg-[#F5821F] text-white text-sm py-2.5 font-semibold disabled:opacity-50">
              {loading ? "กำลังคำนวณจากแดดจริง…" : "☀︎ คำนวณผลผลิต"}
            </button>

            {result ? (
              <>
                <div className="text-center py-1">
                  <div className="text-3xl font-bold text-[#1d1d1f]">{num(result.annual)}</div>
                  <div className="text-[12px] text-[#6e6e73]">kWh / ปี · {num(specYield)} kWh/kWp</div>
                </div>
                {shadeFactor < 0.999 && (
                  <div className="text-center rounded-xl bg-[#fff6ef] py-2">
                    <div className="text-xl font-bold text-[#F5821F]">{num(annualNet)}</div>
                    <div className="text-[11px] text-[#6e6e73]">kWh / ปี หลังหักเงา ({((1 - shadeFactor) * 100).toFixed(0)}% เสียเงา)</div>
                  </div>
                )}
                {result.monthly && <MonthlyChart data={result.monthly} />}
                <div className="text-[11px] text-[#a1a1a6]">{result.source}</div>
                <button onClick={saveDesign} className="w-full rounded-xl border border-[#e8e8ed] text-[13px] py-2 font-medium text-[#1d1d1f]">
                  {saved ? "✓ บันทึกแล้ว" : "บันทึกดีไซน์"}
                </button>
                {saved && <a href="/quote" className="block text-center text-[12px] text-[#F5821F] font-semibold">ไปทำใบเสนอราคา →</a>}
              </>
            ) : (
              <div className="text-[12px] text-[#6e6e73] text-center py-4">
                กดปุ่มเพื่อดึงข้อมูลแดดจริงของพิกัดนี้ (PVGIS)
              </div>
            )}
          </div>
        </div>
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
    <div className="flex items-end gap-1 h-24 pt-1">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full rounded-t bg-[#F5821F]" style={{ height: `${(v / mx) * 100}%`, minHeight: 2 }} title={`${MONTHS[i]}: ${v} kWh`} />
          <div className="text-[8px] text-[#a1a1a6]">{MONTHS[i][0]}</div>
        </div>
      ))}
    </div>
  );
}
