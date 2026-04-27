import { useState } from "react";
import { useTradeData, useIsMobile, useDesign, useNavigation } from "./hooks";
import { BACK_MODULES, FWD_MODULES, SETTINGS_MODULE, BOTTOM_NAV_H } from "./constants";

import { GlobalStyles } from "./components/GlobalStyles";
import Sidebar          from "./components/Sidebar";
import NavIcon          from "./components/NavIcon";
import ModuleContent    from "./components/ModuleContent";
import Settings         from "./modules/Settings";

const FONT = "'DM Sans', system-ui, sans-serif";

export default function App() {
  const { backTrades, setBackTrades, fwdTrades, setFwdTrades, backStats, loading, error } = useTradeData();
  const [design, setDesign] = useDesign();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const { mode, isForward, tab, setTab, switchMode, globalTab } = useNavigation();

  const D          = design;
  const modules    = isForward ? FWD_MODULES : BACK_MODULES;
  const modeColor  = isForward ? D.green : D.purple;
  const tradeCount = isForward ? fwdTrades.length : backTrades.length;

  const goToData = () => setTab(isForward ? "fwd-data" : "data");

  const activeModule = globalTab === "settings"
    ? SETTINGS_MODULE
    : (modules.find(m => m.id === tab) || modules[0]);

  // ── Error screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: D.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: D.red, fontSize: 14 }}>Error: {error}</div>
      </div>
    );
  }

  // ── Shared content ────────────────────────────────────────────────────────
  const content = loading ? (
    <div style={{ textAlign: "center", padding: 80, color: D.purple, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
      <div style={{ minHeight: "100vh", background: D.bg, color: D.text, fontFamily: FONT, display: "flex", flexDirection: "column" }}>
        <GlobalStyles design={D} />

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${D.border}`, background: `${D.sidebar}ee`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: D.text }}>{activeModule?.label}</div>
          <ModeToggle mode={mode} onSwitch={switchMode} D={D} compact />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 16, paddingBottom: BOTTOM_NAV_H + 16 }}>
          {content}
        </div>

        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: BOTTOM_NAV_H, background: `${D.sidebar}f5`, backdropFilter: "blur(16px)", borderTop: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 20 }}>
          {mobileTabs.map(m => {
            const isActive = tab === m.id;
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
  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text, fontFamily: FONT, display: "flex" }}>
      <GlobalStyles design={D} />

      <Sidebar
        open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)}
        modules={modules} tab={tab} isForward={isForward}
        mode={mode} onSwitchMode={switchMode} onSetTab={setTab}
        design={D} tradeCount={tradeCount} modeColor={modeColor}
      />

      {/* Main panel */}
      <div style={{ flex: 1, minWidth: 0, overflow: "auto", background: D.bg }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 28px", borderBottom: `1px solid ${D.border}`, background: `${D.sidebar}cc`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 5 }}>
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{activeModule?.label}</div>
              {tab !== "settings" && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: isForward ? "rgba(16,232,160,0.08)" : "rgba(167,139,250,0.08)", color: modeColor, border: `1px solid ${modeColor}30`, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {isForward ? "Live" : "Backtest"}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: D.textMuted, marginTop: 1 }}>
              {loading ? "Loading..." : tab === "settings" ? "Global" : `${tradeCount} trades`}
            </div>
          </div>
        </div>

        {/* Content */}
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

function ModeToggle({ mode, onSwitch, D, compact }) {
  return (
    <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 2, gap: 2, border: `1px solid ${D.border}` }}>
      {[["backtesting", "Back"], ["forward", "Live"]].map(([m, label]) => (
        <button key={m} onClick={() => onSwitch(m)} style={{
          padding: compact ? "4px 12px" : "6px 0", flex: compact ? undefined : 1,
          borderRadius: 6, border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 600,
          background: mode === m
            ? m === "backtesting" ? "linear-gradient(135deg, #818cf8, #6366f1)" : "linear-gradient(135deg, #10e8a0, #059669)"
            : "transparent",
          color: mode === m ? "#fff" : D.textMuted,
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}
