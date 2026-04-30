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

  const D          = design;
  const modules    = isForward ? FWD_MODULES : BACK_MODULES;
  const modeColor  = isForward ? D.green : D.blue;

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
      <div style={{ minHeight: "100vh", color: D.text, fontFamily: FONT, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <GlobalStyles design={D} />
        <PageBackground design={D} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${D.border}`, background: `${D.sidebar}ee`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: D.text }}>
            {globalTab === "settings" ? "Settings" : (modules.find(m => m.id === tab)?.label || "")}
          </div>
          <ModeToggle mode={mode} onSwitch={switchMode} D={D} />
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 16, paddingBottom: BOTTOM_NAV_H + 16 }}>
          {content}
        </div>

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

  // ── Desktop ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", color: D.text, fontFamily: FONT, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      <GlobalStyles design={D} />
      <PageBackground design={D} />

      {/* Floating top nav */}
      <div
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => setNavHovered(false)}
        style={{
          position: "sticky", top: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "12px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

          {/* Mode toggle */}
          <ModeToggle mode={mode} onSwitch={switchMode} D={D} />

          <div style={{ width: 1, height: 18, background: D.border, margin: "0 6px", opacity: 0.6 }} />

          {/* Module tabs — left group */}
          {modules.map(m => {
            const isActive = globalTab !== "settings" && tab === m.id;
            return <NavTab key={m.id} m={m} isActive={isActive} navHovered={navHovered} D={D} onClick={() => setTab(m.id)} />;
          })}

          <div style={{ width: 1, height: 18, background: D.border, margin: "0 6px", opacity: 0.6 }} />

          {/* Settings — right group */}
          <NavTab
            m={SETTINGS_MODULE}
            isActive={globalTab === "settings"}
            navHovered={navHovered}
            D={D}
            onClick={() => setTab("settings")}
          />

        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "8px 28px 28px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NavTab ───────────────────────────────────────────────────────────────────

function NavTab({ m, isActive, navHovered, D, onClick }) {
  return (
    <button
      onClick={onClick}
      title={m.label}
      style={{
        display: "flex", alignItems: "center",
        gap: 6,
        width: navHovered ? "auto" : 36,
        height: 36,
        padding: navHovered ? "0 14px" : "0",
        justifyContent: "center",
        borderRadius: 999,
        border: `1px solid ${isActive ? D.blue + "60" : D.border}`,
        background: isActive ? `${D.blue}18` : `${D.card}cc`,
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        color: isActive ? D.blue : D.textMuted,
        fontSize: 12, fontWeight: isActive ? 600 : 400,
        // No width transition — eliminates shake on leave
        transition: "background 0.2s, border-color 0.2s, color 0.2s, padding 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        whiteSpace: "nowrap",
        flexShrink: 0,
        boxShadow: isActive
          ? `0 0 0 1px ${D.blue}20, 0 2px 8px rgba(0,0,0,0.12)`
          : "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <NavIcon path={m.icon} />
      {navHovered && (
        <span style={{ fontSize: 12 }}>{m.label}</span>
      )}
    </button>
  );
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────

function ModeToggle({ mode, onSwitch, D }) {
  return (
    <div style={{
      display: "flex", borderRadius: 999, padding: 2, gap: 2,
      border: `1px solid ${D.border}`, background: `${D.card}cc`,
      backdropFilter: "blur(12px)",
    }}>
      {[["backtesting", "Back"], ["forward", "Live"]].map(([m, label]) => (
        <button key={m} onClick={() => onSwitch(m)} style={{
          padding: "4px 12px", borderRadius: 999, border: "none", cursor: "pointer",
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