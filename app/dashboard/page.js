"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getStats } from "@/lib/collection";
import { Panel, PixelText, MonoText, SectionLabel, PriceTag, WeekChange, HPBar, LiveDot, EmptyState, Button } from "@/components/shared/ui";

/* mock history while we build the real price tracking */
const MOCK_HISTORY = [
  { d:"Oct", v:8420 },{ d:"Nov", v:7890 },{ d:"Dec", v:9100 },
  { d:"Jan", v:10400 },{ d:"Feb", v:11200 },{ d:"Mar", v:13247 },
];

const ERA_COLOR = { "90s":"#f59e0b","00s":"#22c55e","10s":"#3b82f6","20s":"#8b5cf6" };

function fmt(n) { return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 }); }

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1526", border:"1px solid #f59e0b44", borderRadius:6, padding:"8px 12px", fontSize:11, fontFamily:"var(--font-mono)" }}>
      <div style={{ color:"var(--text-muted)", marginBottom:2 }}>{label}</div>
      <div style={{ color:"var(--accent-gold)", fontWeight:600 }}>{fmt(payload[0].value)}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState("6mo");

  useEffect(() => {
    getStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  if (loading) return <LoadingState />;

  const { totalValue, totalCost, totalCards, gradedCards, flaggedCards, items } = stats;
  const gain    = totalValue - totalCost;
  const gainPct = totalCost > 0 ? ((gain / totalCost) * 100).toFixed(1) : null;
  const isEmpty = items.length === 0;

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh", padding:"20px 24px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20 }}>
          <div>
            <MonoText size={10} color="var(--text-dim)" style={{ display:"block", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>
              CARDEX PORTFOLIO
            </MonoText>
            <h1 style={{ fontSize:20, fontWeight:700, color:"var(--text-primary)", margin:0, letterSpacing:"-0.5px" }}>
              Your Collection
            </h1>
          </div>
          <Link href="/scan">
            <Button variant="primary" style={{ fontSize:11 }}>+ SCAN CARD</Button>
          </Link>
        </div>

        {isEmpty ? (
          <EmptyState
            icon="🃏"
            title="NO CARDS YET"
            subtitle="Scan your first card to get started"
            action={<Link href="/scan"><Button variant="primary">SCAN YOUR FIRST CARD</Button></Link>}
          />
        ) : (
          <>
            {/* Flagged warning */}
            {flaggedCards > 0 && (
              <div style={{ background:"#1a0a00", border:"1px solid #92400e", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <div>
                  <div style={{ fontSize:13, color:"#fbbf24", fontWeight:600 }}>{flaggedCards} card{flaggedCards > 1 ? "s" : ""} need variant review</div>
                  <div style={{ fontSize:11, color:"#78716c", marginTop:2 }}>These were logged with unconfirmed variants — your portfolio value may be inaccurate until resolved.</div>
                </div>
                <Link href="/collection?filter=flagged" style={{ marginLeft:"auto", fontSize:11, color:"#f59e0b", textDecoration:"none", whiteSpace:"nowrap", fontFamily:"var(--font-mono)" }}>Review now →</Link>
              </div>
            )}

            {/* Stat strip */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:12, marginBottom:20 }}>
              <Panel accent="var(--accent-amber)" style={{ padding:"16px 18px" }}>
                <SectionLabel style={{ marginBottom:8 }}>Total Portfolio Value</SectionLabel>
                <div style={{ fontFamily:"var(--font-pixel)", fontSize:18, color:"var(--accent-gold)", marginBottom:6 }}>{fmt(totalValue)}</div>
                {gainPct && (
                  <div style={{ fontSize:11, color: gain >= 0 ? "#4ade80" : "#f87171", fontFamily:"var(--font-mono)" }}>
                    {gain >= 0 ? "▲" : "▼"} {gainPct}% all time ({gain >= 0 ? "+" : ""}{fmt(gain)})
                  </div>
                )}
              </Panel>
              <Panel style={{ padding:"14px 16px" }}>
                <SectionLabel style={{ marginBottom:8 }}>Total Cards</SectionLabel>
                <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color:"var(--text-primary)" }}>{totalCards}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4, fontFamily:"var(--font-mono)" }}>{gradedCards} graded</div>
              </Panel>
              <Panel style={{ padding:"14px 16px" }}>
                <SectionLabel style={{ marginBottom:8 }}>Amount Spent</SectionLabel>
                <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color:"var(--text-primary)" }}>{fmt(totalCost)}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>purchase cost</div>
              </Panel>
              <Panel style={{ padding:"14px 16px" }}>
                <SectionLabel style={{ marginBottom:8 }}>Flagged</SectionLabel>
                <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color: flaggedCards > 0 ? "#f87171" : "var(--text-primary)" }}>{flaggedCards}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>need review</div>
              </Panel>
            </div>

            {/* Portfolio HP bar */}
            <Panel style={{ padding:"12px 16px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <PixelText size={10} color="var(--text-muted)">HP</PixelText>
                  <PixelText size={12} color="var(--accent-green)">{fmt(totalValue).replace("$","")}</PixelText>
                  <PixelText size={10} color="var(--text-dim)">/ $25,000</PixelText>
                </div>
                <MonoText size={10} color="var(--text-dim)">Collection goal: {Math.round((totalValue/25000)*100)}% to target</MonoText>
              </div>
              <HPBar value={totalValue} max={25000} />
            </Panel>

            {/* Chart + breakdown */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, marginBottom:16 }}>
              <Panel style={{ padding:"18px 20px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div>
                    <SectionLabel>Portfolio value</SectionLabel>
                    <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color:"var(--accent-gold)", marginTop:4 }}>{fmt(totalValue)}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {["7d","30d","90d","6mo","All"].map(r => (
                      <button key={r} onClick={() => setRange(r)} style={{
                        padding:"4px 10px", borderRadius:4, fontSize:10, cursor:"pointer",
                        fontFamily:"var(--font-mono)",
                        border: range === r ? "1px solid var(--accent-amber)" : "1px solid var(--border)",
                        background: range === r ? "#2a1e00" : "transparent",
                        color: range === r ? "var(--accent-gold)" : "var(--text-dim)",
                      }}>{r}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={MOCK_HISTORY} margin={{ top:4, right:0, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" tick={{ fill:"var(--text-dim)", fontSize:10, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:"var(--text-dim)", fontSize:10, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v => "$"+Math.round(v/1000)+"k"} width={42} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r:3, fill:"#f59e0b", strokeWidth:0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>

              {/* Recent additions */}
              <Panel style={{ overflow:"hidden" }}>
                <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid var(--border-dim)", display:"flex", alignItems:"center", gap:8 }}>
                  <LiveDot color="var(--accent-blue)" />
                  <SectionLabel>Recently added</SectionLabel>
                </div>
                {items.slice(0, 5).map((card, i) => (
                  <Link key={card.id} href={`/card/${card.card_id}`} style={{ display:"block", textDecoration:"none" }}>
                    <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border-dim)", display:"flex", alignItems:"center", gap:10 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#0d1526"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontSize:20, flexShrink:0 }}>{card.icon || "🃏"}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.name}</div>
                        <div style={{ fontSize:10, color:"var(--text-dim)" }}>{card.set_name}</div>
                      </div>
                      <PriceTag value={card.current_price || 0} size={12} />
                    </div>
                  </Link>
                ))}
                <div style={{ padding:"10px 16px" }}>
                  <Link href="/collection" style={{ fontSize:11, color:"var(--text-muted)", textDecoration:"none", fontFamily:"var(--font-mono)" }}>View all {totalCards} cards →</Link>
                </div>
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", flexDirection:"column", gap:16 }}>
      <div style={{ width:32, height:32, border:"2px solid var(--border)", borderTopColor:"var(--accent-amber)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <MonoText>Loading collection...</MonoText>
    </div>
  );
}
