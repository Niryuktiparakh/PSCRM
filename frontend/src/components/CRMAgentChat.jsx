// src/components/CRMAgentChat.jsx
// Floating AI chat widget — dark glassmorphism theme

import { useEffect, useRef, useState } from "react";
import { sendCRMChat } from "../api/adminApi";

const QUICK_PROMPTS = [
  { label: "🔴 Critical issues",       msg: "What are the most critical and emergency complaints right now?" },
  { label: "↩ Repeat complaints",      msg: "Show me all repeat complaints still open" },
  { label: "⏰ Stuck tasks",            msg: "Which tasks have been stuck or unstarted for more than 2 days?" },
  { label: "🏢 Multi-dept issues",     msg: "Are there any complaints requiring coordination between multiple departments?" },
  { label: "📋 Poor surveys",          msg: "Show me complaints with poor survey ratings this week" },
  { label: "🏗️ Contractor perf.",     msg: "How are the contractors performing?" },
  { label: "🚦 SLA breach risk",       msg: "Which complaints are at risk of breaching SLA (>30 days old)?" },
  { label: "📊 Weekly resolved",       msg: "How many complaints were resolved this week?" },
];

// ── Data table ─────────────────────────────────────────────────────

function DataTable({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  const keys = Object.keys(data[0]).filter(k =>
    !["id","city_id","infra_node_id","workflow_instance_id"].includes(k)
  );
  const format = (v, k) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "✓" : "✗";
    if (k.includes("score")) return (+v).toFixed(2);
    if (k.includes("_at") && v) return new Date(v).toLocaleDateString("en-IN");
    if (k === "status") return <span className="capitalize text-sky-400 font-semibold">{String(v).replace(/_/g," ")}</span>;
    if (k === "priority") {
      const c = { emergency:"#ef4444",critical:"#f87171",high:"#fb923c",normal:"#818cf8",low:"#64748b" };
      return <span className="capitalize font-semibold" style={{ color: c[v] || "#818cf8" }}>{v}</span>;
    }
    if (k === "is_blacklisted") return v ? <span className="text-red-400 font-bold">⚠ Blacklisted</span> : "Active";
    return String(v).length > 40 ? String(v).substring(0,40)+"…" : String(v);
  };
  return (
    <div className="mt-2 overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {keys.map(k => (
              <th key={k} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {k.replace(/_/g," ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              {keys.map(k => (
                <td key={k} className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                  {format(row[k], k)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "rgba(56,189,248,0.2)" }}>
          <span className="material-symbols-outlined text-sky-400 text-[14px]">smart_toy</span>
        </div>
      )}
      <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={isUser
            ? { background: "rgba(56,189,248,0.15)", color: "#0369a1", borderRadius: "16px 16px 4px 16px", border: "1px solid rgba(56,189,248,0.25)" }
            : { background: "rgba(255,255,255,0.9)", color: "#334155", borderRadius: "16px 16px 16px 4px", border: "1px solid rgba(0,0,0,0.08)" }}>
          {msg.content}
        </div>
        {msg.data && <DataTable data={msg.data} />}
        <span className="text-[10px] text-slate-600 px-1">{msg.time}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function CRMAgentChat() {
  const user = JSON.parse(localStorage.getItem("auth_user") || "{}");
  if (!["official","admin","super_admin"].includes(user.role)) return null;

  const [open,     setOpen]     = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Namaskar! I'm your PS-CRM assistant. Ask me anything — complaint status, worker performance, stuck tasks, SLA risks, or anything about ${user.jurisdiction_name || "your area"}.`,
    time: new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }),
  }]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setShowPrompts(false);
    const userMsg = { role: "user", content: msg, time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.slice(-8).map(m => ({ role: m.role==="assistant"?"assistant":"user", content: m.content }));
      const res = await sendCRMChat(msg, history);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.answer || "I couldn't process that request.",
        data: res.data,
        time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const clearChat = () => {
    setMessages([{ role:"assistant", content:"Chat cleared. How can I help you?", time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) }]);
    setShowPrompts(true);
  };

  const glassStyle = {
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  };

  const width  = expanded ? "w-[720px]" : "w-96";
  const height = expanded ? "h-[650px]" : "h-[520px]";

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)} title="PS-CRM Assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", boxShadow: "0 8px 32px rgba(56,189,248,0.3)" }}>
          <span className="material-symbols-outlined text-[26px]">smart_toy</span>
          {messages.length > 1 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
              style={{ border: "2px solid white" }}>
              {messages.filter(m => m.role==="assistant").length - 1}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-6 right-6 z-50 ${width} ${height} rounded-2xl shadow-2xl flex flex-col transition-all duration-200 overflow-hidden`}
          style={glassStyle}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ background: "linear-gradient(135deg,rgba(56,189,248,0.12),rgba(129,140,248,0.1))", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(56,189,248,0.2)" }}>
              <span className="material-symbols-outlined text-sky-400 text-[18px]">smart_toy</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-800">PS-CRM Assistant</p>
              <p className="text-[10px] text-sky-400/70">Gemini 2.5 Flash · {user.role}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setExpanded(e => !e)}
                className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors"
                title={expanded ? "Collapse" : "Expand"}>
                <span className="material-symbols-outlined text-slate-400 text-[16px]">
                  {expanded ? "close_fullscreen" : "open_in_full"}
                </span>
              </button>
              <button onClick={clearChat} title="Clear chat"
                className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">delete_sweep</span>
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
            style={{ background: "rgba(248,250,252,0.6)" }}>
            {messages.map((m, i) => <Message key={i} msg={m} />)}

            {/* Quick prompts */}
            {showPrompts && messages.length === 1 && (
              <div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 px-1">Quick actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => send(p.msg)}
                      className="text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.08)", color: "#64748b" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(56,189,248,0.3)"; e.currentTarget.style.color="#0284c7"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(0,0,0,0.08)"; e.currentTarget.style.color="#64748b"; }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(56,189,248,0.2)" }}>
                  <span className="material-symbols-outlined text-sky-400 text-[14px]">smart_toy</span>
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                  style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.08)" }}>
                  {[0,150,300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask about complaints, tasks, workers…"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm resize-none ginput"
                style={{ minHeight: 40, maxHeight: 96 }}
              />
              <button onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all gbtn-sky">
                <span className="material-symbols-outlined text-white text-[18px]">send</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
