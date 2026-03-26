import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { fetchMyComplaints } from "../api/complaintsApi";
import client from "../api/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_LABEL = {
  received: "Received", clustered: "Clustered", mapped: "Mapped",
  workflow_started: "Workflow Started", in_progress: "In Progress",
  midway_survey_sent: "Survey Sent", resolved: "Resolved", closed: "Closed",
  rejected: "Rejected", escalated: "Escalated", emergency: "Emergency",
  constraint_blocked: "Blocked",
};

const STATUS_ICON = {
  received: "inbox", in_progress: "construction", resolved: "check_circle",
  closed: "done_all", rejected: "cancel", escalated: "priority_high",
  emergency: "emergency", constraint_blocked: "block",
  midway_survey_sent: "rate_review", workflow_started: "play_circle",
  mapped: "place", clustered: "merge",
};

const ALERT_STEPS = new Set([
  "in_progress", "resolved", "closed", "rejected", "escalated",
  "emergency", "constraint_blocked", "midway_survey_sent", "workflow_started",
]);

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildNotifications(complaints, mySurveys = []) {
  const notifs = [];
  for (const c of complaints) {
    notifs.push({
      id: `filed-${c.id}`, complaint_id: c.id, complaint_number: c.complaint_number,
      title: c.title, type: "complaint", icon: "receipt_long",
      message: `Complaint #${c.complaint_number} filed successfully.`,
      timestamp: c.created_at, read: true,
    });
    if (ALERT_STEPS.has(c.status)) {
      notifs.push({
        id: `status-${c.id}`, complaint_id: c.id, complaint_number: c.complaint_number,
        title: c.title, type: "complaint", icon: STATUS_ICON[c.status] || "notifications",
        message: `Complaint #${c.complaint_number} is now: ${STATUS_LABEL[c.status] || c.status}.`,
        timestamp: c.updated_at || c.created_at,
        read: ["resolved", "closed"].includes(c.status),
      });
    }
  }
  for (const s of mySurveys) {
    notifs.push({
      id: `survey-${s.id}`, survey_instance_id: s.id, complaint_id: s.complaint_id,
      complaint_number: s.complaint_number, title: s.complaint_title,
      type: "survey", icon: "rate_review",
      message: `Please provide feedback for complaint #${s.complaint_number}.`,
      timestamp: s.created_at, read: false,
    });
  }
  notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return notifs;
}

const FILTER_TABS = ["All", "Unread", "Complaints", "Surveys"];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications]       = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [activeTab, setActiveTab]               = useState("All");
  const [pendingSurveyCount, setPendingSurveyCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [compRes, surveyRes] = await Promise.all([
          fetchMyComplaints({ limit: 50 }),
          client.get("/surveys/user/my").catch(() => ({ data: [] })),
        ]);
        const surveys = surveyRes.data || [];
        setPendingSurveyCount(surveys.filter(s => s.status === "pending").length);
        setNotifications(buildNotifications(compRes.items || [], surveys));
      } catch { toast.error("Failed to load notifications."); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const filtered = notifications.filter(n => {
    if (activeTab === "All")        return true;
    if (activeTab === "Unread")     return !n.read;
    if (activeTab === "Complaints") return n.type === "complaint";
    if (activeTab === "Surveys")    return n.type === "survey";
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppLayout unreadCount={unreadCount}>
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-400">notifications</span>
              Notifications
            </h1>
            {unreadCount > 0 && <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>}
            {pendingSurveyCount > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">
                {pendingSurveyCount} pending survey{pendingSurveyCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-xl"
          style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 text-sm py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: activeTab === tab ? "rgba(56,189,248,0.15)" : "transparent",
                color: activeTab === tab ? "#38bdf8" : "#64748b",
              }}>
              {tab}
              {tab === "Unread" && unreadCount > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(56,189,248,0.2)", color: "#38bdf8" }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex flex-col gap-2">
          {loading ? (
            [1,2,3,4].map(n => (
              <div key={n} className="h-20 rounded-2xl animate-pulse"
                style={{ background: "rgba(0,0,0,0.06)" }} />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <span className="material-symbols-outlined text-5xl mb-2 block">notifications_off</span>
              <p className="text-sm">
                {notifications.length === 0
                  ? "No complaints filed yet — nothing to show."
                  : "No notifications in this category."}
              </p>
            </div>
          ) : (
            filtered.map(n => {
              const isSurvey = n.type === "survey";
              return (
                <div key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    if (isSurvey && n.survey_instance_id) navigate(`/survey/${n.survey_instance_id}`);
                    else if (n.complaint_id) navigate(`/complaints/${n.complaint_id}`);
                  }}
                  className="relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: n.read ? "rgba(255,255,255,0.6)" : "rgba(56,189,248,0.06)",
                    border: `1px solid ${n.read ? "rgba(0,0,0,0.06)" : "rgba(56,189,248,0.2)"}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = n.read ? "rgba(255,255,255,0.9)" : "rgba(56,189,248,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? "rgba(255,255,255,0.6)" : "rgba(56,189,248,0.06)"}>
                  {!n.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-sky-400"
                      style={{ boxShadow: "0 0 6px rgba(56,189,248,0.6)" }} />
                  )}
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
                    style={{
                      background: isSurvey ? "rgba(251,146,60,0.15)" : "rgba(56,189,248,0.12)",
                      color: isSurvey ? "#fb923c" : "#38bdf8",
                    }}>
                    <span className="material-symbols-outlined text-[20px]">{n.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? "text-slate-500" : "font-semibold text-slate-800"}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{timeAgo(n.timestamp)}</p>
                    {isSurvey && (
                      <div className="mt-2">
                        <span className="text-xs px-3 py-1 rounded-full font-semibold"
                          style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c" }}>
                          Take Survey →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!loading && notifications.length > 0 && (
          <p className="text-xs text-slate-700 text-center">
            Notifications are derived from your complaint history.<br />
            Push notifications (WhatsApp/SMS) activate when configured.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
