// ===== Supabase data layer =====
// แทน lib/sheets.js — คุย Supabase (Postgres) ผ่าน REST ด้วย service_role key (ฝั่ง server เท่านั้น, bypass RLS)
// คง interface เดิม: isConfigured / getRows / appendRow / updateRow / ensureTab
// เพื่อไม่ต้องแก้หน้าเว็บ — คืน row ที่ key เป็นหัวคอลัมน์แบบชีตเดิม (legacy headers)
//
// ต้องตั้ง env (Vercel + .env.local):
//   NEXT_PUBLIC_SUPABASE_URL   = https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  = <service_role key จาก Settings > API>   (ห้าม expose ฝั่ง client)

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isConfigured() {
  return !!(URL && KEY);
}

let _client = null;
function db() {
  if (!_client) {
    if (!isConfigured()) throw new Error("ยังไม่ได้ตั้ง env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    _client = createClient(URL, KEY, { auth: { persistSession: false }, global: { fetch: (u, o = {}) => fetch(u, { ...o, cache: "no-store" }) } });
  }
  return _client;
}

// ===== ทะเบียนตาราง: ชื่อแท็บเดิม -> ตาราง + map [หัวคอลัมน์เดิม, คอลัมน์ Postgres] =====
// idHeader = หัวคอลัมน์ที่หน้าเว็บใช้เป็น idField ; idCol = คอลัมน์ PK จริง
const REG = {
  "A-Card": { table: "acard", idHeader: "ACard_ID", idCol: "acard_id", cols: [
    ["ACard_ID","acard_id"],["Date","date"],["Customer_Name","customer_name"],["Phone_LINE","phone_line"],
    ["Source","source"],["Type","type"],["Province","province"],["Monthly_Bill_THB","monthly_bill_thb"],
    ["Est_kWp","est_kwp"],["System_Type","system_type"],["Grade","grade"],["Status","status"],
    ["Next_Action","next_action"],["Note","note"],
  ]},
  "Leads_Inbox": { table: "leads_inbox", idHeader: "Lead_ID", idCol: "lead_id", cols: [
    ["Lead_ID","lead_id"],["Received_At","received_at"],["Channel","channel"],["Channel_Account","channel_account"],
    ["Campaign","campaign"],["Customer_Name","customer_name"],["Contact_Handle","contact_handle"],
    ["First_Message","first_message"],["AI_Reply","ai_reply"],["Intent","intent"],["Grade","grade"],
    ["Status","status"],["Handoff","handoff"],["ACard_ID","acard_id"],["Note","note"],
  ]},
  "Jobs": { table: "jobs", idHeader: "Job_ID", idCol: "job_id", cols: [
    ["Job_ID","job_id"],["Job_Type","job_type"],["Client_Payer","client_payer"],["ACard_ID","acard_id"],
    ["Customer_Name","customer_name"],["Province","province"],["Equipment_By","equipment_by"],["Phase","phase"],
    ["kWp","kwp"],["Panel_Model","panel_model"],["Panel_Qty","panel_qty"],["Inverter_Model","inverter_model"],
    ["Inverter_kW","inverter_kw"],["Sub_Team","sub_team"],["Promised_Date","promised_date"],
    ["Actual_Install_Date","actual_install_date"],["Sell_Price_THB","sell_price_thb"],["Planned_Cost_THB","planned_cost_thb"],
    ["Planned_Margin_%","planned_margin_pct"],["PEA_Status","pea_status"],["Handover_Status","handover_status"],
    ["Commissioning_Pass","commissioning_pass"],["Rework","rework"],["Customer_Rating","customer_rating"],["Note","note"],
    // ฟิลด์สำหรับ SLD / ยื่นขนานไฟ (portal)
    ["Sellback_Mode","sellback_mode"],["Main_Breaker_A","main_breaker_a"],["Combiner_Breaker_A","combiner_breaker_a"],["Battery_kWh","battery_kwh"],
  ]},
  "Stock": { table: "stock", idHeader: "SKU", idCol: "sku", cols: [
    ["SKU","sku"],["Type","type"],["Model","model"],["Spec","spec"],["On_Hand","on_hand"],
    ["Reorder_Point","reorder_point"],["Unit_Cost_THB","unit_cost_thb"],["Supplier","supplier"],["Note","note"],
  ]},
  "Stock_Moves": { table: "stock_moves", idHeader: "Move_ID", idCol: "move_id", cols: [
    ["Move_ID","move_id"],["Date","date"],["SKU","sku"],["Type_of_Move","type_of_move"],["Qty","qty"],["Ref","ref"],["Note","note"],
  ]},
  "Sales": { table: "sales", idHeader: "Sale_ID", idCol: "sale_id", cols: [
    ["Sale_ID","sale_id"],["Date","date"],["Job_ID","job_id"],["Customer_Name","customer_name"],["Invoice_No","invoice_no"],
    ["Milestone","milestone"],["Amount_ExVAT","amount_exvat"],["VAT_7%","vat"],["Amount_IncVAT","amount_incvat"],
    ["Paid","paid"],["Paid_Date","paid_date"],["Payment_Method","payment_method"],["Slip_Link","slip_link"],["Note","note"],
  ]},
  "Purchases": { table: "purchases", idHeader: "Purchase_ID", idCol: "purchase_id", cols: [
    ["Purchase_ID","purchase_id"],["Date","date"],["Supplier","supplier"],["Category","category"],["Job_ID","job_id"],
    ["PO_Ref","po_ref"],["Amount_ExVAT","amount_exvat"],["VAT_7%","vat"],["Amount_IncVAT","amount_incvat"],
    ["Paid","paid"],["Paid_Date","paid_date"],["Slip_Link","slip_link"],["Note","note"],
  ]},
  "Sub_Teams": { table: "sub_teams", idHeader: "Team_ID", idCol: "team_id", cols: [
    ["Team_ID","team_id"],["Team_Name","team_name"],["Lead_Name","lead_name"],["Contact","contact"],
    ["Rate_THB_per_W","rate_thb_per_w"],["Grade","grade"],["Active","active"],["Note","note"],
    ["User_Email","user_email"],
  ]},
  "Installed_Base": { table: "installed_base", idHeader: "Site_ID", idCol: "site_id", cols: [
    ["Site_ID","site_id"],["Customer_Name","customer_name"],["Area","area"],["Brand","brand"],["kWp","kwp"],
    ["Battery_kWh","battery_kwh"],["Install_Date","install_date"],["Last_Service_Date","last_service_date"],
    ["Ticket_Issue","ticket_issue"],["Ticket_Status","ticket_status"],
    // Atmoce Cloud live telemetry (imported 33 sites)
    ["Atmoce_ID","atmoce_id"],["Today_kWh","today_kwh"],["Lifetime_kWh","lifetime_kwh"],
    ["Online","online"],["Synced_At","synced_at"],
  ]},
  "Packages": { table: "packages", idHeader: "Pkg_ID", idCol: "pkg_id", cols: [
    ["Pkg_ID","pkg_id"],["Name","name"],["kWp","kwp"],["Panels","panels"],["Inverter","inverter"],["Price","price"],["Phase","phase"],
  ]},
  "Payment_Schedule": { table: "payment_schedule", idHeader: "Schedule_ID", idCol: "schedule_id", cols: [
    ["Schedule_ID","schedule_id"],["Job_ID","job_id"],["Milestone","milestone"],["Percent","percent"],
    ["Amount_THB","amount_thb"],["Due_Date","due_date"],["Paid","paid"],["Paid_Date","paid_date"],["Note","note"],
  ]},
  // อุปกรณ์รายชิ้น (serial) — ตารางใหม่จาก schema v2
  "Equipment_Units": { table: "equipment_units", idHeader: "Serial", idCol: "serial", cols: [
    ["Serial","serial"],["Part_No","part_no"],["Equip_Type","equip_type"],["Brand","brand"],["Model","model"],
    ["Status","status"],["Job_ID","job_id"],["Received_At","received_at"],["Installed_At","installed_at"],
    ["Photo_URL","photo_url"],["Raw_QR","raw_qr"],["Intake_Ref","intake_ref"],["Note","note"],
  ]},
  "Equipment_Catalog": { table: "equipment_catalog", idHeader: "Part_No", idCol: "part_no", cols: [
    ["Part_No","part_no"],["Equip_Type","equip_type"],["Brand","brand"],["Model","model"],["SKU","sku"],["Spec","spec"],["Note","note"],
  ]},
  // Portal ช่างซับ — รูปติดตั้งตาม checklist + คำขอเบิก
  "Work_Photos": { table: "work_photos", idHeader: "ID", idCol: "id", cols: [
    ["ID","id"],["Job_ID","job_id"],["Checklist_Key","checklist_key"],["Photo_URL","photo_url"],
    ["Note","note"],["Uploaded_By","uploaded_by"],["Created_At","created_at"],
  ]},
  "Disbursement_Requests": { table: "disbursement_requests", idHeader: "ID", idCol: "id", cols: [
    ["ID","id"],["Job_ID","job_id"],["Sub_Team","sub_team"],["Amount","amount"],["Status","status"],
    ["Note","note"],["Requested_By","requested_by"],["Requested_At","requested_at"],
    ["Approved_By","approved_by"],["Approved_At","approved_at"],
  ]},
};

function reg(tab) {
  const r = REG[tab];
  if (!r) throw new Error("ไม่รู้จักแท็บ: " + tab);
  return r;
}
// map: legacy header -> column, และ column -> legacy header
function h2c(r) { const m = {}; r.cols.forEach(([h, c]) => (m[h] = c)); return m; }
function c2h(r) { const m = {}; r.cols.forEach(([h, c]) => (m[c] = h)); return m; }

// แปลง row จาก DB (คอลัมน์ snake_case) -> object หัวคอลัมน์แบบชีตเดิม + _row
function rowFromDb(r, dbRow) {
  const back = c2h(r);
  const o = {};
  for (const [c, h] of Object.entries(back)) {
    let v = dbRow[c];
    if (v === null || v === undefined) v = "";
    o[h] = v;
  }
  o._row = dbRow[r.idCol];
  return o;
}
// แปลง object หัวคอลัมน์เดิม -> row สำหรับเขียน DB (เฉพาะคอลัมน์ที่รู้จัก, ข้ามค่าว่าง)
function rowToDb(r, obj) {
  const map = h2c(r);
  const out = {};
  for (const [h, v] of Object.entries(obj)) {
    const c = map[h];
    if (!c) continue;
    if (v === "" || v === undefined) continue; // ปล่อยให้เป็น null/default
    out[c] = v;
  }
  return out;
}

export const HEADERS = (tab) => reg(tab).cols.map(([h]) => h);

// อ่านทั้งตาราง -> { headers, rows:[{...legacy, _row}] }
export async function getRows(tab /* , headerRow ignored */) {
  const r = reg(tab);
  const { data, error } = await db().from(r.table).select("*");
  if (error) throw new Error("db read " + r.table + ": " + error.message);
  const rows = (data || []).map((d) => rowFromDb(r, d));
  return { headers: HEADERS(tab), rows };
}

// เพิ่มแถวใหม่ — ตรวจ required (ตามหัวคอลัมน์เดิม) + คืนแถวที่เพิ่ง insert
export async function appendRow(tab, obj, { required = [], idField } = {}) {
  const r = reg(tab);
  for (const f of required) if (obj[f] === undefined || obj[f] === "") throw new Error("ขาดฟิลด์จำเป็น: " + f);
  const payload = rowToDb(r, obj);
  const { data, error } = await db().from(r.table).insert(payload).select().single();
  if (error) throw new Error("db insert " + r.table + ": " + error.message);
  return rowFromDb(r, data);
}

// อัปเดตตาม idField (หัวคอลัมน์เดิม) -> หา column PK แล้ว update + คืนแถวใหม่
export async function updateRow(tab, idField, idValue, patch) {
  const r = reg(tab);
  const idCol = h2c(r)[idField] || r.idCol;
  const payload = rowToDb(r, patch);
  const { data, error } = await db().from(r.table).update(payload).eq(idCol, idValue).select().single();
  if (error) throw new Error("db update " + r.table + ": " + error.message);
  return rowFromDb(r, data);
}

// ตารางถูกสร้างจาก schema แล้ว — ensureTab เป็น no-op เพื่อความเข้ากันได้กับหน้าเดิม
export async function ensureTab(tab /* , headers, note */) {
  reg(tab); // จะ throw ถ้าแท็บไม่รู้จัก
  return { created: false, tab };
}
