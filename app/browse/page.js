"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Panel, SectionLabel, MonoText, PixelText, HoloBadge, EraTag, Spinner, EmptyState } from "@/components/shared/ui";

const SETS = [
  { id:"base1",   name:"Base Set",          year:1999, era:"90s", total:102, color:"#f59e0b", icon:"⬡", hot:true  },
  { id:"base2",   name:"Jungle",            year:1999, era:"90s", total:64,  color:"#22c55e", icon:"✦", hot:false },
  { id:"base3",   name:"Fossil",            year:1999, era:"90s", total:62,  color:"#3b82f6", icon:"◆", hot:false },
  { id:"base5",   name:"Team Rocket",       year:2000, era:"90s", total:83,  color:"#7c3aed", icon:"◈", hot:false },
  { id:"neo1",    name:"Neo Genesis",       year:2000, era:"90s", total:111, color:"#06b6d4", icon:"◉", hot:true  },
  { id:"neo2",    name:"Neo Discovery",     year:2001, era:"90s", total:75,  color:"#10b981", icon:"✦", hot:false },
  { id:"ecard1",  name:"Expedition",        year:2002, era:"00s", total:165, color:"#6366f1", icon:"⬠", hot:false },
  { id:"ex1",     name:"Ruby & Sapphire",   year:2003, era:"00s", total:109, color:"#ef4444", icon:"★", hot:false },
  { id:"dp1",     name:"Diamond & Pearl",   year:2007, era:"00s", total:130, color:"#3b82f6", icon:"◆", hot:false },
  { id:"bw1",     name:"Black & White",     year:2011, era:"10s", total:114, color:"#64748b", icon:"⬡", hot:false },
  { id:"xy1",     name:"XY",                year:2014, era:"10s", total:146, color:"#6366f1", icon:"◉", hot:false },
  { id:"evolutions", name:"XY Evolutions",  year:2016, era:"10s", total:108, color:"#a855f7", icon:"⬡", hot:true  },
  { id:"swsh1",   name:"Sword & Shield",    year:2020, era:"20s", total:216, color:"#0ea5e9", icon:"▲", hot:false },
  { id:"swsh12",  name:"Silver Tempest",    year:2022, era:"20s", total:215, color:"#8b5cf6", icon:"★", hot:false },
  { id:"sv3",     name:"Obsidian Flames",   year:2023, era:"20s", total:197, color:"#ef4444", icon:"▲", hot:true  },
  { id:"sv4pt5",  name:"Paldean Fates",     year:2024, era:"20s", total:91,  color:"#ec4899", icon:"✦", hot:true  },
];

const TYPE_META = {
  Fire:      { color:"#ef4444", bg:"#3a0a0a", glyph:"▲" },
  Water:     { color:"#3b82f6", bg:"#0a1e3a", glyph:"◆" },
  Grass:     { color:"#22c55e", bg:"#0a2a14", glyph:"✦" },
  Lightning: { color:"#f59e0b", bg:"#2a1e00", glyph:"★" },
  Psychic:   { color:"#8b5cf6", bg:"#1e0a3a", glyph:"◉" },
  Darkness:  { color:"#7c3aed", bg:"#0f0a1e", glyph:"◈" },
  Dragon:    { color:"#0ea5e9", bg:"#0a1e2a", glyph:"⬡" },
  Fighting:  { color:"#f97316", bg:"#2a0f00", glyph:"⬠" },
  Metal:     { color:"#9ca3af", bg:"#1a1f2e", glyph:"○" },
  Colorless: { color:"#6b7280", bg:"#1a1f2e", glyph:"·" },
};

const ERA_COLOR = { "90s":"#f59e0b","00s":"#22c55e","10s":"#3b82f6","20s":"#8b5cf6" };
const ERAS = ["All","90s","00s","10s","20s"];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BrowsePage() {
  const [query,       setQuery]       = useState("");
  const [cards,       setCards]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [mode,        setMode]        = useState("home"); // home | results | set
  const [activeSet,   setActiveSet]   = useState(null);
  const [view,        setView]        = useState("grid");
  const [filterEra,   setFilterEra]   = useState("All");
  const [filterType,  setFilterType]  = useState("All");
  const [sortBy,      setSortBy]      = useState("number");
  const [recent,      setRecent]      = useState([]);
  const debouncedQ    = useDebounce(query, 400);
  const abortRef      = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("vault_recent_searches");
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  const saveRecent = (q) => {
    const next = [q, ...recent.filter(r => r !== q)].slice(0, 8);
    setRecent(next);
    localStorage.setItem("vault_recent_searches", JSON.stringify(next));
  };

  const fetchCards = useCallback(async (q, setId) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      let url = "/api/cards?pageSize=32";
      if (q)     url += `&q=name:${encodeURIComponent(q)}*`;
      if (setId) url += `&set=${setId}`;
      const res  = await fetch(url, { signal: abortRef.current.signal });
      const data = await res.json();
      setCards(data.data || []);
    } catch (e) {
      if (e.name !== "AbortError") setCards([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!debouncedQ.trim()) { if (mode === "results") setMode("home"); setCards([]); return; }
    setMode("results");
    saveRecent(debouncedQ.trim());
    fetchCards(debouncedQ.trim(), null);
  }, [debouncedQ]);

  const openSet = (set) => {
    setActiveSet(set);
    setMode("set");
    setQuery("");
    setCards([]);
    fetchCards(null, set.id);
  };

  const clearAll = () => {
    setQuery(""); setMode("home"); setActiveSet(null); setCards([]);
    setFilterEra("All"); setFilterType("All");
  };

  const filteredSets = SETS.filter(s => filterEra === "All" || s.era === filterEra);

  const displayCards = cards.filter(c => {
    if (filterType === "All") return true;
    return c.types?.includes(filterType);
  }).sort((a, b) => {
    if (sortBy === "number") return (parseInt(a.number) || 0) - (parseInt(b.number) || 0);
    if (sortBy === "name")   return a.name.localeCompare(b.name);
    if (sortBy === "rarity") return (a.rarity || "").localeCompare(b.rarity || "");
    return 0;
  });

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh", padding:"0 0 60px" }}>

      {/* Sticky search */}
      <div style={{ background:"var(--bg-nav)", borderBottom:"1px solid var(--border)", padding:"12px 24px", position:"sticky", top:52, zIndex:90 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", fontSize:16, pointerEvents:"none" }}>⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search any card, set, type... e.g. 'Charizard' or 'Base Set'"
            style={{ width:"100%", height:44, paddingLeft:42, paddingRight:query?40:16, borderRadius:10, fontSize:14, border:`1px solid ${query?"var(--accent-blue)":"var(--border)"}`, transition:"border-color .2s" }}
          />
          {query && (
            <button onClick={clearAll} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:24, height:24, borderRadius:"50%", background:"var(--border)", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px" }}>

        {/* HOME */}
        {mode === "home" && (
          <div>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <SectionLabel>Recent searches</SectionLabel>
                  <button onClick={() => { setRecent([]); localStorage.removeItem("vault_recent_searches"); }} style={{ fontSize:10, color:"var(--text-dim)", background:"transparent", border:"none", cursor:"pointer", fontFamily:"var(--font-mono)" }}>Clear</button>
                </div>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  {recent.map(r => (
                    <button key={r} onClick={() => setQuery(r)} style={{ padding:"5px 12px", borderRadius:6, fontSize:12, cursor:"pointer", border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:6 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-blue)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                      <span style={{ fontSize:10, color:"var(--text-dim)" }}>↺</span> {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Browse by type */}
            <div style={{ marginBottom:28 }}>
              <SectionLabel style={{ marginBottom:12 }}>Browse by type</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {Object.entries(TYPE_META).map(([type, meta]) => (
                  <button key={type} onClick={() => setQuery(type)} style={{ padding:"10px 8px", borderRadius:8, cursor:"pointer", border:`1px solid ${meta.color}33`, background:meta.bg, color:meta.color, fontSize:11, fontWeight:500, display:"flex", flexDirection:"column", alignItems:"center", gap:5, transition:"all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color+"88"; e.currentTarget.style.transform="scale(1.03)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=meta.color+"33"; e.currentTarget.style.transform="scale(1)"; }}>
                    <span style={{ fontSize:18 }}>{meta.glyph}</span>
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sets */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <SectionLabel>All sets</SectionLabel>
                <div style={{ display:"flex", gap:6 }}>
                  {ERAS.map(e => (
                    <button key={e} onClick={() => setFilterEra(filterEra===e?"All":e)} style={{ padding:"3px 9px", borderRadius:4, fontSize:10, cursor:"pointer", fontFamily:"var(--font-mono)", border: filterEra===e?`1px solid ${ERA_COLOR[e]||"#64748b"}`:"1px solid var(--border)", background: filterEra===e?`${ERA_COLOR[e]||"#64748b"}22`:"transparent", color: filterEra===e?ERA_COLOR[e]||"#64748b":"var(--text-dim)" }}>{e}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {filteredSets.map((set, i) => (
                  <div key={set.id} onClick={() => openSet(set)} style={{ background:"var(--bg-card)", border:`1px solid ${set.color}33`, borderRadius:10, padding:"14px", cursor:"pointer", transition:"all .15s", animation:`fadeUp 0.3s ease ${i*0.04}s both`, position:"relative" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=set.color+"77"; e.currentTarget.style.background="#111b2e"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=set.color+"33"; e.currentTarget.style.background="var(--bg-card)"; }}>
                    {set.hot && <div style={{ position:"absolute", top:8, right:8, fontSize:9, fontFamily:"var(--font-mono)", color:"#f59e0b", background:"#2a1e0066", border:"1px solid #f59e0b33", padding:"2px 6px", borderRadius:10 }}>HOT</div>}
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <div style={{ width:32, height:32, borderRadius:6, background:`${set.color}22`, border:`1px solid ${set.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:set.color, flexShrink:0 }}>{set.icon}</div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{set.name}</div>
                        <div style={{ fontSize:10, color:"var(--text-dim)" }}>{set.year} · {set.total} cards</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:10, color:`${set.color}88`, fontFamily:"var(--font-mono)" }}>{set.era}</span>
                      <span style={{ fontSize:11, color:set.color, fontFamily:"var(--font-mono)" }}>Browse →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS / SET VIEW */}
        {(mode === "results" || mode === "set") && (
          <div>
            {/* Set header */}
            {mode === "set" && activeSet && (
              <div style={{ background:`${activeSet.color}12`, border:`1px solid ${activeSet.color}44`, borderRadius:12, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:8, background:`${activeSet.color}22`, border:`1px solid ${activeSet.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:activeSet.color, flexShrink:0 }}>{activeSet.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{activeSet.name}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>{activeSet.year} · {activeSet.total} cards · {activeSet.era} era</div>
                </div>
                <button onClick={clearAll} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:11, cursor:"pointer" }}>← Back</button>
              </div>
            )}

            {/* Controls */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
              <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
                {loading ? "Searching..." : `${displayCards.length} cards`}
                {mode === "results" && query && <span style={{ color:"var(--accent-blue)" }}> · "{query}"</span>}
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                {/* Type filter */}
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding:"6px 10px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"var(--font-mono)" }}>
                  <option value="All">All types</option>
                  {Object.keys(TYPE_META).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:"6px 10px", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"var(--font-mono)" }}>
                  <option value="number">By number</option>
                  <option value="name">By name</option>
                  <option value="rarity">By rarity</option>
                </select>
                <div style={{ display:"flex", border:"1px solid var(--border)", borderRadius:6, overflow:"hidden" }}>
                  {[{v:"grid",i:"⊞"},{v:"list",i:"≡"}].map(({v,i}) => (
                    <button key={v} onClick={() => setView(v)} style={{ width:32, height:30, border:"none", cursor:"pointer", fontSize:14, background: view===v?"#1e3a5f":"transparent", color: view===v?"#93c5fd":"var(--text-muted)" }}>{i}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ display:"flex", justifyContent:"center", padding:"60px 0", flexDirection:"column", alignItems:"center", gap:12 }}>
                <Spinner size={28} />
                <MonoText>Fetching from Pokémon TCG API...</MonoText>
              </div>
            )}

            {/* No results */}
            {!loading && displayCards.length === 0 && (
              <EmptyState icon="◈" title="NO CARDS FOUND" subtitle="Try a different search or browse by set" />
            )}

            {/* Grid */}
            {!loading && displayCards.length > 0 && view === "grid" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:10 }}>
                {displayCards.map((card, i) => (
                  <div key={card.id} style={{ animation:`fadeUp 0.25s ease ${Math.min(i,12)*0.03}s both` }}>
                    <BrowseCard card={card} />
                  </div>
                ))}
              </div>
            )}

            {/* List */}
            {!loading && displayCards.length > 0 && view === "list" && (
              <Panel style={{ overflow:"hidden" }}>
                {displayCards.map((card, i) => <BrowseRow key={card.id} card={card} last={i===displayCards.length-1} />)}
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BrowseCard({ card }) {
  const typeColor = card.types?.[0] ? (TYPE_META[card.types[0]]?.color || "#64748b") : "#64748b";
  const typeBg    = card.types?.[0] ? (TYPE_META[card.types[0]]?.bg    || "#1a1f2e") : "#1a1f2e";
  const isHolo    = card.rarity?.toLowerCase().includes("holo") || card.rarity?.toLowerCase().includes("rare");

  return (
    <Link href={`/card/${card.id}`} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", transition:"all .15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=typeColor+"66"; e.currentTarget.style.transform="translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="translateY(0)"; }}>
        <div style={{ height:130, background: card.images?.small ? "var(--bg-base)" : `linear-gradient(135deg,${typeBg},var(--bg-base))`, display:"flex", alignItems:"center", justifyContent:"center", borderBottom:"1px solid var(--border-dim)", position:"relative" }}>
          {card.images?.small
            ? <img src={card.images.small} alt={card.name} style={{ height:120, objectFit:"contain" }} />
            : <span style={{ fontSize:36 }}>{TYPE_META[card.types?.[0]]?.glyph || "🃏"}</span>
          }
          <div style={{ position:"absolute", bottom:4, left:5, display:"flex", gap:3 }}>
            {card.set?.releaseDate && <EraTag era={card.set.releaseDate.slice(0,4) < "2003" ? "90s" : card.set.releaseDate.slice(0,4) < "2010" ? "00s" : card.set.releaseDate.slice(0,4) < "2020" ? "10s" : "20s"} />}
            {isHolo && <HoloBadge />}
          </div>
        </div>
        <div style={{ padding:"8px 10px" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", marginBottom:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.name}</div>
          <div style={{ fontSize:10, color:"var(--text-dim)", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.set?.name} · #{card.number}</div>
          <div style={{ fontSize:9, color:typeColor, fontFamily:"var(--font-mono)" }}>{card.rarity}</div>
        </div>
      </div>
    </Link>
  );
}

function BrowseRow({ card, last }) {
  const typeColor = card.types?.[0] ? (TYPE_META[card.types[0]]?.color || "#64748b") : "#64748b";
  return (
    <Link href={`/card/${card.id}`} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ display:"grid", gridTemplateColumns:"36px 2fr 1fr 1fr 80px", gap:12, padding:"10px 16px", borderBottom: last?"none":"1px solid var(--border-dim)", alignItems:"center", transition:"background .12s" }}
        onMouseEnter={e => e.currentTarget.style.background="var(--bg-card)"}
        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
        <div style={{ width:32, height:32, borderRadius:6, background:`${typeColor}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:typeColor }}>
          {TYPE_META[card.types?.[0]]?.glyph || "·"}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{card.name}</div>
          <div style={{ fontSize:10, color:"var(--text-dim)" }}>#{card.number}</div>
        </div>
        <div style={{ fontSize:11, color:"var(--text-muted)" }}>{card.set?.name}</div>
        <div style={{ fontSize:10, color:typeColor, fontFamily:"var(--font-mono)" }}>{card.rarity}</div>
        <div style={{ fontSize:10, color:typeColor, fontFamily:"var(--font-mono)" }}>
          {card.types?.join(", ")}
        </div>
      </div>
    </Link>
  );
}
