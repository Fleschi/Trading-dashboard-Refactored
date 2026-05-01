import { useState } from "react";
import { useTradeData, useIsMobile, useDesign, useNavigation } from "./hooks";
import { BACK_MODULES, FWD_MODULES, SETTINGS_MODULE, BOTTOM_NAV_H } from "./constants.jsx";

import { GlobalStyles } from "./components/GlobalStyles";
import NavIcon          from "./components/NavIcon";
import ModuleContent    from "./components/ModuleContent";
import Settings         from "./modules/Settings";
import PageBackground   from "./components/PageBackground";

const FONT  = "'DM Sans', system-ui, sans-serif";
const NAV_H = 56; // nav floats above content, doesn't consume layout space

export default function App() {
  const { backTrades, setBackTrades, fwdTrades, setFwdTrades, backStats, loading, error } = useTradeData();
  const [design, setDesign] = useDesign();
  const [navHovered, setNavHovered] = useState(false);
  const isMobile = useIsMobile();
  const { mode, isForward, tab, setTab, switchMode, globalTab } = useNavigation();

  const D         = design;
  const modules   = isForward ? FWD_MODULES : BACK_MODULES;
  const modeColor = isForward ? D.green : D.blue;

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

  // ── Mobile ────────────────────────────────────────────────────────────────
  if (isMobile) {
    const mobileTabs = [SETTINGS_MODULE, ...modules];
    return (
      <div style={{ height: "100vh", color: D.text, fontFamily: FONT, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, overflow: "hidden", background: D.bg }}>
        <GlobalStyles design={D} />
        <PageBackground design={D} />

        {/* Mobile topbar — uses design tokens */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", flexShrink: 0,
          borderBottom: `1px solid ${D.border}`,
          background: `${D.card}ee`,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: D.text }}>
            {globalTab === "settings" ? "Settings" : (modules.find(m => m.id === tab)?.label || "")}
          </div>
          {/* Mode toggle — uses lg-mode CSS class which uses D.* vars */}
          <div className="lg-mode">
            {[["backtesting", "Back"], ["forward", "Live"]].map(([m, label]) => (
              <button key={m} className={`lg-mode-btn${mode === m ? " active" : ""}`} onClick={() => switchMode(m)}>{label}</button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16, paddingBottom: BOTTOM_NAV_H + 16 }}>
          {content}
        </div>

        {/* Bottom nav — uses design tokens */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: BOTTOM_NAV_H,
          background: `${D.card}f5`,
          backdropFilter: "blur(16px)",
          borderTop: `1px solid ${D.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-around",
          zIndex: 20,
        }}>
          {mobileTabs.map(m => {
            const isActive = globalTab === "settings" ? m.id === "settings" : tab === m.id;
            return (
              <button key={m.id} onClick={() => setTab(m.id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "6px 0", background: "none", border: "none", cursor: "pointer",
                color: isActive ? modeColor : D.textMuted,
              }}>
                <NavIcon path={m.icon} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, letterSpacing: "0.04em" }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Desktop — floating nav ─────────────────────────────────────────────────
  return (
    <div style={{ height: "100vh", color: D.text, fontFamily: FONT, position: "relative", zIndex: 1, overflow: "hidden", background: D.bg }}>
      <GlobalStyles design={D} />
      <PageBackground design={D} />

      {/* Floating nav — position: fixed, no layout space consumed */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: NAV_H, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 24px",
          pointerEvents: "none", // let clicks through the transparent area
        }}
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => setNavHovered(false)}
      >
        {/* The shell itself captures pointer events */}
        <div className="lg-shell" style={{ pointerEvents: "all" }}>

          <div className="lg-mode">
            {[["backtesting", "Back"], ["forward", "Live"]].map(([m, label]) => (
              <button key={m} className={`lg-mode-btn${mode === m ? " active" : ""}`} onClick={() => switchMode(m)}>{label}</button>
            ))}
          </div>

          <div className="lg-divider" />

          {modules.map(m => {
            const isActive = globalTab !== "settings" && tab === m.id;
            return (
              <button key={m.id} className={`lg-btn${isActive ? " active" : ""}`} onClick={() => setTab(m.id)} title={m.label}>
                <NavIcon path={m.icon} />
                {navHovered && <span>{m.label}</span>}
              </button>
            );
          })}

          <div className="lg-divider" />

          <button className={`lg-btn${globalTab === "settings" ? " active" : ""}`} onClick={() => setTab("settings")} title={SETTINGS_MODULE.label}>
            <NavIcon path={SETTINGS_MODULE.icon} />
            {navHovered && <span>{SETTINGS_MODULE.label}</span>}
          </button>

        </div>
      </div>

      {/* Full-height scrollable content — paddingTop so content starts below nav */}
      <div style={{ height: "100%", overflowY: "auto", position: "relative", zIndex: 1 }}>
        <div style={{ paddingTop: NAV_H + 12, padding: `${NAV_H + 12}px 28px 28px` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}