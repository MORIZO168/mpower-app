// แปลงกำลังติดตั้งสะสม (kWp) เป็นผลกระทบ — ใช้ค่ามาตรฐาน (ปรับได้)
export const FACTORS = {
  yield_kwh_per_kwp: 1450,   // ผลผลิตต่อ kWp ต่อปี (ไทย แดดดี)
  grid_tco2_per_mwh: 0.50,   // ค่าการปล่อยของกริดไทย (~0.4999)
  co2_kg_per_tree_yr: 21.77, // ต้นไม้ดูดซับ CO2 ต่อปี
  home_kwh_yr: 4200,         // ครัวเรือนไทยเฉลี่ย/ปี
  car_tco2_yr: 2.4,          // รถยนต์เฉลี่ย/ปี
  baht_per_kwh: 4.2,         // ค่าไฟเฉลี่ย
};

// รับ array ของงานติดตั้ง [{kwp}] หรือผลรวม kWp
export function impact(installedKwp) {
  const f = FACTORS;
  const kwhYr = installedKwp * f.yield_kwh_per_kwp;
  const mwhYr = kwhYr / 1000;
  const tco2 = mwhYr * f.grid_tco2_per_mwh;
  return {
    kwp: installedKwp,
    mwp: installedKwp / 1000,
    gwhYr: mwhYr / 1000,
    tco2Yr: Math.round(tco2),
    trees: Math.round((tco2 * 1000) / f.co2_kg_per_tree_yr),
    homes: Math.round(kwhYr / f.home_kwh_yr),
    cars: Math.round(tco2 / f.car_tco2_yr),
    bahtSavedYr: Math.round(kwhYr * f.baht_per_kwh),
  };
}

// ข้อมูลสะสมตัวอย่าง (ภายหลังดึงผลรวม kWp จากชีตงานที่ติดตั้งแล้ว)
export const INSTALLED = { projects: 312, kwp: 4820 };
