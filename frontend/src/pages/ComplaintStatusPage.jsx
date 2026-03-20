import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchComplaintById } from "../api/complaintsApi";
import AppLayout from "../components/AppLayout";

const STATUS_STEPS = ["Registered", "Verified", "Contractor Assigned", "Work In Progress", "Quality Audit", "Resolved"];

function getStepIndex(status) {
  const map = {
    received: 0,
    registered: 0,
    verified: 1,
    classified: 1,
    assigned: 2,
    in_progress: 3,
    audit: 4,
    resolved: 5,
    closed: 5,
  };
  return map[status] ?? 0;
}

function StatusBadge({ status }) {
  const styles = {
    received: "bg-surface-container-high text-on-surface-variant",
    registered: "bg-surface-container-high text-on-surface-variant",
    verified: "bg-primary/10 text-primary",
    classified: "bg-primary/10 text-primary",
    assigned: "bg-primary/10 text-primary",
    in_progress: "bg-secondary-container/20 text-secondary",
    audit: "bg-secondary-container/20 text-secondary",
    resolved: "bg-tertiary-container/20 text-tertiary",
    closed: "bg-tertiary-container/20 text-tertiary",
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${styles[status] || styles.received}`}>
      {status?.replace(/_/g, " ") || "received"}
    </span>
  );
}

export default function ComplaintStatusPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComplaint() {
      try {
        const data = await fetchComplaintById(id);
        setComplaint(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to fetch complaint");
      }
    }
    loadComplaint();
  }, [id]);

  if (error) {
    return (
      <AppLayout title="Complaint Detail">
        <div className="flex items-center gap-2 px-4 py-3 bg-error-container/50 rounded-lg max-w-xl">
          <span className="material-symbols-outlined text-error text-sm">error</span>
          <p className="text-sm font-medium text-on-error-container">{error}</p>
        </div>
      </AppLayout>
    );
  }

  if (!complaint) {
    return (
      <AppLayout title="Complaint Detail">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading complaint details...</span>
        </div>
      </AppLayout>
    );
  }

  const activeStep = getStepIndex(complaint.status);

  return (
    <AppLayout title="Complaint Detail">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6">
        <Link to="/my-complaints" className="hover:text-primary">My Complaints</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">#{complaint.complaint_number || id.slice(0, 8)}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[63%_37%] gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Summary Card */}
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">report</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    #{complaint.complaint_number || id.slice(0, 8)}
                  </span>
                  <StatusBadge status={complaint.status} />
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  {complaint.title || "Civic Complaint"}
                </h3>
                {complaint.address_text && (
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {complaint.address_text}
                  </p>
                )}
                <p className="text-xs text-on-surface-variant mt-1">
                  <span className="material-symbols-outlined text-xs mr-1">calendar_today</span>
                  Reported on {new Date(complaint.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Complaint Image */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="mt-4 rounded-lg overflow-hidden h-48 bg-surface-container-low">
                <img src={complaint.images[0]} alt="Complaint" className="w-full h-full object-cover" />
              </div>
            )}
          </section>

          {/* Activity Timeline */}
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm">
            <h3 className="font-headline font-bold text-on-surface mb-6">Activity Timeline</h3>
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i < activeStep;
                const isCurrent = i === activeStep;
                const isPending = i > activeStep;
                return (
                  <div key={step} className="flex gap-4">
                    {/* Line + Dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                          isCompleted
                            ? "bg-tertiary border-tertiary"
                            : isCurrent
                            ? "bg-primary border-primary"
                            : "bg-surface-container-low border-outline-variant"
                        }`}
                      />
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-10 ${
                            isCompleted ? "bg-tertiary" : "bg-outline-variant/30"
                          }`}
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`pb-4 ${isPending ? "opacity-40" : ""}`}>
                      <p className={`text-sm font-bold ${isCurrent ? "text-primary" : "text-on-surface"}`}>
                        {step}
                      </p>
                      {isCompleted && (
                        <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-tertiary text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          Completed
                        </p>
                      )}
                      {isCurrent && (
                        <p className="text-[10px] text-primary font-medium mt-0.5">Currently active</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* AI Summary */}
          <section className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
              <h3 className="font-headline font-bold text-on-surface text-sm">AI Summary</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {complaint.agent_summary || complaint.description || "No AI summary available yet."}
            </p>
          </section>

          {/* SLA Tracker */}
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm text-center">
            <h3 className="font-headline font-bold text-on-surface mb-4 text-left text-sm">SLA Tracker</h3>
            <div className="relative w-28 h-28 mx-auto mb-3">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-low" cx="56" cy="56" fill="transparent" r="50" stroke="currentColor" strokeWidth="7" />
                <circle
                  className="text-primary"
                  cx="56"
                  cy="56"
                  fill="transparent"
                  r="50"
                  stroke="currentColor"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - (activeStep / STATUS_STEPS.length))}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{Math.round((activeStep / STATUS_STEPS.length) * 100)}%</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Progress</span>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${activeStep >= 5 ? "bg-tertiary-container/20 text-tertiary" : "bg-primary/10 text-primary"}`}>
              {activeStep >= 5 ? "Resolved" : "In Progress"}
            </span>
          </section>

          {/* Quick Actions */}
          <section className="space-y-3">
            <Link
              to="/submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Report Another Issue
            </Link>
            <Link
              to="/my-complaints"
              className="w-full flex items-center justify-center gap-2 bg-white text-on-surface border border-outline-variant/20 py-3 rounded-lg font-bold text-sm hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-lg">assignment</span>
              View All Complaints
            </Link>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
