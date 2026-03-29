"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Panel, SectionLabel, MonoText, PixelText, HoloBadge, EraTag, Spinner, EmptyState } from "@/components/shared/ui";

/* ─── Energy type metadata ───────────────────────────────────────
   Official energy symbol images from the Pokémon TCG API CDN.
   These are freely served — same source the API uses for card data.
─────────────────────────────────────────────────────────────────── */
const TYPE_META = {
  Fire:      { color:"#ef4444", bg:"#3a0a0a", img:"https://images.pokemontcg.io/energies/fire.png"      },
  Water:     { color:"#3b82f6", bg:"#0a1e3a", img:"https://images.pokemontcg.io/energies/water.png"     },
  Grass:     { color:"#22c55e", bg:"#0a2a14", img:"https://images.pokemontcg.io/energies/grass.png"     },
  Lightning: { color:"#f59e0b", bg:"#2a1e00", img:"https://images.pokemontcg.io/energies/lightning.png" },
  Psychic:   { color:"#8b5cf6", bg:"#1e0a3a", img:"https://images.pokemontcg.io/energies/psychic.png"   },
  Darkness:  { color:"#7c3aed", bg:"#0f0a1e", img:"https://images.pokemontcg.io/energies/darkness.png"  },
  Dragon:    { color:"#0ea5e9", bg:"#0a1e2a", img:"https://images.pokemontcg.io/energies/dragon.png"    },
  Fighting:  { color:"#f97316", bg:"#2a0f00", img:"https://images.pokemontcg.io/energies/fighting.png"  },
  Metal:     { color:"#9ca3af", bg:"#1a1f2e", img:"https://images.pokemontcg.io/energies/metal.png"     },
  Colorless: { color:"#6b7280", bg:"#1a1f2e", img:"https://images.pokemontcg.io/energies/colorless.png" },
};

/* ─── Fallback set data with real TCG API set IDs ────────────────
   Logo/symbol images are fetched live from the API.
   We keep this list so we control ordering and "hot" flags.
─────────────────────────────────────────────────────────────────── */
const SET_CATALOG = [
  { id:"base1",    name:"Base Set",         year:1999, era:"90s", total:102, hot:true  },
  { id:"base2",    name:"Jungle",           year:1999, era:"90s", total:64,  hot:false },
  { id:"base3",    name:"Fossil",           year:1999, era:"90s", total:62,  hot:false },
  { id:"base5",    name:"Team Rocket",      year:2000, era:"90s", total:83,  hot:false },
  { id:"neo1",     name:"Neo Genesis",      year:2000, era:"90s", total:111, hot:true  },
  { id:"neo2",     name:"Neo Discovery",    year:2001, era:"90s", total:75,  hot:false },
  { id:"neo3",     name:"Neo Revelation",   year:2001, era:"90s", total:66,  hot:false },
  { id:"neo4",     name:"Neo Destiny",      year:2002, era:"90s", total:113, hot:false },
  { id:"ecard1",   name:"Expedition Base",  year:2002, era:"00s", total:165, hot:false },
  { id:"ex1",      name:"Ruby & Sapphire",  year:2003, era:"00s", total:109, hot:false },
  { id:"ex13",     name:"Delta Species",    year:2005, era:"00s", total:114, hot:false },
  { id:"dp1",      name:"Diamond & Pearl",  year:2007, era:"00s", total:130, hot:false },
  { id:"pl1",      name:"Platinum",         year:2009, era:"00s", total:133, hot:false },
  { id:"bw1",      name:"Black & White",    year:2011, era:"10s", total:114, hot:false },
  { id:"xy1",      name:"XY",               year:2014, era:"10s", total:146, hot:false },
  { id:"evolutions",name:"XY Evolutions",   year:2016, era:"10s", total:108, hot:true  },
  { id:"sm1",      name:"Sun & Moon",       year:2017, era:"10s", total:149, hot:false },
  { id:"swsh1",    name:"Sword & Shield",   year:2020, era:"20s", total:216, hot:false },
  { id:"swsh12",   name:"Silver Tempest",   year:2022, era:"20s", total:215, hot:false },
  { id:"sv3",      name:"Obsidian Flames",  year:2023, era:"20s", total:197, hot:true  },
  { id:"sv4pt5",   name:"Paldean Fates",    year:2024, era:"20s", total:91,  hot:true  },
];

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

/* ─── Energy type button with real image ─── */
function TypeButton({ type, meta, active, onClick }) {
  const [imgError, setImgError] = useState(false);
  return (
    <button onClick={onClick} style={{
      padding:"12px 8px", borderRadius:10, cursor:"pointer",
      border:`1px solid ${active ? meta.color : meta.color + "44"}`,
      background: active ? `${meta.color}33` : meta.bg,
      display:"flex", flexDirection:"column", alignItems:"center", gap:6,
      transition:"all .15s", flex:1,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.transform = "scale(1.03)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = active ? meta.color : meta.color+"44"; e.currentTarget.style.transform = "scale(1)"; }}
    >
      {!imgError ? (
        <img
          src={meta.img}
          alt={type}
          style={{ width:28, height:28, objectFit:"contain", filter:"drop-shadow(0 0 4px currentColor)" }}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback if CDN doesn't have the image */
        <div style={{ width:28, height:28, borderRadius:"50%", background:`${meta.color}44`, border:`1px solid ${meta.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:meta.color }}>
          {type[0]}
        </div>
      )}
      <span style={{ fontSize:10, fontWeight:500, color: active ? meta.color : meta.color+"cc" }}>{type}</span>
    </button>
  );
}

/* ─── Set tile with real logo from API ─── */
function SetTile({ set, apiData, onClick }) {
  const [logoError, setLogoError] = useState(false);
  const logo   = apiData?.images?.logo;
  const symbol = apiData?.images?.symbol;
  const era    = set.era;
  const eraC   = ERA_COLOR[era] || "#64748b";

  return (
    <div onClick={onClick} style={{
      background:"var(--bg-card)", border:`1px solid ${eraC}33`,
      borderRadius:12, overflow:"hidden", cursor:"pointer",
      transition:"all .15s", position:"relative",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = eraC+"88"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = eraC+"33"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {set.hot && (
        <div style={{ position:"absolute", top:8, right:8, zIndex:2, fontSize:9, fontFamily:"var(--font-mono)", color:"#f59e0b", background:"#2a1e0088", border:"1px solid #f59e0b44", padding:"2px 7px", borderRadius:10 }}>HOT</div>
      )}

      {/* Logo area */}
      <div style={{
        height:90, background:`linear-gradient(135deg, ${eraC}18 0%, var(--bg-base) 100%)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        borderBottom:`1px solid ${eraC}22`, padding:"10px 16px", position:"relative",
      }}>
        {logo && !logoError ? (
          <img
            src={logo}
            alt={set.name}
            style={{ maxHeight:60, maxWidth:"90%", objectFit:"contain", filter:`drop-shadow(0 2px 8px ${eraC}66)` }}
            onError={() => setLogoError(true)}
          />
        ) : (
          /* Fallback — name text if logo fails */
          <div style={{ textAlign:"center" }}>
            {symbol && <img src={symbol} alt="" style={{ width:24, height:24, objectFit:"contain", marginBottom:4, opacity:0.8 }} />}
            <div style={{ fontSize:13, fontWeight:700, color:eraC, textAlign:"center", lineHeight:1.3 }}>{set.name}</div>
          </div>
        )}
      </div>

      {/* Info row */}
      <div style={{ padding:"10px 12px" }}>
        <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{set.name}</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:10, color:"var(--text-dim)" }}>{set.year} · {set.total} cards</div>
          <span style={{ fontSize:9, fontFamily:"var(--font-mono)", color:eraC, background:`${eraC}22`, padding:"1px 6px", borderRadius:10, border:`1px solid ${eraC}44` }}>{set.era}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Browse card grid item with real image ─── */
function BrowseCard({ card, onClick }) {
  const typeColor = card.types?.[0] ? (TYPE_META[card.types[0]]?.color || "#64748b") : "#64748b";
  const isHolo    = card.rarity?.toLowerCase().includes("holo") || card.rarity?.toLowerCase().includes("rare");
  const era       = card.set?.releaseDate?.slice(0,4) < "2003" ? "90s"
    : card.set?.releaseDate?.slice(0,4) < "2010" ? "00s"
    : card.set?.releaseDate?.slice(0,4) < "2020" ? "10s" : "20s";

  return (
    <Link href={`/card/${card.id}`} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", transition:"all .15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=typeColor+"66"; e.currentTarget.style.transform="translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="translateY(0)"; }}>
        {/* Card image */}
        <div style={{ height:140, background: card.images?.small ? "var(--bg-base)" : `linear-gradient(135deg, ${typeColor}22, var(--bg-base))`, display:"flex", alignItems:"center", justifyContent:"center", borderBottom:"1px solid var(--border-dim)", position:"relative" }}>
          {card.images?.small
            ? <img src={card.images.small} alt={card.name} style={{ height:130, objectFit:"contain" }} />
            : <div style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>NO IMAGE</div>
          }
          {/* Type icon overlay */}
          {card.types?.[0] && TYPE_META[card.types[0]] && (
            <div style={{ position:"absolute", top:5, left:5, width:20, height:20 }}>
              <img src={TYPE_META[card.types[0]].img} alt={card.types[0]} style={{ width:20, height:20, objectFit:"contain" }} />
            </div>
          )}
          <div style={{ position:"absolute", bottom:4, left:5, display:"flex", gap:3 }}>
            <EraTag era={era} />
            {isHolo && <HoloBadge />}
          </div>
        </div>
        {/* Info */}
        <div style={{ padding:"8px 10px" }}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", marginBottom:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.name}</div>
          <div style={{ fontSize:10, color:"var(--text-dim)", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.set?.name} · #{card.number}</div>
          <div style={{ fontSize:9, color:typeColor, fontFamily:"var(--font-mono)" }}>{card.rarity}</div>
        </div>
      </div>
    </Link>
  );
}

/* ─── List row ─── */
function BrowseRow({ card, last }) {
  const typeColor = card.types?.[0] ? (TYPE_META[card.types[0]]?.color || "#64748b") : "#64748b";
  const typeMeta  = card.types?.[0] ? TYPE_META[card.types[0]] : null;
  return (
    <Link href={`/card/${card.id}`} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ display:"grid", gridTemplateColumns:"40px 2fr 1fr 1fr 80px", gap:12, padding:"10px 16px", borderBottom: last?"none":"1px solid var(--border-dim)", alignItems:"center", transition:"background .12s" }}
        onMouseEnter={e => e.currentTarget.style.background="var(--bg-card)"}
        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
        {/* Type icon or card image */}
        <div style={{ width:36, height:48, borderRadius:4, overflow:"hidden", flexShrink:0 }}>
          {card.images?.small
            ? <img src={card.images.small} alt={card.name} style={{ width:36, height:48, objectFit:"cover" }} />
            : typeMeta
              ? <div style={{ width:36, height:48, background:typeMeta.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <img src={typeMeta.img} alt="" style={{ width:22, height:22, objectFit:"contain" }} />
                </div>
              : <div style={{ width:36, height:48, background:"var(--bg-base)", border:"1px solid var(--border)", borderRadius:4 }}/>
          }
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{card.name}</div>
          <div style={{ fontSize:10, color:"var(--text-dim)" }}>#{card.number}</div>
        </div>
        <div style={{ fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.set?.name}</div>
        <div style={{ fontSize:10, color:typeColor, fontFamily:"var(--font-mono)" }}>{card.rarity}</div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {typeMeta && <img src={typeMeta.img} alt={card.types[0]} style={{ width:16, height:16, objectFit:"contain" }} />}
          <span style={{ fontSize:10, color:typeColor }}>{card.types?.join(", ")}</span>
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════
   MAIN
════════════════════════════════════ */
export default function BrowsePage() {
  const [query,      setQuery]      = useState("");
  const [cards,      setCards]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [setsLoading,setSetsLoading]= useState(true);
  const [mode,       setMode]       = useState("home");
  const [activeSet,  setActiveSet]  = useState(null);
  const [view,       setView]       = useState("grid");
  const [filterEra,  setFilterEra]  = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [sortBy,     setSortBy]     = useState("number");
  const [recent,     setRecent]     = useState([]);
  const [setApiData, setSetApiData] = useState({}); // id → {images:{logo,symbol}}
  const debouncedQ   = useDebounce(query, 400);
  const abortRef     = useRef(null);

  /* Load set images from API on mount */
  useEffect(() => {
    fetch("/api/sets")
      .then(r => r.json())
      .then(d => {
        const map = {};
        (d.data || []).forEach(s => { map[s.id] = s; });
        setSetApiData(map);
      })
      .catch(() => {})
      .finally(() => setSetsLoading(false));
  }, []);

  /* Recent searches */
  useEffect(() => {
    const saved = localStorage.getItem("vault_recent_searches");
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  const saveRecent = (q) => {
    const next = [q, ...recent.filter(r => r !== q)].slice(0, 8);
    setRecent(next);
    localStorage.setItem("vault_recent_searches", JSON.stringify(next));
  };

  /* Fetch cards */
  const fetchCards = (q, setId) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    let url = "/api/cards?pageSize=32";
    if (q)     url += `&q=name:${encodeURIComponent(q)}*`;
    if (setId) url += `&set=${setId}`;
    fetch(url, { signal: abortRef.current.signal })
      .then(r => r.json())
      .then(d => { setCards(d.data || []); setLoading(false); })
      .catch(e => { if (e.name !== "AbortError") { setCards([]); setLoading(false); } });
  };

  useEffect(() => {
    if (!debouncedQ.trim()) { if (mode === "results") { setMode("home"); setCards([]); } return; }
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

  const filteredSets = SET_CATALOG.filter(s => filterEra === "All" || s.era === filterEra);

  const displayCards = cards
    .filter(c => filterType === "All" || c.types?.includes(filterType))
    .sort((a, b) => {
      if (sortBy === "name")   return a.name.localeCompare(b.name);
      if (sortBy === "rarity") return (a.rarity||"").localeCompare(b.rarity||"");
      return (parseInt(a.number)||0) - (parseInt(b.number)||0);
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
            placeholder="Search any card, set, or type..."
            style={{ width:"100%", height:44, paddingLeft:42, paddingRight:query?40:16, borderRadius:10, fontSize:14, border:`1px solid ${query?"var(--accent-blue)":"var(--border)"}`, transition:"border-color .2s" }}
          />
          {query && (
            <button onClick={clearAll} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:24, height:24, borderRadius:"50%", background:"var(--border)", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px" }}>

        {/* ── HOME ── */}
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
                      onMouseEnter={e => e.currentTarget.style.borderColor="var(--accent-blue)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                      <span style={{ fontSize:10, color:"var(--text-dim)" }}>↺</span> {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Browse by type — real energy images */}
            <div style={{ marginBottom:32 }}>
              <SectionLabel style={{ display:"block", marginBottom:14 }}>Browse by type</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {Object.entries(TYPE_META).map(([type, meta]) => (
                  <TypeButton
                    key={type}
                    type={type}
                    meta={meta}
                    active={filterType === type}
                    onClick={() => { setFilterType(filterType === type ? "All" : type); setQuery(type); }}
                  />
                ))}
              </div>
            </div>

            {/* Sets — real logos */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <SectionLabel>Browse sets</SectionLabel>
                <div style={{ display:"flex", gap:6 }}>
                  {ERAS.map(e => (
                    <button key={e} onClick={() => setFilterEra(filterEra===e?"All":e)} style={{ padding:"3px 9px", borderRadius:4, fontSize:10, cursor:"pointer", fontFamily:"var(--font-mono)", border: filterEra===e?`1px solid ${ERA_COLOR[e]||"#64748b"}`:"1px solid var(--border)", background: filterEra===e?`${ERA_COLOR[e]||"#64748b"}22`:"transparent", color: filterEra===e?ERA_COLOR[e]||"#64748b":"var(--text-dim)" }}>{e}</button>
                  ))}
                </div>
              </div>

              {setsLoading ? (
                <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner /></div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12 }}>
                  {filteredSets.map((set, i) => (
                    <div key={set.id} style={{ animation:`fadeUp 0.3s ease ${i*0.03}s both` }}>
                      <SetTile set={set} apiData={setApiData[set.id]} onClick={() => openSet(set)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTS / SET ── */}
        {(mode === "results" || mode === "set") && (
          <div>
            {/* Set header with real logo */}
            {mode === "set" && activeSet && (
              <div style={{ background:`${ERA_COLOR[activeSet.era]||"#64748b"}12`, border:`1px solid ${ERA_COLOR[activeSet.era]||"#64748b"}44`, borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
                {setApiData[activeSet.id]?.images?.logo ? (
                  <img src={setApiData[activeSet.id].images.logo} alt={activeSet.name} style={{ height:50, objectFit:"contain", filter:`drop-shadow(0 2px 8px ${ERA_COLOR[activeSet.era]||"#64748b"}66)` }} />
                ) : (
                  <div style={{ fontSize:16, fontWeight:700, color:ERA_COLOR[activeSet.era]||"#64748b" }}>{activeSet.name}</div>
                )}
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
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                {/* Type filter with images */}
                <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                  <button onClick={() => setFilterType("All")} style={{ padding:"4px 8px", borderRadius:5, fontSize:10, cursor:"pointer", fontFamily:"var(--font-mono)", border: filterType==="All"?"1px solid var(--accent-amber)":"1px solid var(--border)", background: filterType==="All"?"#2a1e00":"transparent", color: filterType==="All"?"var(--accent-gold)":"var(--text-muted)" }}>All</button>
                  {Object.entries(TYPE_META).map(([type, meta]) => (
                    <button key={type} onClick={() => setFilterType(filterType===type?"All":type)} title={type} style={{ width:28, height:28, borderRadius:5, cursor:"pointer", border: filterType===type?`1px solid ${meta.color}`:"1px solid var(--border)", background: filterType===type?`${meta.color}22`:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:4 }}>
                      <img src={meta.img} alt={type} style={{ width:18, height:18, objectFit:"contain" }} />
                    </button>
                  ))}
                </div>
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

            {loading && (
              <div style={{ display:"flex", justifyContent:"center", padding:"60px 0", flexDirection:"column", alignItems:"center", gap:12 }}>
                <Spinner size={28} />
                <MonoText>Fetching cards...</MonoText>
              </div>
            )}

            {!loading && displayCards.length === 0 && (
              <EmptyState icon="◈" title="NO CARDS FOUND" subtitle="Try a different search or browse by set" />
            )}

            {!loading && displayCards.length > 0 && view === "grid" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:10 }}>
                {displayCards.map((card, i) => (
                  <div key={card.id} style={{ animation:`fadeUp 0.25s ease ${Math.min(i,12)*0.03}s both` }}>
                    <BrowseCard card={card} />
                  </div>
                ))}
              </div>
            )}

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
