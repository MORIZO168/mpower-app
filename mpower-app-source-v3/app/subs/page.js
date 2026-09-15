// Server component — ทีมช่างซับจริง (sub_teams) + ผูกอีเมลช่างเข้าพอร์ทัล
import { isConfigured, getRows } from "@/lib/db";
import SubsClient from "@/components/SubsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SubsPage() {
  const configured = isConfigured();
  let teams = [], error = null;
  if (configured) {
    try { teams = (await getRows("Sub_Teams")).rows; }
    catch (e) { error = String(e).slice(0, 200); }
  }
  teams = [...teams].sort((a, b) => String(a.Team_ID || "").localeCompare(String(b.Team_ID || "")));
  return <SubsClient teams={teams} configured={configured} error={error} />;
}
