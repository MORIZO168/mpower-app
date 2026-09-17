// lib/solar.js — เครื่องมือคำนวณสำหรับหน้าออกแบบหลังคา (Phase 1)
// ล้วนเป็นฟังก์ชันบริสุทธิ์ (ไม่แตะ DOM / network) เพื่อทดสอบง่ายและใช้ซ้ำได้
// หน่วยพิกัด: lat/lng (องศา) — ภายในแปลงเป็นเมตรบนระนาบสัมผัสท้องถิ่น (local tangent plane)

const R_LAT = 111320; // เมตรต่อ 1 องศาละติจูด (คงที่พอใช้ที่สเกลหลังคา)

// ---- แปลง lat/lng <-> เมตร (x=ตะวันออก, y=เหนือ) รอบจุดอ้างอิง ref ----
export function toXY(pt, ref) {
  const mPerLng = R_LAT * Math.cos((ref.lat * Math.PI) / 180);
  return {
    x: (pt.lng - ref.lng) * mPerLng,
    y: (pt.lat - ref.lat) * R_LAT,
  };
}
export function toLatLng(xy, ref) {
  const mPerLng = R_LAT * Math.cos((ref.lat * Math.PI) / 180);
  return {
    lat: ref.lat + xy.y / R_LAT,
    lng: ref.lng + xy.x / mPerLng,
  };
}

// ---- centroid ของ polygon (lat/lng) แบบเฉลี่ยง่าย ๆ ----
export function centroid(pts) {
  if (!pts.length) return { lat: 13.7563, lng: 100.5018 };
  const s = pts.reduce((a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: s.lat / pts.length, lng: s.lng / pts.length };
}

// ---- พื้นที่ polygon (ตร.ม.) ด้วย shoelace บนระนาบเมตร ----
export function areaM2(pts) {
  if (pts.length < 3) return 0;
  const ref = centroid(pts);
  const xy = pts.map((p) => toXY(p, ref));
  let a = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    a += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  return Math.abs(a) / 2;
}

// ---- ความยาวขอบแต่ละด้าน (เมตร) ----
export function edgeLengths(pts) {
  if (pts.length < 2) return [];
  const ref = centroid(pts);
  const xy = pts.map((p) => toXY(p, ref));
  const out = [];
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    out.push(Math.hypot(xy[j].x - xy[i].x, xy[j].y - xy[i].y));
  }
  return out;
}

// ---- ทิศ (bearing 0=เหนือ, 90=ตะวันออก) ของเวกเตอร์ a->b ----
export function bearing(a, b, ref) {
  const A = toXY(a, ref), B = toXY(b, ref);
  let deg = (Math.atan2(B.x - A.x, B.y - A.y) * 180) / Math.PI; // atan2(east,north)
  return (deg + 360) % 360;
}

// ---- เดาทิศที่แผงหันจาก "ขอบยาวสุด" (สมมติเป็นสันหลังคา/ชายคา แผงหันตั้งฉาก) ----
// คืนค่า compass azimuth (0=N,90=E,180=S,270=W) โดยเลือกด้านที่ค่อนไปทางใต้ (ซีกโลกเหนือรับแดดดีสุด)
export function suggestAzimuth(pts) {
  if (pts.length < 2) return 180;
  const ref = centroid(pts);
  const els = edgeLengths(pts);
  let mi = 0;
  for (let i = 1; i < els.length; i++) if (els[i] > els[mi]) mi = i;
  const a = pts[mi], b = pts[(mi + 1) % pts.length];
  const edgeBear = bearing(a, b, ref);
  // ตั้งฉากสองทาง
  const perp1 = (edgeBear + 90) % 360;
  const perp2 = (edgeBear + 270) % 360;
  // เลือกอันที่ใกล้ทิศใต้ (180) มากกว่า
  const d = (x) => Math.min(Math.abs(x - 180), 360 - Math.abs(x - 180));
  return d(perp1) <= d(perp2) ? Math.round(perp1) : Math.round(perp2);
}

// ---- แปลง compass azimuth -> PVGIS aspect (0=ใต้,90=ตะวันตก,-90=ตะวันออก,180=เหนือ) ----
export function toPvgisAspect(azCompass) {
  let a = ((azCompass - 180) % 360 + 360) % 360; // 0..360, 0=ใต้
  if (a > 180) a -= 360; // -180..180
  return Math.round(a);
}

// ---- ป้ายทิศไทยจาก compass azimuth ----
export function azimuthLabel(az) {
  const names = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
  const i = Math.round(((az % 360) / 45)) % 8;
  return names[i];
}

// ---- point-in-polygon (ray casting) บนพิกัดเมตร ----
function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const hit = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

// ---- จัดแผงลงหลังคาแบบอัตโนมัติ (grid packing) ----
// pts: ขอบหลังคา (lat/lng)
// panel: { w, h } เมตร (แนวตั้งค่าเริ่ม: w=ด้านกว้าง, h=ด้านยาว)
// opts: { orientation:'auto'|'portrait'|'landscape', setback:เว้นขอบ(ม.), rowGap:ช่องว่างแถว(ม.) }
// คืน: { count, kwp?, orientation, rects:[{corners:[latlng x4]}] }
export function packPanels(pts, panel, wattP, opts = {}) {
  const setback = opts.setback ?? 0.3;
  const rowGap = opts.rowGap ?? 0; // หลังคาลาด แผงแนบระนาบ = 0; ดาดฟ้าตั้งแร็ค = ใส่ค่า
  const colGap = opts.colGap ?? 0.02;
  if (pts.length < 3 || !panel?.w || !panel?.h) return { count: 0, orientation: "portrait", rects: [] };

  const ref = centroid(pts);
  const poly = pts.map((p) => toXY(p, ref));
  const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);

  const tryOrient = (pw, ph, tag) => {
    const cw = pw + colGap, ch = ph + rowGap;
    const rects = [];
    // ไล่กริดจากมุมล่างซ้าย เผื่อ setback
    for (let y = minY + setback; y + ph <= maxY - setback + 1e-6; y += ch) {
      for (let x = minX + setback; x + pw <= maxX - setback + 1e-6; x += cw) {
        // ต้องอยู่ในรูปครบทั้ง 4 มุม + จุดกึ่งกลาง
        const c = [
          { x, y }, { x: x + pw, y }, { x: x + pw, y: y + ph }, { x, y: y + ph },
          { x: x + pw / 2, y: y + ph / 2 },
        ];
        if (c.every((pt) => inPoly(pt.x, pt.y, poly))) {
          rects.push([
            toLatLng({ x, y }, ref),
            toLatLng({ x: x + pw, y }, ref),
            toLatLng({ x: x + pw, y: y + ph }, ref),
            toLatLng({ x, y: y + ph }, ref),
          ]);
        }
      }
    }
    return { count: rects.length, orientation: tag, rects };
  };

  const portrait = tryOrient(panel.w, panel.h, "portrait");
  if (opts.orientation === "portrait") return withKwp(portrait, wattP);
  const landscape = tryOrient(panel.h, panel.w, "landscape");
  if (opts.orientation === "landscape") return withKwp(landscape, wattP);
  return withKwp(portrait.count >= landscape.count ? portrait : landscape, wattP);
}
function withKwp(res, wattP) {
  res.kwp = wattP ? +((res.count * wattP) / 1000).toFixed(2) : undefined;
  return res;
}

// ---- อ่านสเปคแผงจากข้อความ Spec ในฐานอุปกรณ์ (ยืดหยุ่น + มีค่าเริ่มสำรอง) ----
// รองรับ: "580W" "580 Wp" "580วัตต์" ; ขนาด "2278x1134" "2.28x1.13" "2278*1134*30mm"
// คืน { watt, w, h }  (w,h เป็นเมตร) ; ถ้าอ่านไม่ได้ใช้ค่าเริ่ม 600W, 2.28x1.13
export function parsePanelSpec(spec) {
  const s = String(spec || "");
  let watt = null, w = null, h = null;
  const mW = s.match(/(\d{3,4})\s*(?:w|wp|วัตต์|watt)/i);
  if (mW) watt = +mW[1];
  // ขนาด: จับคู่ตัวเลข x ตัวเลข (เอาสองตัวแรก)
  const mD = s.match(/(\d{3,4}(?:\.\d+)?)\s*[x×*]\s*(\d{3,4}(?:\.\d+)?)/i);
  if (mD) {
    let a = +mD[1], b = +mD[2];
    // ถ้าเป็นมิลลิเมตร (>100) แปลงเป็นเมตร
    if (a > 100) a /= 1000;
    if (b > 100) b /= 1000;
    // แผงมาตรฐาน: ยาว > กว้าง — จัดให้ w=สั้น, h=ยาว
    w = Math.min(a, b);
    h = Math.max(a, b);
  }
  return {
    watt: watt || 600,
    w: w || 1.134,
    h: h || 2.278,
    parsed: { watt: !!watt, dim: !!(w && h) },
  };
}

// ---- ประมาณผลผลิตเบื้องต้นแบบออฟไลน์ (เมื่อ PVGIS ล่ม) : specific yield กทม. ~1450 kWh/kWp/ปี ----
export function offlineAnnual(kwp, tilt = 15, az = 180) {
  const base = 1450;
  const tiltPen = 1 - Math.min(Math.abs(tilt - 15), 40) * 0.004;
  const d = Math.min(Math.abs(az - 180), 360 - Math.abs(az - 180));
  const azPen = 1 - (d / 90) * 0.18;
  return Math.round(kwp * base * tiltPen * azPen);
}

// ---- ทิศ/มุมเอียงที่เหมาะสุดสำหรับดาดฟ้า (ตั้งแร็คเองได้) แถวกรุงเทพ ----
export const OPTIMAL_FLAT = { tilt: 15, az: 180 }; // ~15° หันใต้

export const BKK = { lat: 13.7563, lng: 100.5018 };
