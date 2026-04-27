import { useState } from "react";
import { C, StatCard } from "../utils/ui";
import { fmt, fmtPct } from "../utils/calculations";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── Calendar ─────────────────────────────────────────────────────────────────

function CalendarView({ trades, D }) {
  const [viewDate, setViewDate] = useState(() => {
    if (!trades || trades.length === 0) return new Date();
    const sorted = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    return new Date(sorted[0].date);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = {};
  for (const t of (trades || [])) {
    if (!t.date) continue;
    const d = new Date(t.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!byDay[key]) byDay[key] = { pnl: 0, trades: [], wins: 0, losses: 0 };
      byDay[key].pnl += t.pnl || 0;
      byDay[key].trades.push(t);
      if (t.pnl > 0) byDay[key].wins++;
      if (t.pnl < 0) byDay[key].losses++;
    }
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthPnl  = Object.values(byDay).reduce((a, d) => a + d.pnl, 0);
  const greenDays = Object.values(byDay).filter(d => d.pnl > 0).length;
  const redDays   = Object.values(byDay).filter(d => d.pnl < 0).length;

  return (
    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{monthName}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 6, color: D.textMuted, cursor: "pointer", fontSize: 13 }}>←</button>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ padding: "4px 10px", background: "transparent", border: `1px solid ${D.border}`, borderRadius: 6, color: D.textMuted, cursor: "pointer", fontSize: 13 }}>→</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: D.textMuted, padding: "3px 0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const data = byDay[day];
          const today = new Date();
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const bg    = data ? (data.pnl > 0 ? `${D.green}18` : data.pnl < 0 ? `${D.red}18` : `${D.yellow}15`) : "transparent";
          const color = data ? (data.pnl > 0 ? D.green : data.pnl < 0 ? D.red : D.yellow) : D.textMuted;
          return (
            <div key={day} title={data ? `${data.trades.length} trades · ${fmt(data.pnl)}` : ""}
              style={{ background: bg, border: `1px solid ${isToday ? D.blue : data ? color + "35" : D.border}`, borderRadius: 6, padding: "5px 4px", minHeight: 52 }}>
              <div style={{ fontSize: 10, fontWeight: isToday ? 700 : 400, color: isToday ? D.blue : D.textMuted, marginBottom: 2 }}>{day}</div>
              {data && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color, lineHeight: 1.2 }}>
                    {data.pnl >= 0 ? "+" : ""}{Math.abs(data.pnl) >= 1000 ? `${(data.pnl/1000).toFixed(1)}k` : data.pnl.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 9, color: D.textMuted, marginTop: 1 }}>{data.wins}W/{data.losses}L</div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {Object.keys(byDay).length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${D.border}`, display: "flex", gap: 28 }}>
          {[["Month PnL", fmt(monthPnl), monthPnl >= 0 ? D.green : D.red], ["Green Days", greenDays, D.green], ["Red Days", redDays, D.red]].map(([lbl, val, col]) => (
            <div key={lbl}>
              <div style={{ fontSize: 10, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: col }}>{val}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 1.2: Simplified Equity — no preset buttons, just custom input ─────────────

function MiniEquity({ trades, D }) {
  const [accountSize, setAccountSize] = useState(50000);
  const [inputVal, setInputVal]       = useState("50000");
  const BASE_ACCOUNT = 50000;

  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  const scale = accountSize / BASE_ACCOUNT;
  let eq = 0;
  const chartData = [
    { index: 0, equity: accountSize },
    ...sorted.map((t, i) => {
      eq += t.pnl || 0;
      return {
        index: i + 1,
        equity: parseFloat((accountSize + eq * scale).toFixed(2)),
        pnl: parseFloat(((t.pnl || 0) * scale).toFixed(2)),
      };
    }),
  ];

  const equities    = chartData.map(d => d.equity);
  const minEq       = Math.min(...equities);
  const maxEq       = Math.max(...equities);
  const yMin        = Math.floor((minEq - 500) / 1000) * 1000;
  const yMax        = Math.ceil((maxEq + 500) / 1000) * 1000;
  const finalEquity = chartData[chartData.length - 1]?.equity ?? accountSize;
  const totalPnl    = finalEquity - accountSize;
  const accentColor = totalPnl >= 0 ? D.green : D.red;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <div style={{ color: D.textMuted, marginBottom: 3 }}>Trade #{d.index}</div>
        <div style={{ color: accentColor, fontWeight: 600 }}>${d.equity.toLocaleString()}</div>
        {d.index > 0 && <div style={{ color: d.pnl >= 0 ? D.green : D.red, fontSize: 11, marginTop: 2 }}>{d.pnl >= 0 ? "+" : ""}${Math.abs(d.pnl).toFixed(0)}</div>}
      </div>
    );
  };

  return (
    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        {/* 1.2: Only a single input */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: D.textMuted }}>Account ($)</span>
          <div style={{ display: "flex", alignItems: "center", background: D.bg, border: `1px solid ${D.border}`, borderRadius: 6, overflow: "hidden" }}>
            <span style={{ fontSize: 10, color: D.textMuted, paddingLeft: 8 }}>$</span>
            <input
              type="number"
              value={inputVal}
              onChange={e => {
                setInputVal(e.target.value);
                const v = parseFloat(e.target.value);
                if (v > 0) setAccountSize(v);
              }}
              style={{ width: 90, padding: "5px 8px", background: "transparent", border: "none", outline: "none", color: D.text, fontSize: 13 }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Start", `$${accountSize.toLocaleString()}`, D.text], ["Final", `$${finalEquity.toLocaleString()}`, accentColor], ["PnL", `${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toFixed(0)}`, accentColor]].map(([lbl, val, col]) => (
            <div key={lbl} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: col }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fwdEquityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={accentColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={D.border} />
          <XAxis dataKey="index" tick={false} axisLine={false} tickLine={false} />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: D.textMuted }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={accountSize} stroke={D.border} strokeDasharray="4 4" />
          <Area type="monotone" dataKey="equity" stroke={accentColor} strokeWidth={2}
            fill="url(#fwdEquityGrad)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ForwardOverview({ trades, design }) {
  const D = design || C;

  if (!trades || trades.length === 0) return (
    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: 40, textAlign: "center", color: D.textMuted }}>
      No forward trades yet. Add trades in the Data tab.
    </div>
  );

  const wins       = trades.filter(t => t.pnl > 0);
  const losses     = trades.filter(t => t.pnl < 0);
  const winRate    = (wins.length + losses.length) > 0 ? wins.length / (wins.length + losses.length) : 0;
  const totalPnl   = trades.reduce((a, t) => a + (t.pnl || 0), 0);
  const avgWin     = wins.length ? wins.reduce((a, t) => a + t.pnl, 0) / wins.length : 0;
  const avgLoss    = losses.length ? Math.abs(losses.reduce((a, t) => a + t.pnl, 0) / losses.length) : 0;
  const avgRR      = trades.filter(t => t.rr > 0).reduce((a, t) => a + t.rr, 0) / (trades.filter(t => t.rr > 0).length || 1);
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;

  // Max drawdown
  let peak = 0, eq = 0, mdd = 0;
  for (const t of [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    eq += t.pnl || 0;
    if (eq > peak) peak = eq;
    const dd = peak - eq;
    if (dd > mdd) mdd = dd;
  }

  const weeklyMap = {};
  for (const t of trades) {
    const d = new Date(t.date);
    if (isNaN(d)) continue;
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    weeklyMap[`${d.getFullYear()}-W${wk}`] = (weeklyMap[`${d.getFullYear()}-W${wk}`] || 0) + 1;
  }
  const avgTradesPerWeek = Object.keys(weeklyMap).length > 0
    ? (trades.length / Object.keys(weeklyMap).length).toFixed(1) : "—";

  // 1.8: exactly these 6 stats
  const cards = [
    { label: "Total PnL",     value: fmt(totalPnl),                                     color: totalPnl >= 0 ? D.green : D.red},
    { label: "Win Rate",      value: fmtPct(winRate),                                    color: D.text },
    { label: "Avg RR",        value: avgRR > 0 ? `${avgRR.toFixed(2)}R` : "—",          color: D.text },
    { label: "Trades / Week", value: avgTradesPerWeek,                                   color: D.text },
    { label: "Expectancy",    value: fmt(expectancy),                                    color: expectancy >= 0 ? D.green : D.red},
    { label: "Max Drawdown",  value: mdd > 0 ? `-$${mdd.toFixed(0)}` : "$0",            color: D.red },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* 1.1: same StatCard style as Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
        {cards.map(c => (
          <StatCard key={c.label} label={c.label} value={c.value} color={c.color} trend={c.trend} design={D} />
        ))}
      </div>

      {/* Secondary stats bar */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "16px 24px", display: "flex", gap: 0, flexWrap: "wrap" }}>
        {[
          ["Wins",     wins.length,                      D.green],
          ["Losses",   losses.length,                    D.red],
          ["Avg Win",  fmt(avgWin),                      D.green],
          ["Avg Loss", `-$${avgLoss.toFixed(0)}`,        D.red],
          ["Trades",   trades.length,                    D.text],
        ].map(([label, value, color], i, arr) => (
          <div key={label} style={{ flex: "1 1 auto", padding: "8px 20px", borderRight: i < arr.length - 1 ? `1px solid ${D.border}` : "none", minWidth: 80 }}>
            <div style={{ fontSize: 10, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      <MiniEquity trades={trades} D={D} />
      <CalendarView trades={trades} D={D} />
    </div>
  );
}