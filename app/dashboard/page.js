"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getStats, updateCard } from "@/lib/collection";
import { Panel, PixelText, MonoText, SectionLabel, PriceTag, HPBar, LiveDot, EmptyState, Button, Spinner } from "@/components/shared/ui";

const MOCK_HISTORY = [
  { d:"Oct", v:8420 },{ d:"Nov", v:7890 },{ d:"Dec", v:9100 },
  { d:"Jan", v:10400 },{ d:"Feb", v:11200 },{ d:"Mar", v:13247 },
];

function fmt(n) { return "$" + Number(n||0).toLocaleString("en-US", { maximumFractionDigits:0 }); }
function fmtFull(n) { return "$" + Number(n||0).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 }); }

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1526", border:"1px solid #f59e0b44", borderRadius:6, padding:"8px 12px", fontSize:11, fontFamily:"var(--font-mono)" }}>
      <div style={{ color:"var(--text-muted)", marginBottom:2 }}>{label}</div>
      <div style={{ color:"var(--accent-gold)", fontWeight:600 }}>{fmt(payload[0].value)}</div>
    </div>
  );
}

/* ── Price refresh: fetches best available price for a card ── */
async function fetchBestPrice(card) {
  try {
    /* Try eBay sold avg first */
    const q = `${card.name} ${card.set_name || ""} ${card.number || ""}`;
    const ebayRes = await fetch(`/api/ebay?card=${encodeURIComponent(q)}&condition=${encodeURIComponent(card.grade||"Raw")}`);
    const ebayData = await ebayRes.json();
    const prices = (ebayData.items||[]).map(i => i.price).filter(Boolean);
    if (prices.length > 0) return Math.round(prices.reduce((a,b)=>a+b,0)/prices.length);

    /* Fall back to TCGplayer via card detail API */
    if (card.card_id) {
      const cardRes = await fetch(`/api/cards?q=id:${card.card_id}&pageSize=1`);
      const cardData = await cardRes.json();
      const c = cardData.data?.[0];
      if (c?.tcgplayer?.prices) {
        const p = c.tcgplayer.prices;
        return p.holofoil?.market || p.normal?.market || p.reverseHolofoil?.market || null;
      }
    }
  } catch {}
  return null;
}

export default function Dashboard() {
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [range,      setRange]      = useState("6mo");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ done:0, total:0 });

  useEffect(() => {
    getStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  /* ── Refresh all prices ── */
  const handleRefreshPrices = async () => {
    if (!stats?.items?.length || refreshing) return;
    setRefreshing(true);
    const items = stats.items;
    setRefreshProgress({ done:0, total:items.length });
    let updatedItems = [...items];

    for (let i = 0; i < items.length; i++) {
      const card = items[i];
      const newPrice = await fetchBestPrice(card);
      if (newPrice && newPrice > 0) {
        await updateCard(card.id, { current_price: newPrice });
        updatedItems[i] = { ...card, current_price: newPrice };
      }
      setRefreshProgress({ done: i + 1, total: items.length });
    }

    /* Recalculate stats with updated prices */
    const totalValue = updatedItems.filter(c => c.current_price > 0).reduce((s, c) => s + c.current_price * (c.quantity||1), 0);
    setStats(prev => ({ ...prev, items: updatedItems, totalValue }));
    setRefreshing(false);
    setRefreshProgress({ done:0, total:0 });
  };

  if (loading) return <LoadingState />;

  const { totalValue, totalCost, totalCards, gradedCards, flaggedCards, unpricedCount, items } = stats;
  const gain    = totalValue - totalCost;
  const gainPct = totalCost > 0 ? ((gain / totalCost) * 100).toFixed(1) : null;
  const isEmpty = items.length === 0;
  const unpriced = unpricedCount || items.filter(c => !c.current_price || c.current_price === 0).length;

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh", padding:"20px 24px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:10 }}>
          <div>
            <MonoText size={10} color="var(--text-dim)" style={{ display:"block", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>CARDEX PORTFOLIO</MonoText>
            <h1 style={{ fontSize:20, fontWeight:700, color:"var(--text-primary)", margin:0, letterSpacing:"-0.5px" }}>Your Collection</h1>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {/* Price refresh button */}
            {!isEmpty && (
              <button onClick={handleRefreshPrices} disabled={refreshing} style={{
                padding:"9px 16px", borderRadius:8, cursor: refreshing ? "default" : "pointer",
                border:"1px solid var(--border)", background:"transparent",
                color: refreshing ? "var(--text-dim)" : "var(--text-secondary)",
                fontSize:11, fontFamily:"var(--font-mono)", display:"flex", alignItems:"center", gap:7,
                opacity: refreshing ? 0.7 : 1, whiteSpace:"nowrap",
              }}>
                {refreshing ? (
                  <>
                    <div style={{ width:12, height:12, border:"1.5px solid var(--border)", borderTopColor:"var(--accent-blue)", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                    {refreshProgress.total > 0 ? `${refreshProgress.done}/${refreshProgress.total}` : "Refreshing..."}
                  </>
                ) : (
                  <>↺ Refresh prices{unpriced > 0 ? ` · ${unpriced} unpriced` : ""}</>
                )}
              </button>
            )}
            <Link href="/scan">
              <Button variant="primary" style={{ fontSize:11 }}>+ SCAN CARD</Button>
            </Link>
          </div>
        </div>

        {isEmpty ? (
          <EmptyState icon="🃏" title="YOUR PC BOX IS EMPTY" subtitle="Scan or add your first card to start building your collection"
            action={
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <Link href="/browse"><button style={{ padding:"10px 18px", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", cursor:"pointer", fontSize:12 }}>+ Add Manually</button></Link>
                <Link href="/scan"><Button variant="primary">SCAN FIRST CARD</Button></Link>
              </div>
            }
          />
        ) : (
          <>
            {/* Unpriced warning */}
            {unpriced > 0 && (
              <div style={{ background:"#1a1200", border:"1px solid #92400e44", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:"#fbbf24", fontWeight:600 }}>{unpriced} card{unpriced>1?"s":""} need pricing</div>
                  <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2 }}>Hit "Refresh prices" to fetch current market values automatically.</div>
                </div>
                <button onClick={handleRefreshPrices} disabled={refreshing} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid #92400e", background:"#2a1200", color:"#fbbf24", fontSize:11, cursor:"pointer", fontFamily:"var(--font-mono)", whiteSpace:"nowrap" }}>
                  {refreshing ? "Refreshing..." : "↺ Fix now"}
                </button>
              </div>
            )}

            {/* Flagged warning */}
            {flaggedCards > 0 && (
              <div style={{ background:"#1a0a00", border:"1px solid #92400e", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <div>
                  <div style={{ fontSize:13, color:"#fbbf24", fontWeight:600 }}>{flaggedCards} card{flaggedCards>1?"s":""} need variant review</div>
                  <div style={{ fontSize:11, color:"#78716c", marginTop:2 }}>Unconfirmed variants — portfolio value may be inaccurate until resolved.</div>
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
                  <div style={{ fontSize:11, color: gain>=0?"#4ade80":"#f87171", fontFamily:"var(--font-mono)" }}>
                    {gain>=0?"▲":"▼"} {gainPct}% all time ({gain>=0?"+":""}{fmt(gain)})
                  </div>
                )}
                {totalValue === 0 && items.length > 0 && (
                  <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)", marginTop:4 }}>Hit refresh to fetch prices</div>
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
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>cost basis</div>
              </Panel>
              <Panel style={{ padding:"14px 16px" }}>
                <SectionLabel style={{ marginBottom:8 }}>Unpriced</SectionLabel>
                <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color: unpriced>0?"#fbbf24":"var(--text-primary)" }}>{unpriced}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>need pricing</div>
              </Panel>
            </div>

            {/* HP bar */}
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

            {/* Chart + recent */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, marginBottom:16 }}>
              <Panel style={{ padding:"18px 20px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div>
                    <SectionLabel>Portfolio value</SectionLabel>
                    <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color:"var(--accent-gold)", marginTop:4 }}>{fmt(totalValue)}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {["7d","30d","90d","6mo","All"].map(r => (
                      <button key={r} onClick={() => setRange(r)} style={{ padding:"4px 10px", borderRadius:4, fontSize:10, cursor:"pointer", fontFamily:"var(--font-mono)", border: range===r?"1px solid var(--accent-amber)":"1px solid var(--border)", background: range===r?"#2a1e00":"transparent", color: range===r?"var(--accent-gold)":"var(--text-dim)" }}>{r}</button>
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
                    <YAxis tick={{ fill:"var(--text-dim)", fontSize:10, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v=>"$"+Math.round(v/1000)+"k"} width={42} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r:3, fill:"#f59e0b", strokeWidth:0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>

              <Panel style={{ overflow:"hidden" }}>
                <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid var(--border-dim)", display:"flex", alignItems:"center", gap:8 }}>
                  <LiveDot color="var(--accent-blue)" />
                  <SectionLabel>Recently added</SectionLabel>
                </div>
                {items.slice(0, 5).map(card => (
                  <Link key={card.id} href={`/card/${card.card_id}`} style={{ display:"block", textDecoration:"none" }}>
                    <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border-dim)", display:"flex", alignItems:"center", gap:10, transition:"background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background="#0d1526"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <div style={{ width:32, height:40, flexShrink:0, overflow:"hidden", borderRadius:4 }}>
                        {card.image_url
                          ? <img src={card.image_url} alt={card.name} style={{ width:32, height:40, objectFit:"cover" }} />
                          : <div style={{ width:32, height:40, background:"var(--bg-base)", border:"1px solid var(--border)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🃏</div>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.name}</div>
                        <div style={{ fontSize:10, color:"var(--text-dim)" }}>{card.set_name}</div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        {card.current_price > 0
                          ? <div style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:700, color:"var(--accent-gold)" }}>{fmtFull(card.current_price)}</div>
                          : <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#fbbf24" }}>—</div>
                        }
                      </div>
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
