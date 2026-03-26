// src/components/SideNav.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/authApi";

const CITIZEN_NAV = [
  { to: "/dashboard",     icon: "dashboard",     label: "Dashboard" },
  { to: "/my-complaints", icon: "assignment",    label: "My Complaints" },
  { to: "/submit",        icon: "add_circle",    label: "Report Issue" },
  { to: "/notifications", icon: "notifications", label: "Alerts" },
];

const OFFICIAL_NAV = [
  { to: "/dashboard",     icon: "dashboard",            label: "Command Center" },
  { to: "/admin",         icon: "admin_panel_settings", label: "Complaints" },
  { to: "/notifications", icon: "notifications",        label: "Alerts" },
];

const ADMIN_NAV = [
  { to: "/dashboard",    icon: "dashboard",       label: "Command Center" },
  { to: "/admin",        icon: "manage_accounts", label: "Operations" },
  { to: "/admin/users",  icon: "group",           label: "Users" },
  { to: "/notifications",icon: "notifications",   label: "Alerts" },
];

const WORKER_NAV = [
  { to: "/dashboard",    icon: "assignment",    label: "My Tasks" },
  { to: "/notifications",icon: "notifications", label: "Alerts" },
];

const BOTTOM_ITEMS = [
  { to: "/profile", icon: "manage_accounts", label: "Settings" },
];

const ROLE_LABEL = {
  citizen:     "Citizen",
  official:    "Field Official",
  admin:       "Admin",
  super_admin: "Super Admin",
  worker:      "Worker",
  contractor:  "Contractor",
};

const ROLE_COLOR = {
  citizen:     "#38bdf8",
  official:    "#818cf8",
  admin:       "#34d399",
  super_admin: "#f59e0b",
  worker:      "#fb923c",
  contractor:  "#a78bfa",
};

function getNavItems(role) {
  if (role === "super_admin" || role === "admin") return ADMIN_NAV;
  if (role === "official")                        return OFFICIAL_NAV;
  if (role === "worker" || role === "contractor") return WORKER_NAV;
  return CITIZEN_NAV;
}

export default function SideNav({ isMobile, onClose }) {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const role     = user.role || "citizen";
  const navItems = getNavItems(role);
  const accent   = ROLE_COLOR[role] || "#38bdf8";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <aside
      className={`flex flex-col h-full overflow-y-auto w-60 gnav ${
        !isMobile ? "fixed left-0 top-0 z-50" : ""
      }`}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-black/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}18)`, border: `1px solid ${accent}40` }}>
            <span className="material-symbols-outlined text-[16px]" style={{ color: accent }}>
              location_city
            </span>
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-slate-800 tracking-tight">PS-CRM</h1>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">Delhi</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: `${accent}0f`, border: `1px solid ${accent}20` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
            {initials}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
              {user?.full_name || "User"}
            </p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: `${accent}20`, color: accent }}>
              {ROLE_LABEL[role] || role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                isActive
                  ? "text-slate-800"
                  : "text-slate-500 hover:text-slate-700 hover:bg-black/5"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: `linear-gradient(135deg, ${accent}20, ${accent}0a)`,
                    border: `1px solid ${accent}30`,
                  }
                : {}
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[19px] shrink-0"
                  style={{ color: isActive ? accent : undefined }}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Bottom section */}
        <div className="pt-4 mt-4 border-t border-black/8 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            Account
          </p>
          {BOTTOM_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  isActive
                    ? "bg-black/6 text-slate-800"
                    : "text-slate-500 hover:text-slate-700 hover:bg-black/5"
                }`
              }
            >
              <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm"
          >
            <span className="material-symbols-outlined text-[19px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Version footer */}
      <div className="px-5 py-3 border-t border-black/6">
        <p className="text-[10px] text-slate-400">PS-CRM v2.0 · Delhi Municipal</p>
      </div>
    </aside>
  );
}
