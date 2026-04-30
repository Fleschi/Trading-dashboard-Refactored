import NavIcon from "./NavIcon";
import { SETTINGS_MODULE, SIDEBAR_WIDTH, ICON_ONLY_WIDTH } from "../constants.jsx";

export default function Sidebar({
  open, onToggle,
  modules, tab, isForward,
  mode, onSwitchMode, onSetTab,
  design: D,
  tradeCount, modeColor,
}) {
  const sidebarW = open ? SIDEBAR_WIDTH : ICON_ONLY_WIDTH;

  return (
    <div style={{
      width: sidebarW, minWidth: sidebarW, flexShrink: 0,
      transition: "width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
      background: D.sidebar || "#0d0d14",
      borderRight: `1px solid ${D.border}`,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0, zIndex: 10,
    }}>
      {/* Inner wrapper keeps content at full width so labels don't wrap during animation */}
      <div style={{ width: SIDEBAR_WIDTH, display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Logo */}
        <div style={{ padding: "18px 18px 14px", borderBottom: `1px solid ${D.border}`, flexShrink: 0, display: "flex", alignItems: "center" }}>
          <div className={`nav-label${open ? "" : " hidden"}`}>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.text }}>Trading</div>
            <div style={{ fontSize: 10, color: D.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Dashboard</div>
          </div>
        </div>

        {/* Settings link */}
        <div style={{ padding: "8px 8px 0" }}>
          <button
            className={`nav-item${tab === "settings" ? " active-settings" : ""}`}
            onClick={() => onSetTab("settings")}
          >
            <NavIcon path={SETTINGS_MODULE.icon} />
            <span className={`nav-label${open ? "" : " hidden"}`}>{SETTINGS_MODULE.label}</span>
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{ padding: open ? "8px 10px 10px" : "8px 8px 10px", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          {open ? (
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 3, gap: 2, border: `1px solid ${D.border}` }}>
              {[["backtesting", "Back"], ["forward", "Live"]].map(([m, label]) => (
                <button key={m} onClick={() => onSwitchMode(m)} style={modeButtonStyle(mode, m)}>
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {[["backtesting", "B"], ["forward", "L"]].map(([m, label]) => (
                <button key={m} onClick={() => onSwitchMode(m)} style={modeButtonCollapsedStyle(mode, m)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Module nav */}
        <nav style={{ flex: 1, paddingTop: 8, overflowY: "auto", overflowX: "hidden" }}>
          {modules.map(m => {
            const isActive = tab === m.id;
            const cls = isActive
              ? `nav-item ${isForward ? "active-fwd" : "active-back"}`
              : "nav-item";
            return (
              <button key={m.id} className={cls} onClick={() => onSetTab(m.id)}>
                <NavIcon path={m.icon} />
                <span className={`nav-label${open ? "" : " hidden"}`}>{m.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer: trade count + refresh */}
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${D.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: modeColor, flexShrink: 0 }} />
          <span className={`nav-label${open ? "" : " hidden"}`} style={{ fontSize: 11, color: D.textMuted }}>
            {tradeCount} trades
          </span>

        </div>

      </div>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function modeButtonStyle(currentMode, m) {
  const active = currentMode === m;
  return {
    flex: 1, padding: "6px 0", borderRadius: 8, border: "none",
    cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.15s",
    background: active
      ? m === "backtesting" ? "linear-gradient(135deg, #818cf8, #6366f1)" : "linear-gradient(135deg, #10e8a0, #059669)"
      : "transparent",
    color: active ? "#fff" : "#52525b",
  };
}

function modeButtonCollapsedStyle(currentMode, m) {
  const active = currentMode === m;
  return {
    width: "100%", padding: "5px 0", borderRadius: 8, border: "none",
    cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.15s",
    background: active
      ? m === "backtesting" ? "linear-gradient(135deg, #818cf8, #6366f1)" : "linear-gradient(135deg, #10e8a0, #059669)"
      : "rgba(255,255,255,0.04)",
    color: active ? "#fff" : "#52525b",
  };
}
