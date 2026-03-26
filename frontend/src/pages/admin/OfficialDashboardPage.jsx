// src/pages/admin/OfficialDashboardPage.jsx — full glassmorphism revamp
import { useEffect, useRef, useState, useCallback } from "react";
import Map, { Layer, Source, NavigationControl, Popup } from "react-map-gl";
import AppLayout from "../../components/AppLayout";
import CRMAgentChat from "../../components/CRMAgentChat";
import MapboxInfraLayer from "../../components/MapboxInfraLayer";
import {
  fetchAdminKPI, fetchDailyBriefing, fetchComplaintQueue, fetchWorkerTasks,
  fetchWorkflowSuggestions, approveWorkflow, assignTask,
  fetchAvailableWorkers, fetchAvailableContractors, fetchInfraNodeSummary,
  fetchInfraNodeAiSummary, fetchAdminTaskList, fetchInfraNodeMap,
  rolloutSurvey, fetchOfficials, fetchDepartments,
} from "../../api/adminApi";
import client from "../../api/client";
import { toast } from "sonner";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const PC = { normal:"#6366f1", high:"#f97316", critical:"#ef4444", emergency:"#dc2626", low:"#94a3b8" };
const SC = { received:"#818cf8", workflow_started:"#38bdf8", in_progress:"#fb923c", resolved:"#34d399", closed:"#34d399", rejected:"#f87171", escalated:"#ef4444" };
const DELHI = { longitude:77.209, latitude:28.6139, zoom:11.5, pitch:50, bearing:-15 };

// ── Shared atoms ──────────────────────────────────────────────────

function GCard({ children, className = "", style = {} }) {
  return (
    <div className={`gcard p-5 ${className}`} style={style}>{children}</div>
  );
}

function Pill({ label, color, size = "sm" }) {
  const sz = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span className={`${sz} rounded-full font-semibold capitalize`}
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {label?.replace(/_/g, " ")}
    </span>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            active === t.key
              ? "text-sky-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
          style={active === t.key ? { background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)" } : {}}
        >
          <span className="material-symbols-outlined text-[15px]">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`rounded-2xl w-full ${wide ? "max-w-4xl" : "max-w-xl"} max-h-[88vh] overflow-y-auto`}
        style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(24px)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div className="sticky top-0 px-6 pt-5 pb-4 border-b border-black/8 flex items-center justify-between z-10"
          style={{ background: "rgba(255,255,255,0.98)" }}>
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-black/6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color, sub, loading }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2 transition-all hover:-translate-y-0.5"
      style={{ background: `${color}0a`, border: `1px solid ${color}22`, backdropFilter: "blur(16px)" }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${color}99` }}>{label}</span>
        <span className="material-symbols-outlined text-[18px]" style={{ color }}>{icon}</span>
      </div>
      <p className="text-3xl font-black text-slate-800">{loading ? "…" : (value ?? 0)}</p>
      {sub && <p className="text-[11px]" style={{ color: `${color}80` }}>{sub}</p>}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────

function OverviewTab({ kpi, briefing, loading }) {
  const sections = briefing?.sections || [];
  const sectionStyle = {
    alert:   { bg:"rgba(239,68,68,0.08)",   border:"rgba(239,68,68,0.25)",   text:"#dc2626" },
    warning: { bg:"rgba(245,158,11,0.08)",  border:"rgba(245,158,11,0.25)",  text:"#d97706" },
    info:    { bg:"rgba(56,189,248,0.08)",  border:"rgba(56,189,248,0.25)",  text:"#0284c7" },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* AI Briefing */}
      {briefing && (
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.08),rgba(129,140,248,0.06))", border: "1px solid rgba(56,189,248,0.15)" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.3),rgba(56,189,248,0.15))", border: "1px solid rgba(56,189,248,0.3)" }}>
              <span className="material-symbols-outlined text-sky-400 text-[20px]">smart_toy</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-sky-400 mb-1 uppercase tracking-wider">AI Morning Briefing</p>
              <p className="text-sm text-slate-600 leading-relaxed">{briefing.greeting}</p>
            </div>
          </div>
          {sections.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {sections.map((s, i) => {
                const st = sectionStyle[s.type] || sectionStyle.info;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium"
                    style={{ background: st.bg, borderColor: st.border, color: st.text }}>
                    <span className="flex-1">{s.title}</span>
                    <span className="text-xs opacity-60">{s.action}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Open"        value={kpi?.summary?.open_complaints}     icon="inbox"         color="#6366f1" loading={loading} />
        <KPICard label="Critical"    value={kpi?.summary?.critical_count}      icon="warning"       color="#ef4444" loading={loading} sub="Needs action" />
        <KPICard label="Needs Wflow" value={kpi?.summary?.needs_workflow}      icon="account_tree"  color="#8b5cf6" loading={loading} />
        <KPICard label="Repeat"      value={kpi?.summary?.repeat_count}        icon="replay"        color="#f97316" loading={loading} />
        <KPICard label="SLA Risk"    value={kpi?.summary?.sla_at_risk}         icon="timer_off"     color="#dc2626" loading={loading} sub=">30d open" />
        <KPICard label="Resolved"    value={kpi?.summary?.resolved_complaints} icon="check_circle"  color="#10b981" loading={loading}
          sub={kpi?.summary?.avg_resolution_days ? `Avg ${kpi.summary.avg_resolution_days}d` : ""} />
      </div>

      {/* Task stats + Infra breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GCard>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[18px] text-sky-500">construction</span>
            Task Summary
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l:"Active",  v: kpi?.tasks?.active,    c:"#f97316" },
              { l:"Overdue", v: kpi?.tasks?.overdue,   c:"#ef4444" },
              { l:"Done",    v: kpi?.tasks?.completed, c:"#10b981" },
            ].map(t => (
              <div key={t.l} className="flex flex-col items-center p-4 rounded-xl"
                style={{ background: `${t.c}0a`, border: `1px solid ${t.c}22` }}>
                <span className="text-2xl font-black" style={{ color: t.c }}>{loading ? "…" : (t.v ?? 0)}</span>
                <span className="text-xs text-slate-500 mt-1">{t.l}</span>
              </div>
            ))}
          </div>
        </GCard>

        {kpi?.top_infra_types?.length > 0 && (
          <GCard>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px] text-indigo-500">category</span>
              Top Infra Issues
            </h3>
            <div className="flex flex-col gap-2.5">
              {kpi.top_infra_types.map(it => {
                const pct = Math.round((it.count / kpi.top_infra_types[0].count) * 100);
                return (
                  <div key={it.code} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-28 truncate">{it.infra_type}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                      <div className="h-full rounded-full bg-sky-500" style={{ width:`${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-6 text-right">{it.count}</span>
                  </div>
                );
              })}
            </div>
          </GCard>
        )}
      </div>
    </div>
  );
}

// ── Map tab ───────────────────────────────────────────────────────

function MapTab({ onNodeClick }) {
  const [infraNodes, setInfraNodes] = useState({ type:"FeatureCollection", features:[] });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const INFRA_TYPES = ["POTHOLE","ROAD","DRAIN","STLIGHT","WATER_PIPE","SEWER","GARBAGE","TREE","ELEC_POLE","WIRE_HAZARD"];

  useEffect(() => {
    setLoading(true);
    fetchInfraNodeMap({ status: statusFilter !== "all" ? statusFilter : undefined, infraTypeCode: typeFilter || undefined })
      .then(d => setInfraNodes(d || { type:"FeatureCollection", features:[] }))
      .catch(() => toast.error("Failed to load infra map"))
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter]);

  const nodeCount = infraNodes?.features?.length || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { k:"all", l:"All", c:"#6366f1" }, { k:"operational", l:"Operational", c:"#10b981" },
            { k:"under_repair", l:"Repair", c:"#f59e0b" }, { k:"damaged", l:"Damaged", c:"#ef4444" },
          ].map(f => (
            <button key={f.k} onClick={() => setStatusFilter(f.k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter===f.k ? "" : "gbtn-ghost"}`}
              style={statusFilter===f.k ? { background:`${f.c}20`, border:`1px solid ${f.c}40`, color:f.c } : {}}>
              {f.l}
            </button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold ginput">
          <option value="">All Types</option>
          {INFRA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-slate-500">{loading ? "Loading…" : `${nodeCount} nodes`}</span>
      </div>

      {/* Info banner */}
      <div className="rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-sky-400"
        style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)" }}>
        <span className="material-symbols-outlined text-[16px]">info</span>
        Map shows <strong className="mx-1">infrastructure nodes</strong> — each clusters all complaints at that location. Hover for AI summary.
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden" style={{ height:580, border:"1px solid rgba(0,0,0,0.08)" }}>
        {loading ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background:"rgba(0,0,0,0.04)" }}>
            <span className="material-symbols-outlined text-4xl animate-spin text-sky-400">progress_activity</span>
          </div>
        ) : (
          <MapboxInfraLayer nodes={infraNodes} onNodeClick={onNodeClick} />
        )}
      </div>
    </div>
  );
}

// ── Complaints tab ────────────────────────────────────────────────

function ComplaintsTab({ onWorkflow, onViewInfra }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status:"", priority:"" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchComplaintQueue({ limit:100, ...filter })
      .then(d => { setComplaints(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const shown = complaints.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
      || c.complaint_number?.includes(search)
      || c.address_text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, number, address…"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm ginput" />
        <select value={filter.priority} onChange={e => setFilter(p => ({...p, priority:e.target.value}))}
          className="px-3 py-2.5 rounded-xl text-sm ginput">
          <option value="">All Priority</option>
          {["emergency","critical","high","normal","low"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(p => ({...p, status:e.target.value}))}
          className="px-3 py-2.5 rounded-xl text-sm ginput">
          <option value="">All Status</option>
          {["received","workflow_started","in_progress","resolved","rejected"].map(s =>
            <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array(6).fill(0).map((_,i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background:"rgba(0,0,0,0.05)" }} />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <span className="material-symbols-outlined text-5xl block mb-2">search_off</span>
          No complaints found
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map(c => (
            <div key={c.id} className="rounded-xl p-4 transition-all"
              style={{ background:"rgba(255,255,255,0.7)", border:"1px solid rgba(0,0,0,0.07)" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.9)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.7)"}>
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: PC[c.priority]||"#6366f1" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono text-slate-500">#{c.complaint_number}</span>
                    <Pill label={c.priority} color={PC[c.priority]} size="xs" />
                    <Pill label={c.status} color={SC[c.status]||"#6366f1"} size="xs" />
                    {c.is_repeat_complaint && <span className="text-[10px] text-orange-400 font-bold">↩ Repeat ({c.repeat_gap_days}d)</span>}
                    {c.mapping_confidence && <span className="text-[10px] text-slate-500">{Math.round(c.mapping_confidence*100)}% conf</span>}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm truncate">{c.title}</p>
                  <p className="text-xs text-slate-500 truncate">{c.address_text}</p>
                  {c.agent_summary && <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">{c.agent_summary}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {!c.workflow_instance_id && (
                    <button onClick={() => onWorkflow(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold gbtn-sky flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">account_tree</span>
                      Workflow
                    </button>
                  )}
                  {c.infra_node_id && (
                    <button onClick={() => onViewInfra(c.infra_node_id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold gbtn-ghost flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">hub</span>
                      Node
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Workflow tab ──────────────────────────────────────────────────

function WorkflowTab({ onAssign }) {
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [expandedSugg, setExpandedSugg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSteps, setEditedSteps] = useState([]);
  const [editReason, setEditReason] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchComplaintQueue({ limit:100 }).then(d => {
      setComplaints((d.items||[]).filter(c => !c.workflow_instance_id));
    });
  }, []);

  const loadSuggestions = async (complaint) => {
    setSelected(complaint); setSuggestions([]); setExpandedSugg(null); setEditMode(false); setLoadingSugg(true);
    try {
      const d = await fetchWorkflowSuggestions(complaint.id);
      setSuggestions(Array.isArray(d) ? d : (d.suggestions || d.items || []));
    } catch { toast.error("Failed to load suggestions"); }
    finally { setLoadingSugg(false); }
  };

  const startEdit = (sugg) => { setExpandedSugg(sugg); setEditedSteps(sugg.steps.map(s => ({...s}))); setEditMode(true); };

  const approve = async (sugg, isEdited) => {
    if (!selected) return;
    setApproving(true);
    try {
      await approveWorkflow(selected.id, sugg.template_id, sugg.version_id, isEdited ? editedSteps : null, isEdited ? editReason : null);
      toast.success("Workflow started!");
      setSelected(null); setSuggestions([]);
      setComplaints(cs => cs.filter(c => c.id !== selected.id));
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setApproving(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: complaints needing workflow */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-800 text-sm">Needs Workflow</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full gpill-red">{complaints.length}</span>
        </div>
        <div className="flex flex-col gap-2 max-h-150 overflow-y-auto">
          {complaints.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">All complaints have workflows assigned</div>
          ) : complaints.map(c => (
            <button key={c.id} onClick={() => loadSuggestions(c)}
              className="text-left p-4 rounded-xl transition-all"
              style={{
                background: selected?.id===c.id ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.7)",
                border: selected?.id===c.id ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(0,0,0,0.07)",
              }}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Pill label={c.priority} color={PC[c.priority]} size="xs" />
                {c.is_repeat_complaint && <span className="text-[10px] text-orange-500 font-bold">↩ Repeat</span>}
              </div>
              <p className="font-semibold text-slate-800 text-sm">{c.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{c.address_text}</p>
              {c.infra_type_code && <p className="text-[10px] text-sky-500 mt-1 font-mono">{c.infra_type_code}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Right: suggestions panel */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-2">account_tree</span>
            <p className="text-sm">Select a complaint to view workflow suggestions</p>
          </div>
        ) : loadingSugg ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
            <p className="text-sm">AI generating suggestions…</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl p-4" style={{ background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)" }}>
              <p className="font-bold text-sky-600 text-sm">{selected.title}</p>
              <p className="text-xs text-sky-500/80 mt-1">{selected.agent_summary}</p>
            </div>

            {editMode && expandedSugg ? (
              <GCard>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 text-sm">Edit Workflow Steps</h4>
                  <button onClick={() => setEditMode(false)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                </div>
                <div className="flex flex-col gap-3 mb-4">
                  {editedSteps.map((step, idx) => (
                    <div key={idx} className="rounded-xl p-4" style={{ background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.07)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-sky-600"
                          style={{ background:"rgba(56,189,248,0.15)", border:"1px solid rgba(56,189,248,0.25)" }}>{step.step_number}</span>
                        <input value={step.step_name}
                          onChange={e => { const ns=[...editedSteps]; ns[idx]={...ns[idx],step_name:e.target.value}; setEditedSteps(ns); }}
                          className="flex-1 px-2 py-1 text-sm rounded-lg ginput" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-slate-500 mb-1 block">Department</label>
                          <p className="text-slate-600 font-medium">{step.department_name}</p>
                        </div>
                        <div>
                          <label className="text-slate-500 mb-1 block">Duration (hrs)</label>
                          <input type="number" value={step.expected_duration_hours||24}
                            onChange={e => { const ns=[...editedSteps]; ns[idx]={...ns[idx],expected_duration_hours:+e.target.value}; setEditedSteps(ns); }}
                            className="w-full px-2 py-1 rounded-lg text-xs ginput" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <textarea value={editReason} onChange={e => setEditReason(e.target.value)}
                  placeholder="Reason for editing this workflow…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none h-20 mb-3 ginput" />
                <button onClick={() => approve(expandedSugg, true)} disabled={!editReason||approving}
                  className="w-full gbtn-sky py-2.5 text-sm font-bold disabled:opacity-40">
                  {approving ? "Saving…" : "Save & Start Workflow"}
                </button>
              </GCard>
            ) : (
              <div className="flex flex-col gap-3">
                {suggestions.map((sugg, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden transition-all"
                    style={{ background:"rgba(255,255,255,0.7)", border:"1px solid rgba(0,0,0,0.07)" }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-sky-600"
                              style={{ background:"rgba(56,189,248,0.15)" }}>{i+1}</span>
                            <span className="text-[11px] text-slate-500">{Math.round((sugg.match_score||0)*100)}% match · {sugg.avg_completion_days?.toFixed(1)}d avg · {sugg.times_used}x used</span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm">{sugg.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{sugg.match_reason}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button onClick={() => approve(sugg, false)} disabled={approving}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold gbtn-sky flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check</span>
                            Approve
                          </button>
                          <button onClick={() => startEdit(sugg)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold gbtn-ghost flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                            Edit
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 mt-3">
                        {sugg.steps?.map((s, si) => (
                          <div key={si} className="flex items-center gap-2 text-xs py-1.5 border-t border-black/5">
                            <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-slate-500 shrink-0"
                              style={{ background:"rgba(0,0,0,0.06)" }}>{s.step_number}</span>
                            <span className="text-slate-600 font-medium flex-1">{s.step_name}</span>
                            <span className="text-slate-500 text-[10px]">{s.department_name}</span>
                            <span className="text-slate-500 text-[10px]">{s.expected_duration_hours}h</span>
                            {s.requires_tender && <span className="text-[10px] font-semibold gpill-orange px-1.5 py-0.5 rounded-full">Tender</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Tasks tab ─────────────────────────────────────────────────────

function TasksTab({ onTenderRequest }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [assignData, setAssignData] = useState({ workerId:"", contractorId:"", notes:"" });
  const [assigning, setAssigning] = useState(false);

  const load = (status) => {
    setLoading(true);
    fetchWorkerTasks(status).then(d => { setTasks(d.items||[]); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(null); }, []);

  const openTask = async (task) => {
    setSelected(task);
    const [w, c] = await Promise.all([
      fetchAvailableWorkers({ deptId: task.department_id }),
      fetchAvailableContractors({ deptId: task.department_id }),
    ]).catch(() => [[],[]]);
    setWorkers(w||[]); setContractors(c||[]);
    setAssignData({ workerId:"", contractorId:"", notes:"" });
  };

  const doAssign = async () => {
    if (!assignData.workerId && !assignData.contractorId) { toast.error("Select a worker or contractor"); return; }
    setAssigning(true);
    try {
      await assignTask(selected.id, {
        workerId: assignData.workerId || undefined,
        contractorId: assignData.contractorId || undefined,
        notes: assignData.notes || undefined,
      });
      toast.success("Task assigned!"); setSelected(null); load(filter);
    } catch (e) { toast.error(e.response?.data?.detail||"Failed"); }
    finally { setAssigning(false); }
  };

  const photoCount = (t, type) => (t[`${type}_photos`]||[]).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {[{k:null,l:"All"},{k:"pending",l:"Pending"},{k:"accepted",l:"Accepted"},{k:"in_progress",l:"In Progress"},{k:"completed",l:"Completed"}].map(f => (
          <button key={String(f.k)} onClick={() => { setFilter(f.k); load(f.k); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter===f.k ? "" : "gbtn-ghost"}`}
            style={filter===f.k ? { background:"rgba(56,189,248,0.15)", border:"1px solid rgba(56,189,248,0.3)", color:"#38bdf8" } : {}}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array(4).fill(0).map((_,i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background:"rgba(0,0,0,0.05)" }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(t => (
            <div key={t.id} className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ background:"rgba(255,255,255,0.7)", border:"1px solid rgba(0,0,0,0.07)" }}
              onClick={() => openTask(t)}>
              <div className="h-1" style={{ background: PC[t.priority]||"#6366f1" }} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-500">#{t.task_number}</span>
                  <Pill label={t.priority} color={PC[t.priority]} size="xs" />
                  <Pill label={t.status} color={t.status==="completed"?"#10b981":t.status==="in_progress"?"#f97316":"#6366f1"} size="xs" />
                </div>
                <p className="font-semibold text-slate-800 text-sm mb-1">{t.title}</p>
                <p className="text-xs text-slate-500 truncate">{t.address_text}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  <span className={photoCount(t,"before")>0?"text-emerald-400 font-semibold":""}>
                    📷 {photoCount(t,"before")} before
                  </span>
                  <span className={photoCount(t,"after")>0?"text-emerald-400 font-semibold":""}>
                    ✅ {photoCount(t,"after")} after
                  </span>
                  {t.due_at && (
                    <span className={`ml-auto ${new Date(t.due_at)<new Date()?"text-red-400 font-semibold":""}`}>
                      {new Date(t.due_at)<new Date()?"⚠️ Overdue":"Due"} {new Date(t.due_at).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-500">
              <span className="material-symbols-outlined text-5xl block mb-2">task_alt</span>
              No tasks found
            </div>
          )}
        </div>
      )}

      {selected && (
        <Modal title={`Task: ${selected.task_number}`} onClose={() => setSelected(null)} wide>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">{selected.title}</p>
                <p className="text-sm text-slate-400 mt-1">{selected.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Pill label={selected.priority} color={PC[selected.priority]} />
                  <Pill label={selected.status} color={selected.status==="completed"?"#10b981":"#6366f1"} />
                </div>
              </div>
              {selected.status==="pending" && (
                <button onClick={() => onTenderRequest(selected)}
                  className="px-3 py-2 rounded-xl text-xs font-bold gpill-orange flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                  Tender
                </button>
              )}
            </div>

            {(photoCount(selected,"before") > 0 || photoCount(selected,"after") > 0) && (
              <div>
                <p className="font-semibold text-slate-400 text-xs uppercase tracking-wider mb-3">Work Photos</p>
                <div className="grid grid-cols-2 gap-4">
                  {["before","after"].map(type => (
                    <div key={type}>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-2">{type} ({photoCount(selected,type)})</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(selected[`${type}_photos`]||[]).slice(0,6).map((p,i) => (
                          <img key={i} src={p.url} alt="" className="aspect-square rounded-lg object-cover w-full" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.status !== "completed" && (
              <div className="border-t border-black/8 pt-4">
                <p className="font-semibold text-slate-700 text-sm mb-3">Assign Worker / Contractor</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Worker</label>
                    <select value={assignData.workerId}
                      onChange={e => setAssignData(d => ({...d, workerId:e.target.value, contractorId:""}))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm ginput">
                      <option value="">Select worker…</option>
                      {workers.map(w => <option key={w.id} value={w.id}>{w.full_name} — {w.department_name} (⭐{w.performance_score})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Contractor</label>
                    <select value={assignData.contractorId}
                      onChange={e => setAssignData(d => ({...d, contractorId:e.target.value, workerId:""}))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm ginput">
                      <option value="">Select contractor…</option>
                      {contractors.map(c => <option key={c.id} value={c.id}>{c.company_name} (⭐{c.performance_score})</option>)}
                    </select>
                  </div>
                </div>
                <input value={assignData.notes} onChange={e => setAssignData(d => ({...d,notes:e.target.value}))}
                  placeholder="Notes (optional)…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm mb-3 ginput" />
                <button onClick={doAssign} disabled={assigning}
                  className="w-full gbtn-sky py-2.5 font-bold text-sm disabled:opacity-40">
                  {assigning ? "Assigning…" : "Assign"}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Surveys tab ───────────────────────────────────────────────────

function SurveyRolloutForm() {
  const [complaints, setComplaints] = useState([]);
  const [complaintId, setComplaintId] = useState("");
  const [surveyType, setSurveyType] = useState("midway");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComplaintQueue({ status:"in_progress", limit:30 }).then(d => setComplaints(d.items||[]));
  }, []);

  const send = async () => {
    if (!complaintId) { toast.error("Select a complaint"); return; }
    setSending(true);
    try {
      await rolloutSurvey(complaintId, surveyType);
      toast.success("Survey dispatched to citizen"); setComplaintId("");
    } catch (e) { toast.error(e.response?.data?.detail||"Failed"); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <select value={complaintId} onChange={e => setComplaintId(e.target.value)}
        className="px-3 py-2.5 rounded-xl text-sm ginput">
        <option value="">Select complaint…</option>
        {complaints.map(c => <option key={c.id} value={c.id}>#{c.complaint_number} — {c.title}</option>)}
      </select>
      <div className="flex gap-2">
        {["midway","closing","worker_feedback"].map(t => (
          <button key={t} onClick={() => setSurveyType(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${surveyType===t ? "" : "gbtn-ghost"}`}
            style={surveyType===t ? { background:"rgba(56,189,248,0.15)", border:"1px solid rgba(56,189,248,0.3)", color:"#38bdf8" } : {}}>
            {t.replace("_"," ")}
          </button>
        ))}
      </div>
      <button onClick={send} disabled={sending||!complaintId}
        className="gbtn-sky py-2.5 font-bold text-sm disabled:opacity-40">
        {sending ? "Sending…" : "Send Survey"}
      </button>
    </div>
  );
}

function SurveysTab() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyBriefing().then(d => { setAlerts(d.survey_alerts || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <GCard>
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px] text-amber-500">warning</span>
          Quality Alerts — Poor Survey Responses
        </h3>
        {loading ? <div className="h-20 rounded-xl animate-pulse" style={{ background:"rgba(0,0,0,0.05)" }} /> :
         alerts.length === 0 ? <p className="text-sm text-slate-400">No alerts — all surveys look good!</p> :
         <div className="flex flex-col gap-2">
           {alerts.map((a, i) => (
             <div key={i} className="rounded-xl p-4" style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)" }}>
               <div className="flex items-center justify-between">
                 <div>
                   <p className="font-semibold text-slate-800 text-sm">{a.title}</p>
                   <p className="text-xs text-slate-400">#{a.complaint_number} · {a.survey_type}</p>
                   <div className="flex items-center gap-1 mt-1">
                     {[1,2,3,4,5].map(s => (
                       <span key={s} className={`text-xs ${s<=Math.round(a.avg_rating)?"text-amber-400":"text-slate-600"}`}>★</span>
                     ))}
                     <span className="text-xs text-slate-500 ml-1">({+a.avg_rating?.toFixed(1)}) · {a.response_count} responses</span>
                   </div>
                 </div>
                 <span className="text-2xl">⚠️</span>
               </div>
             </div>
           ))}
         </div>}
      </GCard>

      <GCard>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px] text-sky-500">rate_review</span>
          Send Survey Manually
        </h3>
        <SurveyRolloutForm />
      </GCard>
    </div>
  );
}

// ── AI Infra Summary ──────────────────────────────────────────────

function AiInfraSummary({ nodeId }) {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const prevNode = useState(null);

  if (prevNode[0] !== nodeId) {
    prevNode[0] = nodeId;
    if (loaded) { setLoaded(false); setAiData(null); setError(null); }
  }

  const load = async () => {
    setLoading(true); setError(null);
    try { const d = await fetchInfraNodeAiSummary(nodeId); setAiData(d); setLoaded(true); }
    catch { setError("AI analysis failed. Try again."); }
    finally { setLoading(false); }
  };

  const SEV = { low:"#34d399", medium:"#fb923c", high:"#ef4444", critical:"#dc2626" };

  if (!loaded && !loading) return (
    <div className="rounded-2xl p-5" style={{ background:"linear-gradient(135deg,rgba(139,92,246,0.08),rgba(56,189,248,0.06))", border:"1px solid rgba(139,92,246,0.2)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"rgba(139,92,246,0.2)", border:"1px solid rgba(139,92,246,0.3)" }}>
          <span className="material-symbols-outlined text-violet-400 text-[20px]">psychology</span>
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">AI Deep Analysis</p>
          <p className="text-xs text-slate-400">Themes, frequency, incidents, recommendations</p>
        </div>
      </div>
      <button onClick={load}
        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 gbtn-sky"
        style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow:"0 4px 14px rgba(124,58,237,0.35)" }}>
        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
        Generate AI Analysis
      </button>
    </div>
  );

  if (loading) return (
    <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)" }}>
      <span className="material-symbols-outlined text-violet-400 animate-spin text-[24px]">progress_activity</span>
      <p className="text-sm text-violet-600">Gemini analysing complaint patterns…</p>
    </div>
  );

  if (error) return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)" }}>
      <span className="material-symbols-outlined text-red-400 text-[20px]">error</span>
      <p className="text-sm text-red-400">{error}</p>
      <button onClick={load} className="ml-auto text-xs font-bold text-red-500 hover:text-red-600">Retry</button>
    </div>
  );

  if (!aiData) return null;

  const sevColor = SEV[aiData.estimated_severity] || "#6366f1";
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(139,92,246,0.25)" }}>
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.6),rgba(56,189,248,0.4))" }}>
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-white text-[20px]">psychology</span>
          <p className="font-bold text-white text-sm">AI Infrastructure Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full font-bold capitalize text-white"
            style={{ background:`${sevColor}40`, border:`1px solid ${sevColor}60` }}>
            {aiData.estimated_severity?.toUpperCase()}
          </span>
          <button onClick={() => { setLoaded(false); setAiData(null); }}
            className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <span className="material-symbols-outlined text-white text-[14px]">refresh</span>
          </button>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4" style={{ background:"rgba(250,252,255,0.8)" }}>
        <div className="rounded-xl p-4" style={{ background:`${sevColor}08`, border:`1px solid ${sevColor}25` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[18px]" style={{ color:sevColor }}>bolt</span>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color:sevColor }}>Recommended Action</p>
          </div>
          <p className="text-sm font-semibold text-slate-800">{aiData.recommended_action}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Major Themes</p>
          <div className="flex flex-wrap gap-2">
            {(aiData.major_themes || []).map((t, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full gpill-sky font-medium">{t}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Frequency Analysis</p>
          <p className="text-sm text-slate-600 leading-relaxed">{aiData.frequency_analysis}</p>
        </div>

        {aiData.incident_timeline?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Incident Timeline</p>
            <div className="flex flex-col gap-2">
              {aiData.incident_timeline.map((item, i) => {
                const c = { high:"#ef4444", medium:"#f97316", low:"#34d399" }[item.severity] || "#6366f1";
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.06)" }}>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 capitalize"
                      style={{ background:`${c}18`, color:c, border:`1px solid ${c}30` }}>{item.period}</span>
                    <p className="text-xs text-slate-500 flex-1">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Infra Nodes tab ───────────────────────────────────────────────

function InfraNodesTab() {
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState([]);

  const loadNode = async (nodeId) => {
    setSelected(nodeId); setSummary(null); setLoading(true);
    try { setSummary(await fetchInfraNodeSummary(nodeId)); }
    catch { toast.error("Failed to load node"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchComplaintQueue({ limit:100 }).then(d => {
      const seen = new Set();
      const unique = [];
      (d.items||[]).forEach(c => {
        if (c.infra_node_id && !seen.has(c.infra_node_id)) {
          seen.add(c.infra_node_id);
          unique.push({ id:c.infra_node_id, name:c.infra_type_name, code:c.infra_type_code, address:c.address_text });
        }
      });
      setNodes(unique);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <p className="font-semibold text-slate-800 text-sm mb-3">Infra Nodes in Jurisdiction</p>
        <div className="flex flex-col gap-2 max-h-150 overflow-y-auto">
          {nodes.map(n => (
            <button key={n.id} onClick={() => loadNode(n.id)}
              className="text-left p-3 rounded-xl transition-all"
              style={{
                background: selected===n.id ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.7)",
                border: selected===n.id ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(0,0,0,0.07)",
              }}>
              <p className="font-semibold text-slate-700 text-xs">{n.code}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{n.address}</p>
            </button>
          ))}
          {nodes.length===0 && <p className="text-sm text-slate-500 text-center py-8">No infra nodes found</p>}
        </div>
      </div>

      <div className="lg:col-span-2">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-2">hub</span>
            <p className="text-sm">Select an infra node</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
            <p className="text-sm">Loading node summary…</p>
          </div>
        ) : summary && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-5" style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-sm">{summary.node.infra_type_name}</h3>
                <Pill label={summary.node.status} color="#34d399" />
              </div>
              <p className="text-xs text-sky-400/70 mb-3">{summary.node.jurisdiction_name}</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { l:"Total", v:summary.node.total_complaint_count, c:"#6366f1" },
                  { l:"Resolved", v:summary.node.total_resolved_count, c:"#34d399" },
                  { l:"Repeat Alert", v:`${summary.node.repeat_alert_years}yr`, c:"#f97316" },
                  { l:"Radius", v:`${summary.node.cluster_radius_meters}m`, c:"#8b5cf6" },
                ].map(s => (
                  <div key={s.l} className="rounded-xl p-3 text-center"
                    style={{ background:`${s.c}0a`, border:`1px solid ${s.c}22` }}>
                    <p className="text-lg font-black" style={{color:s.c}}>{s.v}</p>
                    <p className="text-[10px] text-slate-500">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {summary.active_workflow && (
              <div className="rounded-xl p-4" style={{ background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">account_tree</span>
                  <span className="font-bold text-emerald-400 text-sm">Active Workflow</span>
                </div>
                <p className="font-semibold text-slate-700 text-sm">{summary.active_workflow.template_name}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(0,0,0,0.08)" }}>
                    <div className="h-full bg-emerald-500 rounded-full"
                      style={{width:`${(summary.active_workflow.current_step_number/summary.active_workflow.total_steps)*100}%`, boxShadow:"0 0 6px rgba(52,211,153,0.4)"}} />
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">
                    Step {summary.active_workflow.current_step_number} / {summary.active_workflow.total_steps}
                  </span>
                </div>
              </div>
            )}

            <AiInfraSummary nodeId={selected} />

            <div>
              <p className="font-semibold text-slate-800 text-sm mb-3">Complaint History ({summary.complaints.length})</p>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {summary.complaints.map(c => (
                  <div key={c.id} className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background:"rgba(255,255,255,0.7)", border:"1px solid rgba(0,0,0,0.07)" }}>
                    <div className="w-1.5 h-6 rounded-full shrink-0" style={{background:SC[c.status]||"#6366f1"}} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-xs truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <Pill label={c.status} color={SC[c.status]||"#6366f1"} size="xs" />
                    {c.is_repeat_complaint && <span className="text-[10px] text-orange-400 font-bold">↩</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tenders tab ───────────────────────────────────────────────────

function TendersTab({ prefillTask, onClear }) {
  const [form, setForm] = useState({
    complaint_id: prefillTask?.complaint_id || "",
    title: prefillTask ? `Tender for: ${prefillTask.title}` : "",
    description: "", scope_of_work: "", estimated_cost: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaintQueue({ status:"in_progress", limit:30 }).then(d => setComplaints(d.items||[]));
    if (prefillTask) {
      setForm(f => ({...f, complaint_id: prefillTask.complaint_id||"", title:`Tender for: ${prefillTask.title}`, workflow_step_instance_id:prefillTask.workflow_step_instance_id}));
    }
  }, [prefillTask]);

  const submit = async () => {
    if (!form.complaint_id || !form.title || !form.estimated_cost) { toast.error("Fill all required fields"); return; }
    setSubmitting(true);
    try {
      await client.post("/admin/tenders/request", { ...form, estimated_cost:+form.estimated_cost });
      toast.success("Tender request created!");
      if (onClear) onClear();
      setForm({ complaint_id:"", title:"", description:"", scope_of_work:"", estimated_cost:"" });
    } catch (e) { toast.error(e.response?.data?.detail||"Failed"); }
    finally { setSubmitting(false); }
  };

  const field = (label, el) => (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      {el}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <GCard>
        <h3 className="font-bold text-slate-800 text-sm mb-4">Request New Tender</h3>
        <div className="flex flex-col gap-4">
          {field("Related Complaint *",
            <select value={form.complaint_id} onChange={e => setForm(f => ({...f,complaint_id:e.target.value}))}
              className="w-full px-3 py-2.5 rounded-xl text-sm ginput">
              <option value="">Select complaint…</option>
              {complaints.map(c => <option key={c.id} value={c.id}>#{c.complaint_number} — {c.title}</option>)}
            </select>
          )}
          {field("Tender Title *",
            <input value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))}
              placeholder="e.g. Pothole repair — Rohini Sector 7"
              className="w-full px-3 py-2.5 rounded-xl text-sm ginput" />
          )}
          {field("Description",
            <textarea value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))}
              rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none ginput"
              placeholder="Description of the work required…" />
          )}
          {field("Scope of Work",
            <textarea value={form.scope_of_work} onChange={e => setForm(f => ({...f,scope_of_work:e.target.value}))}
              rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none ginput"
              placeholder="Materials, expected deliverables…" />
          )}
          {field("Estimated Cost (₹) *",
            <input type="number" value={form.estimated_cost} onChange={e => setForm(f => ({...f,estimated_cost:e.target.value}))}
              placeholder="e.g. 150000"
              className="w-full px-3 py-2.5 rounded-xl text-sm ginput" />
          )}
          <button onClick={submit} disabled={submitting}
            className="gbtn-sky py-3 font-bold text-sm disabled:opacity-40">
            {submitting ? "Creating…" : "Create Tender Request"}
          </button>
        </div>
      </GCard>

      <GCard>
        <h3 className="font-bold text-slate-800 text-sm mb-4">How Tender Flow Works</h3>
        <div className="flex flex-col gap-0">
          {[
            {s:1,t:"Official creates request",d:"Linked to a complaint or workflow step",i:"edit_note"},
            {s:2,t:"Admin reviews & approves",d:"Cost and scope reviewed by branch head",i:"gavel"},
            {s:3,t:"Sent to contractors",d:"Registered contractors can view and apply",i:"send"},
            {s:4,t:"Contractor awarded",d:"Admin selects contractor and awards",i:"verified"},
            {s:5,t:"Work begins",d:"Contractor assigned to relevant tasks",i:"construction"},
          ].map(s => (
            <div key={s.s} className="flex items-start gap-3 py-3.5 border-b border-black/6 last:border-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.2)" }}>
                <span className="material-symbols-outlined text-sky-500 text-[16px]">{s.i}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{s.s}. {s.t}</p>
                <p className="text-xs text-slate-500">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </GCard>
    </div>
  );
}

// ── Reroute Tab ───────────────────────────────────────────────────

function RerouteTab() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newDepts, setNewDepts] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(new Set());

  useEffect(() => {
    Promise.all([fetchComplaintQueue({ limit:100 }), fetchDepartments()])
      .then(([q, d]) => { setComplaints(q.items||[]); setDepartments(d||[]); })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!selected || newDepts.length === 0) { toast.error("Select at least one department"); return; }
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    setSubmitting(true);
    try {
      await client.post(`/admin/complaints/${selected.id}/reroute`, { new_dept_ids:newDepts, reason });
      toast.success("Complaint rerouted!"); setDone(prev => new Set([...prev, selected.id]));
      setSelected(null); setNewDepts([]); setReason("");
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
    finally { setSubmitting(false); }
  };

  const toggleDept = (id) => setNewDepts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  const visible = complaints.filter(c => !done.has(c.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-800 text-sm">Complaints</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full gpill-sky">{visible.length}</span>
        </div>
        {loading ? Array(4).fill(0).map((_,i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background:"rgba(0,0,0,0.05)" }} />) :
         visible.length === 0 ? (
           <div className="text-center py-12 text-slate-500">
             <span className="material-symbols-outlined text-4xl block mb-1">alt_route</span>
             <p className="text-sm">No complaints to reroute</p>
           </div>
         ) : (
           <div className="flex flex-col gap-2 max-h-150 overflow-y-auto">
             {visible.map(c => (
               <button key={c.id} onClick={() => { setSelected(c); setNewDepts([]); setReason(""); }}
                 className="text-left p-3 rounded-xl transition-all"
                 style={{
                   background: selected?.id===c.id ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.7)",
                   border: selected?.id===c.id ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(0,0,0,0.07)",
                 }}>
                 <div className="flex items-center gap-2 mb-1 flex-wrap">
                   <Pill label={c.priority} color={PC[c.priority]} size="xs" />
                   <Pill label={c.status} color={SC[c.status]||"#6366f1"} size="xs" />
                 </div>
                 <p className="font-semibold text-slate-800 text-xs truncate">{c.title}</p>
                 <p className="text-[10px] text-slate-500 mt-0.5 truncate">{c.address_text}</p>
               </button>
             ))}
           </div>
         )}
      </div>

      <div className="lg:col-span-3">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-2">alt_route</span>
            <p className="text-sm">Select a complaint to reroute it</p>
          </div>
        ) : (
          <GCard>
            <div className="rounded-xl p-4 mb-4" style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Pill label={selected.priority} color={PC[selected.priority]} size="xs" />
                <span className="text-[10px] font-mono text-slate-500">#{selected.complaint_number}</span>
              </div>
              <p className="font-bold text-sky-600 text-sm">{selected.title}</p>
              <p className="text-xs text-sky-500/70 mt-1">{selected.agent_summary}</p>
            </div>

            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Assign to Department(s) *</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {departments.map(d => (
                <button key={d.id} type="button" onClick={() => toggleDept(d.id)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: newDepts.includes(d.id) ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.7)",
                    border: newDepts.includes(d.id) ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(0,0,0,0.07)",
                  }}>
                  <p className="font-bold text-slate-700 text-xs">{d.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{d.code}</p>
                </button>
              ))}
            </div>

            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Reason for rerouting…" rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none mb-4 ginput" />

            <button onClick={submit} disabled={submitting || newDepts.length===0}
              className="w-full gbtn-sky py-2.5 font-bold text-sm disabled:opacity-40">
              {submitting ? "Rerouting…" : "Reroute Complaint"}
            </button>
          </GCard>
        )}
      </div>
    </div>
  );
}

// ── Main OfficialDashboardPage ────────────────────────────────────

const TABS = [
  { key:"overview",   label:"Overview",    icon:"dashboard" },
  { key:"map",        label:"Map",         icon:"map" },
  { key:"complaints", label:"Complaints",  icon:"inbox" },
  { key:"workflow",   label:"Workflow",    icon:"account_tree" },
  { key:"tasks",      label:"Tasks",       icon:"construction" },
  { key:"surveys",    label:"Surveys",     icon:"rate_review" },
  { key:"infra",      label:"Infra Nodes", icon:"hub" },
  { key:"tenders",    label:"Tenders",     icon:"gavel" },
  { key:"reroute",    label:"Reroute",     icon:"alt_route" },
];

export default function OfficialDashboardPage() {
  const [tab,        setTab]        = useState("overview");
  const [kpi,        setKpi]        = useState(null);
  const [briefing,   setBriefing]   = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [tenderTask, setTenderTask] = useState(null);
  const [chatOpen,   setChatOpen]   = useState(false);

  useEffect(() => {
    Promise.all([fetchAdminKPI(), fetchDailyBriefing()])
      .then(([k, b]) => { setKpi(k); setBriefing(b); })
      .catch(err => console.warn("KPI/briefing load failed:", err))
      .finally(() => setKpiLoading(false));
  }, []);

  const handleWorkflow = (complaint) => setTab("workflow");
  const handleViewInfra = (nodeId) => setTab("infra");
  const handleTenderRequest = (task) => { setTenderTask(task); setTab("tenders"); };

  return (
    <AppLayout title="Command Center">
      <div className="p-5 lg:p-7 flex flex-col gap-5">
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Command Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">Official Dashboard · Real-time civic operations</p>
          </div>
          <button onClick={() => setChatOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={chatOpen
              ? { background:"rgba(56,189,248,0.2)", border:"1px solid rgba(56,189,248,0.35)", color:"#38bdf8" }
              : { background:"rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.08)", color:"#64748b" }}>
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            AI Assistant
            {chatOpen && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
          </button>
        </div>

        {/* Tabs */}
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {/* Main content + optional chat panel */}
        <div className={`flex gap-5 ${chatOpen ? "flex-col lg:flex-row" : ""}`}>
          <div className={`flex-1 min-w-0 ${chatOpen ? "lg:w-[65%]" : "w-full"}`}>
            {tab === "overview"   && <OverviewTab kpi={kpi} briefing={briefing} loading={kpiLoading} />}
            {tab === "map"        && <MapTab onNodeClick={id => { handleViewInfra(id); }} />}
            {tab === "complaints" && <ComplaintsTab onWorkflow={handleWorkflow} onViewInfra={handleViewInfra} />}
            {tab === "workflow"   && <WorkflowTab />}
            {tab === "tasks"      && <TasksTab onTenderRequest={handleTenderRequest} />}
            {tab === "surveys"    && <SurveysTab />}
            {tab === "infra"      && <InfraNodesTab />}
            {tab === "tenders"    && <TendersTab prefillTask={tenderTask} onClear={() => setTenderTask(null)} />}
            {tab === "reroute"    && <RerouteTab />}
          </div>

          {chatOpen && (
            <div className="lg:w-[35%] shrink-0">
              <div className="sticky top-20 rounded-2xl overflow-hidden"
                style={{ height:"70vh", border:"1px solid rgba(0,0,0,0.08)", background:"rgba(255,255,255,0.85)", backdropFilter:"blur(20px)" }}>
                <CRMAgentChat />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
