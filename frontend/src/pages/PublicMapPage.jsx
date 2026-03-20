import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const CLUSTERS = [
  { pos: [28.7041, 77.1025], label: "Rohini", count: 12, severity: "critical" },
  { pos: [28.5921, 77.046], label: "Dwarka", count: 8, severity: "pending" },
  { pos: [28.6519, 77.1909], label: "Karol Bagh", count: 7, severity: "ongoing" },
  { pos: [28.6353, 77.2249], label: "Connaught Place", count: 3, severity: "resolved" },
  { pos: [28.5562, 77.1], label: "Vasant Kunj", count: 5, severity: "pending" },
  { pos: [28.6889, 77.2205], label: "Civil Lines", count: 4, severity: "ongoing" },
];

const CATEGORIES = [
  { name: "Drainage & Sewage", count: 34, percent: 28, color: "bg-primary" },
  { name: "Road & Footpath", count: 28, percent: 23, color: "bg-secondary-container" },
  { name: "Streetlights", count: 18, percent: 15, color: "bg-outline" },
  { name: "Water Supply", count: 15, percent: 12, color: "bg-tertiary-container" },
  { name: "Garbage & Sanitation", count: 14, percent: 12, color: "bg-error" },
  { name: "Other", count: 12, percent: 10, color: "bg-surface-dim" },
];

export default function PublicMapPage() {
  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 h-[56px] bg-white border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-headline font-extrabold text-[18px] text-on-background tracking-tight">
            PS-CRM
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
          <span className="text-xs text-on-surface-variant font-medium ml-2">Public Dashboard</span>
        </div>
        <Link
          to="/login"
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-container hover:text-on-primary-container transition-all"
        >
          Login to track your complaint
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Stats Panel */}
        <aside className="w-full lg:w-[360px] bg-white border-r border-outline-variant/20 p-6 overflow-y-auto">
          <h2 className="font-headline font-bold text-lg text-on-surface mb-1">Delhi Live Civic Map</h2>
          <p className="text-xs text-on-surface-variant mb-6">Real-time view of civic complaints across Delhi NCT</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: "Total Active", value: "121", icon: "pending_actions", color: "text-primary", bg: "bg-primary/10" },
              { label: "Resolved (30d)", value: "342", icon: "check_circle", color: "text-tertiary", bg: "bg-tertiary-container/10" },
              { label: "Critical", value: "12", icon: "error", color: "text-error", bg: "bg-error-container/50" },
              { label: "Avg SLA (days)", value: "23", icon: "schedule", color: "text-secondary", bg: "bg-secondary-container/10" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl border border-outline-variant/10">
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <span className={`material-symbols-outlined text-sm ${s.color}`}>{s.icon}</span>
                </div>
                <p className="text-lg font-bold font-mono">{s.value}</p>
                <p className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">Category Breakdown</h3>
          <div className="space-y-3 mb-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-on-surface-variant">{cat.name}</span>
                  <span className="font-bold">{cat.count}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">Map Legend</h3>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-container" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Ongoing</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tertiary-container" /> Resolved</span>
          </div>
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative" style={{ zIndex: 1 }}>
          <MapContainer
            center={[28.6139, 77.209]}
            zoom={11}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", minHeight: "600px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
            />
            {CLUSTERS.map((c, i) => (
              <Marker key={i} position={c.pos} icon={markerIcon}>
                <Popup>
                  <strong>{c.label}</strong><br />
                  {c.count} complaints ({c.severity})
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Legend */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg text-xs font-medium border border-outline-variant/20 z-[1000]">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="w-1.5 h-1.5 bg-tertiary-container rounded-full animate-pulse" />
              Live data · Updated 2m ago
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
