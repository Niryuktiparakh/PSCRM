// src/pages/DashboardPage.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import ComplaintMap from "../components/ComplaintMap";
import {
  fetchMyComplaints,
  fetchNearbyComplaints,
  fetchAllComplaints,
  fetchMyStats,
} from "../api/complaintsApi";
import { toast } from "sonner";

const STATUS_COLOR = {
  received:          "#818cf8",
  clustered:         "#818cf8",
  mapped:            "#60a5fa",
  workflow_started:  "#38bdf8",
  in_progress:       "#fb923c",
  midway_survey_sent:"#fb923c",
  resolved:          "#34d399",
  closed:            "#34d399",
  rejected:          "#f87171",
  escalated:         "#f87171",
  emergency:         "#ef4444",
  constraint_blocked:"#d97706",
};

const STATUS_LABEL = {
  received:          "Received",
  clustered:         "Clustered",
  mapped:            "Mapped",
  workflow_started:  "Assigned",
  in_progress:       "In Progress",
  midway_survey_sent:"Survey Sent",
  resolved:          "Resolved",
  closed:            "Closed",
  rejected:          "Rejected",
  escalated:         "Escalated",
  emergency:         "Emergency",
  constraint_blocked:"Blocked",
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

const DELHI_CENTER = [28.6139, 77.209];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");

  const [complaints,     setComplaints]     = useState([]);
  const [nearbyPins,     setNearbyPins]     = useState([]);
  const [allPins,        setAllPins]        = useState([]);
  const [stats,          setStats]          = useState(null);
  const [userLocation,   setUserLocation]   = useState(null);
  const [locationStatus, setLocationStatus] = useState("locating");
  const [loading,        setLoading]        = useState(true);
  const [mapView,        setMapView]        = useState("nearby"); // "nearby" | "all"

  // ── Step 1: GPS ──────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(DELHI_CENTER);
      setLocationStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationStatus("found");
      },
      () => {
        setUserLocation(DELHI_CENTER);
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ── Step 2: Load all data once location is known ─────────────
  useEffect(() => {
    if (!userLocation) return;

    async function load() {
      setLoading(true);
      try {
        const [complaintsRes, nearbyRes, allRes, statsRes] = await Promise.all([
          fetchMyComplaints({ limit: 5 }),
          fetchNearbyComplaints(userLocation[0], userLocation[1], 4000),
          fetchAllComplaints(),
          fetchMyStats(),
        ]);
        setComplaints(complaintsRes.items || []);
        setNearbyPins(nearbyRes || []);
        setAllPins(allRes || []);
        setStats(statsRes);
      } catch {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userLocation]);

  // ── Derived ──────────────────────────────────────────────────
  const activePins       = mapView === "nearby" ? nearbyPins : allPins;
  const totalAll         = stats?.total_count    ?? 1;
  const totalResolved    = stats?.resolved_count ?? 0;
  const slaPercent       = totalAll > 0 ? Math.round((totalResolved / totalAll) * 100) : 0;
  const circumference    = 2 * Math.PI * 24;
  const slaOffset        = circumference * (1 - slaPercent / 100);
  const activeComplaints = complaints.filter(
    (c) => !["resolved", "closed", "rejected"].includes(c.status)
  );

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6 lg:flex-row min-h-0">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-5 lg:w-[58%]">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-headline font-bold text-on-surface">
                Namaskar, {user.full_name?.split(" ")[0] || "Citizen"} 🙏
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {loading
                  ? "Loading your grievances…"
                  : `${stats?.total_count ?? 0} total · ${stats?.active_count ?? 0} active · ${stats?.resolved_count ?? 0} resolved`}
              </p>
            </div>
            <Link
              to="/submit"
              className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Report
            </Link>
          </div>

          {/* Map view toggle */}
          <div className="flex items-center gap-2">
            {[
              { key: "nearby", label: `Nearby (${nearbyPins.length})`, icon: "near_me" },
              { key: "all",    label: `All Delhi (${allPins.length})`,  icon: "public"  },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMapView(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  mapView === opt.key
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{opt.icon}</span>
                {opt.label}
              </button>
            ))}

            {!loading && (
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-on-surface-variant font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* 3D Map */}
          <ComplaintMap
            pins={activePins}
            userLocation={userLocation}
            locationStatus={locationStatus}
            height="420px"
            showRadius={mapView === "nearby"}
            radiusMeters={4000}
          />

          {/* Recent complaints */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">receipt_long</span>
                My Recent Complaints
              </h2>
              <Link to="/my-complaints" className="text-primary text-sm hover:underline">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-outline-variant/30 animate-pulse" />
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-2">inbox</span>
                <p className="text-sm">No complaints filed yet.</p>
                <Link to="/submit" className="text-primary text-sm mt-1 inline-block hover:underline">
                  File your first one →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/complaints/${c.id}`)}
                    className="flex items-start gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-on-surface-variant font-mono">
                          #{c.complaint_number}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: (STATUS_COLOR[c.status] || "#818cf8") + "22",
                            color:      STATUS_COLOR[c.status] || "#818cf8",
                          }}
                        >
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                        {c.is_repeat_complaint && (
                          <span className="text-xs text-red-400 font-semibold">Repeat</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-on-surface truncate">{c.title}</p>
                      {c.address_text && (
                        <p className="text-xs text-on-surface-variant truncate">{c.address_text}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-on-surface-variant whitespace-nowrap shrink-0">
                      {timeAgo(c.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-5 lg:w-[42%]">

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",    value: stats?.total_count,    icon: "receipt_long", color: "#818cf8" },
              { label: "Active",   value: stats?.active_count,   icon: "pending",      color: "#fb923c" },
              { label: "Resolved", value: stats?.resolved_count, icon: "check_circle", color: "#34d399" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant flex flex-col items-center gap-1"
                style={{ borderColor: s.color + "30" }}
              >
                <span className="material-symbols-outlined text-[24px]" style={{ color: s.color }}>
                  {s.icon}
                </span>
                <span className="text-2xl font-headline font-bold text-on-surface">
                  {loading ? "…" : (s.value ?? 0)}
                </span>
                <span className="text-xs text-on-surface-variant">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Delhi overview — near you vs citywide */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant">
            <h2 className="font-headline font-semibold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">public</span>
              Delhi Overview
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Near You (4km)",
                  value: nearbyPins.length,
                  sub:   `${nearbyPins.filter(p => !["resolved","closed","rejected"].includes(p.status)).length} active`,
                  color: "#6366f1",
                },
                {
                  label: "Citywide",
                  value: allPins.length,
                  sub:   `${allPins.filter(p => ["critical","emergency"].includes(p.priority)).length} critical`,
                  color: "#f97316",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 border"
                  style={{ borderColor: s.color + "25", background: s.color + "08" }}
                >
                  <p className="text-xs text-on-surface-variant font-medium mb-1">{s.label}</p>
                  <p className="text-xl font-headline font-bold" style={{ color: s.color }}>
                    {loading ? "…" : s.value}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution rate */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant">
            <h2 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">timer</span>
              Resolution Rate
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="rotate-[-90deg]" width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="24" fill="none"
                    stroke={slaPercent >= 70 ? "#10b981" : slaPercent >= 40 ? "#f97316" : "#ef4444"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={slaOffset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-on-surface">
                  {loading ? "…" : `${slaPercent}%`}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {loading ? "Loading…" : `${totalResolved} of ${totalAll} resolved`}
                </p>
                {stats?.avg_resolution_days != null && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    Avg. {stats.avg_resolution_days} days to resolve
                  </p>
                )}
                <span className={`text-xs font-semibold mt-1.5 inline-block px-2 py-0.5 rounded-full ${
                  slaPercent >= 70
                    ? "bg-green-500/10 text-green-600"
                    : slaPercent >= 40
                    ? "bg-orange-500/10 text-orange-600"
                    : "bg-red-500/10 text-red-600"
                }`}>
                  {slaPercent >= 70 ? "On Track" : slaPercent >= 40 ? "In Progress" : "Low"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant">
            <h2 className="font-headline font-semibold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">bolt</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Report Issue",  icon: "add_circle",    to: "/submit",        primary: true },
                { label: "My Complaints", icon: "list_alt",      to: "/my-complaints" },
                { label: "Call 1031",     icon: "phone",         onClick: () => window.open("tel:1031") },
                { label: "Notifications", icon: "notifications", to: "/notifications" },
              ].map((action) => {
                const cls = `flex flex-col items-center gap-1.5 p-3 rounded-xl border transition text-sm font-medium ${
                  action.primary
                    ? "bg-primary text-on-primary border-primary hover:bg-primary/90"
                    : "bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high"
                }`;
                return action.to ? (
                  <Link key={action.label} to={action.to} className={cls}>
                    <span className="material-symbols-outlined text-[22px]">{action.icon}</span>
                    {action.label}
                  </Link>
                ) : (
                  <button key={action.label} className={cls} onClick={action.onClick}>
                    <span className="material-symbols-outlined text-[22px]">{action.icon}</span>
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active list */}
          {!loading && activeComplaints.length > 0 && (
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant">
              <h2 className="font-headline font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-orange-500">pending</span>
                Active ({activeComplaints.length})
              </h2>
              {activeComplaints.map((c) => (
                <Link
                  key={c.id}
                  to={`/complaints/${c.id}`}
                  className="flex items-center gap-3 py-2 border-b border-outline-variant last:border-0 hover:text-primary transition"
                >
                  <span className="text-xs font-mono text-on-surface-variant">
                    #{c.complaint_number}
                  </span>
                  <span className="text-sm text-on-surface truncate flex-1">{c.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}