// lib/sun.js — ตำแหน่งดวงอาทิตย์ (NOAA solar position) + ตารางสุ่มแดดทั้งปีสำหรับวิเคราะห์เงา
// ล้วนเป็นฟังก์ชันบริสุทธิ์ (ไม่พึ่ง three.js / DOM) เพื่อทดสอบได้
// พิกัดฉาก 3 มิติของฉาก: X=ตะวันออก, Y=ขึ้นบน, Z=เหนือ
// azimuth: วัดจากทิศเหนือ ตามเข็มนาฬิกา (0=เหนือ, 90=ตะวันออก, 180=ใต้, 270=ตะวันตก)

const RAD = Math.PI / 180;

// ---- ตำแหน่งดวงอาทิตย์จากวันเวลา (UTC instant) + พิกัด ----
// คืน { altitude, azimuth } เป็น "องศา" (altitude<0 = ใต้ขอบฟ้า)
export function sunPosition(date, lat, lng) {
  const JD = date.getTime() / 86400000 + 2440587.5; // JS epoch(ms) -> Julian Day (UTC)
  const T = (JD - 2451545.0) / 36525.0;
  const L0 = mod360(280.46646 + T * (36000.76983 + T * 0.0003032));
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Mr = M * RAD;
  const C =
    Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mr) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(appLong * RAD)); // radians
  // equation of time (นาที)
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const L0r = L0 * RAD;
  const eqTime =
    (4 / RAD) *
    (y * Math.sin(2 * L0r) -
      2 * e * Math.sin(Mr) +
      4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r) -
      0.5 * y * y * Math.sin(4 * L0r) -
      1.25 * e * e * Math.sin(2 * Mr));
  const minUTC = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const trueSolar = mod(minUTC + eqTime + 4 * lng, 1440); // lng ตะวันออก +
  let ha = trueSolar / 4 - 180; // องศา (ลบ=เช้า)
  if (ha < -180) ha += 360;
  const har = ha * RAD;
  const latR = lat * RAD;
  const zenith = Math.acos(
    Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(har)
  );
  const altitude = 90 - zenith / RAD;
  let azSouth = Math.atan2(
    Math.sin(har),
    Math.cos(har) * Math.sin(latR) - Math.tan(decl) * Math.cos(latR)
  ) / RAD; // จากทิศใต้ ไปตะวันตก +
  const azimuth = mod360(azSouth + 180); // จากทิศเหนือ ตามเข็ม
  return { altitude, azimuth };
}

// ---- เวกเตอร์ทิศไปยังดวงอาทิตย์ (พิกัดฉาก X=ตอ.,Y=ขึ้น,Z=เหนือ) ----
export function sunDir(altitudeDeg, azimuthDeg) {
  const a = altitudeDeg * RAD, z = azimuthDeg * RAD;
  return [Math.cos(a) * Math.sin(z), Math.sin(a), Math.cos(a) * Math.cos(z)];
}

// ---- ความเข้มลำแสงตรง (beam normal, kW/m²) ท้องฟ้าโปร่ง โดยประมาณ ----
// ใช้ air-mass model ง่าย ๆ: 1.353 * 0.7^(AM^0.678)
export function clearSkyBeam(altitudeDeg) {
  if (altitudeDeg <= 3) return 0; // ต่ำมาก ตัดทิ้ง (แสงอ่อน+บังกันเยอะ)
  const am = 1 / Math.sin(altitudeDeg * RAD);
  return 1.353 * Math.pow(0.7, Math.pow(am, 0.678));
}

// ---- ตารางสุ่มแดดทั้งปี: วันตัวแทน 12 เดือน × ทุก stepMin นาที (เฉพาะกลางวัน) ----
// คืน [{ dir:[x,y,z], weight }] โดย weight = beam × ชั่วโมงต่อ step × จำนวนวันที่เดือนนั้นแทน
// tzHours = เขตเวลาไซต์ (ไทย +7)
export function annualSamples(lat, lng, tzHours = 7, stepMin = 30) {
  const out = [];
  const stepH = stepMin / 60;
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let m = 0; m < 12; m++) {
    const dom = 15; // กลางเดือน
    for (let min = 5 * 60; min <= 19 * 60; min += stepMin) {
      const localH = Math.floor(min / 60), localM = min % 60;
      // สร้าง Date เป็น UTC instant จากเวลาไซต์ - tz
      const d = new Date(Date.UTC(2025, m, dom, localH, localM, 0) - tzHours * 3600000);
      const { altitude, azimuth } = sunPosition(d, lat, lng);
      const beam = clearSkyBeam(altitude);
      if (beam <= 0) continue;
      out.push({ dir: sunDir(altitude, azimuth), weight: beam * stepH * daysInMonth[m], alt: altitude, az: azimuth });
    }
  }
  return out;
}

// ---- รวมค่าการรับแดด: (ผลรวม weight ที่ไม่โดนบัง) / (ผลรวม weight ทั้งหมด) → 0..1 ----
export function exposureFactor(samples, isBlockedFn) {
  let tot = 0, open = 0;
  for (const s of samples) {
    tot += s.weight;
    if (!isBlockedFn(s.dir)) open += s.weight;
  }
  return tot > 0 ? open / tot : 1;
}

// ---- สีจากค่าการรับแดด 0..1 (แดง=บังเยอะ → เขียว=โล่ง) คืน hex ----
export function exposureColor(f) {
  const t = Math.max(0, Math.min(1, f));
  // แดง (0.85) -> เหลือง (0.93) -> เขียว (1.0)
  let r, g;
  if (t < 0.9) { const k = (t - 0.6) / 0.3; r = 220; g = Math.round(60 + 180 * Math.max(0, Math.min(1, k))); }
  else { const k = (t - 0.9) / 0.1; r = Math.round(220 - 190 * Math.max(0, Math.min(1, k))); g = 200; }
  return "#" + [r, g, 60].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function mod(a, n) { return ((a % n) + n) % n; }
function mod360(a) { return mod(a, 360); }
