import { useEffect } from "react";
import { BACKGROUNDS } from "../constants.jsx";
const STORAGE_KEY = "trading_dashboard_design";

export const DEFAULT_DESIGN = {
  bg: "#0a0a0f", card: "#111118", border: "#1e1e2a", sidebar: "#0d0d14",
  green: "#10e8a0", red: "#ff4d6d", blue: "#818cf8",
  purple: "#a78bfa", yellow: "#fbbf24",
  text: "#f1f1f3", textMuted: "#52525b",
};

export function loadDesign() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DESIGN;
    return { ...DEFAULT_DESIGN, ...JSON.parse(raw) };
  } catch { return DEFAULT_DESIGN; }
}

function saveDesign(design) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)); } catch {}
}

export default function Settings({ design, onChange }) {
  const D = design;

  useEffect(() => { saveDesign(design); }, [design]);

  const inp = { padding: "7px 12px", background: D.bg, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, fontSize: 13, fontFamily: "monospace", width: "100%", outline: "none" };
  const lbl = { fontSize: 11, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5, fontWeight: 600 };

  const applyPreset = (p) => {
    onChange({ ...D, bg: p.bg, card: p.card, border: p.border, sidebar: p.sidebar, blue: p.accent, purple: p.accent });
  };

  const reset = () => { onChange(DEFAULT_DESIGN); saveDesign(DEFAULT_DESIGN); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>

      {/* Presets */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: D.text }}>Theme Presets</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)}
              style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${D.bg === p.bg ? p.accent : D.border}`, background: p.bg, cursor: "pointer", transition: "all 0.15s", boxShadow: D.bg === p.bg ? `0 0 12px ${p.accent}40` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.accent }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: D.bg === p.bg ? p.accent : "#9ca3af" }}>{p.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: D.text }}>Custom Colors</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            ["Background", "bg"],
            ["Card",       "card"],
            ["Border",     "border"],
            ["Sidebar",    "sidebar"],
            ["Accent",     "blue"],
            ["Text",       "text"],       // 1.12: text color
            ["Text Muted", "textMuted"],  // 1.12: muted text color
          ].map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={D[key] || "#000000"}
                  onChange={e => onChange({ ...D, [key]: e.target.value, ...(key === "blue" ? { purple: e.target.value } : {}) })}
                  style={{ width: 36, height: 36, border: "none", borderRadius: 8, cursor: "pointer", background: "none", padding: 0 }} />
                <input type="text" value={D[key] || ""}
                  onChange={e => onChange({ ...D, [key]: e.target.value, ...(key === "blue" ? { purple: e.target.value } : {}) })}
                  style={inp} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Win/Loss colors */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: D.text }}>Win / Loss Colors</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[["Win", "green"], ["Loss", "red"], ["Break-even", "yellow"]].map(([label, key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={D[key] || "#000000"}
                  onChange={e => onChange({ ...D, [key]: e.target.value })}
                  style={{ width: 36, height: 36, border: "none", borderRadius: 8, cursor: "pointer", background: "none", padding: 0 }} />
                <input type="text" value={D[key] || ""}
                  onChange={e => onChange({ ...D, [key]: e.target.value })}
                  style={inp} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Background Pattern */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: D.text }}>Background Pattern</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {BACKGROUNDS.map(b => {
            const isActive = (D.background || "none") === b.id;
            return (
              <button key={b.id} onClick={() => onChange({ ...D, background: b.id })}
                style={{
                  width: 80, height: 56, borderRadius: 10, cursor: "pointer", overflow: "hidden",
                  border: `2px solid ${isActive ? D.blue : D.border}`,
                  padding: 0, position: "relative",
                  boxShadow: isActive ? `0 0 12px ${D.blue}40` : "none",
                  transition: "all 0.15s",
                }}>
                <div style={{ position: "absolute", inset: 0, ...b.preview(D.bg) }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#fff", letterSpacing: "0.04em" }}>{b.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={reset}
        style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 10, color: D.textMuted, cursor: "pointer", fontSize: 13, alignSelf: "flex-start" }}>
        Reset to default
      </button>
    </div>
  );
}