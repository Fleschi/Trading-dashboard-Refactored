import { useState } from "react";
import { saveTrade, saveForwardTrade, deleteTrade, updateTrade } from "../utils/supabase";
import { C } from "../utils/ui";

const convertDate = (raw) => {
  if (!raw) return raw;
  const [datePart, timePart = "00:00"] = raw.split(" ");
  const [dd, mm, yy] = datePart.split("/");
  if (!dd || !mm || !yy) return raw;
  return `20${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${timePart}`;
};

const isoToDisplay = (iso) => {
  if (!iso) return "";
  const [datePart, timePart = ""] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}${timePart ? " " + timePart.slice(0, 5) : ""}`;
};

const formatDateInput = (value) => {
  let raw = value.replace(/[^\d]/g, "");
  let out = "";
  if (raw.length > 0) out = raw.slice(0, 2);
  if (raw.length > 2) out += "/" + raw.slice(2, 4);
  if (raw.length > 4) out += "/" + raw.slice(4, 6);
  if (raw.length > 6) out += " " + raw.slice(6, 8);
  if (raw.length > 8) out += ":" + raw.slice(8, 10);
  return out;
};

const EMPTY_TRADE = () => ({ date: "", rr: "", pnl: "" });

export default function DataEntry({ trades, onTradesChange, design, mode = "backtesting" }) {
  const D = design || C;
  const [form, setForm]         = useState(EMPTY_TRADE());
  const [saving, setSaving]     = useState(false);
  const [sortCol, setSortCol]   = useState("date");
  const [sortDir, setSortDir]   = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [showFilter, setShowFilter]       = useState(false);
  const [editId, setEditId]     = useState(null);
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
        saved = await saveForwardTrade({
          date: isoDate, time_entered: "", pnl, rr, risk: 250,
          direction: "", continuation: "", sl_management: "", tp_management: "",
          location: "", notes: "", learnings: "", fees: 0, screenshot_url: null,
        });
      } else {
        saved = await saveTrade({ ...form, date: isoDate, pnl, rr, mode });
      }
      onTradesChange(prev =>
        [...prev, { ...form, date: isoDate, pnl, rr, id: saved.id }]
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
      setForm(EMPTY_TRADE());
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const remove = async (id) => {
    try {
      await deleteTrade(id);
      onTradesChange(prev => prev.filter(t => t.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e) { console.error(e); }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    try {
      await Promise.all([...selected].map(id => deleteTrade(id)));
      onTradesChange(prev => prev.filter(t => !selected.has(t.id)));
      setSelected(new Set());
    } catch (e) { console.error(e); }
  };

  const startEdit = (t) => {
    setEditId(t.id);
    setEditForm({ date: isoToDisplay(t.date), rr: t.rr || "", pnl: t.pnl || "" });
  };

  const saveEdit = async () => {
    try {
      const updated = { ...editForm, date: convertDate(editForm.date), pnl: parseFloat(editForm.pnl) || 0, rr: parseFloat(editForm.rr) || 0 };
      await updateTrade(editId, updated);
      onTradesChange(prev => prev.map(t => t.id === editId ? { ...t, ...updated } : t));
      setEditId(null);
    } catch (e) { console.error(e); }
  };

  const exportCSV = () => {
    const header = ["Date","Outcome","RR","PnL"];
    const rows = trades.map(t => [t.date, t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : "be", t.rr, t.pnl]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "trades.csv"; a.click();
  };

  const filtered = trades.filter(t => {
    const outcome = t.pnl > 0 ? "win" : t.pnl < 0 ? "loss" : "be";
    return filterOutcome === "all" || outcome === filterOutcome;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (sortCol === "date") { av = new Date(av); bv = new Date(bv); }
    if (sortCol === "pnl" || sortCol === "rr") { av = parseFloat(av); bv = parseFloat(bv); }
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("desc"); } };
  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allVisibleIds = sorted.map(t => t.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.delete(id)); return n; });
    else setSelected(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.add(id)); return n; });
  };

  const inputStyle = { padding: "8px 12px", background: D.bg, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, fontFamily: "monospace", width: "100%" };
  const labelStyle = { fontSize: 11, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 };
  const outcomeColor = (pnl) => pnl > 0 ? D.green : pnl < 0 ? D.red : D.yellow;
  const outcomeLabel = (pnl) => pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Entry Form */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>
            New Trade
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: `${D.border}40`, color: D.textMuted, marginLeft: 6 }}>
              {mode === "backtesting" ? "Backtesting" : "Forward Testing"}
            </span>
          </div>
          <button onClick={exportCSV} disabled={trades.length === 0}
            style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 8, color: D.textMuted, cursor: "pointer", fontSize: 13 }}>
            Export CSV
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Date & Time </label>
            <input type="text" value={form.date}
              onChange={e => inp("date", formatDateInput(e.target.value))}
              maxLength={14} style={{ ...inputStyle, fontFamily: "monospace" }} />
          </div>
          <div>
            <label style={labelStyle}>Risk-Reward </label>
            <input type="number" step="0.1" value={form.rr} onChange={e => inp("rr", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>PnL </label>
            <input type="number" value={form.pnl} onChange={e => inp("pnl", e.target.value)}
              style={{ ...inputStyle, borderColor: form.pnl !== "" ? (parseFloat(form.pnl) > 0 ? D.green : parseFloat(form.pnl) < 0 ? D.red : D.yellow) : D.border }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={submit} disabled={saving || form.pnl === ""}
            style={{ padding: "10px 28px", background: D.green, color: "#0a0e1a", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (saving || form.pnl === "") ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Add Trade"}
          </button>
          <span style={{ fontSize: 12, color: D.textMuted, marginLeft: "auto" }}>{trades.length} trades</span>
        </div>
      </div>

      {/* 1.11: Collapsible filter bar */}
      {trades.length > 0 && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div onClick={() => setShowFilter(s => !s)}
            style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
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
                  <button key={o} onClick={() => setFilterOutcome(o)}
                    style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${filterOutcome === o ? c : D.border}`, background: filterOutcome === o ? `${c}20` : "transparent", color: filterOutcome === o ? c : D.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                    {o}
                  </button>
                );
              })}
              {selected.size > 0 && (
                <button onClick={deleteSelected}
                  style={{ marginLeft: "auto", padding: "6px 16px", background: `${D.red}20`, border: `1px solid ${D.red}`, borderRadius: 6, color: D.red, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Delete {selected.size}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {trades.length > 0 && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                  <th style={{ padding: "12px 16px", width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer", accentColor: D.green }} />
                  </th>
                  {[["date","Date"],["outcome","Outcome"],["rr","RR"],["pnl","PnL"]].map(([col, lbl]) => (
                    <th key={col} onClick={() => toggleSort(col)}
                      style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: sortCol === col ? D.text : D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                      {lbl} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  ))}
                  <th style={{ padding: "12px 16px", width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => {
                  const isEditing = editId === t.id;
                  return (
                    <tr key={t.id || i} style={{ borderBottom: `1px solid ${D.border}`, background: selected.has(t.id) ? `${D.blue}15` : i % 2 === 0 ? "transparent" : `${D.border}20` }}>
                      <td style={{ padding: "10px 16px" }} onClick={() => !isEditing && toggleSelect(t.id)}>
                        <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} style={{ cursor: "pointer", accentColor: D.green }} />
                      </td>
                      {isEditing ? (
                        <>
                          <td style={{ padding: "6px 8px" }}>
                            <input type="text" value={editForm.date}
                              onChange={e => setEditForm(f => ({ ...f, date: formatDateInput(e.target.value) }))}
                              maxLength={14} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, width: 130, fontFamily: "monospace" }} />
                          </td>
                          <td style={{ padding: "6px 8px", color: outcomeColor(parseFloat(editForm.pnl)), fontSize: 12, fontWeight: 700 }}>{outcomeLabel(parseFloat(editForm.pnl))}</td>
                          <td style={{ padding: "6px 8px" }}><input type="number" step="0.1" value={editForm.rr} onChange={e => setEditForm(f => ({ ...f, rr: e.target.value }))} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, width: 70 }} /></td>
                          <td style={{ padding: "6px 8px" }}><input type="number" value={editForm.pnl} onChange={e => setEditForm(f => ({ ...f, pnl: e.target.value }))} style={{ ...inputStyle, padding: "4px 8px", fontSize: 12, width: 90 }} /></td>
                          <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                            <button onClick={saveEdit} style={{ padding: "4px 10px", background: D.green, color: "#0a0e1a", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, marginRight: 4 }}>Save</button>
                            <button onClick={() => setEditId(null)} style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 6, cursor: "pointer", fontSize: 12, color: D.textMuted }}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "10px 16px", color: D.textMuted, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {t.date ? new Date(t.date).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${outcomeColor(t.pnl)}22`, color: outcomeColor(t.pnl) }}>
                              {outcomeLabel(t.pnl)}
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px", fontFamily: "monospace", color: D.textMuted }}>{t.rr > 0 ? `${t.rr.toFixed(1)}R` : "—"}</td>
                          <td style={{ padding: "10px 16px", fontFamily: "monospace", fontWeight: 600, color: outcomeColor(t.pnl) }}>
                            {t.pnl >= 0 ? `+$${t.pnl.toLocaleString()}` : `-$${Math.abs(t.pnl).toLocaleString()}`}
                          </td>
                          <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <button onClick={() => startEdit(t)} style={{ background: "transparent", border: "none", color: D.blue, cursor: "pointer", fontSize: 13, marginRight: 8 }}>Edit</button>
                            <button onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", color: D.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}