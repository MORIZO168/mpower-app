"use client";
import { useState } from "react";
import { matchProvinces } from "@/lib/provinces";

// ช่องกรอกจังหวัดแบบ autocomplete — พิมพ์ "กรุง" แล้วเลือก "กรุงเทพมหานคร"
export default function ProvinceInput({ value, onChange, className, placeholder = "พิมพ์ชื่อจังหวัด…" }) {
  const [open, setOpen] = useState(false);
  const sug = matchProvinces(value);
  const show = open && sug.length > 0 && !(sug.length === 1 && sug[0] === value);

  return (
    <div className="relative">
      <input
        className={className}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {show && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#e2e2e7] rounded-lg shadow-lg overflow-hidden">
          {sug.map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(p); setOpen(false); }}
              className="block w-full text-left px-3 py-1.5 text-sm text-[#1d1d1f] hover:bg-[#fff5ec]"
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
