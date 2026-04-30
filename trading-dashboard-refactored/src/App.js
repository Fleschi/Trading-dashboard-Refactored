import { useState } from "react";
import { useTradeData, useIsMobile, useDesign, useNavigation } from "./hooks";
import { BACK_MODULES, FWD_MODULES, SETTINGS_MODULE, BOTTOM_NAV_H } from "./constants.jsx";

import { GlobalStyles } from "./components/GlobalStyles";
import NavIcon          from "./components/NavIcon";
import ModuleContent    from "./components/ModuleContent";
import Settings         from "./modules/Settings";
import PageBackground   from "./components/PageBackground";

const FONT = "'DM Sans', system-ui, sans-serif";

export default function App() {
  const { backTrades, setBackTrades, fwdTrades, setFwdTrades, backStats, loading, error } = useTradeData();
  const [design, setDesign] = useDesign();
  const [navHovered, setNavHovered] = useState(false);
  const isMobile = useIsMobile();
  const { mode, isForward, tab, setTab, switchMode, globalTab } = useNavigation();

  const D         = design;
  const modules   = isForward ? FWD_MODULES : BACK_MODULES;
  const modeColor = isForward ? D.green : D.blue;
  const tradeCount = isForward ? fwdTrades.length : backTrades.length;

  const goToData = () => setTab(isForward ? "fwd-data" : "data");

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: D.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: D.red, fontSize: 14 }}>Error: {error}</div>
      </div>
    );
  }

  const content = loading ? (
    <div style={{ textAlign: "center", padding: 80, color: D.textMuted, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>
      Loading...
    </div>
  ) : (
    <>
      {globalTab === "settings" && <Settings design={D} onChange={setDesign} />}
      {globalTab !== "settings" && (
        <ModuleContent
          tab={tab} globalTab={globalTab} isForward={isForward}
          backTrades={backTrades} setBackTrades={setBackTrades}
          fwdTrades={fwdTrades} setFwdTrades={setFwdTrades}
          backStats={backStats} design={D}
          onGoToData={goToData}
        />
      )}
    </>
  );

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    const mobileTabs = [SETTINGS_MODULE, ...modules];
    return (
      <div style={{ minHeight: "100vh", color: D.text, fontFamily: FONT, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <GlobalStyles design={D} />
        <PageBackground design={D} />

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${D.border}`, background: `${D.sidebar}ee`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: D.text }}>
            {globalTab === "settings" ? "Settings" : (modules.find(m => m.id === tab)?.label || "")}
          </div>
          <ModeToggle mode={mode} onSwitch={switchMode} D={D} />
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 16, paddingBottom: BOTTOM_NAV_H + 16 }}>
          {content}
        </div>

        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: BOTTOM_NAV_H, background: `${D.sidebar}f5`, backdropFilter: "blur(16px)", borderTop: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 20 }}>
          {mobileTabs.map(m => {
            const isActive = globalTab === "settings" ? m.id === "settings" : tab === m.id;
            return (
              <button key={m.id} onClick={() => setTab(m.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", background: "none", border: "none", cursor: "pointer", color: isActive ? modeColor : D.textMuted }}>
                <NavIcon path={m.icon} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, letterSpacing: "0.04em" }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────
  const allTabs = [...modules, SETTINGS_MODULE];

  return (
    <div style={{ minHeight: "100vh", color: D.text, fontFamily: FONT, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <GlobalStyles design={D} />
      <PageBackground design={D} />

      {/* Top nav bar */}
      <div
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => setNavHovered(false)}
        style={{
          position: "sticky", top: 0, zIndex: 20,
          display: "flex", alignItems: "center", gap: 4,
          padding: navHovered ? "10px 24px" : "6px 24px",
          transition: "padding 0.2s ease, background 0.2s ease",
          background: navHovered ? `${D.sidebar}f0` : `${D.sidebar}80`,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${navHovered ? D.border : "transparent"}`,
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: 12, fontWeight: 700, color: D.textMuted, marginRight: 12, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Trading
        </div>

        {/* Mode toggle */}
        <ModeToggle mode={mode} onSwitch={switchMode} D={D} />

        <div style={{ width: 1, height: 20, background: D.border, margin: "0 8px" }} />

        {/* Module tabs */}
        {allTabs.map(m => {
          const isActive = m.id === "settings" ? globalTab === "settings" : (globalTab !== "settings" && tab === m.id);
          return (
            <button
              key={m.id}
              onClick={() => setTab(m.id)}
              style={{
                display: "flex", alignItems: "center", gap: navHovered ? 7 : 0,
                padding: navHovered ? "6px 12px" : "6px 10px",
                background: isActive ? `${D.blue}15` : "transparent",
                border: `1px solid ${isActive ? D.blue + "40" : "transparent"}`,
                borderRadius: 8, cursor: "pointer",
                color: isActive ? D.blue : D.textMuted,
                fontSize: 12, fontWeight: isActive ? 600 : 400,
                transition: "all 0.2s ease",
                overflow: "hidden", whiteSpace: "nowrap",
              }}
            >
              <NavIcon path={m.icon} />
              <span style={{
                maxWidth: navHovered ? 80 : 0,
                opacity: navHovered ? 1 : 0,
                overflow: "hidden",
                transition: "max-width 0.2s ease, opacity 0.15s ease",
              }}>
                {m.label}
              </span>
            </button>
          );
        })}

        {/* Trade count */}
        <div style={{ marginLeft: "auto", fontSize: 11, color: D.textMuted }}>
          {tradeCount} trades
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", position: "relative", zIndex: 1 }}>
        <div style={{ padding: 28 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────

function ModeToggle({ mode, onSwitch, D }) {
  return (
    <div style={{ display: "flex", background: `${D.border}50`, borderRadius: 8, padding: 2, gap: 2, border: `1px solid ${D.border}` }}>
      {[["backtesting", "Back"], ["forward", "Live"]].map(([m, label]) => (
        <button key={m} onClick={() => onSwitch(m)} style={{
          padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 600,
          background: mode === m ? D.blue : "transparent",
          color: mode === m ? "#fff" : D.textMuted,
          transition: "all 0.15s",
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}