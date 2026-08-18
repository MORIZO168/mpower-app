"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProject, STAGES, isDone, baht } from "@/lib/projects";

function Stepper({ stageIndex, active, onPick }) {
  return (
    <div className="flex items-center overflow-x-auto pb-2">
      {STAGES.map((s, i) => {
        const done = i < stageIndex;
        const cur = i === stageIndex;
        const sel = i === active;
        return (
          <div key={i} className="flex items-center shrink-0">
            <button onClick={() => onPick(i)} className="flex items-center gap-2 px-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
                ${done ? "bg-[#1d1d1f] text-white" : cur ? "bg-[#1a3c6e] text-white" : "bg-[#e6ebf3] text-[#8593a8]"}`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-xs whitespace-nowrap ${sel ? "font-bold text-[#1a3c6e]" : cur ? "text-[#1a3c6e]" : "text-[#8593a8]"}`}>{s}</span>
            </button>
            {i < STAGES.length - 1 && <span className="w-8 h-px bg-[#dbe3ef] shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function Row({ k, v }) {
  return <tr className="border-b border-[#f0f3f8]"><td className="py-2 text-[#5a6a86] w-44 align-top">{k}</td><td className="py-2">{v}</td></tr>;
}
function Card({ title, children, right }) {
  return (
    <div className="card p-5">
      <div className="flex items-center mb-3">
        <div className="font-semibold text-[#1a3c6e]">{title}</div>
        {right && <div className="ml-auto">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function StageCustomer({ p }) {
  const c = p.detail.customer;
  return (
    <Card title="ข้อมูลลูกค้า">
      <table className="w-full text-sm"><tbody>
        <Row k="ชื่อ" v={p.customer} />
        <Row k="ประเภทงาน" v={p.jobType === "Subcontract" ? "รับจ้างติดตั้งให้ TOGETA Solar" : "EPC (ขายทั้งระบบเอง)"} />
        <Row k="ผู้จ่ายเงิน" v={p.client} />
        <Row k="เบอร์โทร" v={c.phone} />
        <Row k="ที่อยู่" v={c.address} />
        <Row k="ประเภทอาคาร" v={c.type} />
        <Row k="การไฟฟ้า" v={c.utility} />
      </tbody></table>
    </Card>
  );
}

function StageSurvey({ p }) {
  const s = p.detail.survey;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="สแกนบิลค่าไฟ (OCR)" right={<span className="pill pill-mut">{s.utility}</span>}>
        <div className="border-2 border-dashed border-[#cdd6e5] rounded-xl p-6 text-center text-xs text-[#8593a8] mb-3">แตะเลือก / ถ่าย / ลากรูปบิลค่าไฟ → AI ดึงข้อมูลให้ (เฟส B)</div>
        <table className="w-full text-sm"><tbody>
          <Row k="ชื่อเจ้าของมิเตอร์" v={s.meterOwner} />
          <Row k="รหัสมิเตอร์" v={s.meterNo} />
          <Row k="เลขผู้ใช้ไฟ (CA)" v={s.ca} />
        </tbody></table>
      </Card>
      <Card title="ประวัติการใช้ไฟย้อนหลัง">
        {s.usage.length ? (
          <table className="w-full text-sm">
            <thead><tr className="text-[#8593a8] text-xs"><th className="text-left py-1">เดือน</th><th className="text-right">หน่วย (kWh)</th><th className="text-right">ค่าไฟ (บาท)</th></tr></thead>
            <tbody>{s.usage.map((u, i) => (
              <tr key={i} className="border-b border-[#f0f3f8]"><td className="py-1.5">{u.m}</td><td className="text-right">{u.kwh.toLocaleString()}</td><td className="text-right">{u.baht.toLocaleString()}</td></tr>
            ))}</tbody>
          </table>
        ) : <div className="text-xs text-[#8593a8] py-4 text-center">ยังไม่มีข้อมูล — งานรับซับ TOGETA เป็นผู้สำรวจ</div>}
      </Card>
    </div>
  );
}

function StageDesign({ p }) {
  const d = p.detail.design;
  return (
    <Card title="ออกแบบ + วางแผง">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 aspect-video bg-gradient-to-br from-[#dfe7f2] to-[#c6d3e6] rounded-xl flex items-center justify-center text-sm text-[#5a6a86]">
          ภาพหลังคาจากดาวเทียม/โดรน + วางแผง (เฟส B–C)
        </div>
        <table className="w-full text-sm self-start"><tbody>
          <Row k="จำนวนแผง" v={`${d.panelQty} แผง`} />
          <Row k="รุ่นแผง" v={d.panelModel} />
          <Row k="พื้นที่หลังคา" v={`${d.roofArea} ตร.ม.`} />
          <Row k="ความชัน / ทิศ" v={`${d.tilt}° · ${d.azimuth}`} />
        </tbody></table>
      </div>
      <p className="text-xs text-[#8593a8] mt-3">{d.note}</p>
    </Card>
  );
}

function Bar({ label, val, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#5a6a86]"><span>{label}</span><span>{val}%</span></div>
      <div className="h-2 rounded-full bg-[#e6ebf3] overflow-hidden mt-1"><div className="h-full" style={{ width: val + "%", background: color }} /></div>
    </div>
  );
}
function StageAnalysis({ p }) {
  const a = p.detail.analysis;
  if (p.jobType === "Subcontract")
    return <Card title="วิเคราะห์คุ้มทุน"><div className="text-sm text-[#8593a8] py-4">งานรับซับ — การวิเคราะห์คุ้มทุนเป็นของ TOGETA (เรารับผิดชอบเฉพาะติดตั้ง)</div></Card>;
  return (
    <Card title="วิเคราะห์คุ้มทุน — ผลิตจริง vs การใช้ไฟ" right={<span className="pill pill-mut">{a.tariff}</span>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#f6f8fc] rounded-lg p-3"><div className="text-xl font-bold text-[#1a3c6e]">{a.annualKwh.toLocaleString()}</div><div className="text-[11px] text-[#8593a8]">ผลิต/ปี (kWh)</div></div>
        <div className="bg-[#f6f8fc] rounded-lg p-3"><div className="text-xl font-bold text-[#1a3c6e]">{a.perDay}</div><div className="text-[11px] text-[#8593a8]">ผลิต/วัน (kWh)</div></div>
        <div className="bg-[#eef7f0] rounded-lg p-3"><div className="text-xl font-bold text-[#1a7d3a]">{baht(a.savingYear)}</div><div className="text-[11px] text-[#8593a8]">ประหยัด/ปี</div></div>
        <div className="bg-[#eef7f0] rounded-lg p-3"><div className="text-xl font-bold text-[#1a7d3a]">{a.payback} ปี</div><div className="text-[11px] text-[#8593a8]">คืนทุน</div></div>
      </div>
      <div className="space-y-2 max-w-md"><Bar label="ใช้ไฟเอง (self-consumption)" val={a.selfUse} color="#F5821F" /><Bar label="ขายคืนกริด" val={100 - a.selfUse} color="#c7c7cc" /></div>
    </Card>
  );
}

function StageBOQ({ p }) {
  const b = p.detail.boq;
  const sell = Math.round(b.cost / (1 - b.marginPct / 100));
  const vat = Math.round(sell * b.vat / 100);
  return (
    <Card title="ใบเสนอ / BOQ" right={<span className="pill pill-mut">{b.pkg}</span>}>
      <table className="w-full text-sm"><tbody>
        <Row k="อินเวอร์เตอร์" v={b.inverter} />
        <Row k="แบตเตอรี่" v={b.battery} />
        <Row k="จำนวนแผง" v={`${b.panelQty} แผง`} />
        <Row k="ต้นทุน (Cost Engine)" v={baht(b.cost)} />
        <Row k="กำไรตั้งไว้" v={`${b.marginPct}%`} />
        <Row k="ราคาขาย (ก่อน VAT)" v={baht(sell)} />
        <Row k={`VAT ${b.vat}%`} v={baht(vat)} />
        <Row k="ราคารวม (incl. VAT)" v={<b className="text-[#1a3c6e]">{baht(sell + vat)}</b>} />
      </tbody></table>
      <button className="mt-4 bg-[#1a3c6e] text-white rounded-lg px-5 py-2 text-sm font-semibold">สร้างใบเสนอราคา PDF</button>
    </Card>
  );
}

function StageClose({ p }) {
  const c = p.detail.close;
  return (
    <Card title="ปิดการขาย">
      <table className="w-full text-sm"><tbody>
        <Row k="ใบเสนอราคา" v={c.quoteSent ? "ส่งแล้ว" : "ยังไม่ส่ง"} />
        <Row k="มัดจำ / การชำระ" v={c.deposit} />
        <Row k="สัญญา" v={c.contract} />
        <Row k="ผล" v={<span className="pill pill-ok">{c.result}</span>} />
      </tbody></table>
    </Card>
  );
}

const PANELS = [StageCustomer, StageSurvey, StageDesign, StageAnalysis, StageBOQ, StageClose];

export default function ProjectDetail() {
  const { id } = useParams();
  const p = getProject(id);
  const start = p ? Math.min(p.stageIndex, STAGES.length - 1) : 0;
  const [active, setActive] = useState(start);

  if (!p) return <div className="p-6"><Link href="/projects" className="text-[#1a3c6e]">← กลับ</Link><div className="mt-4 text-[#8593a8]">ไม่พบโครงการนี้</div></div>;

  const Panel = PANELS[active];
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/projects" className="text-sm text-[#5a6a86]">← ย้อนกลับ</Link>

      <div className="card p-5 mt-3 mb-4 flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#8593a8]">{p.code}</span>
            <span className={`pill pill-${p.jobType === "Subcontract" ? "warn" : "ok"}`}>{p.jobType === "Subcontract" ? "รับซับ · TOGETA" : "EPC"}</span>
          </div>
          <h1 className="text-lg font-bold text-[#1f2a44] mt-1">{p.customer}</h1>
          <div className="text-xs text-[#8593a8] mt-0.5">{p.province} · {p.kwp} kWp · ทีม {p.subTeam} · ผู้ดูแล {p.owner}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-[#8593a8]">มูลค่า</div>
          <div className="text-xl font-bold text-[#1a3c6e]">{baht(p.value)}</div>
          <span className="pill pill-mut mt-1 inline-block">{isDone(p) ? "ปิดงานแล้ว" : STAGES[p.stageIndex]}</span>
        </div>
      </div>

      <div className="card p-4 mb-4"><Stepper stageIndex={p.stageIndex} active={active} onPick={setActive} /></div>

      <Panel p={p} />
    </div>
  );
}
