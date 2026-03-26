// src/pages/WorkerDashboardPage.jsx
// Worker + Contractor dashboard — glassmorphism dark theme

import { useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import AppLayout from "../../components/AppLayout";
import client from "../../api/client";
import { toast } from "sonner";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const PC = {
  normal:    "#818cf8",
  high:      "#fb923c",
  critical:  "#f87171",
  emergency: "#ef4444",
  low:       "#64748b",
};

function Pill({ label, color }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
      style={{ background: color + "20", color }}>
      {label?.replace(/_/g, " ")}
    </span>
  );
}

// ── Photo capture ─────────────────────────────────────────────────

function PhotoCapture({ label, photos, onAdd, onRemove }) {
  const fileRef  = useRef(null);
  const videoRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream]         = useState(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch { toast.error("Camera access denied"); }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(blob => {
      const f = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      onAdd(f, URL.createObjectURL(f));
      stopCamera();
    }, "image/jpeg", 0.85);
  };

  const handleFile = (e) => {
    Array.from(e.target.files).forEach(f => onAdd(f, URL.createObjectURL(f)));
    e.target.value = "";
  };

  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      {cameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black mb-3" style={{ height: 240 }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
            <button onClick={capture}
              className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 hover:scale-105 active:scale-95 transition-transform" />
            <button onClick={stopCamera}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: "rgba(0,0,0,0.7)" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mb-3">
          <button onClick={startCamera}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-600 transition-colors"
            style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)" }}>
            <span className="material-symbols-outlined text-[16px] text-sky-400">photo_camera</span>
            Camera
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 transition-colors"
            style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <span className="material-symbols-outlined text-[16px]">upload</span>
            Gallery
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
        </div>
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              <button onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
                style={{ background: "rgba(0,0,0,0.7)" }}>✕</button>
              <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[11px]">check</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Task update drawer ────────────────────────────────────────────

function TaskUpdateDrawer({ task, onClose, onSuccess }) {
  const [mode, setMode]             = useState("update");
  const [updateType, setType]       = useState("before_photo");
  const [beforePhotos, setBefore]   = useState([]);
  const [afterPhotos, setAfter]     = useState([]);
  const [progressPhotos, setProgress] = useState([]);
  const [notes, setNotes]           = useState("");
  const [lat, setLat]               = useState(null);
  const [lng, setLng]               = useState(null);
  const [gpsStatus, setGpsStatus]   = useState("Getting GPS…");
  const [submitting, setSubmitting] = useState(false);
  const [surveyInstanceId, setSurveyInstanceId] = useState(null);
  const [rating, setRating]         = useState(0);
  const [feedback, setFeedback]     = useState("");
  const [isResolved, setIsResolved] = useState(null);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => { setLat(p.coords.latitude); setLng(p.coords.longitude); setGpsStatus("GPS: ✓"); },
      () => setGpsStatus("GPS: unavailable"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    if (task.complaint_id) {
      client.get(`/worker/tasks/${task.id}/pending-survey`)
        .then(d => { if (d.data?.survey_instance_id) setSurveyInstanceId(d.data.survey_instance_id); })
        .catch(() => {});
    }
  }, [task]);

  const getCurrentPhotos  = () => updateType === "before_photo" ? beforePhotos : updateType === "after_photo" || updateType === "complete" ? afterPhotos : progressPhotos;
  const getCurrentSetter  = () => updateType === "before_photo" ? (f,p) => setBefore(prev=>[...prev,{file:f,preview:p}]) : updateType === "after_photo" || updateType === "complete" ? (f,p) => setAfter(prev=>[...prev,{file:f,preview:p}]) : (f,p) => setProgress(prev=>[...prev,{file:f,preview:p}]);
  const getCurrentRemover = () => updateType === "before_photo" ? (i) => setBefore(prev=>prev.filter((_,j)=>j!==i)) : updateType === "after_photo" || updateType === "complete" ? (i) => setAfter(prev=>prev.filter((_,j)=>j!==i)) : (i) => setProgress(prev=>prev.filter((_,j)=>j!==i));

  const submit = async () => {
    const photos = getCurrentPhotos();
    if (updateType === "complete" && afterPhotos.length === 0) { toast.error("After photo required to complete"); return; }
    if (updateType === "before_photo" && photos.length === 0) { toast.error("Add at least one before photo"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("update_type", updateType);
      if (notes) fd.append("notes", notes);
      if (lat) fd.append("lat", String(lat));
      if (lng) fd.append("lng", String(lng));
      const allPhotos = updateType === "complete" ? afterPhotos : photos;
      allPhotos.forEach(p => fd.append("photos", p.file));
      await client.post(`/worker/tasks/${task.id}/update`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(updateType === "complete" ? "Task marked complete!" : "Update submitted!");
      onSuccess();
      if (updateType !== "complete") {
        if (updateType === "before_photo") setBefore([]);
        else if (updateType === "after_photo") setAfter([]);
        else setProgress([]);
        setNotes("");
      } else { onClose(); }
    } catch (e) { toast.error(e.response?.data?.detail || "Submission failed"); }
    finally { setSubmitting(false); }
  };

  const submitSurvey = async () => {
    if (!rating) { toast.error("Please give a star rating"); return; }
    setSubmittingSurvey(true);
    try {
      await client.post(`/surveys/${surveyInstanceId}/submit`, { rating, feedback, is_resolved: isResolved, wants_followup: false });
      toast.success("Survey submitted!");
      setSurveyInstanceId(null);
      onSuccess();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to submit survey"); }
    finally { setSubmittingSurvey(false); }
  };

  const UPDATE_OPTIONS = [
    { k: "before_photo",  l: "Before Work",   icon: "photo_camera", desc: "Document site before starting", color: "#818cf8" },
    { k: "progress_note", l: "Progress",       icon: "edit_note",    desc: "Mid-work update with notes",    color: "#fb923c" },
    { k: "after_photo",   l: "After Work",     icon: "done_all",     desc: "Document completed work",       color: "#34d399" },
    { k: "complete",      l: "Mark Complete",  icon: "task_alt",     desc: "Finish task — after photo req", color: "#34d399" },
  ];

  const mapLocation = task.lat ? { longitude: task.lng, latitude: task.lat, zoom: 15 } : null;
  const glass = { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="ml-auto w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl" style={glass}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">#{task.task_number}</p>
              <h2 className="font-black text-slate-800 text-lg leading-tight">{task.title}</h2>
              {task.address_text && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  {task.address_text}
                </p>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setMode("update")}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{ background: mode === "update" ? "rgba(56,189,248,0.15)" : "rgba(0,0,0,0.04)", color: mode === "update" ? "#0284c7" : "#64748b", border: `1px solid ${mode === "update" ? "rgba(56,189,248,0.3)" : "rgba(0,0,0,0.08)"}` }}>
              Update Task
            </button>
            {surveyInstanceId && (
              <button onClick={() => setMode("survey")}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-colors"
                style={{ background: mode === "survey" ? "rgba(251,191,36,0.15)" : "rgba(0,0,0,0.04)", color: mode === "survey" ? "#d97706" : "#64748b", border: `1px solid ${mode === "survey" ? "rgba(251,191,36,0.3)" : "rgba(0,0,0,0.08)"}` }}>
                Survey Pending
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === "survey" && surveyInstanceId ? (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl p-4" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                <p className="font-bold text-amber-300 text-sm">Survey from the citizen</p>
                <p className="text-xs text-amber-500/70 mt-1">Please answer honestly — your responses improve our services.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-3">How would you rate the overall experience?</p>
                <div className="flex gap-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)}
                      className="w-12 h-12 rounded-xl text-2xl transition-all"
                      style={{ background: s <= rating ? "rgba(251,191,36,0.25)" : "rgba(0,0,0,0.04)", transform: s <= rating ? "scale(1.1)" : "scale(1)", color: s <= rating ? "#d97706" : "#94a3b8" }}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-2">Was the issue resolved?</p>
                <div className="flex gap-3">
                  {[{v:true,l:"Yes"},{v:false,l:"No"}].map(o => (
                    <button key={String(o.v)} onClick={() => setIsResolved(o.v)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                      style={{ background: isResolved === o.v ? "rgba(56,189,248,0.15)" : "rgba(0,0,0,0.04)", color: isResolved === o.v ? "#0284c7" : "#64748b", border: `1px solid ${isResolved === o.v ? "rgba(56,189,248,0.3)" : "rgba(0,0,0,0.08)"}` }}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-800 block mb-2 text-sm">Comments (optional)</label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                  rows={4} placeholder="Any feedback…"
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none ginput" />
              </div>
              <button onClick={submitSurvey} disabled={!rating || submittingSurvey || isResolved === null}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white disabled:opacity-40 gbtn-sky">
                {submittingSurvey ? "Submitting…" : "Submit Survey"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">What are you updating?</p>
                <div className="grid grid-cols-2 gap-2">
                  {UPDATE_OPTIONS.map(o => (
                    <button key={o.k} onClick={() => setType(o.k)}
                      className="p-3.5 rounded-2xl text-left transition-all"
                      style={{
                        background: updateType === o.k ? `${o.color}15` : "rgba(0,0,0,0.04)",
                        border: `1px solid ${updateType === o.k ? `${o.color}40` : "rgba(0,0,0,0.06)"}`,
                      }}>
                      <span className="material-symbols-outlined text-[20px] block mb-1" style={{ color: o.color }}>{o.icon}</span>
                      <p className="font-bold text-slate-800 text-sm">{o.l}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                <div className="flex gap-3 text-xs font-semibold">
                  {beforePhotos.length > 0 && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8" }}>
                      {beforePhotos.length} before
                    </span>
                  )}
                  {afterPhotos.length > 0 && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                      {afterPhotos.length} after
                    </span>
                  )}
                </div>
              )}

              <PhotoCapture
                label={UPDATE_OPTIONS.find(o => o.k === updateType)?.l || "Photos"}
                photos={getCurrentPhotos()}
                onAdd={getCurrentSetter()}
                onRemove={getCurrentRemover()}
              />

              {(updateType === "progress_note" || updateType === "complete") && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    {updateType === "complete" ? "Completion Notes" : "Progress Notes"}
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none ginput"
                    placeholder={updateType === "complete"
                      ? "Describe what was done, materials used, any issues…"
                      : "Describe current progress, any blockers…"} />
                </div>
              )}

              {mapLocation && updateType !== "progress_note" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site Location</p>
                    <span className={`text-xs font-semibold ${lat ? "text-emerald-400" : "text-slate-500"}`}>{gpsStatus}</span>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ height: 150, border: "1px solid rgba(0,0,0,0.08)" }}>
                    <Map initialViewState={mapLocation} mapboxAccessToken={MAPBOX_TOKEN}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      style={{ width: "100%", height: "100%" }} interactive={false} attributionControl={false}>
                      <Marker longitude={task.lng} latitude={task.lat}>
                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md" />
                      </Marker>
                      {lat && (
                        <Marker longitude={lng} latitude={lat}>
                          <div className="w-4 h-4 rounded-full bg-sky-400 border-2 border-white shadow-md" />
                        </Marker>
                      )}
                    </Map>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Red = Task site · Blue = Your GPS</p>
                </div>
              )}
            </div>
          )}
        </div>

        {mode === "update" && (
          <div className="px-6 pb-6 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <button onClick={submit} disabled={submitting}
              className={`w-full py-4 rounded-2xl font-black text-sm text-white disabled:opacity-40 transition-all ${updateType === "complete" ? "" : "gbtn-sky"}`}
              style={updateType === "complete" ? { background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" } : {}}>
              {submitting ? "Submitting…" :
               updateType === "complete" ? "Mark Task Complete" :
               updateType === "before_photo" ? "Submit Before Photos" :
               updateType === "after_photo" ? "Submit After Photos" : "Submit Progress Update"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────

function TaskCard({ task, onOpen }) {
  const color    = PC[task.priority] || "#818cf8";
  const before   = task.before_photos?.length || 0;
  const after    = task.after_photos?.length  || 0;
  const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== "completed";
  const isDone   = task.status === "completed";

  return (
    <div className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${isOverdue ? "rgba(248,113,113,0.3)" : "rgba(0,0,0,0.08)"}`,
        boxShadow: isOverdue ? "0 4px 24px rgba(248,113,113,0.1)" : "0 4px 24px rgba(0,0,0,0.06)",
      }}
      onClick={() => onOpen(task)}>
      <div className="h-1" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-mono text-slate-500">#{task.task_number}</span>
          <Pill label={task.priority} color={color} />
          <Pill label={task.status}
            color={isDone ? "#34d399" : task.status === "in_progress" ? "#fb923c" : color} />
          {isOverdue && <span className="text-[10px] text-red-400 font-bold">Overdue</span>}
        </div>
        <p className="font-black text-slate-800 text-sm leading-tight">{task.title}</p>
        {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>}

        {task.address_text && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[13px]">location_on</span>
            <span className="truncate">{task.address_text}</span>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className={`flex items-center gap-1.5 text-xs ${before > 0 ? "text-emerald-400" : "text-slate-600"}`}>
            <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            {before} before
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${after > 0 ? "text-emerald-400" : "text-slate-600"}`}>
            <span className="material-symbols-outlined text-[14px]">done_all</span>
            {after} after
          </div>
          {task.due_at && (
            <span className={`ml-auto text-xs font-semibold ${isOverdue ? "text-red-400" : "text-slate-600"}`}>
              Due {new Date(task.due_at).toLocaleDateString("en-IN")}
            </span>
          )}
        </div>

        <div className="mt-4 py-2.5 rounded-xl text-sm font-bold text-center transition-colors"
          style={isDone
            ? { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }
            : { background: "rgba(56,189,248,0.12)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>
          {isDone ? "✓ Completed" : "Update Task"}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────

export default function WorkerDashboardPage() {
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setFilter]   = useState(null);
  const [drawerTask, setDrawerTask] = useState(null);

  const loadTasks = (status = null) => {
    setLoading(true);
    const params = status ? { status } : {};
    client.get("/worker/tasks", { params })
      .then(d => { setTasks(d.data.items || []); setLoading(false); })
      .catch(() => { toast.error("Failed to load tasks"); setLoading(false); });
  };

  useEffect(() => { loadTasks(); }, []);

  const counts = {
    pending:     tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed:   tasks.filter(t => t.status === "completed").length,
    overdue:     tasks.filter(t => t.due_at && new Date(t.due_at) < new Date() && t.status !== "completed").length,
  };

  const FILTERS = [
    { k: null,          l: "All",         color: "#818cf8" },
    { k: "pending",     l: "Assigned",    color: "#38bdf8" },
    { k: "in_progress", l: "In Progress", color: "#fb923c" },
    { k: "completed",   l: "Completed",   color: "#34d399" },
  ];

  return (
    <AppLayout title="My Tasks">
      <div className="p-4 md:p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              Namaskar, {user.full_name?.split(" ")[0]} 🙏
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 capitalize">{user.role}</p>
          </div>
          {counts.overdue > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)" }}>
              <span className="material-symbols-outlined text-red-400 text-[18px]">alarm_off</span>
              <span className="text-sm font-bold text-red-400">{counts.overdue} overdue</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Assigned",    v: counts.pending,     c: "#818cf8" },
            { l: "In Progress", v: counts.in_progress, c: "#fb923c" },
            { l: "Completed",   v: counts.completed,   c: "#34d399" },
            { l: "Overdue",     v: counts.overdue,     c: "#f87171" },
          ].map(s => (
            <div key={s.l} className="gcard p-4 flex flex-col items-center gap-1">
              <span className="text-2xl font-black" style={{ color: s.c }}>{s.v}</span>
              <span className="text-xs text-slate-500">{s.l}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={String(f.k)} onClick={() => { setFilter(f.k); loadTasks(f.k); }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: activeFilter === f.k ? `${f.color}20` : "rgba(0,0,0,0.04)",
                color: activeFilter === f.k ? f.color : "#64748b",
                border: `1px solid ${activeFilter === f.k ? `${f.color}40` : "rgba(0,0,0,0.06)"}`,
              }}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Task grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl animate-pulse"
                style={{ background: "rgba(0,0,0,0.06)" }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-3">task_alt</span>
            <p className="font-bold text-lg text-slate-800">No tasks here</p>
            <p className="text-sm">New tasks will appear when assigned by your official</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(t => (
              <TaskCard key={t.id} task={t} onOpen={setDrawerTask} />
            ))}
          </div>
        )}
      </div>

      {drawerTask && (
        <TaskUpdateDrawer
          task={drawerTask}
          onClose={() => setDrawerTask(null)}
          onSuccess={() => loadTasks(activeFilter)}
        />
      )}
    </AppLayout>
  );
}
