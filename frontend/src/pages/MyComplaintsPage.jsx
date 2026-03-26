import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { fetchMyComplaints, fetchMyStats } from "../api/complaintsApi";
import { toast } from "sonner";

const STATUS_LABEL = {
  received:            "Received",
  clustered:           "Clustered",
  mapped:              "Mapped",
  workflow_started:    "Workflow Started",
  in_progress:         "In Progress",
  midway_survey_sent:  "Survey Sent",
  resolved:            "Resolved",
  closed:              "Closed",
  rejected:            "Rejected",
  escalated:           "Escalated",
  emergency:           "Emergency",
  constraint_blocked:  "Blocked",
};

const STATUS_STYLE = {
  received:           { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  clustered:          { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  mapped:             { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8" },
  workflow_started:   { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8" },
  in_progress:        { bg: "rgba(251,146,60,0.12)",  color: "#fb923c" },
  midway_survey_sent: { bg: "rgba(251,146,60,0.12)",  color: "#fb923c" },
  resolved:           { bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  closed:             { bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  rejected:           { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
  escalated:          { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
  emergency:          { bg: "rgba(248,113,113,0.2)",  color: "#ef4444" },
  constraint_blocked: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24" },
};

const PRIORITY_COLOR = {
  low:       "#64748b",
  normal:    "#38bdf8",
  high:      "#fb923c",
  critical:  "#f87171",
  emergency: "#ef4444",
};

const STATUS_OPTIONS = [
  "All", "received", "in_progress", "resolved", "closed", "rejected", "escalated",
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || { bg: "rgba(0,0,0,0.06)", color: "#64748b" };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
      style={{ background: s.bg, color: s.color }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function MyComplaintsPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [listRes, statsRes] = await Promise.all([
          fetchMyComplaints({ limit: 100 }),
          fetchMyStats(),
        ]);
        setComplaints(listRes.items || []);
        setStats(statsRes);
      } catch {
        toast.error("Failed to load complaints.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title?.toLowerCase().includes(q) ||
      c.complaint_number?.toLowerCase().includes(q) ||
      c.address_text?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <AppLayout>
      <div className="p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">My Complaints</h1>
          <Link
            to="/submit"
            className="gbtn-sky px-5 py-2.5 rounded-full text-sm font-semibold text-white flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Report
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",    value: stats?.total_count,           icon: "receipt_long", color: "#38bdf8" },
            { label: "Active",   value: stats?.active_count,          icon: "pending",       color: "#fb923c" },
            { label: "Resolved", value: stats?.resolved_count,        icon: "check_circle",  color: "#34d399" },
            { label: "Avg Days", value: stats?.avg_resolution_days != null ? stats.avg_resolution_days.toFixed(1) : null, icon: "schedule", color: "#a78bfa" },
          ].map((s) => (
            <div key={s.label} className="gcard p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]" style={{ color: s.color }}>{s.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800">{loading ? "…" : (s.value ?? "—")}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="material-symbols-outlined text-slate-500 text-[20px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, number, or address…"
              className="bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none flex-1"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ginput px-3 py-2 text-sm rounded-xl"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : STATUS_LABEL[s] || s}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="gcard overflow-hidden">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-14 rounded-xl animate-pulse"
                  style={{ background: "rgba(0,0,0,0.06)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-2 block">inbox</span>
              <p className="text-sm">
                {complaints.length === 0
                  ? "No complaints filed yet."
                  : "No complaints match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <tr>
                    {["#", "Title", "Address", "Status", "Priority", "Filed", "Resolved", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                      onClick={() => navigate(`/complaints/${c.id}`)}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {c.complaint_number}
                      </td>
                      <td className="px-4 py-3 max-w-50">
                        <p className="truncate font-medium text-slate-800">{c.title}</p>
                        {c.is_repeat_complaint && (
                          <span className="text-[10px] text-red-400 font-semibold">Repeat complaint</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-40">
                        <p className="truncate text-slate-500">{c.address_text || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize font-medium"
                          style={{ color: PRIORITY_COLOR[c.priority] || "#94a3b8" }}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {c.resolved_at ? formatDate(c.resolved_at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-sky-400 text-xs hover:text-sky-300 transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/complaints/${c.id}`); }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-xs text-slate-600 text-right">
            Showing {filtered.length} of {complaints.length} complaints
          </p>
        )}
      </div>
    </AppLayout>
  );
}
