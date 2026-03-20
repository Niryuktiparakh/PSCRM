import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "complaint",
    icon: "assignment",
    title: "Complaint #GR-2024-04821 Updated",
    description: "Your drainage blockage complaint has moved to \"In Repair\" stage. Contractor has been notified.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "alert",
    icon: "warning",
    title: "Water Supply Interruption – Rohini Sector 7-8",
    description: "MCD scheduled maintenance. Expected restoration by 6 PM today.",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "survey",
    icon: "rate_review",
    title: "Feedback Request – Pothole Repair",
    description: "Your complaint #GR-2024-03102 has been marked resolved. Please confirm if the issue is fixed.",
    time: "1 day ago",
    read: false,
  },
  {
    id: "4",
    type: "complaint",
    icon: "assignment",
    title: "Complaint #GR-2024-05119 Registered",
    description: "Your broken streetlight complaint has been registered and assigned to the Electricity Department.",
    time: "2 days ago",
    read: true,
  },
  {
    id: "5",
    type: "alert",
    icon: "info",
    title: "Road Diversion – Sector 11",
    description: "Temporary road diversion effective from tomorrow 8 AM due to sewer line repair.",
    time: "3 days ago",
    read: true,
  },
];

const TABS = ["All", "Unread", "Complaints", "Alerts", "Surveys"];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filtered = notifications.filter((n) => {
    if (activeTab === "Unread") return !n.read;
    if (activeTab === "Complaints") return n.type === "complaint";
    if (activeTab === "Alerts") return n.type === "alert";
    if (activeTab === "Surveys") return n.type === "survey";
    return true;
  });

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout title="Notifications">
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6">
        <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">Notifications</span>
      </nav>

      <div className="max-w-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-headline font-bold text-xl text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-error/10 text-error text-xs font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button onClick={markAllRead} className="text-xs font-bold text-primary hover:underline">
            Mark all as read
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-container-low rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-colors ${
                n.read
                  ? "bg-surface-container-lowest border-outline-variant/10"
                  : "bg-primary/[0.03] border-l-4 border-primary border-t border-r border-b border-t-outline-variant/10 border-r-outline-variant/10 border-b-outline-variant/10"
              }`}
            >
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  n.type === "alert" ? "bg-error/10" : n.type === "survey" ? "bg-secondary-container/10" : "bg-primary/10"
                }`}>
                  <span className={`material-symbols-outlined text-lg ${
                    n.type === "alert" ? "text-error" : n.type === "survey" ? "text-secondary" : "text-primary"
                  }`}>{n.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-tight ${n.read ? "font-medium" : "font-bold"}`}>{n.title}</p>
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{n.description}</p>
                  {n.type === "survey" && !n.read && (
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Confirm Resolved
                      </button>
                      <button className="px-3 py-1.5 bg-error/10 text-error text-[10px] font-bold rounded-lg hover:bg-error/20 transition-colors">
                        Issue Not Fixed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">notifications_off</span>
              <p className="text-sm font-medium">No notifications in this category</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
