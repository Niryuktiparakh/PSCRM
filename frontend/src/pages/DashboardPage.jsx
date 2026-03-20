import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AppLayout from "../components/AppLayout";
import client from "../api/client";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MOCK_COMPLAINTS = [
  {
    id: "1",
    complaint_number: "GR-2024-04821",
    title: "Drainage Blockage",
    address_text: "Rohini Sector 7, Delhi-110085",
    status: "in_progress",
    step: 3,
    created_at: "2024-03-14T10:00:00Z",
  },
  {
    id: "2",
    complaint_number: "GR-2024-03102",
    title: "Pothole Repair",
    address_text: "Sector 12, Dwarka",
    status: "resolved",
    step: 4,
    created_at: "2024-02-20T10:00:00Z",
    resolved_at: "2024-03-12T10:00:00Z",
  },
  {
    id: "3",
    complaint_number: "GR-2024-05119",
    title: "Broken Streetlight",
    address_text: "Main Market, Karol Bagh",
    status: "received",
    step: 1,
    created_at: "2024-03-18T10:00:00Z",
  },
];

const STATUS_STYLES = {
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-tertiary-container/20 text-tertiary",
  received: "bg-surface-container-high text-on-surface-variant",
};

export default function DashboardPage() {
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);

  useEffect(() => {
    async function tryFetch() {
      try {
        const res = await client.get("/complaints");
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setComplaints(res.data);
        }
      } catch {
        // Use mock data if API unavailable
      }
    }
    tryFetch();
  }, []);

  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-[62%_38%] gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-8">
          {/* Map Card */}
          <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/5">
            <div className="p-5 flex items-center justify-between border-b border-surface-container-low">
              <div className="flex items-center gap-3">
                <h3 className="font-headline font-bold text-on-surface">Delhi Complaint Map</h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-container/20 text-tertiary text-[10px] font-bold uppercase tracking-wider rounded-full">
                  <span className="w-1.5 h-1.5 bg-tertiary-container rounded-full animate-pulse" />
                  Live
                </span>
              </div>
            </div>
            <div className="relative h-[380px] overflow-hidden" style={{ zIndex: 1 }}>
              <MapContainer
                center={[28.6139, 77.209]}
                zoom={11}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                />
                {/* Sample Markers */}
                <Marker position={[28.7041, 77.1025]} icon={markerIcon}>
                  <Popup>Rohini — 12 complaints</Popup>
                </Marker>
                <Marker position={[28.5921, 77.046]} icon={markerIcon}>
                  <Popup>Dwarka — 8 complaints</Popup>
                </Marker>
                <Marker position={[28.6519, 77.1909]} icon={markerIcon}>
                  <Popup>Karol Bagh — 7 complaints</Popup>
                </Marker>
              </MapContainer>
              {/* Map Legend */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg flex flex-wrap justify-between items-center gap-4 text-xs font-medium border border-outline-variant/20 z-[1000]">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error" /> Critical (12)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-container" /> Pending (8)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Ongoing (7)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tertiary-container" /> Resolved (3)</span>
                </div>
                <span className="text-on-surface-variant italic">Data updated 2m ago</span>
              </div>
            </div>
          </section>

          {/* My Complaints */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-headline font-bold text-on-surface">My Complaints</h3>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                  {complaints.filter((c) => c.status !== "resolved").length} Active
                </span>
              </div>
              <Link to="/my-complaints" className="text-xs font-bold text-primary hover:underline">View All History</Link>
            </div>
            <div className="space-y-4">
              {complaints.map((c) => (
                <Link
                  key={c.id}
                  to={`/complaints/${c.id}`}
                  className="block bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-on-surface-variant">#{c.complaint_number}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${STATUS_STYLES[c.status] || STATUS_STYLES.received}`}>
                          {c.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="font-bold text-on-surface">{c.title}</h4>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {c.address_text}
                      </p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden flex">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-full w-1/4 ${s <= (c.step || 1)
                          ? c.status === "resolved" ? "bg-tertiary-container" : "bg-primary"
                          : "bg-surface-container-low"
                        } ${s < 4 ? "border-r border-white" : ""}`}
                      />
                    ))}
                  </div>
                  {c.status === "resolved" && c.resolved_at && (
                    <p className="text-[10px] text-tertiary font-bold mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Issue resolved on {new Date(c.resolved_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* Area Activity */}
          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/5 shadow-sm">
            <h3 className="font-headline font-bold text-on-surface mb-4">Ward Activity</h3>
            <div className="space-y-3">
              {[
                { name: "Drainage", count: 12, color: "bg-primary" },
                { name: "Road Repair", count: 4, color: "bg-secondary-container" },
                { name: "Streetlights", count: 2, color: "bg-outline" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.name}
                  </div>
                  <span className="text-xs font-bold">{item.count} Reports</span>
                </div>
              ))}
            </div>
          </section>

          {/* SLA Tracker */}
          <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-sm text-center">
            <h3 className="font-headline font-bold text-on-surface mb-6 text-left">Active SLA Tracker</h3>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-low" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                <circle className="text-primary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="160.3" strokeWidth="8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">23</span>
                <span className="text-[10px] text-on-surface-variant font-medium">of 41 days</span>
              </div>
            </div>
            <div className="mb-4">
              <span className="px-3 py-1 bg-tertiary-container/20 text-tertiary text-xs font-bold rounded-full">On Track</span>
            </div>
            <p className="text-xs text-on-surface-variant">Target Resolution Deadline:<br /><strong className="text-on-surface">April 24, 2024</strong></p>
          </section>

          {/* Nearby Alerts */}
          <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/5 shadow-sm">
            <h3 className="font-headline font-bold text-on-surface mb-4">Nearby Alerts</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-error shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">Water Supply Interruption</p>
                  <p className="text-[10px] text-on-surface-variant">MCD Maintenance in Rohini Sector 7-8</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-secondary-container shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight">Road Diversion: Sector 11</p>
                  <p className="text-[10px] text-on-surface-variant">Effective tomorrow morning 8 AM</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="space-y-3">
            <Link
              to="/submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Report New Issue
            </Link>
            <button className="w-full flex items-center justify-center gap-2 bg-white text-on-surface border border-outline-variant/20 py-3 rounded-lg font-bold text-sm hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-lg">call</span>
              Call Centre (1031)
            </button>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
