"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Panel, SectionLabel, MonoText, PixelText, HoloBadge, EraTag, Spinner, Button } from "@/components/shared/ui";
import { addCard, getCollection, updateCard, removeCard } from "@/lib/collection";

const GRADE_OPTIONS    = ["Raw","PSA 10","PSA 9","PSA 8","PSA 7","BGS 9.5","BGS 9","CGC 10","CGC 9"];
const PRICE_CONDITIONS = ["Raw","PSA 10","PSA 9","PSA 8","PSA 7","BGS 9.5","BGS 9"];
const COND_OPTIONS     = ["NM","LP","MP","HP","D"];

const MOCK_HISTORY = [
  { d:"Oct", p:310 },{ d:"Nov", p:295 },{ d:"Dec", p:340 },
  { d:"Jan", p:365 },{ d:"Feb", p:390 },{ d:"Mar", p:412 },
];

function fmt(n) { return "$" + Number(n||0).toLocaleString("en-US",{maximumFractionDigits:0}); }
function fmtFull(n) {
  if (n == null) return "—";
  return "$" + Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso), now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1526", border:"1px solid #f59e0b44", borderRadius:6, padding:"8px 12px", fontSize:11, fontFamily:"var(--font-mono)" }}>
      <div style={{ color:"var(--text-muted)", marginBottom:2 }}>{label}</div>
      <div style={{ color:"var(--accent-gold)", fontWeight:600 }}>{fmtFull(payload[0].value)}</div>
    </div>
  );
}

function getEra(date) {
  if (!date) return "20s";
  const y = parseInt(date.slice(0,4));
  if (y < 2003) return "90s";
  if (y < 2010) return "00s";
  if (y < 2020) return "10s";
  return "20s";
}

function getTcgPrice(card) {
  const p = card?.tcgplayer?.prices;
  if (!p) return null;
  return p.holofoil?.market || p.normal?.market || p.reverseHolofoil?.market
    || p["1stEditionHolofoil"]?.market || p.unlimitedHolofoil?.market || null;
}

function MyCopyPanel({ collectionItem, bestPrice, onUpdated, onDeleted }) {
  const [editing,  setEditing]  = useState(false);
  const [cond,     setCond]     = useState(collectionItem.condition || "NM");
  const [purchase, setPurchase] = useState(collectionItem.purchase_price || "");
  const [notes,    setNotes]    = useState(collectionItem.notes || "");
  const [saving,   setSaving]   = useState(false);
  const [showDel,  setShowDel]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentPrice = collectionItem.current_price || bestPrice;
  const hasCost      = collectionItem.purchase_price > 0;
  const gain         = currentPrice && hasCost ? currentPrice - collectionItem.purchase_price : null;
  const gainPct      = gain !== null ? ((gain / collectionItem.purchase_price) * 100).toFixed(1) : null;

  const handleSave = async () => {
    setSaving(true);
    const updates = { condition: cond, notes };
    if (purchase !== "") updates.purchase_price = parseFloat(purchase);
    await updateCard(collectionItem.id, updates);
    setSaving(false);
    setEditing(false);
    onUpdated({ ...collectionItem, ...updates });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await removeCard(collectionItem.id);
    setDeleting(false);
    onDeleted();
  };

  return (
    <Panel accent="var(--accent-green)" style={{ marginBottom:20 }}>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent-green)", boxShadow:"0 0 6px #22c55e" }} />
            <PixelText size={10} color="var(--accent-green)">IN YOUR COLLECTION</PixelText>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setEditing(!editing)} style={{ padding:"5px 12px", borderRadius:6, fontSize:11, cursor:"pointer", border:"1px solid #2d5a8e", background: editing ? "#1e3a5f" : "transparent", color: editing ? "#93c5fd" : "var(--text-muted)", fontFamily:"var(--font-mono)" }}>
              {editing ? "Cancel" : "✎ Edit"}
            </button>
            <button onClick={() => setShowDel(true)} style={{ padding:"5px 12px", borderRadius:6, fontSize:11, cursor:"pointer", border:"1px solid #7f1d1d", background:"transparent", color:"#f87171", fontFamily:"var(--font-mono)" }}>
              Release
            </button>
          </div>
        </div>

        {!editing ? (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom: gain !== null || collectionItem.notes ? 12 : 0 }}>
              {[
                { label:"Grade",     value: collectionItem.grade || "Raw" },
                { label:"Condition", value: collectionItem.condition || "—" },
                { label:"Value",     value: currentPrice ? fmtFull(currentPrice) : "— unpriced" },
                { label:"Paid",      value: hasCost ? fmtFull(collectionItem.purchase_price) : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:"var(--bg-base)", borderRadius:8, padding:"10px 12px", border:"1px solid var(--border-dim)" }}>
                  <SectionLabel style={{ marginBottom:4 }}>{label}</SectionLabel>
                  <div style={{ fontSize:13, fontWeight:600, color: label==="Value" ? "var(--accent-gold)" : "var(--text-primary)", fontFamily: label==="Value"||label==="Paid" ? "var(--font-mono)" : "inherit" }}>{value}</div>
                </div>
              ))}
            </div>

            {gain !== null && (
              <div style={{ padding:"10px 12px", borderRadius:8, background: gain>=0?"#052e16":"#450a0a", border:`1px solid ${gain>=0?"#22c55e33":"#7f1d1d33"}`, marginBottom: collectionItem.notes ? 10 : 0 }}>
                <div style={{ fontSize:12, color: gain>=0?"#4ade80":"#f87171", fontFamily:"var(--font-mono)", fontWeight:600 }}>
                  {gain>=0?"▲":"▼"} {gain>=0?"+":""}{fmtFull(gain)} ({gain>=0?"+":""}{gainPct}%) since purchase
                </div>
              </div>
            )}

            {collectionItem.notes && (
              <div style={{ fontSize:11, color:"var(--text-muted)", fontStyle:"italic", marginTop:8 }}>"{collectionItem.notes}"</div>
            )}

            <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
              {collectionItem.print_variant && collectionItem.print_variant !== "unlimited" && (
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:3, background:"#2a1e00", border:"1px solid #92400e", color:"#fbbf24", fontFamily:"var(--font-mono)" }}>
                  {collectionItem.print_variant === "1st_edition" ? "1st Edition" : collectionItem.print_variant}
                </span>
              )}
              {collectionItem.language && collectionItem.language !== "en" && (
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:3, background:"#1e0a3a", border:"1px solid #7c3aed44", color:"#a78bfa", fontFamily:"var(--font-mono)" }}>
                  {collectionItem.language.toUpperCase()}
                </span>
              )}
              {collectionItem.flagged && (
                <span style={{ fontSize:9, padding:"2px 7px", borderRadius:3, background:"#450a0a", border:"1px solid #7f1d1d", color:"#f87171", fontFamily:"var(--font-mono)" }}>
                  ⚠ VARIANT UNCONFIRMED
                </span>
              )}
              {collectionItem.added_at && (
                <span style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"var(--font-mono)", marginLeft:"auto" }}>
                  Added {timeAgo(collectionItem.added_at)}
                </span>
              )}
            </div>

            <div style={{ marginTop:10, fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>
              Tap the grade buttons above to update your copy's grade instantly
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom:14 }}>
              <SectionLabel style={{ marginBottom:8 }}>Condition</SectionLabel>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {COND_OPTIONS.map(c => (
                  <button key={c} onClick={() => setCond(c)} style={{ padding:"6px 11px", borderRadius:6, fontSize:11, cursor:"pointer", border: cond===c?"1px solid var(--accent-amber)":"1px solid var(--border)", background: cond===c?"#2a1e00":"transparent", color: cond===c?"var(--accent-gold)":"var(--text-muted)" }}>{c}</button>
                ))}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <SectionLabel style={{ marginBottom:8 }}>Purchase price</SectionLabel>
                <input value={purchase} onChange={e=>setPurchase(e.target.value)} placeholder="$0.00"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13, fontFamily:"var(--font-mono)" }} />
              </div>
              <div>
                <SectionLabel style={{ marginBottom:8 }}>Notes</SectionLabel>
                <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Minor edge wear..."
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13 }} />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} style={{ width:"100%", padding:"12px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"var(--font-pixel)", opacity: saving?0.7:1 }}>
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </button>
          </div>
        )}
      </div>

      {showDel && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <Panel style={{ padding:24, maxWidth:360, width:"100%", textAlign:"center" }}>
            <PixelText size={11} color="#f87171" style={{ display:"block", marginBottom:12 }}>RELEASE CARD?</PixelText>
            {currentPrice && (
              <div style={{ fontSize:12, color:"var(--text-dim)", marginBottom:8, fontFamily:"var(--font-mono)" }}>
                Current value: <span style={{ color:"var(--accent-gold)" }}>{fmtFull(currentPrice)}</span>
              </div>
            )}
            <div style={{ fontSize:11, color:"var(--text-dim)", marginBottom:20, fontStyle:"italic" }}>Released to another trainer</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowDel(false)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>Keep it</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #7f1d1d", background:"#450a0a", color:"#f87171", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                {deleting ? "Releasing..." : "Release"}
              </button>
            </div>
          </Panel>
        </div>
      )}
    </Panel>
  );
}

export default function CardDetail() {
  const { id }           = useParams();
  const router           = useRouter();
  const [card,           setCard]           = useState(null);
  const [ebay,           setEbay]           = useState({ items:[], source:"loading" });
  const [condition,      setCondition]      = useState("Raw");
  const [tab,            setTab]            = useState("ebay");
  const [adding,         setAdding]         = useState(false);
  const [collectionItem, setCollectionItem] = useState(null);
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [addGrade,       setAddGrade]       = useState("Raw");
  const [addCond,        setAddCond]        = useState("NM");
  const [addPrice,       setAddPrice]       = useState("");
  const [chartRange,     setChartRange]     = useState("6mo");
  const [gradeUpdating,  setGradeUpdating]  = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cards?q=id:${id}&pageSize=1`)
      .then(r => r.json())
      .then(d => setCard(d.data?.[0] || null))
      .catch(() => setCard(null));
  }, [id]);

  useEffect(() => {
    if (!card) return;
    setEbay({ items:[], source:"loading" });
    const q = `${card.name} ${card.set?.name} ${card.number}`;
    fetch(`/api/ebay?card=${encodeURIComponent(q)}&condition=${encodeURIComponent(condition)}`)
      .then(r => r.json())
      .then(d => setEbay(d))
      .catch(() => setEbay({ items:[], source:"error" }));
  }, [card, condition]);

  useEffect(() => {
    if (!card) return;
    getCollection().then(items => {
      const found = items.find(i => i.card_id === card.id);
      setCollectionItem(found || null);
      if (found?.grade) setCondition(found.grade);
    });
  }, [card]);

  if (!card) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"70vh", flexDirection:"column", gap:12 }}>
      <Spinner size={32} />
      <MonoText>Loading card data...</MonoText>
    </div>
  );

  const typeColor = card.types?.[0] === "Fire"      ? "#ef4444"
    : card.types?.[0] === "Water"     ? "#3b82f6"
    : card.types?.[0] === "Grass"     ? "#22c55e"
    : card.types?.[0] === "Psychic"   ? "#8b5cf6"
    : card.types?.[0] === "Lightning" ? "#f59e0b"
    : "#64748b";

  const isHolo = card.rarity?.toLowerCase().includes("holo") || card.rarity?.toLowerCase().includes("rare");
  const era    = getEra(card.set?.releaseDate);

  const prices   = ebay.items.map(i => i.price).filter(Boolean);
  const ebayAvg  = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : null;
  const ebayHigh = prices.length ? Math.max(...prices) : null;
  const ebayLow  = prices.length ? Math.min(...prices) : null;

  const tcgPrice    = getTcgPrice(card);
  const cmPrice     = card.cardmarket?.prices?.averageSellPrice || null;
  const bestPrice   = ebayAvg || tcgPrice || cmPrice || null;
  const priceSource = ebayAvg ? "eBay avg" : tcgPrice ? "TCGplayer" : cmPrice ? "CardMarket" : null;

  const handleGradeTab = async (g) => {
    setCondition(g);
    if (!collectionItem || collectionItem.grade === g) return;
    setGradeUpdating(true);
    const updates = { grade: g, current_price: null };
    await updateCard(collectionItem.id, updates);
    setCollectionItem(prev => ({ ...prev, ...updates }));
    setGradeUpdating(false);
  };

  const handleAdd = async () => {
    if (!card) return;
    setAdding(true);
    const item = await addCard({
      card_id:        card.id,
      name:           card.name,
      set_name:       card.set?.name,
      set_id:         card.set?.id,
      number:         card.number,
      image_url:      card.images?.small,
      rarity:         card.rarity,
      condition:      addCond,
      grade:          addGrade,
      current_price:  bestPrice,
      purchase_price: addPrice ? parseFloat(addPrice) : null,
      holo:           card.rarity?.toLowerCase().includes("holo"),
      flagged:        false,
      print_variant:  "unlimited",
      language:       "en",
      quantity:       1,
      era:            getEra(card.set?.releaseDate),
    });
    setAdding(false);
    setCollectionItem(item);
    setShowAddForm(false);
  };

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh", padding:"20px 24px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        <div style={{ fontSize:12, color:"var(--text-dim)", marginBottom:16, display:"flex", gap:6, fontFamily:"var(--font-mono)" }}>
          <Link href="/browse" style={{ color:"var(--text-muted)", textDecoration:"none" }}>Browse</Link>
          <span>›</span>
          <span>{card.set?.name}</span>
          <span>›</span>
          <span style={{ color:"var(--text-secondary)" }}>{card.name}</span>
        </div>

        <div style={{ display:"flex", gap:24, alignItems:"flex-start", marginBottom:24, flexWrap:"wrap" }}>
          <div style={{ flexShrink:0 }}>
            {card.images?.large
              ? <img src={card.images.large} alt={card.name} style={{ width:200, borderRadius:12, boxShadow:`0 8px 32px ${typeColor}33` }} />
              : <div style={{ width:200, height:280, borderRadius:12, background:`${typeColor}22`, border:`1px solid ${typeColor}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>🃏</div>
            }
          </div>

          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
              <h1 style={{ fontSize:26, fontWeight:700, color:"var(--text-primary)", margin:0, letterSpacing:"-0.5px" }}>{card.name}</h1>
              {isHolo && <HoloBadge />}
              <EraTag era={era} />
              {card.rarity && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:`${typeColor}22`, color:typeColor, border:`1px solid ${typeColor}44` }}>{card.rarity}</span>}
            </div>
            <div style={{ fontSize:14, color:"var(--text-muted)", marginBottom:16 }}>
              {card.set?.name} · #{card.number} · {card.set?.releaseDate?.slice(0,4)}
            </div>

            {card.types && (
              <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                {card.types.map(t => (
                  <span key={t} style={{ fontSize:12, padding:"4px 12px", borderRadius:6, background:`${typeColor}22`, color:typeColor, border:`1px solid ${typeColor}44`, fontWeight:500 }}>{t}</span>
                ))}
              </div>
            )}

            {bestPrice && (
              <div style={{ marginBottom:16, padding:"10px 14px", background:"#0a1a0a", border:"1px solid #22c55e33", borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:20, fontWeight:700, color:"var(--accent-green)" }}>{fmtFull(bestPrice)}</div>
                <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>est. market value · {priceSource}</div>
              </div>
            )}

            <div style={{ marginBottom: collectionItem ? 8 : 16 }}>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {PRICE_CONDITIONS.map(c => {
                  const isOwned  = collectionItem?.grade === c;
                  const isActive = condition === c;
                  return (
                    <button key={c} onClick={() => handleGradeTab(c)} style={{
                      padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                      fontFamily:"var(--font-mono)",
                      border:     isOwned ? "2px solid var(--accent-green)" : isActive ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
                      background: isOwned ? "#052e16" : isActive ? "#1e3a5f" : "transparent",
                      color:      isOwned ? "#4ade80" : isActive ? "#93c5fd" : "var(--text-muted)",
                      transition:"all .15s", position:"relative",
                    }}>
                      {c}
                      {isOwned && gradeUpdating && <span style={{ marginLeft:4, fontSize:9 }}>...</span>}
                      {isOwned && !gradeUpdating && <span style={{ marginLeft:4, fontSize:9 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {collectionItem && (
                <div style={{ fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)", marginTop:5 }}>
                  Green = your copy's grade · tap to update grade or filter price view
                </div>
              )}
            </div>

            {!collectionItem && (
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:8 }}>
                <Button variant="primary" onClick={() => setShowAddForm(!showAddForm)} style={{ fontSize:10 }}>
                  {showAddForm ? "Cancel" : "+ ADD TO COLLECTION"}
                </Button>
                <Link href="/scan">
                  <Button variant="secondary" style={{ fontSize:12 }}>Scan a copy</Button>
                </Link>
              </div>
            )}

            {showAddForm && !collectionItem && (
              <div style={{ marginTop:14, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"14px" }}>
                <SectionLabel style={{ marginBottom:10 }}>Quick add</SectionLabel>
                {bestPrice
                  ? <div style={{ marginBottom:10, padding:"8px 10px", background:"#0a1a0a", border:"1px solid #22c55e22", borderRadius:6, fontSize:11, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
                      Will log market value as <span style={{ color:"var(--accent-green)" }}>{fmtFull(bestPrice)}</span> ({priceSource})
                    </div>
                  : <div style={{ marginBottom:10, padding:"8px 10px", background:"#1a0a00", border:"1px solid #92400e44", borderRadius:6, fontSize:11, color:"#fbbf24" }}>
                      ⚠ No market price found — card will be flagged as unpriced
                    </div>
                }
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:5 }}>Condition</div>
                    <select value={addCond} onChange={e=>setAddCond(e.target.value)} style={{ width:"100%", padding:"7px 10px", fontSize:12, borderRadius:7 }}>
                      {COND_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:5 }}>Grade</div>
                    <select value={addGrade} onChange={e=>setAddGrade(e.target.value)} style={{ width:"100%", padding:"7px 10px", fontSize:12, borderRadius:7 }}>
                      {GRADE_OPTIONS.map(g=><option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:5 }}>Purchase price (optional)</div>
                  <input value={addPrice} onChange={e=>setAddPrice(e.target.value)} placeholder="$0.00" style={{ width:"100%", padding:"7px 10px", fontSize:12, borderRadius:7 }} />
                </div>
                <div style={{ fontSize:11, color:"#f87171", marginBottom:10 }}>
                  ⚠ For full variant verification, use the <Link href="/scan" style={{ color:"var(--accent-blue)" }}>Scan flow</Link> instead.
                </div>
                <Button variant="success" onClick={handleAdd} disabled={adding} style={{ width:"100%", fontSize:10 }}>
                  {adding ? "ADDING..." : "ADD TO COLLECTION"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {collectionItem && (
          <MyCopyPanel
            collectionItem={collectionItem}
            bestPrice={bestPrice}
            onUpdated={(updated) => setCollectionItem(updated)}
            onDeleted={() => setCollectionItem(null)}
          />
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:"eBay avg (30d)",  value:ebayAvg,  sub:`${prices.length} sold listings`, accent:true,  dot:"#f59e0b" },
            { label:"eBay high (30d)", value:ebayHigh, sub:"top sold price",                 accent:false, dot:"#f59e0b" },
            { label:"eBay low (30d)",  value:ebayLow,  sub:"lowest sold price",              accent:false, dot:"#f59e0b" },
            { label:"TCGplayer",       value:tcgPrice,  sub:"market price",                  accent:false, dot:"#3b82f6" },
            { label:"CardMarket",      value:cmPrice,   sub:"avg sell price",                accent:false, dot:"#a855f7" },
          ].map(({ label, value, sub, accent, dot }) => (
            <Panel key={label} accent={accent?"var(--accent-amber)":null} style={{ padding:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:dot, flexShrink:0 }} />
                <SectionLabel>{label}</SectionLabel>
              </div>
              {value != null
                ? <div style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:700, color: accent?"var(--accent-green)":"var(--text-primary)" }}>{fmtFull(value)}</div>
                : <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-dim)" }}>—</div>
              }
              {sub && <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:4 }}>{sub}</div>}
            </Panel>
          ))}
        </div>

        <Panel style={{ padding:"18px 20px 12px", marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <SectionLabel>Price history · {condition}</SectionLabel>
              {bestPrice && <div style={{ fontFamily:"var(--font-pixel)", fontSize:14, color:"var(--accent-gold)", marginTop:4 }}>{fmtFull(bestPrice)}</div>}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {["30d","90d","6mo","1yr"].map(r => (
                <button key={r} onClick={() => setChartRange(r)} style={{ padding:"3px 10px", borderRadius:4, fontSize:10, cursor:"pointer", fontFamily:"var(--font-mono)", border: chartRange===r?"1px solid var(--accent-amber)":"1px solid var(--border)", background: chartRange===r?"#2a1e00":"transparent", color: chartRange===r?"var(--accent-gold)":"var(--text-dim)" }}>{r}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={MOCK_HISTORY} margin={{ top:4, right:0, bottom:0, left:0 }}>
              <XAxis dataKey="d" tick={{ fill:"var(--text-dim)", fontSize:10, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"var(--text-dim)", fontSize:10, fontFamily:"var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)} width={44} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="p" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r:3, fill:"#f59e0b", strokeWidth:0 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:8 }}>Price history shows mock data — real tracking coming soon.</div>
        </Panel>

        <div style={{ display:"flex", gap:0, borderBottom:"1px solid var(--border)", marginBottom:16 }}>
          {[
            { key:"ebay",  label:`eBay Sold (${ebay.items.length})` },
            { key:"stats", label:"Card stats" },
            { key:"sets",  label:"Other printings" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding:"10px 18px", fontSize:13, fontWeight:500, background:"transparent", border:"none", borderBottom: tab===key?"2px solid var(--accent-amber)":"2px solid transparent", color: tab===key?"var(--accent-gold)":"var(--text-muted)", cursor:"pointer", marginBottom:-1 }}>{label}</button>
          ))}
        </div>

        {tab === "ebay" && (
          <Panel style={{ overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border-dim)" }}>
              <div style={{ fontSize:12, color:"var(--text-muted)" }}>
                eBay <strong style={{ color:"var(--accent-gold)" }}>sold</strong> listings · {condition}
                {ebay.source === "mock" && <span style={{ marginLeft:8, fontSize:10, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>(demo data — add eBay API key for live)</span>}
              </div>
            </div>
            {ebay.source === "loading" ? (
              <div style={{ padding:32, display:"flex", justifyContent:"center" }}><Spinner /></div>
            ) : ebay.items.length === 0 ? (
              <div style={{ padding:32, textAlign:"center", color:"var(--text-dim)", fontSize:13 }}>No sold listings found</div>
            ) : (
              <>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid var(--border-dim)" }}>
                      {["Date","Title","Cond.","Type","Sold for"].map(h => (
                        <th key={h} style={{ padding:"8px 14px", textAlign:"left", color:"var(--text-dim)", fontWeight:500, fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", fontFamily:"var(--font-mono)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ebay.items.map((item, i) => (
                      <tr key={item.id} style={{ borderBottom:"1px solid var(--border-dim)", background: i%2===0?"transparent":"#050a12" }}>
                        <td style={{ padding:"10px 14px", color:"var(--text-muted)", whiteSpace:"nowrap", fontFamily:"var(--font-mono)", fontSize:11 }}>{timeAgo(item.date)}</td>
                        <td style={{ padding:"10px 14px", color:"var(--text-secondary)", maxWidth:320 }}>
                          {item.url
                            ? <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color:"var(--accent-blue)", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>{item.title}</a>
                            : <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                          }
                          {item.bids && <div style={{ fontSize:10, color:"var(--text-dim)", marginTop:1 }}>{item.bids} bids</div>}
                        </td>
                        <td style={{ padding:"10px 14px" }}>
                          <span style={{ fontSize:10, padding:"2px 6px", borderRadius:3, background:"#1c2f1c", color:"#6ee7b7", fontFamily:"var(--font-mono)" }}>{item.condition}</span>
                        </td>
                        <td style={{ padding:"10px 14px" }}>
                          <span style={{ fontSize:10, padding:"2px 6px", borderRadius:3, background: item.type==="Auction"?"#2d1b00":"#1a1f2e", color: item.type==="Auction"?"#fb923c":"#64748b", fontFamily:"var(--font-mono)" }}>{item.type}</span>
                        </td>
                        <td style={{ padding:"10px 14px" }}>
                          <div style={{ fontWeight:700, fontFamily:"var(--font-mono)", color:"var(--text-primary)", fontSize:13 }}>{fmtFull(item.price)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ebayAvg && (
                  <div style={{ padding:"10px 14px", borderTop:"1px solid var(--border-dim)", display:"flex", gap:24, fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>
                    <span>Avg: <span style={{ color:"#f59e0b", fontWeight:600 }}>{fmtFull(ebayAvg)}</span></span>
                    {ebayHigh && <span>High: <span style={{ color:"#4ade80" }}>{fmtFull(ebayHigh)}</span></span>}
                    {ebayLow  && <span>Low: <span style={{ color:"#f87171" }}>{fmtFull(ebayLow)}</span></span>}
                    {ebay.ebaySearchUrl && (
                      <a href={ebay.ebaySearchUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft:"auto", color:"var(--accent-blue)", textDecoration:"none" }}>View on eBay ↗</a>
                    )}
                  </div>
                )}
              </>
            )}
          </Panel>
        )}

        {tab === "stats" && (
          <Panel style={{ padding:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
              {[
                { label:"HP",      value: card.hp ? `${card.hp} HP` : "—" },
                { label:"Rarity",  value: card.rarity || "—" },
                { label:"Artist",  value: card.artist || "—" },
                { label:"Set",     value: card.set?.name || "—" },
                { label:"Release", value: card.set?.releaseDate || "—" },
                { label:"Number",  value: card.number ? `${card.number}/${card.set?.printedTotal || "?"}` : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <SectionLabel style={{ marginBottom:4 }}>{label}</SectionLabel>
                  <div style={{ fontSize:13, color:"var(--text-secondary)" }}>{value}</div>
                </div>
              ))}
            </div>
            {card.attacks?.length > 0 && (
              <div style={{ marginTop:20 }}>
                <SectionLabel style={{ marginBottom:10 }}>Attacks</SectionLabel>
                {card.attacks.map(a => (
                  <div key={a.name} style={{ background:"var(--bg-base)", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{a.name}</span>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:typeColor }}>{a.damage}</span>
                    </div>
                    {a.text && <div style={{ fontSize:11, color:"var(--text-muted)", lineHeight:1.5 }}>{a.text}</div>}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {tab === "sets" && (
          <Panel style={{ padding:20 }}>
            <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>
              Other sets containing <strong style={{ color:"var(--text-primary)" }}>{card.name}</strong>
            </div>
            <Link href={`/browse?q=${encodeURIComponent(card.name)}`} style={{ textDecoration:"none" }}>
              <Button variant="secondary" style={{ fontSize:12 }}>Browse all printings of {card.name} →</Button>
            </Link>
          </Panel>
        )}

      </div>
    </div>
  );
}
