// utils/ui.js

import { useEffect, useRef } from "react";

export const C = {
  green: "#10e8a0", red: "#ff4d6d", yellow: "#fbbf24",
  blue: "#818cf8", purple: "#a78bfa",
  bg: "#0a0a0f", card: "#111118", border: "#1e1e2a",
  text: "#f1f1f3", textMuted: "#52525b",
  pink: "#ec4899", // Pink für Glow
};

// ─── GlowCard ─────────────────────────────────────────────────────────────────

export function GlowCard({ children, style = {}, design, glowColor, onClick, active, className }) {
  const ref = useRef();
  const D = design || C;
  const glow = glowColor || D.pink || "#ec4899";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
      el.style.setProperty("--glow-opacity", "1");
    };
    const onLeave = () => {
      el.style.setProperty("--glow-opacity", "0");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        position: "relative",
        borderRadius: 12,
        border: `1px solid ${active ? glow : D.border}`,
        background: D.card,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s",
        overflow: "hidden",
        "--mx": "50%", "--my": "50%",
        "--glow-opacity": "0",
        ...style,
      }}
    >
      {/* Subtle inner glow that bleeds into background */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        pointerEvents: "none",
        zIndex: 0,
        opacity: "var(--glow-opacity)",
        transition: "opacity 0.3s",
        background: `radial-gradient(200px circle at var(--mx) var(--my), ${glow}12, transparent 70%)`,
      }} />

      {/* Border glow - stronger at the edge */}
      <div style={{
        position: "absolute",
        inset: -2,
        borderRadius: "inherit",
        pointerEvents: "none",
        zIndex: 2,
        opacity: "var(--glow-opacity)",
        transition: "opacity 0.3s",
        background: `radial-gradient(150px circle at var(--mx) var(--my), ${glow}60, transparent 55%)`,
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        padding: 2,
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ─── StatCard with Glow ────────────────────────────────────────────────────────

export function StatCard({ label, value, sub, color, design, onClick, active, trend, glowColor }) {
  const D = design || C;
  const glow = glowColor || D.pink;
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <GlowCard design={D} glowColor={glow} onClick={onClick} active={active} style={{ padding: 0 }}>
      <div style={{ padding: "20px 22px" }}>
        {/* Label + trend */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
            {label}
          </div>
          {(isPositive || isNegative) && (
            <span style={{ fontSize: 11, fontWeight: 600, color: isPositive ? D.green : D.red }}>
              {isPositive ? "↑" : "↓"}
            </span>
          )}
        </div>
        {/* Value */}
        <div style={{ fontSize: 24, fontWeight: 700, color: color || D.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: D.textMuted, marginTop: 6 }}>{sub}</div>}
      </div>
    </GlowCard>
  );
}