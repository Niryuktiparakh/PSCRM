import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

const MOCK_COMPLAINTS = [
  { id: "1", complaint_number: "GR-2024-04821", title: "Drainage Blockage", category: "Drainage", address_text: "Rohini Sector 7", status: "in_progress", created_at: "2024-03-14T10:00:00Z", step: 3 },
  { id: "2", complaint_number: "GR-2024-03102", title: "Pothole Repair", category: "Road", address_text: "Sector 12, Dwarka", status: "resolved", created_at: "2024-02-20T10:00:00Z", step: 4 },
  { id: "3", complaint_number: "GR-2024-05119", title: "Broken Streetlight", category: "Streetlight", address_text: "Main Market, Karol Bagh", status: "received", created_at: "2024-03-18T10:00:00Z", step: 1 },
  { id: "4", complaint_number: "GR-2024-05220", title: "Garbage Overflow", category: "Sanitation", address_text: "Block C, Janakpuri", status: "in_progress", created_at: "2024-03-17T09:00:00Z", step: 2 },
  { id: "5", complaint_number: "GR-2024-05301", title: "Water Leakage", category: "Water", address_text: "Sector 15, Rohini", status: "received", created_at: "2024-03-19T14:00:00Z", step: 1 },
];

const STATUS_STYLES = {
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-tertiary-container/20 text-tertiary",
  received: "bg-surface-container-high text-on-surface-variant",
};

const CATEGORIES = ["All", "Drainage", "Road", "Streetlight", "Sanitation", "Water"];
const STATUSES = ["All", "received", "in_progress", "resolved"];

export default function MyComplaintsPage() {
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = MOCK_COMPLAINTS.filter((c) => {
    if (filterCategory !== "All" && c.category !== filterCategory) return false;
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    if (search && !c.complaint_number.toLowerCase().includes(search.toLowerCase()) && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout title="My Complaints">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6">
        <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">My Complaints</span>
      </nav>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Filed", value: MOCK_COMPLAINTS.length, icon: "assignment", color: "text-primary", bg: "bg-primary/10" },
          { label: "Active", value: MOCK_COMPLAINTS.filter((c) => c.status !== "resolved").length, icon: "pending", color: "text-secondary", bg: "bg-secondary-container/10" },
          { label: "Resolved", value: MOCK_COMPLAINTS.filter((c) => c.status === "resolved").length, icon: "check_circle", color: "text-tertiary", bg: "bg-tertiary-container/10" },
          { label: "Avg. Days", value: "12", icon: "schedule", color: "text-on-surface-variant", bg: "bg-surface-container-low" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
              </div>
            </div>
            <p className="text-xl font-bold font-mono">{s.value}</p>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm mb-6">
        <div className="p-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Search by ID or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Category Filter */}
          <select
            className="px-3 py-2 bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
          </select>
          {/* Status Filter */}
          <select
            className="px-3 py-2 bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-container-low">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Location</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Filed On</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Progress</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-surface-container-low/50 hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">#{c.complaint_number}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant text-[10px] font-bold rounded">{c.category}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant">{c.address_text}</td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant">
                    {new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${STATUS_STYLES[c.status] || STATUS_STYLES.received}`}>
                      {c.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`w-2.5 h-2.5 rounded-full ${
                            s <= (c.step || 1)
                              ? c.status === "resolved" ? "bg-tertiary-container" : "bg-primary"
                              : "bg-surface-container-low"
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/complaints/${c.id}`} className="text-primary text-xs font-bold hover:underline">View</Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-on-surface-variant">
                    No complaints found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
