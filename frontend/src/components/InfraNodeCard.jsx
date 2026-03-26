// src/components/InfraNodeCard.jsx
import React from "react";

const SEVERITY_GLOW = {
  critical: { border: "rgba(248,113,113,0.3)", glow: "rgba(248,113,113,0.12)", text: "#f87171", label: "Critical" },
  high:     { border: "rgba(251,146,60,0.3)",  glow: "rgba(251,146,60,0.12)",  text: "#fb923c", label: "High" },
  medium:   { border: "rgba(250,204,21,0.3)",  glow: "rgba(250,204,21,0.08)",  text: "#facc15", label: "Medium" },
  low:      { border: "rgba(52,211,153,0.3)",  glow: "rgba(52,211,153,0.08)",  text: "#34d399", label: "Low" },
};

const STATUS_DOT = {
  operational:  { color: "#34d399", label: "Operational" },
  under_repair: { color: "#fb923c", label: "Under Repair" },
  damaged:      { color: "#f87171", label: "Damaged" },
  inactive:     { color: "#64748b", label: "Inactive" },
};

function HealthBar({ score }) {
  if (score == null) return null;
  const pct = Math.round(Math.min(100, Math.max(0, score)));
  const color = pct >= 70 ? "#34d399" : pct >= 40 ? "#fb923c" : "#f87171";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Health</span>
        <span className="text-[11px] font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/8 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
      </div>
    </div>
  );
}

export default function InfraNodeCard({ node, onSelect }) {
  if (!node) return null;

  const sev    = SEVERITY_GLOW[node.cluster_severity] || SEVERITY_GLOW.low;
  const status = STATUS_DOT[node.status] || { color: "#64748b", label: node.status || "Unknown" };
  const themes = Array.isArray(node.cluster_major_themes)
    ? node.cluster_major_themes
    : typeof node.cluster_major_themes === "string"
    ? (() => { try { return JSON.parse(node.cluster_major_themes); } catch { return []; } })()
    : [];

  return (
    <article
      className="rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${sev.border}`,
        boxShadow: `0 4px 24px ${sev.glow}`,
      }}
      onClick={() => onSelect?.(node)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">
            {node.infra_type_name || "Infra Node"}
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">#{node.id?.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full shrink-0"
            style={{ background: status.color, boxShadow: `0 0 6px ${status.color}` }} />
          <span className="text-[11px] font-medium" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Open",  value: node.open_complaint_count ?? 0,  color: "#f87171" },
          { label: "Total", value: node.total_complaint_count ?? 0, color: "#94a3b8" },
          { label: "Done",  value: node.total_resolved_count ?? 0,  color: "#34d399" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2 text-center"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Health bar */}
      <div className="mb-3">
        <HealthBar score={node.health_score} />
      </div>

      {/* AI cluster summary */}
      {node.cluster_ai_summary && (
        <div className="rounded-xl p-2.5 mb-3 text-xs"
          style={{ background: `${sev.glow}`, border: `1px solid ${sev.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: sev.text }}>
            AI Summary · {sev.label}
          </p>
          <p className="text-slate-600 leading-snug line-clamp-2">{node.cluster_ai_summary}</p>
        </div>
      )}

      {/* Major themes */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {themes.slice(0, 3).map((t, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.05)", color: "#64748b", border: "1px solid rgba(0,0,0,0.08)" }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {node.is_repeat_risk && (
          <span className="text-[10px] px-2 py-1 rounded-full font-medium gpill-orange flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">replay</span>
            Repeat Risk
          </span>
        )}
        {(node.open_complaint_count ?? 0) > 5 && (
          <span className="text-[10px] px-2 py-1 rounded-full font-medium gpill-red flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            High Load
          </span>
        )}
      </div>

      {/* Location */}
      {(node.jurisdiction_name || node.lat != null) && (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-500">
          <span className="material-symbols-outlined text-[13px]">location_on</span>
          <span className="truncate">
            {node.jurisdiction_name || ""}
            {node.lat != null ? ` · ${Number(node.lat).toFixed(4)}, ${Number(node.lng).toFixed(4)}` : ""}
          </span>
        </div>
      )}

      <button
        type="button"
        className="w-full py-2 rounded-xl text-xs font-semibold text-white gbtn-sky"
        onClick={(e) => { e.stopPropagation(); onSelect?.(node); }}
      >
        Open Node Details
      </button>
    </article>
  );
}
