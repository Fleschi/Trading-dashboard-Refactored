// Returns the global <style> block for the app.
// D = design object. Keeps CSS out of JSX logic in App.js.
export function GlobalStyles({ design: D }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      body { background: ${D.bg}; margin: 0; padding: 0; }

      /* Sidebar nav items */
      .nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 18px; cursor: pointer; font-size: 13px; font-weight: 500;
        border: none; background: none; text-align: left; color: ${D.textMuted};
        border-radius: 10px; margin: 2px 8px; width: calc(100% - 16px);
        transition: all 0.15s ease; white-space: nowrap; overflow: hidden;
      }
      .nav-item:hover { background: rgba(129,140,248,0.08); color: ${D.text}; }
      .nav-item.active-back {
        background: linear-gradient(135deg, rgba(129,140,248,0.18), rgba(167,139,250,0.10));
        color: ${D.purple}; box-shadow: inset 0 0 0 1px rgba(129,140,248,0.2);
      }
      .nav-item.active-fwd {
        background: linear-gradient(135deg, rgba(16,232,160,0.15), rgba(16,232,160,0.06));
        color: ${D.green}; box-shadow: inset 0 0 0 1px rgba(16,232,160,0.2);
      }
      .nav-item.active-settings {
        background: rgba(100,116,139,0.12); color: ${D.text};
        box-shadow: inset 0 0 0 1px rgba(100,116,139,0.2);
      }

      /* Animated label collapse */
      .nav-label { transition: opacity 0.1s ease; }
      .nav-label.hidden { opacity: 0; pointer-events: none; width: 0; }

      /* Hamburger button */
      .hamburger {
        background: none; border: none; cursor: pointer;
        width: 36px; height: 36px; display: flex; align-items: center;
        justify-content: center; border-radius: 10px; color: ${D.textMuted};
        transition: all 0.15s; flex-shrink: 0;
      }
      .hamburger:hover { background: rgba(129,140,248,0.1); color: ${D.text}; }

      /* Scrollbar */
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${D.border}; border-radius: 4px; }
    `}</style>
  );
}
