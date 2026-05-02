import { useState } from "react";
import { saveTrade, saveForwardTrade, deleteTrade, updateTrade } from "../utils/supabase";
import { C } from "../utils/ui";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const SEGMENTS = [
  { key: "dd", len: 2, placeholder: "DD" },
  { key: "mm", len: 2, placeholder: "MM" },
  { key: "yy", len: 2, placeholder: "YY" },
  { key: "hh", len: 2, placeholder: "HH" },
  { key: "mn", len: 2, placeholder: "MM" },
];

const convertDate = ({ dd, mm, yy, hh, mn }) => {
  if (!dd || !mm || !yy) return null;
  return `20${yy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}T${hh||"00"}:${mn||"00"}`;
};

const isoToParts = (iso) => {
  if (!iso) return { dd:"", mm:"", yy:"", hh:"", mn:"" };
  const [datePart="", timePart=""] = iso.split("T");
  const [y="",m="",d=""] = datePart.split("-");
  const [hh="",mn2=""] = timePart.split(":");
  return { dd: d.slice(0,2), mm: m.slice(0,2), yy: y.slice(2,4), hh: hh.slice(0,2), mn: mn2.slice(0,2) };
};

const EMPTY_PARTS = () => ({ dd:"", mm:"", yy:"", hh:"", mn:"" });

// ─── SmartDateInput ───────────────────────────────────────────────────────────
// Single visual input, but internally treats each segment (DD/MM/YY/HH/MM)
// independently so backspace only erases within the current segment.

function SmartDateInput({ parts, onChange, inputStyle }) {
  const display =
    (parts.dd||"__") + "/" +
    (parts.mm||"__") + "/" +
    (parts.yy||"__") + " " +
    (parts.hh||"__") + ":" +
    (parts.mn||"__");


  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      // Find last non-empty segment and remove its last char
      const newParts = { ...parts };
      for (let i = SEGMENTS.length - 1; i >= 0; i--) {
        const { key } = SEGMENTS[i];
        if (newParts[key] && newParts[key].length > 0) {
          newParts[key] = newParts[key].slice(0, -1);
          onChange(newParts);
          return;
        }
      }
    }
  };

  const handleInput = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    // Re-distribute digits across segments
    const newParts = { dd:"", mm:"", yy:"", hh:"", mn:"" };
    let pos = 0;
    for (const { key, len } of SEGMENTS) {
      newParts[key] = digits.slice(pos, pos + len);
      pos += len;
      if (pos >= digits.length) break;
    }
    onChange(newParts);
  };

  return (
    <input
      type="text"
      value={display}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.05em" }}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DataEntry({ trades, onTradesChange, design, mode = "backtesting" }) {
  const D = design || C;
  const [form, setForm]       = useState({ ...EMPTY_PARTS(), rr:"", pnl:"" });
  const [saving, setSaving]   = useState(false);
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected]           = useState(new Set());
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [showFilter, setShowFilter]       = useState(false);
  const [editId, setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_PARTS(), rr:"", pnl:"" });

  const inputStyle = { padding: "8px 12px", background: D.bg, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, width: "100%", outline: "none" };
  const labelStyle = { fontSize: 11, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 };
  const outcomeColor = pnl => pnl > 0 ? D.green : pnl < 0 ? D.red : D.yellow;
  const outcomeLabel = pnl => pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE";

  const submit = async () => {
    if (form.pnl === "") return;
    const isoDate = convertDate(form);
    if (!isoDate) return;
    setSaving(true);
    try {
      const pnl = parseFloat(form.pnl) || 0;
      const rr  = parseFloat(form.rr)  || 0;
      let saved;
      if (mode === "forward") {
        saved = await saveForwardTrade({ date: isoDate, time_entered: "", pnl, rr, risk: 250, direction: "", continuation: "", sl_management: "", tp_management: "", location: "", notes: "", learnings: "", fees: 0, screenshot_url: null });
      } else {
        saved = await saveTrade({ date: isoDate, pnl, rr, mode });
      }
      onTradesChange(prev => [...prev, { date: isoDate, pnl, rr, id: saved.id }].sort((a,b) => new Date(a.date) - new Date(b.date)));
      setForm({ ...EMPTY_PARTS(), rr:"", pnl:"" });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const remove = async (id) => {
    try { await deleteTrade(id); onTradesChange(prev => prev.filter(t => t.id !== id)); setSelected(prev => { const n = new Set(prev); n.delete(id); return n; }); } catch (e) { console.error(e); }
  };
  const deleteSelected = async () => {
    if (!selected.size) return;
    try { await Promise.all([...selected].map(id => deleteTrade(id))); onTradesChange(prev => prev.filter(t => !selected.has(t.id))); setSelected(new Set()); } catch (e) { console.error(e); }
  };
  const startEdit = (t) => { setEditId(t.id); setEditForm({ ...isoToParts(t.date), rr: t.rr||"", pnl: t.pnl||"" }); };
  const saveEdit = async () => {
    try {
      const isoDate = convertDate(editForm);
      const pnl = parseFloat(editForm.pnl) || 0;
      const rr  = parseFloat(editForm.rr)  || 0;
      await updateTrade(editId, { date: isoDate, pnl, rr });
      onTradesChange(prev => prev.map(t => t.id === editId ? { ...t, date: isoDate, pnl, rr } : t));
      setEditId(null);
    } catch (e) { console.error(e); }
  };
  const exportCSV = () => {
    const csv = [["Date","Outcome","RR","PnL"], ...trades.map(t => [t.date, t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : "be", t.rr, t.pnl])].map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "trades.csv"; a.click();
  };

  const filtered = trades.filter(t => { const o = t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : "be"; return filterOutcome === "all" || o === filterOutcome; });
  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (sortCol === "date") { av = new Date(av); bv = new Date(bv); }
    if (sortCol === "pnl" || sortCol === "rr") { av = parseFloat(av); bv = parseFloat(bv); }
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const toggleSort = col => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("desc"); } };
  const toggleSelect = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allVisibleIds = sorted.map(t => t.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.delete(id)); return n; });
    else setSelected(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.add(id)); return n; });
  };

  // checkbox | date | RR | PnL | Outcome | actions
  const COLS = "32px 2fr 1fr 1fr 1fr 72px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Entry Form */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>
            New Trade
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: `${D.border}40`, color: D.textMuted, marginLeft: 8 }}>
              {mode === "backtesting" ? "Backtesting" : "Forward Testing"}
            </span>
          </div>
          <button onClick={exportCSV} disabled={!trades.length} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 8, color: D.textMuted, cursor: "pointer", fontSize: 13 }}>Export CSV</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Date & Time (DD/MM/YY HH:MM)</label>
            <SmartDateInput parts={form} onChange={p => setForm(f => ({...f, ...p}))} inputStyle={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Risk-Reward</label>
            <input type="number" step="0.1" value={form.rr} onChange={e => setForm(f => ({...f, rr: e.target.value}))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>PnL</label>
            <input type="number" value={form.pnl} onChange={e => setForm(f => ({...f, pnl: e.target.value}))}
              style={{ ...inputStyle, borderColor: form.pnl !== "" ? outcomeColor(parseFloat(form.pnl)) : D.border }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={submit} disabled={saving || form.pnl === ""} style={{ padding: "10px 28px", background: D.text, color: D.bg, borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (saving || form.pnl === "") ? 0.4 : 1 }}>
            {saving ? "Saving..." : "Add Trade"}
          </button>
          <span style={{ fontSize: 12, color: D.textMuted, marginLeft: "auto" }}>{trades.length} trades</span>
        </div>
      </div>

      {/* Filter bar */}
      {trades.length > 0 && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div onClick={() => setShowFilter(s => !s)} style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <span style={{ fontSize: 12, color: D.textMuted, fontWeight: 500 }}>
              Filter{filterOutcome !== "all" ? ` · ${filterOutcome.toUpperCase()}` : ""} · {filtered.length}/{trades.length}
              {selected.size > 0 && <span style={{ color: D.red, marginLeft: 8 }}>{selected.size} selected</span>}
            </span>
            <span style={{ color: D.textMuted, fontSize: 12 }}>{showFilter ? "▲" : "▼"}</span>
          </div>
          {showFilter && (
            <div style={{ padding: "12px 20px 14px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderTop: `1px solid ${D.border}` }}>
              {["all","win","loss","be"].map(o => {
                const c = o === "win" ? D.green : o === "loss" ? D.red : o === "be" ? D.yellow : D.blue;
                return (
                  <button key={o} onClick={() => setFilterOutcome(o)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${filterOutcome === o ? c : D.border}`, background: filterOutcome === o ? `${c}20` : "transparent", color: filterOutcome === o ? c : D.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                    {o}
                  </button>
                );
              })}
              {selected.size > 0 && (
                <button onClick={deleteSelected} style={{ marginLeft: "auto", padding: "6px 16px", background: `${D.red}18`, border: `1px solid ${D.red}40`, borderRadius: 6, color: D.red, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Delete {selected.size}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trade list */}
      {trades.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${D.border}`, background: D.bg }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer", accentColor: D.text }} />
            {[["date","Date"],["rr","RR"],["pnl","PnL"],["outcome","Outcome"]].map(([col, lbl]) => (
              <div key={col} onClick={() => col !== "outcome" && toggleSort(col)}
                style={{ fontSize: 10, fontWeight: 600, color: sortCol === col ? D.text : D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", cursor: col !== "outcome" ? "pointer" : "default", userSelect: "none" }}>
                {lbl} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </div>
            ))}
            <div />
          </div>

          {/* Rows */}
          {sorted.map((t, i) => {
            const isEditing = editId === t.id;
            const color = outcomeColor(t.pnl);
            const isSelected = selected.has(t.id);

            if (isEditing) return (
              <div key={t.id || i} style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${D.border}`, background: `${D.border}20`, gap: 8 }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id)} style={{ cursor: "pointer", accentColor: D.text }} />
                <SmartDateInput parts={editForm} onChange={p => setEditForm(f => ({...f, ...p}))} inputStyle={{ ...inputStyle, padding: "4px 8px", fontSize: 12 }} />
                <input type="number" step="0.1" value={editForm.rr} onChange={e => setEditForm(f => ({...f, rr: e.target.value}))} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12 }} />
                <input type="number" value={editForm.pnl} onChange={e => setEditForm(f => ({...f, pnl: e.target.value}))} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: outcomeColor(parseFloat(editForm.pnl)) }}>{outcomeLabel(parseFloat(editForm.pnl))}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={saveEdit} style={{ padding: "3px 8px", background: D.text, color: D.bg, border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Save</button>
                  <button onClick={() => setEditId(null)} style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 5, cursor: "pointer", fontSize: 11, color: D.textMuted }}>✕</button>
                </div>
              </div>
            );

            return (
              <div key={t.id || i} style={{
                display: "grid", gridTemplateColumns: COLS,
                alignItems: "center", padding: "0 16px",
                borderBottom: i < sorted.length - 1 ? `1px solid ${D.border}` : "none",
                background: isSelected ? `${D.border}30` : "transparent",
                transition: "background 0.1s",
              }}>
                <div style={{ padding: "13px 0" }} onClick={() => toggleSelect(t.id)}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id)} style={{ cursor: "pointer", accentColor: D.text }} />
                </div>
                <div style={{ padding: "13px 0", fontFamily: "monospace", fontSize: 12, color: D.textMuted, whiteSpace: "nowrap" }}>
                  {t.date ? new Date(t.date).toLocaleString("de-DE", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—"}
                </div>
                <div style={{ padding: "13px 0", fontFamily: "monospace", fontSize: 13, color: D.textMuted }}>
                  {t.rr > 0 ? `${parseFloat(t.rr).toFixed(1)}R` : "—"}
                </div>
                <div style={{ padding: "13px 0", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color }}>
                  {t.pnl >= 0 ? `+$${t.pnl.toLocaleString()}` : `-$${Math.abs(t.pnl).toLocaleString()}`}
                </div>
                <div style={{ padding: "13px 0" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", background: `${color}15`, color, border: `1px solid ${color}30` }}>
                    {outcomeLabel(t.pnl)}
                  </span>
                </div>
                <div style={{ padding: "13px 0", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => startEdit(t)} style={{ background: "transparent", border: "none", color: D.textMuted, cursor: "pointer", fontSize: 11, padding: "2px 4px" }}>Edit</button>
                  <button onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", color: D.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 2px" }}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}