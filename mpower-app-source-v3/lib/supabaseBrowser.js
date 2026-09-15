// Supabase browser client (ฝั่ง client) — ใช้ anon key ปลอดภัยเปิด public ได้
// RLS ใน DB เป็นตัวคุมสิทธิ์: ช่างเห็น/แก้เฉพาะงานทีมตัวเอง
// ต้องตั้ง env (Vercel): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const portalConfigured = () => !!(URL && ANON);

let _sb = null;
export function sb() {
  if (!portalConfigured()) return null;
  if (!_sb) {
    _sb = createClient(URL, ANON, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "mpower-portal-auth" },
    });
  }
  return _sb;
}

export const PHOTO_BUCKET = "install-photos";
