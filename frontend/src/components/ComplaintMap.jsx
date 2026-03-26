// src/components/ComplaintMap.jsx
// src/components/ComplaintMap.jsx
// npm install react-map-gl@7 mapbox-gl@2 supercluster

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import Map, { Marker, Popup, Source, Layer, NavigationControl } from "react-map-gl";
import Supercluster from "supercluster";
import { useNavigate } from "react-router-dom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE    = "mapbox://styles/mapbox/streets-v12";

const DELHI_VIEW = {
  longitude: 77.209, latitude: 28.6139,
  zoom: 13.5, pitch: 52, bearing: -18,
};

// ── Infra config — color + emoji + label ─────────────────────────
const INFRA = {
  STLIGHT:    { color: "#f59e0b", bg: "#fffbeb", emoji: "💡", label: "Streetlight"   },
  ROAD:       { color: "#64748b", bg: "#f8fafc", emoji: "🛣️", label: "Road"          },
  POTHOLE:    { color: "#ef4444", bg: "#fef2f2", emoji: "⚠️", label: "Pothole"       },
  DRAIN:      { color: "#3b82f6", bg: "#eff6ff", emoji: "🌊", label: "Storm Drain"   },
  FOOTPATH:   { color: "#8b5cf6", bg: "#f5f3ff", emoji: "🚶", label: "Footpath"      },
  TREE:       { color: "#10b981", bg: "#f0fdf4", emoji: "🌳", label: "Tree"          },
  GARBAGE:    { color: "#f97316", bg: "#fff7ed", emoji: "🗑️", label: "Garbage"       },
  WIRE_HAZARD:{ color: "#dc2626", bg: "#fef2f2", emoji: "⚡", label: "Wire Hazard"   },
  WATER_PIPE: { color: "#0ea5e9", bg: "#f0f9ff", emoji: "💧", label: "Water Pipe"    },
  SEWER:      { color: "#78716c", bg: "#fafaf9", emoji: "🔧", label: "Sewer"         },
  HOARDING:   { color: "#a855f7", bg: "#faf5ff", emoji: "📢", label: "Hoarding"      },
  ELEC_POLE:  { color: "#eab308", bg: "#fefce8", emoji: "🔌", label: "Electric Pole" },
  GENERAL:    { color: "#6366f1", bg: "#eef2ff", emoji: "📍", label: "General"       },
};

const STATUS_LABEL = {
  received: "Registered", clustered: "Clustered", mapped: "Mapped",
  workflow_started: "Assigned", in_progress: "In Progress",
  midway_survey_sent: "Survey Sent", resolved: "Resolved",
  closed: "Closed", rejected: "Rejected", escalated: "Escalated",
  emergency: "Emergency", constraint_blocked: "Blocked",
};

const STATUS_PILL = {
  received:          { bg: "rgba(99,102,241,0.2)",  color: "#818cf8" },
  workflow_started:  { bg: "rgba(56,189,248,0.18)", color: "#38bdf8" },
  in_progress:       { bg: "rgba(251,146,60,0.2)",  color: "#fb923c" },
  resolved:          { bg: "rgba(52,211,153,0.18)", color: "#34d399" },
  closed:            { bg: "rgba(52,211,153,0.18)", color: "#34d399" },
  rejected:          { bg: "rgba(248,113,113,0.18)",color: "#f87171" },
  escalated:         { bg: "rgba(248,113,113,0.18)",color: "#f87171" },
  emergency:         { bg: "rgba(239,68,68,0.2)",   color: "#ef4444" },
  constraint_blocked:{ bg: "rgba(217,119,6,0.18)",  color: "#fbbf24" },
};

// Status-based opacity — resolved/closed/rejected fade out
const STATUS_OPACITY = {
  resolved: 0.42, closed: 0.35, rejected: 0.38,
};

// 3D buildings
const BUILDINGS_LAYER = {
  id: "3d-buildings", source: "composite", "source-layer": "building",
  filter: ["==", "extrude", "true"], type: "fill-extrusion", minzoom: 12,
  paint: {
    "fill-extrusion-color": [
      "interpolate", ["linear"], ["get", "height"],
      0, "#dde3ea", 40, "#c8d0da", 100, "#b0bcc9", 200, "#9aaabb",
    ],
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base":   ["get", "min_height"],
    "fill-extrusion-opacity": 0.65,
  },
};

// Radius circle
function makeCircle(lat, lng, r = 4000) {
  const n = 64, pts = [];
  const dLat = (r / 111320) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    pts.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [pts] }, properties: {} }] };
}

// Supercluster
function buildIndex(pts) {
  const idx = new Supercluster({ radius: 60, maxZoom: 17, minZoom: 3 });
  idx.load(pts.map(p => ({ type: "Feature", properties: { ...p }, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })));
  return idx;
}

// ── Big complaint pin ─────────────────────────────────────────────
function ComplaintPin({ pin, isHovered, onClick, onEnter, onLeave }) {
  const infra   = INFRA[pin.infra_type_code] || INFRA.GENERAL;
  const opacity = STATUS_OPACITY[pin.status] ?? 1;
  const urgent  = ["critical", "emergency"].includes(pin.priority);
  const size    = isHovered ? 46 : 36;

  return (
    <Marker longitude={pin.lng} latitude={pin.lat} anchor="bottom">
      <div
        onClick={() => onClick(pin)}
        onMouseEnter={() => onEnter(pin)}
        onMouseLeave={onLeave}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", opacity }}
      >
        {/* Main pin circle */}
        <div style={{
          width:        size,
          height:       size,
          borderRadius: "50%",
          background:   infra.bg,
          border:       isHovered
            ? `3px solid ${infra.color}`
            : `2px solid ${infra.color}`,
          boxShadow: isHovered
            ? `0 6px 24px ${infra.color}55, 0 2px 8px rgba(0,0,0,0.18)`
            : `0 3px 10px ${infra.color}33, 0 1px 4px rgba(0,0,0,0.12)`,
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          transition:    "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
          position:      "relative",
          fontSize:      isHovered ? 22 : 17,
          lineHeight:    1,
          userSelect:    "none",
        }}>
          {infra.emoji}

          {/* Pulse ring for urgent */}
          {urgent && (
            <span style={{
              position: "absolute", inset: -6, borderRadius: "50%",
              border: `2.5px solid ${infra.color}`,
              animation: "pulse-ring 1.4s ease-out infinite", opacity: 0.55,
            }} />
          )}

          {/* Repeat indicator — red dot top-right */}
          {pin.is_repeat_complaint && (
            <span style={{
              position: "absolute", top: -2, right: -2,
              width: 9, height: 9, borderRadius: "50%",
              background: "#ef4444", border: "1.5px solid white",
              boxShadow: "0 0 5px #ef444488",
            }} />
          )}

          {/* Hot node — orange dot bottom-left */}
          {(pin.node_complaint_count || 0) >= 5 && (
            <span style={{
              position: "absolute", bottom: -2, left: -2,
              width: 9, height: 9, borderRadius: "50%",
              background: "#f97316", border: "1.5px solid white",
              boxShadow: "0 0 5px #f9731688",
            }} />
          )}
        </div>

        {/* Infra label — shown on hover */}
        {isHovered && (
          <div style={{
            marginTop:    4,
            background:   infra.color,
            color:        "white",
            fontSize:     9,
            fontWeight:   700,
            letterSpacing:"0.05em",
            textTransform:"uppercase",
            padding:      "2px 7px",
            borderRadius: 99,
            whiteSpace:   "nowrap",
            boxShadow:    `0 2px 8px ${infra.color}55`,
          }}>
            {infra.label}
          </div>
        )}

        {/* Stem */}
        <div style={{
          width:      2.5,
          height:     isHovered ? 16 : 10,
          background: `linear-gradient(to bottom, ${infra.color}bb, transparent)`,
          transition: "height 0.18s ease",
          marginTop:  isHovered ? 0 : 2,
        }} />
      </div>
    </Marker>
  );
}

// ── Cluster pin ───────────────────────────────────────────────────
function ClusterPin({ cluster, onClick }) {
  const { point_count } = cluster.properties;
  const [lng, lat] = cluster.geometry.coordinates;
  const sz = Math.min(28 + Math.sqrt(point_count) * 5, 64);

  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          onClick={() => onClick(cluster)}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)";   }}
          style={{
            width: sz, height: sz, borderRadius: "50%",
            background:    "radial-gradient(circle at 35% 35%, #818cf8, #4338ca)",
            border:        "3px solid rgba(255,255,255,0.95)",
            boxShadow:     "0 6px 20px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.15)",
            display:       "flex", alignItems: "center", justifyContent: "center",
            cursor:        "pointer", color: "white",
            fontSize:      sz > 44 ? 14 : 11, fontWeight: 800, fontFamily: "monospace",
            transition:    "transform 0.12s ease",
          }}
        >
          {point_count > 999 ? "1k+" : point_count}
        </div>
        <div style={{ width: 2.5, height: 10, background: "linear-gradient(to bottom, #6366f1bb, transparent)", marginTop: 1 }} />
      </div>
    </Marker>
  );
}

// ── User location ─────────────────────────────────────────────────
function UserMarker({ lat, lng }) {
  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "rgba(14,165,233,0.12)", animation: "user-pulse 2s ease-out infinite" }} />
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            background: "#0ea5e9", border: "3px solid white",
            boxShadow: "0 0 16px rgba(14,165,233,0.65), 0 2px 8px rgba(0,0,0,0.18)",
            position: "relative", zIndex: 1,
          }} />
        </div>
        <div style={{ width: 2.5, height: 12, background: "linear-gradient(to bottom, #0ea5e9bb, transparent)", marginTop: 2 }} />
      </div>
    </Marker>
  );
}

// ── Rich hover popup with image ───────────────────────────────────
function HoverPopup({ pin }) {
  if (!pin) return null;
  const infra      = INFRA[pin.infra_type_code] || INFRA.GENERAL;
  const statusPill = STATUS_PILL[pin.status]    || { bg: "#eef2ff", color: "#6366f1" };
  const distKm     = pin.distance_meters ? (pin.distance_meters / 1000).toFixed(1) : null;
  const hasImage   = !!pin.thumbnail_url;

  return (
    <Popup
      longitude={pin.lng} latitude={pin.lat}
      anchor="bottom" offset={hasImage ? 46 : 38}
      closeButton={false} closeOnClick={false}
      maxWidth="300px" style={{ zIndex: 1000 }}
    >
      <div style={{
        background:   "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)",
        borderRadius: 14,
        overflow:     "hidden",
        width:        280,
        boxShadow:    "0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)",
        fontFamily:   "system-ui, -apple-system, sans-serif",
      }}>

        {/* Image or color header */}
        {hasImage ? (
          <div style={{ position: "relative", height: 140 }}>
            <img
              src={pin.thumbnail_url}
              alt={pin.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => { e.target.parentElement.style.display = "none"; }}
            />
            {/* Gradient overlay so text is readable over image */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
            }} />
            {/* Infra badge on image */}
            <div style={{
              position:   "absolute", top: 10, left: 10,
              background: infra.bg,
              border:     `1.5px solid ${infra.color}40`,
              borderRadius: 99,
              padding:    "3px 9px",
              display:    "flex", alignItems: "center", gap: 5,
              fontSize:   11, fontWeight: 700, color: infra.color,
            }}>
              <span style={{ fontSize: 13 }}>{infra.emoji}</span>
              {infra.label}
            </div>
            {/* Complaint number on image */}
            <span style={{
              position:   "absolute", top: 10, right: 10,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
              color:      "rgba(255,255,255,0.9)",
              fontSize:   9, fontWeight: 700, fontFamily: "monospace",
              padding:    "3px 7px", borderRadius: 6,
            }}>
              #{pin.complaint_number}
            </span>
            {/* Hot node badge on image */}
            {(pin.node_complaint_count || 0) >= 5 && (
              <span style={{
                position:   "absolute", bottom: 10, right: 10,
                background: "#f97316",
                color:      "white",
                fontSize:   9, fontWeight: 700,
                padding:    "2px 7px", borderRadius: 6,
              }}>
                🔥 Hot spot · {pin.node_complaint_count} reports
              </span>
            )}
          </div>
        ) : (
          /* Color header when no image */
          <div style={{
            height:     56,
            background: `linear-gradient(135deg, ${infra.color}18, ${infra.color}08)`,
            borderBottom: `2px solid ${infra.color}20`,
            display:    "flex", alignItems: "center",
            padding:    "0 14px", gap: 10,
          }}>
            <span style={{ fontSize: 26 }}>{infra.emoji}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: infra.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {infra.label}
              </div>
              {(pin.node_complaint_count || 0) >= 5 && (
                <div style={{ fontSize: 10, color: "#f97316", fontWeight: 600 }}>
                  🔥 Hot spot · {pin.node_complaint_count} reports
                </div>
              )}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>
              #{pin.complaint_number}
            </span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "12px 14px 14px" }}>

          {/* Title */}
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.4, margin: "0 0 10px" }}>
            {pin.title?.length > 72 ? pin.title.slice(0, 69) + "…" : pin.title}
          </p>

          {/* Pills row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {/* Status */}
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: statusPill.bg, color: statusPill.color,
              padding: "3px 8px", borderRadius: 6,
            }}>
              {STATUS_LABEL[pin.status] || pin.status}
            </span>

            {/* Priority — only show if not normal */}
            {pin.priority && pin.priority !== "normal" && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: ["critical","emergency"].includes(pin.priority) ? "#fef2f2" : "#fff7ed",
                color:      ["critical","emergency"].includes(pin.priority) ? "#ef4444" : "#f97316",
                padding: "3px 8px", borderRadius: 6,
                textTransform: "capitalize",
              }}>
                {pin.priority === "critical" ? "🔴" : "🟠"} {pin.priority}
              </span>
            )}

            {/* Repeat */}
            {pin.is_repeat_complaint && (
              <span style={{ fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#ef4444", padding: "3px 8px", borderRadius: 6 }}>
                ↩ Repeat
              </span>
            )}

            {/* Distance */}
            {distKm && (
              <span style={{ fontSize: 10, color: "#64748b", padding: "3px 0" }}>
                📍 {distKm} km away
              </span>
            )}
          </div>

          {/* CTA */}
          <div style={{
            marginTop:    2,
            paddingTop:   10,
            borderTop:    "1px solid rgba(0,0,0,0.08)",
            display:      "flex",
            alignItems:   "center",
            justifyContent:"space-between",
          }}>
            <span style={{ fontSize: 10, color: "#64748b" }}>Click pin to view full details</span>
            <div style={{
              display:      "flex", alignItems: "center", gap: 3,
              background:   infra.color,
              color:        "white",
              fontSize:     10, fontWeight: 700,
              padding:      "4px 10px", borderRadius: 99,
              cursor:       "pointer",
            }}>
              View
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </Popup>
  );
}

// ── Stats overlay ─────────────────────────────────────────────────
function MapStats({ pins, radiusKm }) {
  const total    = pins.length;
  const active   = pins.filter(p => !["resolved","closed","rejected"].includes(p.status)).length;
  const critical = pins.filter(p => ["critical","emergency"].includes(p.priority)).length;

  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: "flex", flexDirection: "column", gap: 5 }}>
      {[
        { label: `Within ${radiusKm}km`, value: total,    color: "#6366f1" },
        { label: "Active",               value: active,   color: "#f97316" },
        { label: "Critical",             value: critical, color: "#ef4444" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
          border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`,
          borderRadius: "0 10px 10px 0", padding: "6px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, minWidth: 140,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}>
          <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Infra legend ──────────────────────────────────────────────────
function MapLegend({ pins }) {
  const counts = useMemo(() => {
    const c = {};
    pins.forEach(p => { const k = p.infra_type_code || "GENERAL"; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [pins]);

  const shown = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!shown.length) return null;

  return (
    <div style={{
      position: "absolute", bottom: 40, left: 12, zIndex: 10,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12,
      padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6,
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
        Infrastructure
      </span>
      {shown.map(([code, count]) => {
        const cfg = INFRA[code] || INFRA.GENERAL;
        return (
          <div key={code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>{cfg.emoji}</span>
            <span style={{ fontSize: 11, color: "#475569", flex: 1 }}>{cfg.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: "white",
              background: cfg.color, padding: "1px 6px", borderRadius: 99,
              fontFamily: "monospace", minWidth: 22, textAlign: "center",
            }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function ComplaintMap({
  pins          = [],
  userLocation  = null,
  locationStatus= "locating",
  height        = "440px",
  showRadius    = true,
  radiusMeters  = 4000,
  className     = "",
}) {
  const navigate       = useNavigate();
  const mapRef         = useRef(null);
  const [viewport,   setViewport]   = useState(DELHI_VIEW);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [clusters,   setClusters]   = useState([]);
  const [mapLoaded,  setMapLoaded]  = useState(false);
  const idxRef = useRef(null);

  useEffect(() => {
    if (!pins.length) { setClusters([]); return; }
    idxRef.current = buildIndex(pins);
    updateClusters(viewport.zoom);
  }, [pins]);

  const updateClusters = useCallback((zoom) => {
    if (!idxRef.current) return;
    const map = mapRef.current?.getMap();
    let b = [-180, -85, 180, 85];
    if (map) { const mb = map.getBounds(); b = [mb.getWest(), mb.getSouth(), mb.getEast(), mb.getNorth()]; }
    setClusters(idxRef.current.getClusters(b, Math.floor(zoom)));
  }, []);

  const handleMove = useCallback((evt) => {
    setViewport(evt.viewState);
    updateClusters(evt.viewState.zoom);
  }, [updateClusters]);

  useEffect(() => {
    if (!userLocation || !mapRef.current || !mapLoaded) return;
    mapRef.current.getMap()?.flyTo({
      center: [userLocation[1], userLocation[0]],
      zoom: 14, pitch: 52, bearing: -18,
      duration: 2000, essential: true,
    });
  }, [userLocation, mapLoaded]);

  const handleClusterClick = useCallback((cluster) => {
    const [lng, lat] = cluster.geometry.coordinates;
    const zoom = Math.min(idxRef.current.getClusterExpansionZoom(cluster.properties.cluster_id), 20);
    mapRef.current?.getMap()?.flyTo({ center: [lng, lat], zoom, duration: 600 });
  }, []);

  const radiusCircle = useMemo(() => {
    if (!userLocation || !showRadius) return null;
    return makeCircle(userLocation[0], userLocation[1], radiusMeters);
  }, [userLocation, radiusMeters, showRadius]);

  const statusText = ({
    locating:    "Locating you…",
    found:       `${pins.length} complaints within ${(radiusMeters / 1000).toFixed(0)} km`,
    denied:      `${pins.length} complaints near Delhi centre`,
    unavailable: `${pins.length} complaints near Delhi centre`,
  })[locationStatus] || "";

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.6); opacity: 0;    }
        }
        @keyframes user-pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(3.0); opacity: 0;   }
        }
        .mapboxgl-popup-content {
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 14px !important;
        }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>

      <div className={className} style={{
        position: "relative", height,
        borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
      }}>

        {/* Status pill */}
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 10,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,0,0,0.08)", borderRadius: 999,
          padding: "5px 13px", display: "flex", alignItems: "center", gap: 7,
          fontSize: 11, fontWeight: 600, color: "#475569",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: locationStatus === "found" ? "#10b981" : "#f97316",
            boxShadow: `0 0 5px ${locationStatus === "found" ? "#10b981" : "#f97316"}80`,
          }} />
          {statusText}
        </div>

        <MapStats pins={pins} radiusKm={radiusMeters / 1000} />
        <MapLegend pins={pins} />

        {/* 3D hint */}
        <div style={{
          position: "absolute", bottom: 40, right: 12, zIndex: 10,
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8,
          padding: "4px 9px", fontSize: 10, color: "#64748b", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>3d_rotation</span>
          Drag to rotate · Scroll to zoom
        </div>

        <Map
          ref={mapRef}
          {...viewport}
          onMove={handleMove}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
          onLoad={() => { setMapLoaded(true); updateClusters(viewport.zoom); }}
        >
          <NavigationControl position="bottom-right" showCompass visualizePitch />

          <Layer {...BUILDINGS_LAYER} />

          {radiusCircle && (
            <Source id="radius" type="geojson" data={radiusCircle}>
              <Layer id="radius-fill" type="fill" paint={{ "fill-color": "#6366f1", "fill-opacity": 0.05 }} />
              <Layer id="radius-line" type="line" paint={{ "line-color": "#6366f1", "line-width": 1.5, "line-opacity": 0.4, "line-dasharray": [4, 3] }} />
            </Source>
          )}

          {userLocation && locationStatus === "found" && (
            <UserMarker lat={userLocation[0]} lng={userLocation[1]} />
          )}

          {clusters.map((item) =>
            item.properties.cluster ? (
              <ClusterPin
                key={`cl-${item.properties.cluster_id}`}
                cluster={item}
                onClick={handleClusterClick}
              />
            ) : (
              <ComplaintPin
                key={item.properties.id}
                pin={item.properties}
                isHovered={hoveredPin?.id === item.properties.id}
                onClick={(p) => navigate(`/complaints/${p.id}`)}
                onEnter={setHoveredPin}
                onLeave={() => setHoveredPin(null)}
              />
            )
          )}

          <HoverPopup pin={hoveredPin} />
        </Map>
      </div>
    </>
  );
}