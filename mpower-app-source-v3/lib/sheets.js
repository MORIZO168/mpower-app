// ตัวเชื่อม Google Sheets (ฝั่ง server เท่านั้น)
// ตั้ง env 3 ตัวใน Vercel:
//   GOOGLE_SA_EMAIL        = client_email ของ service account
//   GOOGLE_SA_KEY          = private_key (ทั้งก้อน รวม \n)
//   MPOWER_SHEET_ID        = id ของ Google Sheet
//
// ถ้ายังไม่ตั้ง env → isSheetsConfigured() = false → หน้าเว็บใช้ mock ใน lib/data.js ไปก่อน

export function isSheetsConfigured() {
  return !!(process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_KEY && process.env.MPOWER_SHEET_ID);
}

// อ่านช่วงข้อมูลจากชีต (เช่น "Funnel!A1:E20") — คืน array ของ object โดยใช้แถวแรกเป็น header
export async function readSheet(range) {
  if (!isSheetsConfigured()) throw new Error("ยังไม่ได้ตั้งค่า Google Sheets env");
  const { google } = await import("googleapis"); // ติดตั้งด้วย: npm i googleapis
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SA_EMAIL,
    undefined,
    process.env.GOOGLE_SA_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.MPOWER_SHEET_ID,
    range,
  });
  const rows = res.data.values || [];
  const header = rows.shift() || [];
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

export async function appendRow(range, values) {
  if (!isSheetsConfigured()) throw new Error("ยังไม่ได้ตั้งค่า Google Sheets env");
  const { google } = await import("googleapis");
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SA_EMAIL, undefined,
    process.env.GOOGLE_SA_KEY.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.MPOWER_SHEET_ID,
    range, valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}
