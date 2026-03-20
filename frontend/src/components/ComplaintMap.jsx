// src/components/ComplaintMap.jsx

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import Map, {
  Marker,
  Popup,
  Source,
  Layer,
  NavigationControl,
} from "react-map-gl";
import Supercluster from "supercluster";
import { useNavigate } from "react-router-dom";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Light streets style — 3D buildings render best here
const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

// Initial 3D view — pitched and slightly rotated
const DELHI_VIEW = {
  longitude: 77.209,
  latitude:  28.6139,
  zoom:      13.5,
  pitch:     52,
  bearing:   -18,
};

const STATUS_OPACITY = {
  received:           1.0,
  workflow_started:   1.0,
  in_progress:        1.0,
  resolved:           0.45,
  closed:             0.35,
  rejected:           0.35,
  escalated:          1.0,
  emergency:          1.0,
  constraint_blocked: 0.8,
};

const STATUS_LABEL = {
  received:          "Registered",
  clustered:         "Clustered",
  mapped:            "Mapped",
  workflow_started:  "Assigned",
  in_progress:       "In Progress",
  midway_survey_sent:"Survey Sent",
  resolved:          "Resolved",
  closed:            "Closed",
  rejected:          "Rejected",
  escalated:         "Escalated",
  emergency:         "Emergency",
  constraint_blocked:"Blocked",
};

const INFRA_CONFIG = {
  STLIGHT:    { color: "#f59e0b", label: "Streetlight",   icon: "💡" },
  ROAD:       { color: "#64748b", label: "Road",           icon: "🛣️" },
  POTHOLE:    { color: "#ef4444", label: "Pothole",        icon: "⚠️" },
  DRAIN:      { color: "#3b82f6", label: "Drain",          icon: "🌊" },
  FOOTPATH:   { color: "#8b5cf6", label: "Footpath",       icon: "🚶" },
  TREE:       { color: "#10b981", label: "Tree",           icon: "🌳" },
  GARBAGE:    { color: "#f97316", label: "Garbage",        icon: "🗑️" },
  WIRE_HAZARD:{ color: "#dc2626", label: "Wire Hazard",    icon: "⚡" },
  WATER_PIPE: { color: "#0ea5e9", label: "Water Pipe",     icon: "💧" },
  SEWER:      { color: "#78716c", label: "Sewer",          icon: "🔧" },
  HOARDING:   { color: "#a855f7", label: "Hoarding",       icon: "📢" },
  ELEC_POLE:  { color: "#eab308", label: "Electric Pole",  icon: "🔌" },
  GENERAL:    { color: "#94a3b8", label: "General",        icon: "📍" },
};


const PRIORITY_CONFIG = {
  low:      { glow: "0 0 6px rgba(99,102,241,0.5)"   },
  normal:   { glow: "0 0 6px rgba(59,130,246,0.5)"   },
  high:     { glow: "0 0 10px rgba(249,115,22,0.7)"  },
  critical: { glow: "0 0 14px rgba(239,68,68,0.9)"   },
  emergency:{ glow: "0 0 18px rgba(220,38,38,1.0)"   },
};

// ── 3D buildings layer ───────────────────────────────────────────
const BUILDINGS_LAYER = {
  id:           "3d-buildings",
  source:       "composite",
  "source-layer": "building",
  filter:       ["==", "extrude", "true"],
  type:         "fill-extrusion",
  minzoom:      12,
  paint: {
    "fill-extrusion-color": [
      "interpolate", ["linear"], ["get", "height"],
      0,   "#dde1e7",
      30,  "#c8cdd6",
      80,  "#a8b0be",
      150, "#8892a4",
    ],
    "fill-extrusion-height":  ["get", "height"],
    "fill-extrusion-base":    ["get", "min_height"],
    "fill-extrusion-opacity": 0.75,
  },
};

// ── Radius circle GeoJSON ────────────────────────────────────────
function makeRadiusCircle(lat, lng, r = 4000) {
  const n = 64, coords = [];
  const dLat = (r / 111320) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} }],
  };
}

// ── Supercluster ─────────────────────────────────────────────────
function buildIndex(pts) {
  const idx = new Supercluster({ radius: 55, maxZoom: 17, minZoom: 3 });
  idx.load(pts.map(p => ({
    type: "Feature",
    properties: { ...p },
    geometry: { type: "Point", coordinates: [p.lng, p.lat] },
  })));
  return idx;
}

// ── Pin — teardrop with 3D stem ──────────────────────────────────
function ComplaintPin({ pin, isHovered, onClick, onEnter, onLeave }) {
  const infra  = INFRA_CONFIG[pin.infra_type_code] || INFRA_CONFIG.GENERAL;
  const pglow  = PRIORITY_CONFIG[pin.priority]     || PRIORITY_CONFIG.normal;
  const urgent = ["critical", "emergency"].includes(pin.priority);
  const opacity = STATUS_OPACITY[pin.status] ?? 1.0;
  const sz     = isHovered ? 22 : 14;

  return (
    <Marker longitude={pin.lng} latitude={pin.lat} anchor="bottom">
      <div
        onClick={() => onClick(pin)}
        onMouseEnter={() => onEnter(pin)}
        onMouseLeave={onLeave}
        style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", cursor: "pointer",
          opacity,
        }}
      >
        <div style={{
          width: sz, height: sz, borderRadius: "50%",
          background:  infra.color,
          border:      isHovered ? "2.5px solid white" : "1.5px solid rgba(255,255,255,0.85)",
          boxShadow:   isHovered
            ? `${pglow.glow}, 0 4px 14px rgba(0,0,0,0.22)`
            : `0 2px 6px rgba(0,0,0,0.18)`,
          transition:  "all 0.15s ease",
          position:    "relative",
          display:     "flex", alignItems: "center", justifyContent: "center",
          fontSize:    isHovered ? 11 : 8,
          lineHeight:  1,
        }}>
          {/* Infra type emoji icon */}
          <span style={{ userSelect: "none" }}>{infra.icon}</span>

          {urgent && (
            <span style={{
              position: "absolute", inset: -5, borderRadius: "50%",
              border: `2px solid ${infra.color}`,
              animation: "pulse-ring 1.4s ease-out infinite", opacity: 0.5,
            }} />
          )}
          {pin.is_repeat_complaint && (
            <span style={{
              position: "absolute", top: -3, right: -3,
              width: 6, height: 6, borderRadius: "50%",
              background: "#ef4444", border: "1.5px solid white",
            }} />
          )}
          {/* Hot node indicator — many complaints on same node */}
          {(pin.node_complaint_count || 0) >= 5 && (
            <span style={{
              position: "absolute", bottom: -3, left: -3,
              width: 6, height: 6, borderRadius: "50%",
              background: "#f97316", border: "1.5px solid white",
            }} />
          )}
        </div>
        <div style={{
          width: 2,
          height: isHovered ? 14 : 9,
          background: `linear-gradient(to bottom, ${infra.color}cc, transparent)`,
          transition: "height 0.15s ease", marginTop: 1,
        }} />
      </div>
    </Marker>
  );
}
// ── Cluster pin ──────────────────────────────────────────────────
function ClusterPin({ cluster, onClick }) {
  const { point_count } = cluster.properties;
  const [lng, lat] = cluster.geometry.coordinates;
  const sz = Math.min(22 + Math.sqrt(point_count) * 4, 56);

  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          onClick={() => onClick(cluster)}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          style={{
            width: sz, height: sz, borderRadius: "50%",
            background:    "radial-gradient(circle at 35% 35%, #818cf8, #4338ca)",
            border:        "2.5px solid rgba(255,255,255,0.95)",
            boxShadow:     "0 4px 18px rgba(99,102,241,0.45), 0 2px 6px rgba(0,0,0,0.15)",
            display:       "flex", alignItems: "center", justifyContent: "center",
            cursor:        "pointer", color: "white",
            fontSize:      sz > 38 ? 13 : 11, fontWeight: 800,
            fontFamily:    "monospace", transition: "transform 0.1s ease",
          }}
        >
          {point_count > 999 ? "1k+" : point_count}
        </div>
        <div style={{ width: 2, height: 9, background: "linear-gradient(to bottom, #6366f1cc, transparent)", marginTop: 1 }} />
      </div>
    </Marker>
  );
}

// ── User location ────────────────────────────────────────────────
function UserMarker({ lat, lng }) {
  return (
    <Marker longitude={lng} latitude={lat} anchor="bottom">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", inset: -10, borderRadius: "50%",
            background: "rgba(14,165,233,0.12)",
            animation: "user-pulse 2s ease-out infinite",
          }} />
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            background: "#0ea5e9", border: "3px solid white",
            boxShadow: "0 0 14px rgba(14,165,233,0.65), 0 2px 8px rgba(0,0,0,0.18)",
            position: "relative", zIndex: 1,
          }} />
        </div>
        <div style={{ width: 2, height: 12, background: "linear-gradient(to bottom, #0ea5e9cc, transparent)", marginTop: 2 }} />
      </div>
    </Marker>
  );
}

// ── Hover popup ──────────────────────────────────────────────────
function HoverPopup({ pin }) {
  if (!pin) return null;
  const infra  = INFRA_CONFIG[pin.infra_type_code] || INFRA_CONFIG.GENERAL;
  const distKm = pin.distance_meters ? (pin.distance_meters / 1000).toFixed(1) : null;

  return (
    <Popup
      longitude={pin.lng} latitude={pin.lat}
      anchor="bottom" offset={34}
      closeButton={false} closeOnClick={false}
      maxWidth="280px" style={{ zIndex: 1000 }}
    >
      <div style={{
        background: "rgba(255,255,255,0.97)", borderRadius: 12,
        padding: "12px 14px", minWidth: 230,
        boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(99,102,241,0.1)",
      }}>
        {/* Infra type header */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <span style={{
            fontSize: 18, lineHeight: 1,
            filter: `drop-shadow(0 1px 2px ${infra.color}50)`,
          }}>
            {infra.icon}
          </span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: infra.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {infra.label}
            </div>
            {pin.node_complaint_count > 1 && (
              <div style={{ fontSize: 9, color: "#94a3b8" }}>
                {pin.node_complaint_count} complaints on this node
                {(pin.node_complaint_count || 0) >= 5 && (
                  <span style={{ color: "#f97316", fontWeight: 700 }}> · Hot spot</span>
                )}
              </div>
            )}
          </div>
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>
            #{pin.complaint_number}
          </span>
        </div>

        {/* Complaint title */}
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.4, margin: "0 0 8px" }}>
          {pin.title?.length > 65 ? pin.title.slice(0, 62) + "…" : pin.title}
        </p>

        {/* Status + priority + distance */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: ["resolved","closed"].includes(pin.status) ? "#10b981" : "#6366f1",
            background: ["resolved","closed"].includes(pin.status) ? "#f0fdf4" : "#eef2ff",
            padding: "2px 7px", borderRadius: 4,
          }}>
            {STATUS_LABEL[pin.status] || pin.status}
          </span>
          {pin.priority && pin.priority !== "normal" && (
            <span style={{ fontSize: 10, fontWeight: 600, color: "#f97316", textTransform: "capitalize" }}>
              {pin.priority}
            </span>
          )}
          {distKm && (
            <span style={{ fontSize: 10, color: "#64748b" }}>{distKm} km away</span>
          )}
          {pin.is_repeat_complaint && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", background: "#fef2f2", padding: "2px 6px", borderRadius: 4 }}>
              REPEAT
            </span>
          )}
        </div>

        <div style={{ paddingTop: 8, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>Click to view full details</span>
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#94a3b8" }}>arrow_forward</span>
        </div>
      </div>
    </Popup>
  );
}

// ── Stats overlay ────────────────────────────────────────────────
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
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)",
          border: `1px solid ${color}20`, borderLeft: `3px solid ${color}`,
          borderRadius: "0 8px 8px 0", padding: "5px 11px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 14, minWidth: 132, boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        }}>
          <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "monospace" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Legend ───────────────────────────────────────────────────────
function MapLegend({ pins }) {
  const counts = useMemo(() => {
    const c = {};
    pins.forEach(p => {
      const key = p.infra_type_code || "GENERAL";
      c[key] = (c[key] || 0) + 1;
    });
    return c;
  }, [pins]);

  const shown = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!shown.length) return null;

  return (
    <div style={{
      position: "absolute", bottom: 40, left: 12, zIndex: 10,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)",
      border: "1px solid rgba(99,102,241,0.14)", borderRadius: 10,
      padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5,
      boxShadow: "0 2px 12px rgba(0,0,0,0.09)",
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
        Infrastructure
      </span>
      {shown.map(([code, count]) => {
        const cfg = INFRA_CONFIG[code] || INFRA_CONFIG.GENERAL;
        return (
          <div key={code} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{cfg.icon}</span>
            <span style={{ fontSize: 11, color: "#334155", flex: 1 }}>{cfg.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: "monospace" }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}
// ── Main export ──────────────────────────────────────────────────
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
  const [viewport, setViewport]     = useState(DELHI_VIEW);
  const [hoveredPin, setHoveredPin] = useState(null);
  const [clusters, setClusters]     = useState([]);
  const [mapLoaded, setMapLoaded]   = useState(false);
  const clusterIdxRef               = useRef(null);

  useEffect(() => {
    if (!pins.length) { setClusters([]); return; }
    clusterIdxRef.current = buildIndex(pins);
    updateClusters(viewport.zoom);
  }, [pins]);

  const updateClusters = useCallback((zoom) => {
    if (!clusterIdxRef.current) return;
    const map = mapRef.current?.getMap();
    let b = [-180, -85, 180, 85];
    if (map) { const mb = map.getBounds(); b = [mb.getWest(), mb.getSouth(), mb.getEast(), mb.getNorth()]; }
    setClusters(clusterIdxRef.current.getClusters(b, Math.floor(zoom)));
  }, []);

  const handleMove = useCallback((evt) => {
    setViewport(evt.viewState);
    updateClusters(evt.viewState.zoom);
  }, [updateClusters]);

  // Fly to user location with 3D pitch preserved
  useEffect(() => {
    if (!userLocation || !mapRef.current || !mapLoaded) return;
    mapRef.current.getMap()?.flyTo({
      center: [userLocation[1], userLocation[0]],
      zoom: 14, pitch: 52, bearing: -18,
      duration: 2200, essential: true,
    });
  }, [userLocation, mapLoaded]);

  const handleClusterClick = useCallback((cluster) => {
    const [lng, lat] = cluster.geometry.coordinates;
    const zoom = Math.min(clusterIdxRef.current.getClusterExpansionZoom(cluster.properties.cluster_id), 20);
    mapRef.current?.getMap()?.flyTo({ center: [lng, lat], zoom, duration: 650 });
  }, []);

  const radiusCircle = useMemo(() => {
    if (!userLocation || !showRadius) return null;
    return makeRadiusCircle(userLocation[0], userLocation[1], radiusMeters);
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
          100% { transform: scale(2.4); opacity: 0;    }
        }
        @keyframes user-pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
        .mapboxgl-popup-content { padding: 0 !important; background: transparent !important; box-shadow: none !important; border-radius: 12px !important; }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>

      <div
        className={className}
        style={{
          position: "relative", height, borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(99,102,241,0.16)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.09), 0 0 0 1px rgba(99,102,241,0.07)",
        }}
      >
        {/* Status pill */}
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 10,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(99,102,241,0.18)", borderRadius: 999,
          padding: "5px 12px", display: "flex", alignItems: "center", gap: 7,
          fontSize: 11, fontWeight: 600, color: "#1e293b",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
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
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(99,102,241,0.12)", borderRadius: 6,
          padding: "4px 8px", fontSize: 10, color: "#64748b", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>3d_rotation</span>
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

          {/* 3D Buildings */}
          <Layer {...BUILDINGS_LAYER} />

          {/* 4km radius ring */}
          {radiusCircle && (
            <Source id="radius" type="geojson" data={radiusCircle}>
              <Layer id="radius-fill" type="fill"
                paint={{ "fill-color": "#6366f1", "fill-opacity": 0.05 }} />
              <Layer id="radius-line" type="line"
                paint={{ "line-color": "#6366f1", "line-width": 1.5, "line-opacity": 0.45, "line-dasharray": [4, 3] }} />
            </Source>
          )}

          {userLocation && locationStatus === "found" && (
            <UserMarker lat={userLocation[0]} lng={userLocation[1]} />
          )}

          {clusters.map((item) =>
            item.properties.cluster ? (
              <ClusterPin key={`cl-${item.properties.cluster_id}`} cluster={item} onClick={handleClusterClick} />
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