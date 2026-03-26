import React from "react";

export default function LowConfidenceTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold"
      style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
      <span className="material-symbols-outlined text-[11px]">alt_route</span>
      Low Confidence
    </span>
  );
}
