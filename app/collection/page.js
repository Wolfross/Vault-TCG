"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCollection, removeCard } from "@/lib/collection";
import { Panel, SectionLabel, PriceTag, HoloBadge, FlaggedBadge, EraTag, MonoText, PixelText, EmptyState, Button, Spinner } from "@/components/shared/ui";

const CONDITIONS = ["All","NM","LP","MP","HP","D"];
const GRADES     = ["All","Raw","PSA","BGS","CGC"];
const SORT_OPTS  = [
  { value:"date_desc",   label:"Newest first" },
  { value:"date_asc",    label:"Oldest first" },
  { value:"price_desc",  label:"Value ↓" },
  { value:"price_asc",   label:"Value ↑" },
  { value:"name",        label:"Name A–Z" },
  { value:"gain",        label:"Best gainers" },
];

function fmt(n) { return "$" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 }); }

function CollectionInner() {
  const searchParams = useSearchParams();
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState("grid");
  const [sortBy,     setSortBy]     = useState("date_desc");
  const [filterCond, setFilterCond] = useState("All");
  const [filterGrade,setFilterGrade]= useState("All");
  const [filterHolo, setFilterHolo] = useState(false);
  const [query,      setQuery]      = useState("");
  const [showFilters,setShowFilters]= useState(false);
  const [selected,   setSelected]   = useState(null);

  const filterFlagged = searchParams.get("filter") === "flagged";

  useEffect(() => {
    getCollection().then(c => { setItems(c); setLoading(false); });
  }, []);

  const filtered = items
    .filter(c => {
      if (filterFlagged && !c.flagged) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase()) &&
          !c.set_name?.toLowerCase().includes(query.toLowerCase())) return false;
      if (filterCond !== "All" && c.condition !== filterCond) return false;
      if (filterGrade !== "All") {
        if (filterGrade === "Raw" && c.grade !== "Raw") return false;
        if (filterGrade !== "Raw" && !c.grade?.startsWith(filterGrade)) return false;
      }
      if (filterHolo && !c.holo) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_desc") return (b.current_price || 0) - (a.current_price || 0);
      if (sortBy === "price_asc")  return (a.current_price || 0) - (b.current_price || 0);
      if (sortBy === "name")       return a.name.localeCompare(b.name);
      if (sortBy === "date_asc")   return new Date(a.added_at) - new Date(b.added_at);
      if (sortBy === "gain")       return (b.week_change || 0) - (a.week_change || 0);
      return new Date(b.added_at) - new Date(a.added_at);
    });

  const totalValue = filtered.reduce((s, c) => s + (c.current_price || 0) * c.quantity, 0);

  const handleDelete = async (id) => {
    await removeCard(id);
    setItems(prev => prev.filter(c => c.id !== id));
    setSelected(null);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spinner size={32} /></div>;

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh", padding:"20px 24px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20 }}>
          <div>
            <SectionLabel style={{ marginBottom:4 }}>
              {filterFlagged ? "⚠ NEEDS REVIEW" : "CARDEX COLLECTION"}
            </SectionLabel>
            <h1 style={{ fontSize:20, fontWeight:700, color:"var(--text-primary)", margin:0 }}>
              {filterFlagged ? "Flagged Cards" : "All Cards"}
            </h1>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4, fontFamily:"var(--font-mono)" }}>
              {filtered.length} cards · {fmt(totalValue)} total
            </div>
          </div>
          <Link href="/scan"><Button variant="primary" style={{ fontSize:10 }}>+ SCAN CARD</Button></Link>
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your collection..."
            style={{ flex:1, minWidth:200, padding:"10px 14px", borderRadius:8, fontSize:13 }}
          />
          <button onClick={() => setShowFilters(!showFilters)} style={{
            padding:"10px 14px", borderRadius:8, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:6,
            border: showFilters ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
            background: showFilters ? "#1e3a5f" : "transparent",
            color: showFilters ? "#93c5fd" : "var(--text-muted)",
          }}>⊞ Filters</button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:"10px 12px", borderRadius:8, fontSize:12, cursor:"pointer" }}>
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ display:"flex", border:"1px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
            {[{v:"grid",i:"⊞"},{v:"list",i:"≡"}].map(({v,i}) => (
              <button key={v} onClick={() => setView(v)} style={{ width:38, height:38, border:"none", cursor:"pointer", fontSize:15, background: view === v ? "#1e3a5f" : "transparent", color: view === v ? "#93c5fd" : "var(--text-muted)" }}>{i}</button>
            ))}
          </div>
        </div>

        {showFilters && (
          <Panel style={{ padding:"14px 16px", marginBottom:14 }}>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <div>
                <SectionLabel style={{ marginBottom:7 }}>Condition</SectionLabel>
                <div style={{ display:"flex", gap:5 }}>
                  {CONDITIONS.map(c => (
                    <button key={c} onClick={() => setFilterCond(c)} style={{ padding:"4px 10px", borderRadius:5, fontSize:11, cursor:"pointer", border: filterCond === c ? "1px solid var(--accent-amber)" : "1px solid var(--border)", background: filterCond === c ? "#2a1e00" : "transparent", color: filterCond === c ? "var(--accent-gold)" : "var(--text-muted)" }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel style={{ marginBottom:7 }}>Grade</SectionLabel>
                <div style={{ display:"flex", gap:5 }}>
                  {GRADES.map(g => (
                    <button key={g} onClick={() => setFilterGrade(g)} style={{ padding:"4px 10px", borderRadius:5, fontSize:11, cursor:"pointer", border: filterGrade === g ? "1px solid var(--accent-blue)" : "1px solid var(--border)", background: filterGrade === g ? "#1e3a5f" : "transparent", color: filterGrade === g ? "#93c5fd" : "var(--text-muted)" }}>{g}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"flex-end" }}>
                <button onClick={() => setFilterHolo(!filterHolo)} style={{ padding:"6px 12px", borderRadius:6, fontSize:11, cursor:"pointer", border: filterHolo ? "1px solid #a855f7" : "1px solid var(--border)", background: filterHolo ? "#2e1065" : "transparent", color: filterHolo ? "#c4b5fd" : "var(--text-muted)", display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:12, height:12, borderRadius:2, border:`1px solid ${filterHolo?"#a855f7":"var(--border)"}`, background: filterHolo ? "#a855f7" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#000" }}>{filterHolo?"✓":""}</div>
                  Holo only
                </button>
              </div>
            </div>
          </Panel>
        )}

        {filtered.length === 0 && (
          <EmptyState icon="🃏" title="NO CARDS FOUND"
            subtitle={items.length > 0 ? "Try changing your filters" : "Start scanning to build your collection"}
            action={items.length === 0 ? <Link href="/scan"><Button variant="primary">SCAN FIRST CARD</Button></Link> : null}
          />
        )}

        {filtered.length > 0 && view === "grid" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(175px, 1fr))", gap:12 }}>
            {filtered.map(card => <GridCard key={card.id} card={card} onDelete={() => setSelected(card)} />)}
          </div>
        )}

        {filtered.length > 0 && view === "list" && (
          <Panel style={{ overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 80px 80px 100px 32px", gap:12, padding:"8px 16px", borderBottom:"1px solid var(--border-dim)" }}>
              {["Card","Set","Condition","Grade","Value",""].map(h => (
                <SectionLabel key={h}>{h}</SectionLabel>
              ))}
            </div>
            {filtered.map((card, i) => <ListRow key={card.id} card={card} last={i === filtered.length - 1} onDelete={() => setSelected(card)} />)}
          </Panel>
        )}

        {selected && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
            <Panel style={{ padding:"24px", maxWidth:360, width:"90%", textAlign:"center" }}>
              <PixelText size={11} color="#f87171" style={{ display:"block", marginBottom:12 }}>REMOVE CARD?</PixelText>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:6 }}>{selected.name}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:24 }}>{selected.set_name} · {selected.grade}</div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setSelected(null)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>Cancel</button>
                <button onClick={() => handleDelete(selected.id)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #7f1d1d", background:"#450a0a", color:"#f87171", cursor:"pointer", fontSize:12, fontWeight:600 }}>Remove</button>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function GridCard({ card, onDelete }) {
  const gain = card.current_price - (card.purchase_price || card.current_price);
  const gainPct = card.purchase_price ? ((gain / card.purchase_price) * 100).toFixed(1) : null;

  return (
    <Panel style={{ overflow:"hidden", position:"relative" }}
      onMouseEnter={e => e.currentTarget.querySelector(".del-btn").style.opacity = "1"}
      onMouseLeave={e => e.currentTarget.querySelector(".del-btn").style.opacity = "0"}>
      <button className="del-btn" onClick={e => { e.preventDefault(); onDelete(); }} style={{ position:"absolute", top:6, right:6, width:22, height:22, borderRadius:"50%", background:"#450a0a", border:"1px solid #7f1d1d", color:"#f87171", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.15s", zIndex:2 }}>✕</button>
      <Link href={`/card/${card.card_id}`} style={{ textDecoration:"none", display:"block" }}>
        <div style={{ height:100, background:`linear-gradient(135deg, ${card.color || "#1e2d3d"}22, var(--bg-base))`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, position:"relative", borderBottom:"1px solid var(--border-dim)" }}>
          {card.image_url
            ? <img src={card.image_url} alt={card.name} style={{ height:90, objectFit:"contain" }} />
            : <span>{card.icon || "🃏"}</span>
          }
          {card.flagged && <div style={{ position:"absolute", top:4, left:4 }}><FlaggedBadge /></div>}
          <div style={{ position:"absolute", bottom:4, left:5, display:"flex", gap:3 }}>
            <EraTag era={card.era} />
            {card.holo && <HoloBadge />}
          </div>
        </div>
        <div style={{ padding:"10px 10px 12px" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", marginBottom:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.name}</div>
          <div style={{ fontSize:10, color:"var(--text-dim)", marginBottom:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.set_name}</div>
          <div style={{ display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3, background:"var(--bg-base)", border:"1px solid var(--border)", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{card.condition}</span>
            {card.grade !== "Raw" && (
              <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3, background:"#1e3a5f", border:"1px solid #2d5a8e", color:"#93c5fd", fontFamily:"var(--font-mono)" }}>{card.grade}</span>
            )}
            {card.print_variant && card.print_variant !== "unlimited" && (
              <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3, background:"#2a1e00", border:"1px solid #92400e", color:"#fbbf24", fontFamily:"var(--font-mono)" }}>
                {card.print_variant === "1st_edition" ? "1st Ed" : card.print_variant}
              </span>
            )}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
            <PriceTag value={card.current_price || 0} size={13} />
            {gainPct && <span style={{ fontSize:10, color: gain >= 0 ? "#4ade80" : "#f87171", fontFamily:"var(--font-mono)" }}>{gain >= 0 ? "+" : ""}{gainPct}%</span>}
          </div>
        </div>
      </Link>
    </Panel>
  );
}

function ListRow({ card, last, onDelete }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 80px 80px 100px 32px", gap:12, padding:"10px 16px", borderBottom: last ? "none" : "1px solid var(--border-dim)", alignItems:"center" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <Link href={`/card/${card.card_id}`} style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:`${card.color || "#1e2d3d"}22`, border:`1px solid ${card.color || "#1e2d3d"}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
          {card.icon || "🃏"}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.name}</div>
          {card.flagged && <FlaggedBadge />}
        </div>
      </Link>
      <div style={{ fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.set_name}</div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>{card.condition}</div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>{card.grade}</div>
      <PriceTag value={card.current_price || 0} size={13} />
      <button onClick={onDelete} style={{ width:26, height:26, borderRadius:5, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.5 }}
        onMouseEnter={e => { e.currentTarget.style.opacity="1"; e.currentTarget.style.borderColor="#7f1d1d"; e.currentTarget.style.color="#f87171"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity="0.5"; e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-muted)"; }}>✕</button>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spinner size={32} /></div>}>
      <CollectionInner />
    </Suspense>
  );
}
