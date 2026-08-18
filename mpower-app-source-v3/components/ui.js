export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div>
        <h1 className="text-xl font-bold text-[#1a3c6e]">{title}</h1>
        {subtitle && <p className="text-sm text-[#5a6a86] mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone }) {
  const c = tone === "ok" ? "text-[#1a7d3a]" : tone === "warn" ? "text-[#b5651d]" : tone === "bad" ? "text-[#c0392b]" : "text-[#1f2a44]";
  return (
    <div className="bg-[#f6f8fc] rounded-xl p-4 border-l-4 border-[#1a3c6e]">
      <div className={`text-2xl font-bold ${c}`}>{value}</div>
      <div className="text-xs text-[#5a6a86] mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-[#8593a8] mt-1">{sub}</div>}
    </div>
  );
}

export function RatioBar({ label, val, std, lowerBetter }) {
  const good = lowerBetter ? val <= std : val >= std;
  const near = lowerBetter ? val <= std * 1.3 : val >= std * 0.8;
  const col = good ? "#1a7d3a" : near ? "#b5651d" : "#c0392b";
  const pct = Math.max(0, Math.min(100, val));
  return (
    <div className="my-3">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span><b style={{ color: col }}>{val}%</b> <span className="text-[#8593a8] text-xs">(มาตรฐาน {lowerBetter ? "≤" : "≥"}{std}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-[#e6ebf3] overflow-hidden mt-1.5">
        <div style={{ width: pct + "%", background: col }} className="h-full" />
      </div>
    </div>
  );
}

export function Pill({ tone, children }) {
  return <span className={`pill pill-${tone || "mut"}`}>{children}</span>;
}
