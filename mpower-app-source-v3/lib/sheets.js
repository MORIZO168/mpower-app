// ===== Google Sheets connector (ปลอดภัย: ID-keyed + header-mapped + read-back verify) =====
// ไม่พึ่ง npm package — เซ็น JWT ด้วย Node crypto เอง แล้วเรียก Sheets REST API
// ต้องตั้ง env บน Vercel: GOOGLE_SA_EMAIL, GOOGLE_SA_KEY, MPOWER_SHEET_ID

import crypto from "crypto";

const SHEET_ID = process.env.MPOWER_SHEET_ID;
const SA_EMAIL = process.env.GOOGLE_SA_EMAIL;
const SA_KEY = (process.env.GOOGLE_SA_KEY || "").split(String.fromCharCode(92) + "n").join(String.fromCharCode(10));

export function isConfigured() {
  return !!(SHEET_ID && SA_EMAIL && SA_KEY);
}

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").split("+").join("-").split("/").join("_");
}

function colLetter(n) {
  let s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s || "A";
}

let _token = null, _exp = 0;
async function getToken() {
  if (_token && Date.now() < _exp - 60000) return _token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const unsigned = `${header}.${claim}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(SA_KEY);
  const jwt = `${unsigned}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("auth failed: " + JSON.stringify(j).slice(0, 150));
  _token = j.access_token; _exp = Date.now() + j.expires_in * 1000;
  return _token;
}

async function api(path, opt = {}) {
  const token = await getToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    ...opt,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opt.headers || {}) },
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`Sheets ${res.status}: ${JSON.stringify(j).slice(0, 150)}`);
  return j;
}

const A1 = (tab, range) => encodeURIComponent(`${tab}!${range}`);

// อ่านทั้งแท็บ → { headers, rows:[{...ค่าตามหัวคอลัมน์, _row}] }
// หมายเหตุ: ชีต MPOWER_DATABASE มีแถว 1 เป็นโน้ต หัวตารางจริงอยู่แถว 2 → default = 2
export async function getRows(tab, headerRow = 2) {
  const j = await api(`/values/${A1(tab, "A1:ZZ")}`);
  const vals = j.values || [];
  const headers = vals[headerRow - 1] || [];
  const rows = [];
  for (let i = headerRow; i < vals.length; i++) {
    const obj = {};
    headers.forEach((h, c) => { obj[h] = vals[i][c] ?? ""; });
    obj._row = i + 1;
    rows.push(obj);
  }
  return { headers, rows };
}

// เพิ่มแถวใหม่ (ต่อท้าย) — ตรวจ required + verify ว่าหาเจอด้วย idField
export async function appendRow(tab, obj, { required = [], idField } = {}) {
  for (const f of required) if (obj[f] === undefined || obj[f] === "") throw new Error(`ขาดฟิลด์จำเป็น: ${f}`);
  const { headers } = await getRows(tab);
  const arr = headers.map((h) => obj[h] ?? "");
  await api(`/values/${A1(tab, "A1")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST", body: JSON.stringify({ values: [arr] }),
  });
  if (idField) {
    const { rows } = await getRows(tab);
    const found = rows.find((r) => r[idField] === obj[idField]);
    if (!found) throw new Error("เขียนแล้วแต่ verify ไม่เจอ");
    return found;
  }
  return true;
}

// อัปเดตตาม ID (หาแถวจาก idField เท่านั้น ไม่ใช้เลขแถวภายนอก) + read-back verify
export async function updateRow(tab, idField, idValue, patch) {
  const { headers, rows } = await getRows(tab);
  const target = rows.find((r) => r[idField] === idValue);
  if (!target) throw new Error(`ไม่พบ ${idField}=${idValue}`);
  const merged = { ...target, ...patch };
  const arr = headers.map((h) => merged[h] ?? "");
  const rowNum = target._row;
  const lastCol = colLetter(headers.length);
  await api(`/values/${A1(tab, `A${rowNum}:${lastCol}${rowNum}`)}?valueInputOption=USER_ENTERED`, {
    method: "PUT", body: JSON.stringify({ values: [arr] }),
  });
  const after = await getRows(tab);
  return after.rows.find((r) => r[idField] === idValue);
}

// สร้างแท็บใหม่ + ใส่หัวคอลัมน์ (แถว1 = โน้ต, แถว2 = headers) ถ้ายังไม่มีแท็บ
export async function ensureTab(tab, headers, note) {
  const meta = await api("?fields=sheets.properties.title");
  const exists = (meta.sheets || []).some(function (s) { return s.properties && s.properties.title === tab; });
  if (!exists) {
    await api(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }) });
    const values = [[note || tab], headers];
    await api("/values/" + A1(tab, "A1") + "?valueInputOption=USER_ENTERED", { method: "PUT", body: JSON.stringify({ values: values }) });
  }
  return { created: !exists, tab: tab };
}
