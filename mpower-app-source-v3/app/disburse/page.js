// Server component — อนุมัติคำขอเบิกของช่างซับ + ดูรูปติดตั้งต่องาน
import { isConfigured, getRows } from "@/lib/db";
import DisburseAdmin from "@/components/DisburseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DisbursePage() {
  const configured = isConfigured();
  let reqs = [], jobs = [], photos = [], error = null;
  if (configured) {
    try {
      const [d, j, p] = await Promise.all([
        getRows("Disbursement_Requests"), getRows("Jobs"), getRows("Work_Photos"),
      ]);
      reqs = d.rows; jobs = j.rows; photos = p.rows;
    } catch (e) {
      error = String(e).slice(0, 200);
    }
  }

  // map job -> customer, และนับรูปต่องาน
  const cust = {};
  jobs.forEach((j) => (cust[j.Job_ID] = j.Customer_Name || ""));
  const photoCount = {};
  photos.forEach((p) => (photoCount[p.Job_ID] = (photoCount[p.Job_ID] || 0) + 1));

  const rows = reqs
    .map((r) => ({ ...r, customer: cust[r.Job_ID] || "", photos: photoCount[r.Job_ID] || 0 }))
    .sort((a, b) => String(b.Requested_At || "").localeCompare(String(a.Requested_At || "")));

  return <DisburseAdmin rows={rows} configured={configured} error={error} />;
}
