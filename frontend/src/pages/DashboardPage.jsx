// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import ComplaintMap from "../components/ComplaintMap";
import { fetchMyComplaints, fetchNearbyComplaints, fetchAllComplaints, fetchMyStats } from "../api/complaintsApi";
import { toast } from "sonner";

const STATUS_COLOR = {
  received: "#818cf8", clustered: "#818cf8", mapped: "#60a5fa",
  workflow_started: "#38bdf8", in_progress: "#fb923c",
  midway_survey_sent: "#fb923c", resolved: "#34d399", closed: "#34d399",
  rejected: "#f87171", escalated: "#f87171", emergency: "#ef4444",
  constraint_blocked: "#d97706",
};
const STATUS_LABEL = {
  received: "Received", clustered: "Clustered", mapped: "Mapped",
  workflow_started: "Assigned", in_progress: "In Progress",
  midway_survey_sent: "Survey Sent", resolved: "Resolved", closed: "Closed",
  rejected: "Rejected", escalated: "Escalated", emergency: "Emergency",
  constraint_blocked: "Blocked",
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function GCard({ children, className = "", style = {} }) {
  return (
    <div className={`gcard p-5 ${className}`} style={style}>{children}</div>
  );
}

function StatCard({ label, value, icon, color, sub, loading }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}25`,
        backdropFilter: "blur(16px)",
      }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${color}99` }}>{label}</span>
        <span className="material-symbols-outlined text-[18px]" style={{ color }}>{icon}</span>
      </div>
      <p className="text-3xl font-black text-slate-800">{loading ? "…" : (value ?? 0)}</p>
      {sub && <p className="text-[11px]" style={{ color: `${color}80` }}>{sub}</p>}
    </div>
  );
}

const DELHI_CENTER = [28.6139, 77.209];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");

  const [complaints,   setComplaints]   = useState([]);
  const [nearbyPins,   setNearbyPins]   = useState([]);
  const [allPins,      setAllPins]      = useState([]);
  const [stats,        setStats]        = useState(null);
  const [userLoc,      setUserLoc]      = useState(null);
  const [locStatus,    setLocStatus]    = useState("locating");
  const [loading,      setLoading]      = useState(true);
  const [mapView,      setMapView]      = useState("nearby");

  useEffect(() => {
    if (!navigator.geolocation) { setUserLoc(DELHI_CENTER); setLocStatus("unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserLoc([p.coords.latitude, p.coords.longitude]); setLocStatus("found"); },
      ()  => { setUserLoc(DELHI_CENTER); setLocStatus("denied"); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!userLoc) return;
    setLoading(true);
    Promise.all([
      fetchMyComplaints({ limit: 5 }),
      fetchNearbyComplaints(userLoc[0], userLoc[1], 4000),
      fetchAllComplaints(),
      fetchMyStats(),
    ]).then(([c, n, a, s]) => {
      setComplaints(c.items || []);
      setNearbyPins(n || []);
      setAllPins(a || []);
      setStats(s);
    }).catch(() => toast.error("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, [userLoc]);

  const activePins    = mapView === "nearby" ? nearbyPins : allPins;
  const totalAll      = stats?.total_count    ?? 1;
  const totalResolved = stats?.resolved_count ?? 0;
  const slaPct        = totalAll > 0 ? Math.round((totalResolved / totalAll) * 100) : 0;
  const circ          = 2 * Math.PI * 24;
  const slaOffset     = circ * (1 - slaPct / 100);
  const slaColor      = slaPct >= 70 ? "#34d399" : slaPct >= 40 ? "#fb923c" : "#f87171";
  const active        = complaints.filter(c => !["resolved","closed","rejected"].includes(c.status));

  return (
    <AppLayout>
      <div className="p-5 lg:p-7 flex flex-col gap-6 lg:flex-row">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-5 lg:w-[58%]">

          {/* Header */}
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Namaskar, {user.full_name?.split(" ")[0] || "Citizen"} 🙏
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {loading ? "Loading…" : `${stats?.total_count ?? 0} total · ${stats?.active_count ?? 0} active · ${stats?.resolved_count ?? 0} resolved`}
              </p>
            </div>
            <Link to="/submit"
              className="gbtn-sky px-5 py-2.5 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Report
            </Link>
          </div>

          {/* Map toggle */}
          <div className="flex items-center gap-2">
            {[
              { key: "nearby", label: `Nearby (${nearbyPins.length})`, icon: "near_me" },
              { key: "all",    label: `Delhi (${allPins.length})`,     icon: "public"  },
            ].map(opt => (
              <button key={opt.key} onClick={() => setMapView(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  mapView === opt.key
                    ? "text-white gbtn-sky"
                    : "gbtn-ghost"
                }`}>
                <span className="material-symbols-outlined text-[14px]">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
            {!loading && (
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden" style={{ height: 400, border: "1px solid rgba(0,0,0,0.08)" }}>
            <ComplaintMap
              pins={activePins}
              userLocation={userLoc}
              locationStatus={locStatus}
              height="400px"
              showRadius={mapView === "nearby"}
              radiusMeters={4000}
            />
          </div>

          {/* Recent complaints */}
          <GCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[18px] text-sky-400">receipt_long</span>
                My Recent Complaints
              </h3>
              <Link to="/my-complaints" className="text-sky-400 text-xs hover:text-sky-300 transition-colors">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(n => (
                  <div key={n} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(0,0,0,0.06)" }} />
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-5xl block mb-2">inbox</span>
                <p className="text-sm">No complaints filed yet.</p>
                <Link to="/submit" className="text-sky-400 text-sm mt-1 inline-block hover:underline">
                  File your first one →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {complaints.map(c => {
                  const col = STATUS_COLOR[c.status] || "#818cf8";
                  return (
                    <div key={c.id} onClick={() => navigate(`/complaints/${c.id}`)}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.9)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.6)"}
                    >
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: col }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] font-mono text-slate-500">#{c.complaint_number}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${col}18`, color: col, border: `1px solid ${col}30` }}>
                            {STATUS_LABEL[c.status] || c.status}
                          </span>
                          {c.is_repeat_complaint && (
                            <span className="text-[10px] font-bold gpill-orange px-1.5 py-0.5 rounded-full">Repeat</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate">{c.title}</p>
                        {c.address_text && <p className="text-xs text-slate-500 truncate">{c.address_text}</p>}
                      </div>
                      <span className="text-[10px] text-slate-600 whitespace-nowrap shrink-0">{timeAgo(c.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </GCard>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-5 lg:w-[42%]">

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total"    value={stats?.total_count}    icon="receipt_long" color="#818cf8" loading={loading} />
            <StatCard label="Active"   value={stats?.active_count}   icon="pending"      color="#fb923c" loading={loading} />
            <StatCard label="Resolved" value={stats?.resolved_count} icon="check_circle" color="#34d399" loading={loading} />
          </div>

          {/* Overview */}
          <GCard>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-indigo-400">public</span>
              Delhi Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Near You (4km)", value: nearbyPins.length, sub: `${nearbyPins.filter(p => !["resolved","closed","rejected"].includes(p.status)).length} active`, color: "#6366f1" },
                { label: "Citywide",       value: allPins.length,    sub: `${allPins.filter(p => ["critical","emergency"].includes(p.priority)).length} critical`,          color: "#f97316" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3"
                  style={{ background: `${s.color}0a`, border: `1px solid ${s.color}20` }}>
                  <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{loading ? "…" : s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </GCard>

          {/* Resolution rate */}
          <GCard>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-sky-400">timer</span>
              Resolution Rate
            </h3>
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
                  <circle cx="32" cy="32" r="24" fill="none" stroke={slaColor} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={slaOffset}
                    style={{ transition: "stroke-dashoffset 0.6s ease", filter: `drop-shadow(0 0 4px ${slaColor})` }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: slaColor }}>
                  {loading ? "…" : `${slaPct}%`}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-800 font-medium">
                  {loading ? "Loading…" : `${totalResolved} of ${totalAll} resolved`}
                </p>
                {stats?.avg_resolution_days != null && (
                  <p className="text-xs text-slate-400 mt-1">Avg. {stats.avg_resolution_days} days</p>
                )}
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: `${slaColor}18`, color: slaColor, border: `1px solid ${slaColor}30` }}>
                  {slaPct >= 70 ? "On Track" : slaPct >= 40 ? "In Progress" : "Needs Attention"}
                </span>
              </div>
            </div>
          </GCard>

          {/* Quick actions */}
          <GCard>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-amber-400">bolt</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Report Issue",   icon: "add_circle",    to: "/submit",        primary: true },
                { label: "My Complaints",  icon: "list_alt",      to: "/my-complaints" },
                { label: "Call 1031",      icon: "phone",         onClick: () => window.open("tel:1031") },
                { label: "Notifications",  icon: "notifications", to: "/notifications" },
              ].map(a => {
                const cls = `flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all ${
                  a.primary ? "gbtn-sky text-white" : "gbtn-ghost"
                }`;
                return a.to ? (
                  <Link key={a.label} to={a.to} className={cls}>
                    <span className="material-symbols-outlined text-[22px]">{a.icon}</span>
                    {a.label}
                  </Link>
                ) : (
                  <button key={a.label} onClick={a.onClick} className={cls}>
                    <span className="material-symbols-outlined text-[22px]">{a.icon}</span>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </GCard>

          {/* Active list */}
          {!loading && active.length > 0 && (
            <GCard>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px] text-orange-400">pending</span>
                Active ({active.length})
              </h3>
              <div className="flex flex-col">
                {active.map(c => (
                  <Link key={c.id} to={`/complaints/${c.id}`}
                    className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0 hover:text-sky-500 text-slate-600 transition-colors text-sm">
                    <span className="text-[10px] font-mono text-slate-600 shrink-0">#{c.complaint_number}</span>
                    <span className="truncate">{c.title}</span>
                  </Link>
                ))}
              </div>
            </GCard>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
