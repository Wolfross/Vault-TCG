"use client";

/* ── Typography ── */
export function PixelText({ children, size = 11, color = "var(--accent-gold)", style = {} }) {
  return (
    <span style={{ fontFamily: "var(--font-pixel)", fontSize: size, color, lineHeight: 1.6, ...style }}>
      {children}
    </span>
  );
}

export function MonoText({ children, size = 11, color = "var(--text-muted)", style = {} }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: size, color, ...style }}>
      {children}
    </span>
  );
}

export function SectionLabel({ children, style = {} }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", ...style }}>
      {children}
    </div>
  );
}

/* ── Price display ── */
export function PriceTag({ value, size = 14, color = "var(--accent-gold)" }) {
  const fmt = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: size, color, fontWeight: 600 }}>{fmt(value)}</span>;
}

export function WeekChange({ pct }) {
  const pos = pct >= 0;
  return (
    <span style={{
      fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600,
      color: pos ? "#4ade80" : "#f87171",
      background: pos ? "#052e16" : "#450a0a",
      padding: "2px 5px", borderRadius: 4,
    }}>
      {pos ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/* ── Badges ── */
export function HoloBadge() {
  return (
    <span style={{
      fontSize: 9, padding: "1px 5px", borderRadius: 3,
      background: "linear-gradient(90deg,#f59e0b22,#8b5cf622,#3b82f622)",
      border: "1px solid #f59e0b44", color: "#fcd34d", fontWeight: 700,
      letterSpacing: "0.06em", fontFamily: "var(--font-mono)",
    }}>HOLO</span>
  );
}

export function FlaggedBadge() {
  return (
    <span style={{
      fontSize: 9, padding: "2px 6px", borderRadius: 3,
      background: "#450a0a", border: "1px solid #7f1d1d",
      color: "#f87171", fontWeight: 700, fontFamily: "var(--font-mono)",
    }}>⚠ NEEDS REVIEW</span>
  );
}

export function EraTag({ era }) {
  const colors = { "90s": "#f59e0b", "00s": "#22c55e", "10s": "#3b82f6", "20s": "#8b5cf6" };
  const c = colors[era] || "#64748b";
  return (
    <span style={{
      fontSize: 9, padding: "1px 5px", borderRadius: 3,
      fontFamily: "var(--font-mono)", color: c,
      background: "var(--bg-base)", border: `1px solid ${c}44`,
    }}>{era}</span>
  );
}

/* ── Card ── */
export function Panel({ children, style = {}, accent = null }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${accent ? accent + "44" : "var(--border)"}`,
      borderRadius: 10,
      ...style,
    }}>
      {accent && <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: "10px 10px 0 0" }} />}
      {children}
    </div>
  );
}

/* ── HP / Progress bar ── */
export function HPBar({ value, max, color = "var(--accent-green)", height = 6 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height, background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, boxShadow: `0 0 6px ${color}55`, transition: "width 0.8s ease" }} />
    </div>
  );
}

/* ── Live dot ── */
export function LiveDot({ color = "var(--accent-green)" }) {
  return (
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", animation: "blink 2s ease-in-out infinite", boxShadow: `0 0 5px ${color}` }} />
  );
}

/* ── Loading spinner ── */
export function Spinner({ size = 20, color = "var(--accent-blue)" }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  );
}

/* ── Empty state ── */
export function EmptyState({ icon = "◈", title, subtitle, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)" }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-pixel)", fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{subtitle}</div>}
      {action}
    </div>
  );
}

/* ── Button ── */
export function Button({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const styles = {
    primary:   { background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#000", border: "none" },
    secondary: { background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" },
    success:   { background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none" },
    danger:    { background: "transparent", color: "#f87171", border: "1px solid #7f1d1d" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 18px", borderRadius: 8, fontSize: 12, cursor: disabled ? "default" : "pointer",
        fontFamily: "var(--font-pixel)", letterSpacing: "0.05em",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
        ...styles[variant], ...style,
      }}
    >{children}</button>
  );
}
