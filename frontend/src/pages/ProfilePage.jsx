import { useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function ProfilePage() {
  const stored = localStorage.getItem("auth_user");
  const user = stored ? JSON.parse(stored) : {};

  const [fullName, setFullName] = useState(user.full_name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [language, setLanguage] = useState(user.preferred_language || "hi");
  const [emailOpt, setEmailOpt] = useState(true);
  const [whatsappOpt, setWhatsappOpt] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const updated = { ...user, full_name: fullName, phone, preferred_language: language };
    localStorage.setItem("auth_user", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <AppLayout title="Profile">
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6">
        <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold">Profile</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 max-w-[1100px]">
        {/* LEFT: Profile Card */}
        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-2xl font-bold mx-auto mb-4">
              {initials}
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface">{fullName || "User"}</h3>
            <span className="inline-block mt-1 px-3 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
              Citizen
            </span>
            <p className="text-xs text-on-surface-variant mt-3">
              {user.email || "No email set"}
            </p>
          </section>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active Reports", value: "3", icon: "pending", color: "text-primary", bg: "bg-primary/10" },
              { label: "Resolved", value: "7", icon: "check_circle", color: "text-tertiary", bg: "bg-tertiary-container/10" },
              { label: "Community Rank", value: "#42", icon: "leaderboard", color: "text-secondary", bg: "bg-secondary-container/10" },
              { label: "Karma Points", value: "180", icon: "star", color: "text-secondary", bg: "bg-secondary-container/10" },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 shadow-sm text-center">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
                </div>
                <p className="text-lg font-bold font-mono">{s.value}</p>
                <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Settings */}
        <div className="space-y-6">
          {/* Personal Information */}
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm">
            <h3 className="font-headline font-bold text-on-surface mb-5">Personal Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider">Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-11 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                  <option value="pa">Punjabi</option>
                  <option value="ur">Urdu</option>
                  <option value="bn">Bengali</option>
                </select>
              </div>
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 shadow-sm">
            <h3 className="font-headline font-bold text-on-surface mb-5">Notification Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-on-surface">Email Notifications</p>
                  <p className="text-[10px] text-on-surface-variant">Receive complaint updates via email</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={emailOpt} onChange={(e) => setEmailOpt(e.target.checked)} />
                  <div className="w-10 h-5 bg-outline-variant/30 rounded-full peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-on-surface">WhatsApp Notifications</p>
                  <p className="text-[10px] text-on-surface-variant">Get real-time updates on WhatsApp</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={whatsappOpt} onChange={(e) => setWhatsappOpt(e.target.checked)} />
                  <div className="w-10 h-5 bg-outline-variant/30 rounded-full peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
                </div>
              </label>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">{saved ? "check" : "save"}</span>
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
