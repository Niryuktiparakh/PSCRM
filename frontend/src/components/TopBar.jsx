import { useNavigate } from "react-router-dom";

export default function TopBar({ title = "Dashboard" }) {
  const navigate = useNavigate();
  const stored = localStorage.getItem("auth_user");
  const user = stored ? JSON.parse(stored) : null;

  return (
    <header className="flex items-center justify-between px-8 h-[60px] sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
      <h2 className="text-xl font-bold font-headline text-on-surface">{title}</h2>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            className="pl-10 pr-4 py-1.5 w-[320px] bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Search ticket ID or area..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1 right-1 w-4 h-4 bg-error text-[10px] text-white flex items-center justify-center rounded-full font-bold">
              3
            </span>
          </button>

          {/* Avatar */}
          <button
            onClick={() => navigate("/profile")}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20 text-xs font-bold text-on-surface"
          >
            {user?.full_name
              ? user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U"}
          </button>
        </div>
      </div>
    </header>
  );
}
