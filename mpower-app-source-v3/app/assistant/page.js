"use client";
import { useState, useRef, useEffect } from "react";
import { LEADS, CHANNEL_PERF, conv } from "@/lib/inbox";

// ===== ผู้ช่วยหลังบ้าน — คุยกับเจ้าของ ดึงข้อมูลจากระบบ =====
// โหมด demo: ตอบจากข้อมูลในแอป · เฟสจริงต่อสมอง Claude ด้วย API key เดียว (ผู้ใช้ approve ทุก action)

const SUGGEST = [
  "วันนี้มี lead ใหม่กี่เจ้า",
  "ช่องทางไหนปิดการขายดีสุด",
  "มี lead ที่รอคนรับไหม",
  "สรุปกำไรเดือนนี้",
];

function brain(q) {
  const t = q.toLowerCase();
  if (t.includes("lead") && (t.includes("ใหม่") || t.includes("กี่"))) {
    const n = LEADS.length;
    const a = LEADS.filter((l) => l.grade === "A").length;
    return `วันนี้มี ${n} lead เข้ามา · เกรด A ${a} เจ้า (ร้อนสุด) · จาก ${new Set(LEADS.map((l) => l.channel)).size} ช่องทาง\nอยากให้ร่างข้อความติดตามเจ้าเกรด A ไหมครับ?`;
  }
  if (t.includes("ช่อง") || t.includes("ปิดการขาย") || t.includes("ดีสุด")) {
    const best = [...CHANNEL_PERF].sort((a, b) => b.closed - a.closed)[0];
    return `ช่องที่ปิดการขายดีสุดเดือนนี้คือ ${best.channel} — ปิด ${best.closed} ราย จาก ${best.leads} lead (Conv ${conv(best)}%)\nถ้าจะเพิ่มงบ ผมแนะนำดู Cost per Lead ในหน้า Inbox ประกอบครับ`;
  }
  if (t.includes("รอคน") || t.includes("handoff") || t.includes("ส่งต่อ")) {
    const h = LEADS.filter((l) => l.handoff);
    if (!h.length) return "ตอนนี้ไม่มี lead ที่รอคนรับครับ บอทดูแลครบ";
    return `มี ${h.length} เจ้าที่รอคนรับ:\n` + h.map((l) => `• ${l.name} (${l.channel}) — "${l.msg}"`).join("\n") + `\nจะให้ผมร่างข้อความตอบไหมครับ? (คุณกดอนุมัติก่อนส่งทุกครั้ง)`;
  }
  if (t.includes("กำไร") || t.includes("การเงิน") || t.includes("รายได้")) {
    return "หน้าการเงินสรุปกำไร/ขาดทุนรายเดือน + VAT ให้แล้วครับ เปิดเมนู 'การเงิน' ได้เลย\nเฟสต่อไปผมจะดึงตัวเลขจริงจาก Google Sheet มาสรุปให้ตรงนี้อัตโนมัติ";
  }
  return "ตอนนี้ผมเป็นโหมด demo ตอบจากข้อมูลในแอปได้บางส่วนครับ\nพอต่อสมอง Claude + Google Sheet จริงแล้ว ผมจะตอบได้ทุกเรื่อง: lead, งาน, ขอขนานไฟ, ใบเสนอ, การเงิน และร่างงานให้คุณกดอนุมัติ";
}

export default function AssistantPage() {
  const [msgs, setMsgs] = useState([
    { role: "bot", text: "สวัสดีครับ ผมคือผู้ช่วยหลังบ้านของ M Power 👋\nถามผมได้เลยเรื่อง lead / งาน / การเงิน หรือให้ผมร่างงานให้ (คุณเป็นคนกดอนุมัติเสมอ)" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  function send(q) {
    const text = (q ?? input).trim();
    if (!text) return;
    setMsgs((m) => [...m, { role: "user", text }, { role: "bot", text: brain(text) }]);
    setInput("");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col" style={{ minHeight: "calc(100vh - 3.5rem)" }}>
      <div className="mb-3">
        <h1 className="text-xl font-bold text-[#1d1d1f]">ผู้ช่วยหลังบ้าน (AI Assistant)</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">คุยกับคุณ ดึงข้อมูลจากระบบ ร่างงานให้ — <span className="text-[#F5821F]">โหมด demo · รอต่อสมอง Claude</span></p>
      </div>

      <div className="card flex-1 p-4 overflow-y-auto space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${m.role === "user" ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {SUGGEST.map((s) => (
          <button key={s} onClick={() => send(s)} className="px-3 py-1.5 rounded-full text-xs border border-[#e2e2e7] text-[#6e6e73] hover:text-[#1d1d1f] bg-white">{s}</button>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="พิมพ์คำถามถึงผู้ช่วย…"
          className="flex-1 px-4 py-2.5 border border-[#d2d2d7] rounded-full text-sm bg-white" />
        <button onClick={() => send()} className="bg-[#F5821F] text-white rounded-full px-5 py-2.5 text-sm font-semibold shrink-0">ส่ง</button>
      </div>
      <p className="text-[11px] text-[#a1a1a6] mt-2">* ทุกงานที่ต้องส่งออก (ตอบลูกค้า/ส่งใบเสนอ/นัดคิว) ผู้ช่วยจะร่างให้ก่อน แล้วคุณกดอนุมัติเท่านั้น</p>
    </div>
  );
}
