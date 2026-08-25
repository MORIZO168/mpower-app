"use client";
import { useState, useEffect } from "react";
import { PACKAGES, rowToPackage } from "@/lib/packages";

// โหลดแพคเกจการขายจากชีต (แท็บ Packages) — fallback เป็นค่า default ระหว่างโหลด/ถ้ายังไม่มีแท็บ
export default function usePackages() {
  const [pkgs, setPkgs] = useState(PACKAGES);
  useEffect(() => {
    (async () => {
      try {
        const cached = localStorage.getItem("mpower_pkgs");
        if (cached) { const a = JSON.parse(cached); if (a && a.length) setPkgs(a); }
        const r = await (await fetch("/api/sheets?tab=Packages")).json();
        if (r && r.rows && r.rows.length) {
          const a = r.rows.map(rowToPackage).filter((p) => p.id && p.kwp);
          if (a.length) { setPkgs(a); localStorage.setItem("mpower_pkgs", JSON.stringify(a)); }
        }
      } catch (e) {}
    })();
  }, []);
  return pkgs;
}
