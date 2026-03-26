// src/components/MapboxInfraLayer.jsx
// Full 3D Mapbox map for infra nodes.
// - Uses dark-v11 for glassmorphism-aligned dark aesthetic
// - Shows infra nodes as GeoJSON circle layer
// - Hover: popup with node card + AI summary
// - Click: calls onNodeClick(nodeId)
// - 3D building extrusion at zoom ≥ 12

import React, { useMemo, useState, useCallback, useRef } from "react";
import Map, { Layer, NavigationControl, Popup, Source } from "react-map-gl";

const DELHI = { longitude: 77.209, latitude: 28.6139, zoom: 11, pitch: 45, bearing: -10 };
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ── Layer definitions ─────────────────────────────────────────────

const building3dLayer = {
  id: "3d-buildings",
  source: "composite",
  "source-layer": "building",
  filter: ["==", "extrude", "true"],
  type: "fill-extrusion",
  minzoom: 12,
  paint: {
    "fill-extrusion-color": [
      "interpolate", ["linear"], ["get", "height"],
      0, "#dde3ea", 30, "#c8d0da", 80, "#b0bcc9", 150, "#9aaabb",
    ],
    "fill-extrusion-height":  ["get", "height"],
    "fill-extrusion-base":    ["get", "min_height"],
    "fill-extrusion-opacity": 0.65,
  },
};

const nodeCircleLayer = {
  id: "infra-node-circles",
  type: "circle",
  source: "infra-nodes",
  paint: {
    "circle-radius": [
      "interpolate", ["linear"],
      ["coalesce", ["get", "open_complaint_count"], 0],
      0, 7, 5, 10, 15, 14, 50, 18,
    ],
    "circle-color": [
      "case",
      ["==", ["get", "status"], "damaged"],      "#ef4444",
      ["==", ["get", "status"], "under_repair"], "#f59e0b",
      ["==", ["get", "status"], "inactive"],     "#475569",
      "#10b981",
    ],
    "circle-stroke-color": [
      "case",
      ["==", ["get", "is_repeat_risk"], true], "#f97316",
      "rgba(255,255,255,0.4)",
    ],
    "circle-stroke-width": [
      "case",
      ["==", ["get", "is_repeat_risk"], true], 2.5,
      1.5,
    ],
    "circle-opacity": 0.92,
    "circle-blur": 0.05,
  },
};

const nodeLabelLayer = {
  id: "infra-node-labels",
  type: "symbol",
  source: "infra-nodes",
  minzoom: 13,
  layout: {
    "text-field": ["to-string", ["coalesce", ["get", "open_complaint_count"], 0]],
    "text-size": 11,
    "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
  },
  paint: {
    "text-color": "#ffffff",
    "text-halo-color": "rgba(0,0,0,0.6)",
    "text-halo-width": 1.5,
  },
};

const SEVERITY_COLOR = {
  critical: { bg: "rgba(239,68,68,0.1)",   text: "#dc2626", label: "Critical" },
  high:     { bg: "rgba(234,88,12,0.1)",   text: "#ea580c", label: "High" },
  medium:   { bg: "rgba(202,138,4,0.1)",   text: "#ca8a04", label: "Medium" },
  low:      { bg: "rgba(22,163,74,0.1)",   text: "#16a34a", label: "Low" },
};

// ── Hover popup card ─────────────────────────────────────────────
function NodePopupCard({ props }) {
  if (!props) return null;
  const sev    = SEVERITY_COLOR[props.cluster_severity] || SEVERITY_COLOR.low;
  const themes = Array.isArray(props.cluster_major_themes) ? props.cluster_major_themes : [];
  const pct    = props.health_score != null ? Math.round(Math.min(100, Math.max(0, props.health_score))) : null;
  const healthColor = pct != null ? (pct >= 70 ? "#34d399" : pct >= 40 ? "#fb923c" : "#f87171") : null;

  return (
    <div style={{
      minWidth: 220, maxWidth: 280,
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 12,
      padding: 12,
      color: "#1e293b",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{props.infra_type_name || "Infra Node"}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px",
          borderRadius: 999, background: sev.bg, color: sev.text,
        }}>
          {sev.label}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {[
          { label: "Open",  value: props.open_complaint_count || 0,  color: "#f87171" },
          { label: "Total", value: props.total_complaint_count || 0, color: "#94a3b8" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(0,0,0,0.04)", borderRadius: 8,
            padding: "6px 8px", textAlign: "center",
          }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Health bar */}
      {pct != null && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 10, color: "#64748b" }}>
            <span>Health</span>
            <span style={{ color: healthColor, fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: healthColor, boxShadow: `0 0 6px ${healthColor}60` }} />
          </div>
        </div>
      )}

      {/* AI summary */}
      {props.cluster_ai_summary && (
        <div style={{ background: sev.bg, border: `1px solid ${sev.text}30`, borderRadius: 8, padding: "6px 8px", marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: sev.text, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Summary
          </p>
          <p style={{ fontSize: 11, color: "#475569", lineHeight: 1.4, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {props.cluster_ai_summary}
          </p>
        </div>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {themes.slice(0, 3).map((t, i) => (
            <span key={i} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 999,
              background: "rgba(0,0,0,0.05)", color: "#475569",
              border: "1px solid rgba(0,0,0,0.08)",
            }}>{t}</span>
          ))}
        </div>
      )}

      {/* Repeat risk */}
      {props.is_repeat_risk && (
        <p style={{ fontSize: 10, fontWeight: 700, color: "#fb923c", marginBottom: 6 }}>↩ Warranty / Repeat Risk</p>
      )}

      <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>Click node to open full details</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function MapboxInfraLayer({ nodes, onNodeClick }) {
  const mapRef   = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  const featureCollection = useMemo(() => {
    if (!nodes) return { type: "FeatureCollection", features: [] };
    if (nodes.type === "FeatureCollection" && Array.isArray(nodes.features)) return nodes;
    if (Array.isArray(nodes)) {
      return {
        type: "FeatureCollection",
        features: nodes
          .filter(n => n?.lng != null && n?.lat != null)
          .map(n => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [Number(n.lng), Number(n.lat)] },
            properties: { ...n },
          })),
      };
    }
    return { type: "FeatureCollection", features: [] };
  }, [nodes]);

  const onMouseMove = useCallback((e) => {
    const features = e.features;
    if (!features || features.length === 0) { setHoverInfo(null); return; }
    const f = features[0];
    let props = { ...f.properties };
    if (typeof props.cluster_major_themes === "string") {
      try { props.cluster_major_themes = JSON.parse(props.cluster_major_themes); } catch { props.cluster_major_themes = []; }
    }
    setHoverInfo({ lngLat: e.lngLat, props });
  }, []);

  const onMouseLeaveMap = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
    setHoverInfo(null);
  }, []);

  const onMouseEnter = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "pointer";
  }, []);

  const onClick = useCallback((e) => {
    const features = e.features;
    if (!features || features.length === 0) return;
    const id = features[0].properties?.id;
    if (id) onNodeClick?.(id);
  }, [onNodeClick]);

  return (
    <div className="w-full h-full overflow-hidden rounded-xl relative"
      style={{ border: "1px solid rgba(0,0,0,0.08)", minHeight: 480 }}>
      <Map
        ref={mapRef}
        initialViewState={DELHI}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={["infra-node-circles"]}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeaveMap}
        onClick={onClick}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass visualizePitch />

        {/* 3D buildings */}
        <Layer {...building3dLayer} />

        {/* Infra node circles */}
        <Source id="infra-nodes" type="geojson" data={featureCollection}>
          <Layer {...nodeCircleLayer} />
          <Layer {...nodeLabelLayer} />
        </Source>

        {/* Hover popup */}
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lngLat.lng}
            latitude={hoverInfo.lngLat.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="top"
            maxWidth="300px"
            style={{ background: "transparent", padding: 0 }}
          >
            <NodePopupCard props={hoverInfo.props} />
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 rounded-xl px-3 py-2 text-xs"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-[10px]">Infra Status</p>
        {[
          { c: "#10b981", l: "Operational" },
          { c: "#f59e0b", l: "Under Repair" },
          { c: "#ef4444", l: "Damaged" },
          { c: "#475569", l: "Inactive" },
        ].map(s => (
          <div key={s.l} className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.c, boxShadow: `0 0 4px ${s.c}80` }} />
            <span className="text-slate-500">{s.l}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500 ring-2 ring-orange-400" />
          <span className="text-slate-500">Repeat / Warranty Risk</span>
        </div>
        <p className="text-slate-400 mt-1.5 text-[10px]">Circle size = open complaints</p>
      </div>
    </div>
  );
}
