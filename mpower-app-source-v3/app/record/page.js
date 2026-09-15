// Server component — บันทึกงานติดตั้ง (jobs) + backfill งานเก่า
import { isConfigured, getRows } from "@/lib/db";
import RecordClient from "@/components/RecordClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const configured = isConfigured();
  let jobs = [], teams = [], error = null;
  if (configured) {
    try {
      const [j, t] = await Promise.all([getRows("Jobs"), getRows("Sub_Teams")]);
      jobs = j.rows;
      teams = t.rows;
    } catch (e) {
      error = String(e).slice(0, 200);
    }
  }
  jobs = [...jobs].sort((a, b) =>
    String(b.Actual_Install_Date || b.Job_ID || "").localeCompare(String(a.Actual_Install_Date || a.Job_ID || ""))
  );
  return <RecordClient jobs={jobs} teams={teams} configured={configured} error={error} />;
}
