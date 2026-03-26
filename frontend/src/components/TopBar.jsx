import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TopBar({ title = "Dashboard", unreadCount = 0, onMenuClick }) {
  const navigate   = useNavigate();
  const stored     = localStorage.getItem("auth_user");
  const user       = stored ? JSON.parse(stored) : null;
  const [search, setSearch] = useState("");

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  function handleSearch(e) {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/my-complaints?q=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <header className="flex items-center justify-between px-4 md:px-8 h-15 sticky top-0 z-40
      border-b border-black/8"
      style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(20px)" }}>

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl hover:bg-black/6 text-slate-500 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-base font-bold text-slate-800 truncate">{title}</h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search — desktop only */}
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search complaints…"
            className="pl-9 pr-4 py-1.5 w-64 text-sm rounded-xl ginput"
          />
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-xl hover:bg-black/5 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate("/profile")}
          className="w-8 h-8 rounded-xl text-xs font-bold text-white shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)" }}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
