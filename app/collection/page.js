"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCollection, removeCard, updateCard } from "@/lib/collection";
import { Panel, SectionLabel, PriceTag, HoloBadge, FlaggedBadge, EraTag, MonoText, PixelText, EmptyState, Button, Spinner } from "@/components/shared/ui";

const CONDITIONS_ALL = ["All","NM","LP","MP","HP","D"];
const CONDITIONS     = ["NM","LP","MP","HP","D"];
const GRADES_ALL     = ["All","Raw","PSA","BGS","CGC"];
const GRADES         = ["Raw","PSA 10","PSA 9","PSA 8","PSA 7","BGS 9.5","BGS 9","CGC 10","CGC 9"];
const SORT_OPTS = [
  { value:"date_desc",  label:"Newest first" },
  { value:"date_asc",   label:"Oldest first" },
  { value:"price_desc", label:"Value ↓" },
  { value:"price_asc",  label:"Value ↑" },
  { value:"name",       label:"Name A–Z" },
];

function fmt(n) {
  if (n == null || n === 0) return null;
  return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function fmtFull(n) {
  if (n == null) return "—";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── Edit Card Modal ── */
function EditModal({ card, onSave, onClose }) {
  const [grade,     setGrade]     = useState(card.grade     || "Raw");
  const [condition, setCondition] = useState(card.condition || "NM");
  const [purchase,  setPurchase]  = useState(card.purchase_price || "");
  const [notes,     setNotes]     = useState(card.notes     || "");
  const [saving,    setSaving]    = useState(false);

  const gradeChanged = grade !== card.grade;

  const handleSave = async () => {
    setSaving(true);
    const updates = { grade, condition, notes };
    if (purchase !== "") updates.purchase_price = parseFloat(purchase);
    /* If grade changed, flag for price refresh */
    if (gradeChanged) updates.current_price = null;
    await updateCard(card.id, updates);
    setSaving(false);
    onSave({ ...card, ...updates });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <Panel style={{ width:"100%", maxWidth:420, padding:24 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, paddingBottom:16, borderBottom:"1px solid var(--border-dim)" }}>
          {card.image_url
            ? <img src={card.image_url} alt={card.name} style={{ width:44, height:60, objectFit:"contain", borderRadius:6 }} />
            : <div style={{ width:44, height:60, borderRadius:6, background:"var(--bg-base)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🃏</div>
          }
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{card.name}</div>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{card.set_name} · #{card.number}</div>
          </div>
        </div>

        {/* Grade — most important field */}
        <div style={{ marginBottom:16 }}>
          <SectionLabel style={{ marginBottom:8 }}>Grade</SectionLabel>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {GRADES.map(g => (
              <button key={g} onClick={() => setGrade(g)} style={{ padding:"6px 11px", borderRadius:6, fontSize:11, cursor:"pointer", border: grade===g ? "1px solid var(--accent-blue)" : "1px solid var(--border)", background: grade===g ? "#1e3a5f" : "transparent", color: grade===g ? "#93c5fd" : "var(--text-muted)" }}>{g}</button>
            ))}
          </div>
          {gradeChanged && (
            <div style={{ marginTop:8, padding:"8px 10px", background:"#0a1a00", border:"1px solid #22c55e33", borderRadius:6, fontSize:11, color:"#4ade80" }}>
              ✦ Grade changed — market price will refresh automatically
            </div>
          )}
        </div>

        {/* Condition */}
        <div style={{ marginBottom:16 }}>
          <SectionLabel style={{ marginBottom:8 }}>Condition</SectionLabel>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => setCondition(c)} style={{ padding:"6px 11px", borderRadius:6, fontSize:11, cursor:"pointer", border: condition===c ? "1px solid var(--accent-amber)" : "1px solid var(--border)", background: condition===c ? "#2a1e00" : "transparent", color: condition===c ? "var(--accent-gold)" : "var(--text-muted)" }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Purchase price */}
        <div style={{ marginBottom:16 }}>
          <SectionLabel style={{ marginBottom:8 }}>Purchase price</SectionLabel>
          <input
            value={purchase}
            onChange={e => setPurchase(e.target.value)}
            placeholder={card.purchase_price ? fmtFull(card.purchase_price) : "$0.00"}
            style={{ width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13, fontFamily:"var(--font-mono)" }}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom:20 }}>
          <SectionLabel style={{ marginBottom:8 }}>Notes</SectionLabel>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Bought at local card show, minor edge wear..."
            style={{ width:"100%", padding:"9px 12px", borderRadius:8, fontSize:13 }}
          />
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:"11px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"var(--font-pixel)", opacity: saving ? 0.7 : 1 }}>
            {saving ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* ── Delete Modal ── */
function DeleteModal({ card, onConfirm, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <Panel style={{ padding:24, maxWidth:360, width:"100%", textAlign:"center" }}>
        <PixelText size={11} color="#f87171" style={{ display:"block", marginBottom:12 }}>RELEASE CARD?</PixelText>
        <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:4 }}>{card.name}</div>
        <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:6 }}>{card.set_name} · {card.grade}</div>
        {card.current_price && (
          <div style={{ fontSize:12, color:"var(--text-dim)", marginBottom:20, fontFamily:"var(--font-mono)" }}>
            Current value: <span style={{ color:"var(--accent-gold)" }}>{fmtFull(card.current_price)}</span>
          </div>
        )}
        <div style={{ fontSize:11, color:"var(--text-dim)", marginBottom:20, fontStyle:"italic" }}>
          Released to another trainer
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>Keep it</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #7f1d1d", background:"#450a0a", color:"#f87171", cursor:"pointer", fontSize:12, fontWeight:600 }}>Release</button>
        </div>
      </Panel>
    </div>
  );
}

function CollectionInner() {
  const searchParams = useSearchParams();
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState("grid");
  const [sortBy,      setSortBy]      = useState("date_desc");
  const [filterCond,  setFilterCond]  = useState("All");
  const [filterGrade, setFilterGrade] = useState("All");
  const [filterHolo,  setFilterHolo]  = useState(false);
  const [query,       setQuery]       = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [toDelete,    setToDelete]    = useState(null);
  const [toEdit,      setToEdit]      = useState(null);

  const filterFlagged = searchParams.get("filter") === "flagged";

  useEffect(() => {
    getCollection().then(c => { setItems(c); setLoading(false); });
  }, []);

  const filtered = items
    .filter(c => {
      if (filterFlagged && !c.flagged) return false;
      if (query && !c.name?.toLowerCase().includes(query.toLowerCase()) &&
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
      return new Date(b.added_at) - new Date(a.added_at);
    });

  const pricedItems  = filtered.filter(c => c.current_price > 0);
  const totalValue   = pricedItems.reduce((s, c) => s + c.current_price * (c.quantity || 1), 0);
  const unpricedCount = filtered.filter(c => !c.current_price || c.current_price === 0).length;

  const handleDelete = async () => {
    if (!toDelete) return;
    await removeCard(toDelete.id);
    setItems(prev => prev.filter(c => c.id !== toDelete.id));
    setToDelete(null);
  };

  const handleEditSave = (updated) => {
    setItems(prev => prev.map(c => c.id === updated.id ? updated : c));
    setToEdit(null);
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spinner size={32} /></div>;

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh", padding:"20px 24px 60px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <SectionLabel style={{ marginBottom:4 }}>
              {filterFlagged ? "⚠ NEEDS REVIEW" : "CARDEX COLLECTION"}
            </SectionLabel>
            <h1 style={{ fontSize:20, fontWeight:700, color:"var(--text-primary)", margin:0 }}>
              {filterFlagged ? "Flagged Cards" : "All Cards"}
            </h1>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4, fontFamily:"var(--font-mono)" }}>
              {filtered.length} cards · {fmt(totalValue) || "$0"} total
              {unpricedCount > 0 && <span style={{ color:"#fbbf24", marginLeft:8 }}>· {unpricedCount} unpriced</span>}
            </div>
          </div>
          {/* Two equal CTAs */}
          <div style={{ display:"flex", gap:10 }}>
            <Link href="/browse">
              <button style={{ padding:"10px 18px", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>
                + Add Manually
              </button>
            </Link>
            <Link href="/scan">
              <Button variant="primary" style={{ fontSize:10, whiteSpace:"nowrap" }}>⬡ Scan Card</Button>
            </Link>
          </div>
        </div>

        {/* Unpriced warning */}
        {unpricedCount > 0 && (
          <div style={{ background:"#1a1200", border:"1px solid #92400e44", borderRadius:8, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:14 }}>⚠️</span>
            <div style={{ fontSize:12, color:"#fbbf24" }}>
              {unpricedCount} card{unpricedCount > 1 ? "s" : ""} couldn't be priced automatically.
              <span style={{ color:"var(--text-dim)", marginLeft:6 }}>Tap the card and edit to update manually.</span>
            </div>
          </div>
        )}

        {/* Search + controls */}
        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your collection..."
            style={{ flex:1, minWidth:200, padding:"10px 14px", borderRadius:8, fontSize:13 }} />
          <button onClick={() => setShowFilters(!showFilters)} style={{ padding:"10px 14px", borderRadius:8, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:6, border: showFilters ? "1px solid var(--accent-blue)" : "1px solid var(--border)", background: showFilters ? "#1e3a5f" : "transparent", color: showFilters ? "#93c5fd" : "var(--text-muted)" }}>⊞ Filters</button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:"10px 12px", borderRadius:8, fontSize:12, cursor:"pointer" }}>
            {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ display:"flex", border:"1px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
            {[{v:"grid",i:"⊞"},{v:"list",i:"≡"}].map(({v,i}) => (
              <button key={v} onClick={() => setView(v)} style={{ width:38, height:38, border:"none", cursor:"pointer", fontSize:15, background: view===v ? "#1e3a5f" : "transparent", color: view===v ? "#93c5fd" : "var(--text-muted)" }}>{i}</button>
            ))}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Panel style={{ padding:"14px 16px", marginBottom:14 }}>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              <div>
                <SectionLabel style={{ marginBottom:7 }}>Condition</SectionLabel>
                <div style={{ display:"flex", gap:5 }}>
                  {CONDITIONS_ALL.map(c => (
                    <button key={c} onClick={() => setFilterCond(c)} style={{ padding:"4px 10px", borderRadius:5, fontSize:11, cursor:"pointer", border: filterCond===c ? "1px solid var(--accent-amber)" : "1px solid var(--border)", background: filterCond===c ? "#2a1e00" : "transparent", color: filterCond===c ? "var(--accent-gold)" : "var(--text-muted)" }}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel style={{ marginBottom:7 }}>Grade</SectionLabel>
                <div style={{ display:"flex", gap:5 }}>
                  {GRADES_ALL.map(g => (
                    <button key={g} onClick={() => setFilterGrade(g)} style={{ padding:"4px 10px", borderRadius:5, fontSize:11, cursor:"pointer", border: filterGrade===g ? "1px solid var(--accent-blue)" : "1px solid var(--border)", background: filterGrade===g ? "#1e3a5f" : "transparent", color: filterGrade===g ? "#93c5fd" : "var(--text-muted)" }}>{g}</button>
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

        {/* Empty */}
        {filtered.length === 0 && (
          <EmptyState icon="🃏" title="YOUR PC BOX IS EMPTY"
            subtitle={items.length > 0 ? "Try changing your filters" : "Scan or add your first card to get started"}
            action={items.length === 0 ? (
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <Link href="/browse"><button style={{ padding:"10px 18px", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", cursor:"pointer", fontSize:12 }}>+ Add Manually</button></Link>
                <Link href="/scan"><Button variant="primary" style={{ fontSize:10 }}>⬡ Scan Card</Button></Link>
              </div>
            ) : null}
          />
        )}

        {/* Grid view */}
        {filtered.length > 0 && view === "grid" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(175px, 1fr))", gap:12 }}>
            {filtered.map(card => (
              <GridCard key={card.id} card={card}
                onDelete={() => setToDelete(card)}
                onEdit={() => setToEdit(card)}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {filtered.length > 0 && view === "list" && (
          <Panel style={{ overflow:"hidden" }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 80px 80px 120px 64px", gap:12, padding:"8px 16px", borderBottom:"1px solid var(--border-dim)" }}>
              {["Card","Set","Condition","Grade","Value",""].map(h => <SectionLabel key={h}>{h}</SectionLabel>)}
            </div>
            {filtered.map((card, i) => (
              <ListRow key={card.id} card={card} last={i === filtered.length - 1}
                onDelete={() => setToDelete(card)}
                onEdit={() => setToEdit(card)}
              />
            ))}
          </Panel>
        )}

        {/* Delete modal */}
        {toDelete && <DeleteModal card={toDelete} onConfirm={handleDelete} onClose={() => setToDelete(null)} />}

        {/* Edit modal */}
        {toEdit && <EditModal card={toEdit} onSave={handleEditSave} onClose={() => setToEdit(null)} />}
      </div>
    </div>
  );
}

/* ── Grid card ── */
function GridCard({ card, onDelete, onEdit }) {
  const hasPrice  = card.current_price && card.current_price > 0;
  const hasCost   = card.purchase_price && card.purchase_price > 0;
  const gain      = hasPrice && hasCost ? card.current_price - card.purchase_price : null;
  const gainPct   = gain !== null ? ((gain / card.purchase_price) * 100).toFixed(1) : null;

  return (
    <Panel style={{ overflow:"hidden", position:"relative" }}>
      {/* Action buttons — always visible on mobile, hover on desktop */}
      <div style={{ position:"absolute", top:6, right:6, display:"flex", gap:4, zIndex:2 }}>
        <button onClick={e => { e.preventDefault(); onEdit(); }} style={{ width:22, height:22, borderRadius:"50%", background:"#1e3a5f", border:"1px solid #2d5a8e", color:"#93c5fd", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }} title="Edit">✎</button>
        <button onClick={e => { e.preventDefault(); onDelete(); }} style={{ width:22, height:22, borderRadius:"50%", background:"#450a0a", border:"1px solid #7f1d1d", color:"#f87171", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }} title="Remove">✕</button>
      </div>

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
            {card.grade && card.grade !== "Raw" && (
              <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3, background:"#1e3a5f", border:"1px solid #2d5a8e", color:"#93c5fd", fontFamily:"var(--font-mono)" }}>{card.grade}</span>
            )}
            {card.print_variant && card.print_variant !== "unlimited" && (
              <span style={{ fontSize:9, padding:"1px 5px", borderRadius:3, background:"#2a1e00", border:"1px solid #92400e", color:"#fbbf24", fontFamily:"var(--font-mono)" }}>
                {card.print_variant === "1st_edition" ? "1st Ed" : card.print_variant}
              </span>
            )}
          </div>

          {/* Market value — primary */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
            {hasPrice
              ? <span style={{ fontFamily:"var(--font-mono)", fontSize:14, fontWeight:700, color:"var(--accent-gold)" }}>{fmtFull(card.current_price)}</span>
              : <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#fbbf24" }}>— needs pricing</span>
            }
            {gainPct && (
              <span style={{ fontSize:10, color: gain >= 0 ? "#4ade80" : "#f87171", fontFamily:"var(--font-mono)" }}>
                {gain >= 0 ? "+" : ""}{gainPct}%
              </span>
            )}
          </div>

          {/* Cost basis — secondary */}
          {hasCost && hasPrice && (
            <div style={{ fontSize:9, color:"var(--text-dim)", marginTop:3, fontFamily:"var(--font-mono)" }}>
              paid {fmtFull(card.purchase_price)}
            </div>
          )}
        </div>
      </Link>
    </Panel>
  );
}

/* ── List row ── */
function ListRow({ card, last, onDelete, onEdit }) {
  const hasPrice = card.current_price && card.current_price > 0;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 80px 80px 120px 64px", gap:12, padding:"10px 16px", borderBottom: last ? "none" : "1px solid var(--border-dim)", alignItems:"center" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <Link href={`/card/${card.card_id}`} style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:28, height:28, borderRadius:6, background:`${card.color||"#1e2d3d"}22`, border:`1px solid ${card.color||"#1e2d3d"}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
          {card.image_url ? <img src={card.image_url} alt="" style={{ width:28, height:28, objectFit:"contain", borderRadius:4 }} /> : "🃏"}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.name}</div>
          {card.flagged && <FlaggedBadge />}
        </div>
      </Link>
      <div style={{ fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.set_name}</div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>{card.condition}</div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>{card.grade}</div>
      <div>
        {hasPrice
          ? <span style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:700, color:"var(--accent-gold)" }}>{fmtFull(card.current_price)}</span>
          : <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#fbbf24" }}>— unpriced</span>
        }
        {card.purchase_price && hasPrice && (
          <div style={{ fontSize:9, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>paid {fmtFull(card.purchase_price)}</div>
        )}
      </div>
      <div style={{ display:"flex", gap:5 }}>
        <button onClick={onEdit} style={{ width:26, height:26, borderRadius:5, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#2d5a8e"; e.currentTarget.style.color="#93c5fd"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-muted)"; }}>✎</button>
        <button onClick={onDelete} style={{ width:26, height:26, borderRadius:5, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#7f1d1d"; e.currentTarget.style.color="#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-muted)"; }}>✕</button>
      </div>
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
