"use client";
import { useState } from "react";
import Link from "next/link";
import { PROJECTS, STAGES, isDone, typeTone, baht } from "@/lib/projects";

function ProgressLine({ stageIndex }) {
  return (
    <div className="flex gap-1 mt-2">
      {STAGES.map((s, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#e6ebf3]" title={s}>
          <div className="h-full" style={{ width: i < stageIndex ? "100%" : i === stageIndex ? "55%" : "0%", background: i <= stageIndex ? "#1a3c6e" : "transparent" }} />
        </div>
      ))}
    </div>
  );
}

function dotColor(p) {
  if (isDone(p)) return "#1a7d3a";
  if (p.jobType === "Subcontract") return "#b5651d";
  return "#4da3ff";
}

export default function ProjectsPage() {
  const [tab, setTab] = useState("active"); // active | done
  const [type, setType] = useState("all");  // all | EPC | Subcontract
  const [q, setQ] = useState("");

  const list = PROJECTS.filter((p) => {
    if (tab === "active" && isDone(p)) return false;
    if (tab === "done" && !isDone(p)) return false;
    if (type !== "all" && p.jobType !== type) return false;
    if (q && !(p.customer + p.code).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const activeCount = PROJECTS.filter((p) => !isDone(p)).length;
  const doneCount = PROJECTS.filter((p) => isDone(p)).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div>
          <h1 className="text-xl font-bold text-[#1a3c6e]">โครงการ</h1>
          <p className="text-sm text-[#5a6a86] mt-0.5">ไล่ทุกงานเป็นเส้นเดียว · {STAGES.join(" → ")}</p>
        </div>
        <button className="ml-auto bg-[#1a3c6e] text-white rounded-lg px-4 py-2 text-sm font-semibold">+ สร้างโครงการใหม่</button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 mb-3">
        <button onClick={() => setTab("active")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab === "active" ? "bg-[#1a3c6e] text-white" : "bg-[#eef2f8] text-[#5a6a86]"}`}>กำลังดำเนินการ ({activeCount})</button>
        <button onClick={() => setTab("done")} className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab === "done" ? "bg-[#1a3c6e] text-white" : "bg-[#eef2f8] text-[#5a6a86]"}`}>ปิดงาน · Win/Lost ({doneCount})</button>
        <span className="w-px h-5 bg-[#dbe3ef] mx-1" />
        {["all", "EPC", "Subcontract"].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-full text-sm ${type === t ? "bg-[#e7f0ff] text-[#1a3c6e] font-semibold border border-[#a9c9f5]" : "bg-[#f4f7fb] text-[#5a6a86]"}`}>
            {t === "all" ? "ทั้งหมด" : t === "EPC" ? "EPC (ของเราเอง)" : "รับซับ TOGETA"}
          </button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / เลขโครงการ"
          className="ml-auto px-3 py-1.5 border border-[#cdd6e5] rounded-lg text-sm w-56 bg-white" />
      </div>

      <div className="space-y-2">
        {list.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}
            className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dotColor(p) }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-[#8593a8]">{p.code}</span>
                <span className="font-semibold text-[#1f2a44] truncate">{p.customer}</span>
                <span className={`pill pill-${typeTone(p.jobType)}`}>{p.jobType === "Subcontract" ? "รับซับ · TOGETA" : "EPC"}</span>
                <span className="pill pill-mut">{isDone(p) ? "ปิดงานแล้ว" : STAGES[p.stageIndex]}</span>
              </div>
              <ProgressLine stageIndex={p.stageIndex} />
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-[#1a3c6e]">{baht(p.value)}</div>
              <div className="text-[11px] text-[#8593a8]">{p.kwp} kWp · {p.ageDays} วัน</div>
            </div>
            <span className="text-[#b7c2d4] text-lg shrink-0">›</span>
          </Link>
        ))}
        {list.length === 0 && <div className="text-center text-sm text-[#8593a8] py-10">ไม่มีโครงการในตัวกรองนี้</div>}
      </div>
    </div>
  );
}
