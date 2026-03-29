"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Panel, SectionLabel, MonoText, PixelText, HoloBadge, EraTag, Spinner, EmptyState } from "@/components/shared/ui";

/* ─── SVG Energy Symbols ─────────────────────────────────────────
   Hand-crafted SVGs matching the Pokémon TCG energy symbol aesthetic.
   No external images needed — renders perfectly at any size.
─────────────────────────────────────────────────────────────────── */
function EnergySVG({ type, size = 28 }) {
  const s = size;
  const symbols = {
    Fire: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#ef4444" />
        <circle cx="16" cy="16" r="12" fill="#dc2626" />
        <path d="M16 6 C14 10 10 11 10 15 C10 19 13 21 16 26 C19 21 22 19 22 15 C22 11 18 10 16 6Z" fill="#fca5a5" />
        <path d="M16 12 C15 14 13 15 13 17.5 C13 19.5 14.5 20.5 16 23 C17.5 20.5 19 19.5 19 17.5 C19 15 17 14 16 12Z" fill="#fff" />
      </svg>
    ),
    Water: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#3b82f6" />
        <circle cx="16" cy="16" r="12" fill="#2563eb" />
        <path d="M16 7 C16 7 9 15 9 19 C9 23 12 26 16 26 C20 26 23 23 23 19 C23 15 16 7 16 7Z" fill="#93c5fd" />
        <path d="M16 13 C16 13 12 18 12 20.5 C12 22.5 13.8 24 16 24 C18.2 24 20 22.5 20 20.5 C20 18 16 13 16 13Z" fill="#fff" opacity="0.7"/>
      </svg>
    ),
    Grass: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#22c55e" />
        <circle cx="16" cy="16" r="12" fill="#16a34a" />
        <path d="M16 8 L16 24" stroke="#86efac" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 14 C16 14 10 10 8 12 C10 16 16 14 16 14Z" fill="#86efac"/>
        <path d="M16 18 C16 18 22 14 24 16 C22 20 16 18 16 18Z" fill="#86efac"/>
        <path d="M16 11 C16 11 12 7 10 8 C11 12 16 11 16 11Z" fill="#bbf7d0"/>
        <path d="M16 21 C16 21 20 17 22 18 C21 22 16 21 16 21Z" fill="#bbf7d0"/>
      </svg>
    ),
    Lightning: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#f59e0b" />
        <circle cx="16" cy="16" r="12" fill="#d97706" />
        <polygon points="18,7 11,17 16,17 14,25 21,15 16,15" fill="#fef08a" />
        <polygon points="18,7 11,17 16,17 14,25 21,15 16,15" fill="#fff" opacity="0.3"/>
      </svg>
    ),
    Psychic: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#8b5cf6" />
        <circle cx="16" cy="16" r="12" fill="#7c3aed" />
        <circle cx="16" cy="16" r="5" fill="#c4b5fd" />
        <circle cx="16" cy="16" r="3" fill="#fff" />
        <circle cx="10" cy="10" r="2.5" fill="#c4b5fd" />
        <circle cx="22" cy="10" r="2" fill="#c4b5fd" />
        <circle cx="10" cy="22" r="2" fill="#c4b5fd" />
        <circle cx="22" cy="22" r="2.5" fill="#c4b5fd" />
      </svg>
    ),
    Darkness: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#4c1d95" />
        <circle cx="16" cy="16" r="12" fill="#3b0764" />
        <path d="M16 8 C11 8 7 12 7 16 C7 20 10 23.5 14 24.5 C12 22 11 19 12 16.5 C13 14 15 13 16 13 C17 13 18 12.5 18 11 C18 9.5 17 8 16 8Z" fill="#a78bfa"/>
        <path d="M18 10 C20 11 22 13.5 22 16 C22 20 18.5 23.5 14 24.5 C16 24 20 21 20 16 C20 13 19 11 18 10Z" fill="#7c3aed"/>
        <circle cx="19" cy="13" r="2" fill="#c4b5fd" opacity="0.6"/>
      </svg>
    ),
    Dragon: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#0284c7" />
        <circle cx="16" cy="16" r="12" fill="#075985" />
        <path d="M8 12 L16 8 L24 12 L24 20 L16 24 L8 20 Z" fill="none" stroke="#7dd3fc" strokeWidth="1.5"/>
        <path d="M16 8 L16 24" stroke="#7dd3fc" strokeWidth="1" opacity="0.5"/>
        <path d="M8 16 L24 16" stroke="#7dd3fc" strokeWidth="1" opacity="0.5"/>
        <circle cx="16" cy="16" r="3" fill="#38bdf8" />
        <circle cx="16" cy="16" r="1.5" fill="#fff" />
      </svg>
    ),
    Fighting: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#c2410c" />
        <circle cx="16" cy="16" r="12" fill="#9a3412" />
        <path d="M11 10 L11 22 L14 22 L14 17 L18 17 L18 22 L21 22 L21 10 L18 10 L18 14 L14 14 L14 10 Z" fill="#fed7aa"/>
        <path d="M11 10 L11 22 L14 22 L14 17 L18 17 L18 22 L21 22 L21 10 L18 10 L18 14 L14 14 L14 10 Z" fill="#fff" opacity="0.2"/>
      </svg>
    ),
    Metal: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#64748b" />
        <circle cx="16" cy="16" r="12" fill="#475569" />
        <circle cx="16" cy="16" r="8" fill="none" stroke="#cbd5e1" strokeWidth="2"/>
        <circle cx="16" cy="16" r="4" fill="#94a3b8" />
        <circle cx="16" cy="16" r="2" fill="#e2e8f0" />
        <line x1="16" y1="8" x2="16" y2="10" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="16" y1="22" x2="16" y2="24" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="16" x2="10" y2="16" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="22" y1="16" x2="24" y2="16" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    Colorless: (
      <svg width={s} height={s} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="#6b7280" />
        <circle cx="16" cy="16" r="12" fill="#4b5563" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="#d1d5db" strokeWidth="1.5"/>
        <circle cx="16" cy="16" r="3.5" fill="#9ca3af" />
        <circle cx="16" cy="11" r="1.5" fill="#d1d5db" opacity="0.7"/>
        <circle cx="20.3" cy="13.5" r="1.5" fill="#d1d5db" opacity="0.7"/>
        <circle cx="20.3" cy="18.5" r="1.5" fill="#d1d5db" opacity="0.7"/>
        <circle cx="16" cy="21" r="1.5" fill="#d1d5db" opacity="0.7"/>
        <circle cx="11.7" cy="18.5" r="1.5" fill="#d1d5db" opacity="0.7"/>
        <circle cx="11.7" cy="13.5" r="1.5" fill="#d1d5db" opacity="0.7"/>
      </svg>
    ),
  };
  return symbols[type] || null;
}

const TYPE_META = {
  Fire:      { color:"#ef4444", bg:"#3a0a0a" },
  Water:     { color:"#3b82f6", bg:"#0a1e3a" },
  Grass:     { color:"#22c55e", bg:"#0a2a14" },
  Lightning: { color:"#f59e0b", bg:"#2a1e00" },
  Psychic:   { color:"#8b5cf6", bg:"#1e0a3a" },
  Darkness:  { color:"#7c3aed", bg:"#0f0a1e" },
  Dragon:    { color:"#0ea5e9", bg:"#0a1e2a" },
  Fighting:  { color:"#f97316", bg:"#2a0f00" },
  Metal:     { color:"#9ca3af", bg:"#1a1f2e" },
  Colorless: { color:"#6b7280", bg:"#1a1f2e" },
};

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

function TypeButton({ type, meta, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"12px 8px", borderRadius:10, cursor:"pointer",
      border:`1px solid ${active ? meta.color : meta.color + "44"}`,
      background: active ? `${meta.color}33` : meta.bg,
      display:"flex", flexDirection:"column", alignItems:"center", gap:6,
      transition:"all .15s", flex:1,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform="scale(1.03)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=active?meta.color:meta.color+"44"; e.currentTarget.style.transform="scale(1)"; }}
    >
      <EnergySVG type={type} size={28} />
      <span style={{ fontSize:10, fontWeight:500, color: active ? meta.color : meta.color+"cc" }}>{type}</span>
    </button>
  );
}

function SetTile({ set, apiData, onClick }) {
  const [logoError, setLogoError] = useState(false);
  const logo  = apiData?.images?.logo;
  const eraC  = ERA_COLOR[set.era] || "#64748b";
  return (
    <div onClick={onClick} style={{ background:"var(--bg-card)", border:`1px solid ${eraC}33`, borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"all .15s", position:"relative" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=eraC+"88"; e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=eraC+"33"; e.currentTarget.style.transform="translateY(0)"; }}>
      {set.hot && <div style={{ position:"absolute", top:8, right:8, zIndex:2, fontSize:9, fontFamily:"var(--font-mono)", color:"#f59e0b", background:"#2a1e0088", border:"1px solid #f59e0b44", padding:"2px 7px", borderRadius:10 }}>HOT</div>}
      <div style={{ height:90, background:`linear-gradient(135deg, ${eraC}18 0%, var(--bg-base) 100%)`, display:"flex", alignItems:"center", justifyContent:"center", borderBottom:`1px solid ${eraC}22`, padding:"10px 16px" }}>
        {logo && !logoError
          ? <img src={logo} alt={set.name} style={{ maxHeight:60, maxWidth:"90%", objectFit:"contain", filter:`drop-shadow(0 2px 8px ${eraC}66)` }} onError={() => setLogoError(true)} />
          : <div style={{ fontSize:13, fontWeight:700, color:eraC, textAlign:"center" }}>{set.name}</div>
        }
      </div>
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

function BrowseCard({ card }) {
  const typeColor = card.types?.[0] ? (TYPE_META[card.types[0]]?.color || "#64748b") : "#64748b";
  const isHolo = card.rarity?.toLowerCase().includes("holo") || card.rarity?.toLowerCase().includes("rare");
  const year = card.set?.releaseDate?.slice(0,4);
  const era  = year < "2003" ? "90s" : year < "2010" ? "00s" : year < "2020" ? "10s" : "20s";
  return (
    <Link href={`/card/${card.id}`} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", transition:"all .15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=typeColor+"66"; e.currentTarget.style.transform="translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="translateY(0)"; }}>
        <div style={{ height:140, background:"var(--bg-base)", display:"flex", alignItems:"center", justifyContent:"center", borderBottom:"1px solid var(--border-dim)", position:"relative" }}>
          {card.images?.small
            ? <img src={card.images.small} alt={card.name} style={{ height:130, objectFit:"contain" }} />
            : <div style={{ fontSize:11, color:"var(--text-dim)", fontFamily:"var(--font-mono)" }}>NO IMAGE</div>
          }
          {card.types?.[0] && TYPE_META[card.types[0]] && (
            <div style={{ position:"absolute", top:5, left:5 }}>
              <EnergySVG type={card.types[0]} size={20} />
            </div>
          )}
          <div style={{ position:"absolute", bottom:4, left:5, display:"flex", gap:3 }}>
            <EraTag era={era} />
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
      <div style={{ display:"grid", gridTemplateColumns:"40px 2fr 1fr 1fr 90px", gap:12, padding:"10px 16px", borderBottom: last?"none":"1px solid var(--border-dim)", alignItems:"center", transition:"background .12s" }}
        onMouseEnter={e => e.currentTarget.style.background="var(--bg-card)"}
        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
        <div style={{ width:36, height:48, borderRadius:4, overflow:"hidden", flexShrink:0 }}>
          {card.images?.small
            ? <img src={card.images.small} alt={card.name} style={{ width:36, height:48, objectFit:"cover" }} />
            : <div style={{ width:36, height:48, background:"var(--bg-base)", border:"1px solid var(--border)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {card.types?.[0] && <EnergySVG type={card.types[0]} size={22} />}
              </div>
          }
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{card.name}</div>
          <div style={{ fontSize:10, color:"var(--text-dim)" }}>#{card.number}</div>
        </div>
        <div style={{ fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.set?.name}</div>
        <div style={{ fontSize:10, color:typeColor, fontFamily:"var(--font-mono)" }}>{card.rarity}</div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          {card.types?.[0] && TYPE_META[card.types[0]] && <EnergySVG type={card.types[0]} size={16} />}
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
  const [loadingMore,setLoadingMore]= useState(false);
  const [mode,       setMode]       = useState("home");
  const [activeSet,  setActiveSet]  = useState(null);
  const [view,       setView]       = useState("grid");
  const [filterEra,  setFilterEra]  = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [sortBy,     setSortBy]     = useState("number");
  const [recent,     setRecent]     = useState([]);
  const [setApiData, setSetApiData] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const debouncedQ = useDebounce(query, 400);
  const abortRef   = useRef(null);

  useEffect(() => {
    fetch("/api/sets")
      .then(r => r.json())
      .then(d => { const map = {}; (d.data||[]).forEach(s => { map[s.id]=s; }); setSetApiData(map); })
      .catch(() => {})
      .finally(() => setSetsLoading(false));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("vault_recent_searches");
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  const saveRecent = (q) => {
    const next = [q, ...recent.filter(r => r !== q)].slice(0, 8);
    setRecent(next);
    localStorage.setItem("vault_recent_searches", JSON.stringify(next));
  };

  /* Fetch ALL cards in a set using pagination */
  const fetchSetCards = async (setId) => {
    setLoading(true);
    setCards([]);
    setTotalCount(0);
    let page = 1;
    let allCards = [];
    let hasMore = true;

    while (hasMore) {
      if (page > 1) setLoadingMore(true);
      try {
        const res  = await fetch(`/api/cards?set=${setId}&pageSize=250&page=${page}`);
        const data = await res.json();
        const batch = data.data || [];
        allCards = [...allCards, ...batch];
        setCards([...allCards]);
        setTotalCount(data.totalCount || allCards.length);
        /* If we got fewer than 250, we're done */
        hasMore = batch.length === 250;
        page++;
      } catch {
        hasMore = false;
      }
    }
    setLoading(false);
    setLoadingMore(false);
  };

  /* Fetch cards for search */
  const fetchSearchCards = (q) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    fetch(`/api/cards?pageSize=60&q=name:${encodeURIComponent(q)}*`, { signal: abortRef.current.signal })
      .then(r => r.json())
      .then(d => { setCards(d.data || []); setTotalCount(d.totalCount || 0); setLoading(false); })
      .catch(e => { if (e.name !== "AbortError") { setCards([]); setLoading(false); } });
  };

  useEffect(() => {
    if (!debouncedQ.trim()) { if (mode === "results") { setMode("home"); setCards([]); } return; }
    setMode("results");
    saveRecent(debouncedQ.trim());
    fetchSearchCards(debouncedQ.trim());
  }, [debouncedQ]);

  const openSet = (set) => {
    setActiveSet(set);
    setMode("set");
    setQuery("");
    fetchSetCards(set.id);
  };

  const clearAll = () => {
    setQuery(""); setMode("home"); setActiveSet(null); setCards([]);
    setFilterEra("All"); setFilterType("All"); setTotalCount(0);
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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search any card, set, or type..."
            style={{ width:"100%", height:44, paddingLeft:42, paddingRight:query?40:16, borderRadius:10, fontSize:14, border:`1px solid ${query?"var(--accent-blue)":"var(--border)"}`, transition:"border-color .2s" }} />
          {query && <button onClick={clearAll} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:24, height:24, borderRadius:"50%", background:"var(--border)", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>✕</button>}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px" }}>

        {/* ── HOME ── */}
        {mode === "home" && (
          <div>
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

            {/* Energy type buttons with SVG symbols */}
            <div style={{ marginBottom:32 }}>
              <SectionLabel style={{ display:"block", marginBottom:14 }}>Browse by type</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {Object.entries(TYPE_META).map(([type, meta]) => (
                  <TypeButton key={type} type={type} meta={meta} active={filterType===type}
                    onClick={() => { setFilterType(filterType===type?"All":type); setQuery(type); }} />
                ))}
              </div>
            </div>

            {/* Sets */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <SectionLabel>Browse sets</SectionLabel>
                <div style={{ display:"flex", gap:6 }}>
                  {ERAS.map(e => (
                    <button key={e} onClick={() => setFilterEra(filterEra===e?"All":e)} style={{ padding:"3px 9px", borderRadius:4, fontSize:10, cursor:"pointer", fontFamily:"var(--font-mono)", border: filterEra===e?`1px solid ${ERA_COLOR[e]||"#64748b"}`:"1px solid var(--border)", background: filterEra===e?`${ERA_COLOR[e]||"#64748b"}22`:"transparent", color: filterEra===e?ERA_COLOR[e]||"#64748b":"var(--text-dim)" }}>{e}</button>
                  ))}
                </div>
              </div>
              {setsLoading
                ? <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner /></div>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12 }}>
                    {filteredSets.map(set => <SetTile key={set.id} set={set} apiData={setApiData[set.id]} onClick={() => openSet(set)} />)}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ── RESULTS / SET ── */}
        {(mode === "results" || mode === "set") && (
          <div>
            {mode === "set" && activeSet && (
              <div style={{ background:`${ERA_COLOR[activeSet.era]||"#64748b"}12`, border:`1px solid ${ERA_COLOR[activeSet.era]||"#64748b"}44`, borderRadius:12, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
                {setApiData[activeSet.id]?.images?.logo
                  ? <img src={setApiData[activeSet.id].images.logo} alt={activeSet.name} style={{ height:50, objectFit:"contain", filter:`drop-shadow(0 2px 8px ${ERA_COLOR[activeSet.era]||"#64748b"}66)` }} />
                  : <div style={{ fontSize:16, fontWeight:700, color:ERA_COLOR[activeSet.era]||"#64748b" }}>{activeSet.name}</div>
                }
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{activeSet.name}</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                    {activeSet.year} · {loading ? "Loading..." : `${cards.length} of ${activeSet.total} cards`}
                    {loadingMore && <span style={{ color:"var(--accent-blue)", marginLeft:8 }}>Loading more...</span>}
                  </div>
                </div>
                <button onClick={clearAll} style={{ padding:"6px 12px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:11, cursor:"pointer" }}>← Back</button>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
              <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
                {loading && cards.length === 0 ? "Loading..." : `${displayCards.length} cards`}
                {loadingMore && <span style={{ color:"var(--accent-blue)", marginLeft:8 }}>· fetching more...</span>}
                {mode === "results" && query && <span style={{ color:"var(--accent-blue)" }}> · "{query}"</span>}
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                {/* SVG type filter icons */}
                <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                  <button onClick={() => setFilterType("All")} style={{ padding:"4px 8px", borderRadius:5, fontSize:10, cursor:"pointer", fontFamily:"var(--font-mono)", border: filterType==="All"?"1px solid var(--accent-amber)":"1px solid var(--border)", background: filterType==="All"?"#2a1e00":"transparent", color: filterType==="All"?"var(--accent-gold)":"var(--text-muted)" }}>All</button>
                  {Object.entries(TYPE_META).map(([type, meta]) => (
                    <button key={type} onClick={() => setFilterType(filterType===type?"All":type)} title={type} style={{ width:28, height:28, borderRadius:5, cursor:"pointer", border: filterType===type?`1px solid ${meta.color}`:"1px solid var(--border)", background: filterType===type?`${meta.color}22`:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:3 }}>
                      <EnergySVG type={type} size={18} />
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

            {loading && cards.length === 0 && (
              <div style={{ display:"flex", justifyContent:"center", padding:"60px 0", flexDirection:"column", alignItems:"center", gap:12 }}>
                <Spinner size={28} />
                <MonoText>Fetching cards...</MonoText>
              </div>
            )}

            {!loading && displayCards.length === 0 && (
              <EmptyState icon="◈" title="NO CARDS FOUND" subtitle="Try a different search or browse by set" />
            )}

            {displayCards.length > 0 && view === "grid" && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:10 }}>
                {displayCards.map(card => <BrowseCard key={card.id} card={card} />)}
                {loadingMore && <div style={{ display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, minHeight:200 }}><Spinner /></div>}
              </div>
            )}

            {displayCards.length > 0 && view === "list" && (
              <Panel style={{ overflow:"hidden" }}>
                {displayCards.map((card, i) => <BrowseRow key={card.id} card={card} last={i===displayCards.length-1} />)}
                {loadingMore && <div style={{ padding:20, textAlign:"center" }}><Spinner /></div>}
              </Panel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
