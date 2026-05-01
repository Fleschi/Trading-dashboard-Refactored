import { useState } from "react";
import { saveTrade, saveForwardTrade, deleteTrade, updateTrade } from "../utils/supabase";
import { C } from "../utils/ui";

const convertDate = (raw) => {
  if (!raw) return raw;
  const [datePart, timePart = "00:00"] = raw.split(" ");
  const [dd, mm, yy] = datePart.split("/");
  if (!dd || !mm || !yy) return raw;
  return `20${yy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}T${timePart}`;
};
const isoToDisplay = (iso) => {
  if (!iso) return "";
  const [datePart, timePart = ""] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}${timePart ? " " + timePart.slice(0,5) : ""}`;
};
const formatDateInput = (value) => {
  let raw = value.replace(/[^\d]/g,""), out = "";
  if (raw.length > 0) out = raw.slice(0,2);
  if (raw.length > 2) out += "/" + raw.slice(2,4);
  if (raw.length > 4) out += "/" + raw.slice(4,6);
  if (raw.length > 6) out += " " + raw.slice(6,8);
  if (raw.length > 8) out += ":" + raw.slice(8,10);
  return out;
};
const EMPTY_TRADE = () => ({ date: "", rr: "", pnl: "" });

export default function DataEntry({ trades, onTradesChange, design, mode = "backtesting" }) {
  const D = design || C;
  const [form, setForm]       = useState(EMPTY_TRADE());
  const [saving, setSaving]   = useState(false);
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected]           = useState(new Set());
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [showFilter, setShowFilter]       = useState(false);
  const [editId, setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({});

  const inp = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const submit = async () => {
    if (form.pnl === "") return;
    setSaving(true);
    try {
      const pnl = parseFloat(form.pnl) || 0;
      const rr  = parseFloat(form.rr)  || 0;
      const isoDate = convertDate(form.date);
      let saved;
      if (mode === "forward") {
        saved = await saveForwardTrade({ date: isoDate, time_entered: "", pnl, rr, risk: 250, direction: "", continuation: "", sl_management: "", tp_management: "", location: "", notes: "", learnings: "", fees: 0, screenshot_url: null });
      } else {
        saved = await saveTrade({ ...form, date: isoDate, pnl, rr, mode });
      }
      onTradesChange(prev => [...prev, { ...form, date: isoDate, pnl, rr, id: saved.id }].sort((a,b) => new Date(a.date) - new Date(b.date)));
      setForm(EMPTY_TRADE());
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
  const startEdit = (t) => { setEditId(t.id); setEditForm({ date: isoToDisplay(t.date), rr: t.rr || "", pnl: t.pnl || "" }); };
  const saveEdit = async () => {
    try {
      const updated = { ...editForm, date: convertDate(editForm.date), pnl: parseFloat(editForm.pnl) || 0, rr: parseFloat(editForm.rr) || 0 };
      await updateTrade(editId, updated);
      onTradesChange(prev => prev.map(t => t.id === editId ? { ...t, ...updated } : t));
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

  const inputStyle = { padding: "8px 12px", background: D.bg, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, fontFamily: "monospace", width: "100%" };
  const labelStyle = { fontSize: 11, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 };
  const outcomeColor = pnl => pnl > 0 ? D.green : pnl < 0 ? D.red : D.yellow;
  const outcomeLabel = pnl => pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE";

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
          <button onClick={exportCSV} disabled={!trades.length} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 8, color: D.textMuted, cursor: "pointer", fontSize: 13 }}>
            Export CSV
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div><label style={labelStyle}>Date & Time</label><input type="text" value={form.date} onChange={e => inp("date", formatDateInput(e.target.value))} maxLength={14} style={{ ...inputStyle, fontFamily: "monospace" }} /></div>
          <div><label style={labelStyle}>Risk-Reward</label><input type="number" step="0.1" value={form.rr} onChange={e => inp("rr", e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>PnL</label>
            <input type="number" value={form.pnl} onChange={e => inp("pnl", e.target.value)}
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

      {/* Trade list — card style */}
      {trades.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden" }}>

          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 64px 96px 80px", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${D.border}`, background: D.bg }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer", accentColor: D.text }} />
            {[["date","Date"],["rr","RR"],["pnl","PnL"]].map(([col, lbl]) => (
              <div key={col} onClick={() => toggleSort(col)} style={{ fontSize: 10, fontWeight: 600, color: sortCol === col ? D.text : D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer", userSelect: "none" }}>
                {lbl} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </div>
            ))}
            <div style={{ fontSize: 10, fontWeight: 600, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Outcome</div>
            <div />
          </div>

          {/* Trade rows */}
          {sorted.map((t, i) => {
            const isEditing = editId === t.id;
            const color = outcomeColor(t.pnl);
            const isSelected = selected.has(t.id);

            if (isEditing) return (
              <div key={t.id || i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 64px 96px 80px", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${D.border}`, background: `${D.border}20`, gap: 8 }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id)} style={{ cursor: "pointer", accentColor: D.text }} />
                <input type="text" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: formatDateInput(e.target.value) }))} maxLength={14} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, fontFamily: "monospace" }} />
                <input type="number" step="0.1" value={editForm.rr} onChange={e => setEditForm(f => ({ ...f, rr: e.target.value }))} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12 }} />
                <input type="number" value={editForm.pnl} onChange={e => setEditForm(f => ({ ...f, pnl: e.target.value }))} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: outcomeColor(parseFloat(editForm.pnl)) }}>{outcomeLabel(parseFloat(editForm.pnl))}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={saveEdit} style={{ padding: "3px 8px", background: D.text, color: D.bg, border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Save</button>
                  <button onClick={() => setEditId(null)} style={{ padding: "3px 8px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 5, cursor: "pointer", fontSize: 11, color: D.textMuted }}>✕</button>
                </div>
              </div>
            );

            return (
              <div key={t.id || i}
                style={{
                  display: "grid", gridTemplateColumns: "32px 1fr 80px 64px 96px 80px",
                  alignItems: "center", padding: "0 16px",
                  borderBottom: i < sorted.length - 1 ? `1px solid ${D.border}` : "none",
                  background: isSelected ? `${D.border}30` : "transparent",
                  borderLeft: `3px solid ${color}`,
                  transition: "background 0.1s",
                }}
              >
                <div style={{ padding: "12px 0" }} onClick={() => toggleSelect(t.id)}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id)} style={{ cursor: "pointer", accentColor: D.text }} />
                </div>

                {/* Date */}
                <div style={{ padding: "12px 0", fontFamily: "monospace", fontSize: 12, color: D.textMuted, whiteSpace: "nowrap" }}>
                  {t.date ? new Date(t.date).toLocaleString("de-DE", { day:"2-digit", month:"2-digit", year:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—"}
                </div>

                {/* RR */}
                <div style={{ padding: "12px 0", fontFamily: "monospace", fontSize: 13, color: D.textMuted }}>
                  {t.rr > 0 ? `${t.rr.toFixed(1)}R` : "—"}
                </div>

                {/* PnL */}
                <div style={{ padding: "12px 0", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color }}>
                  {t.pnl >= 0 ? `+$${t.pnl.toLocaleString()}` : `-$${Math.abs(t.pnl).toLocaleString()}`}
                </div>

                {/* Outcome pill */}
                <div style={{ padding: "12px 0" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", background: `${color}15`, color, border: `1px solid ${color}30` }}>
                    {outcomeLabel(t.pnl)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ padding: "12px 0", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => startEdit(t)} style={{ background: "transparent", border: "none", color: D.textMuted, cursor: "pointer", fontSize: 11, padding: "2px 6px", borderRadius: 4, transition: "color 0.15s" }}>Edit</button>
                  <button onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", color: D.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}