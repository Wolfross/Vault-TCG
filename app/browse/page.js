"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Panel, SectionLabel, MonoText, PixelText, HoloBadge, EraTag, Spinner, EmptyState } from "@/components/shared/ui";

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
  { id:"base1",     name:"Base Set",               year:1999, era:"90s", total:102, hot:true  },
  { id:"base2",     name:"Jungle",                 year:1999, era:"90s", total:64,  hot:false },
  { id:"base3",     name:"Fossil",                 year:1999, era:"90s", total:62,  hot:false },
  { id:"base4",     name:"Base Set 2",             year:2000, era:"90s", total:130, hot:false },
  { id:"base5",     name:"Team Rocket",            year:2000, era:"90s", total:83,  hot:false },
  { id:"gym1",      name:"Gym Heroes",             year:2000, era:"90s", total:132, hot:false },
  { id:"gym2",      name:"Gym Challenge",          year:2000, era:"90s", total:132, hot:false },
  { id:"neo1",      name:"Neo Genesis",            year:2000, era:"90s", total:111, hot:true  },
  { id:"neo2",      name:"Neo Discovery",          year:2001, era:"90s", total:75,  hot:false },
  { id:"neo3",      name:"Neo Revelation",         year:2001, era:"90s", total:66,  hot:false },
  { id:"neo4",      name:"Neo Destiny",            year:2002, era:"90s", total:113, hot:false },
  { id:"base6",     name:"Legendary Collection",   year:2002, era:"90s", total:110, hot:false },
  { id:"ecard1",    name:"Expedition Base Set",    year:2002, era:"00s", total:165, hot:false },
  { id:"ecard2",    name:"Aquapolis",              year:2003, era:"00s", total:186, hot:false },
  { id:"ecard3",    name:"Skyridge",               year:2003, era:"00s", total:182, hot:false },
  { id:"ex1",       name:"Ruby & Sapphire",        year:2003, era:"00s", total:109, hot:false },
  { id:"ex2",       name:"Sandstorm",              year:2003, era:"00s", total:100, hot:false },
  { id:"ex3",       name:"Dragon",                 year:2003, era:"00s", total:97,  hot:false },
  { id:"ex4",       name:"Team Magma vs Team Aqua",year:2004, era:"00s", total:97,  hot:false },
  { id:"ex5",       name:"Hidden Legends",         year:2004, era:"00s", total:102, hot:false },
  { id:"ex6",       name:"FireRed & LeafGreen",    year:2004, era:"00s", total:116, hot:false },
  { id:"ex7",       name:"Team Rocket Returns",    year:2004, era:"00s", total:111, hot:false },
  { id:"ex8",       name:"Deoxys",                 year:2005, era:"00s", total:108, hot:false },
  { id:"ex9",       name:"Emerald",                year:2005, era:"00s", total:106, hot:false },
  { id:"ex10",      name:"Unseen Forces",          year:2005, era:"00s", total:145, hot:false },
  { id:"ex11",      name:"Delta Species",          year:2005, era:"00s", total:114, hot:false },
  { id:"ex12",      name:"Legend Maker",           year:2006, era:"00s", total:93,  hot:false },
  { id:"ex13",      name:"Holon Phantoms",         year:2006, era:"00s", total:110, hot:false },
  { id:"ex14",      name:"Crystal Guardians",      year:2006, era:"00s", total:100, hot:false },
  { id:"ex15",      name:"Dragon Frontiers",       year:2006, era:"00s", total:101, hot:false },
  { id:"ex16",      name:"Power Keepers",          year:2007, era:"00s", total:108, hot:false },
  { id:"dp1",       name:"Diamond & Pearl",        year:2007, era:"00s", total:130, hot:false },
  { id:"dp2",       name:"Mysterious Treasures",   year:2007, era:"00s", total:123, hot:false },
  { id:"dp3",       name:"Secret Wonders",         year:2007, era:"00s", total:132, hot:false },
  { id:"dp4",       name:"Great Encounters",       year:2008, era:"00s", total:106, hot:false },
  { id:"dp5",       name:"Majestic Dawn",          year:2008, era:"00s", total:100, hot:false },
  { id:"dp6",       name:"Legends Awakened",       year:2008, era:"00s", total:146, hot:false },
  { id:"dp7",       name:"Stormfront",             year:2008, era:"00s", total:106, hot:false },
  { id:"pl1",       name:"Platinum",               year:2009, era:"00s", total:133, hot:false },
  { id:"pl2",       name:"Rising Rivals",          year:2009, era:"00s", total:120, hot:false },
  { id:"pl3",       name:"Supreme Victors",        year:2009, era:"00s", total:153, hot:false },
  { id:"pl4",       name:"Arceus",                 year:2009, era:"00s", total:111, hot:false },
  { id:"hgss1",     name:"HeartGold & SoulSilver", year:2010, era:"10s", total:123, hot:false },
  { id:"hgss2",     name:"Unleashed",              year:2010, era:"10s", total:96,  hot:false },
  { id:"hgss3",     name:"Undaunted",              year:2010, era:"10s", total:91,  hot:false },
  { id:"hgss4",     name:"Triumphant",             year:2010, era:"10s", total:103, hot:false },
  { id:"col1",      name:"Call of Legends",        year:2011, era:"10s", total:95,  hot:false },
  { id:"bw1",       name:"Black & White",          year:2011, era:"10s", total:114, hot:false },
  { id:"bw2",       name:"Emerging Powers",        year:2011, era:"10s", total:98,  hot:false },
  { id:"bw3",       name:"Noble Victories",        year:2011, era:"10s", total:102, hot:false },
  { id:"bw4",       name:"Next Destinies",         year:2012, era:"10s", total:103, hot:false },
  { id:"bw5",       name:"Dark Explorers",         year:2012, era:"10s", total:111, hot:false },
  { id:"bw6",       name:"Dragons Exalted",        year:2012, era:"10s", total:128, hot:false },
  { id:"bw7",       name:"Boundaries Crossed",     year:2012, era:"10s", total:153, hot:false },
  { id:"bw8",       name:"Plasma Storm",           year:2013, era:"10s", total:138, hot:false },
  { id:"bw9",       name:"Plasma Freeze",          year:2013, era:"10s", total:122, hot:false },
  { id:"bw10",      name:"Plasma Blast",           year:2013, era:"10s", total:105, hot:false },
  { id:"bw11",      name:"Legendary Treasures",    year:2013, era:"10s", total:140, hot:false },
  { id:"xy1",       name:"XY",                     year:2014, era:"10s", total:146, hot:false },
  { id:"xy2",       name:"Flashfire",              year:2014, era:"10s", total:106, hot:false },
  { id:"xy3",       name:"Furious Fists",          year:2014, era:"10s", total:114, hot:false },
  { id:"xy4",       name:"Phantom Forces",         year:2014, era:"10s", total:122, hot:false },
  { id:"xy5",       name:"Primal Clash",           year:2015, era:"10s", total:164, hot:false },
  { id:"xy6",       name:"Roaring Skies",          year:2015, era:"10s", total:110, hot:false },
  { id:"xy7",       name:"Ancient Origins",        year:2015, era:"10s", total:100, hot:false },
  { id:"xy8",       name:"BREAKthrough",           year:2015, era:"10s", total:165, hot:false },
  { id:"xy9",       name:"BREAKpoint",             year:2016, era:"10s", total:123, hot:false },
  { id:"xy10",      name:"Fates Collide",          year:2016, era:"10s", total:125, hot:false },
  { id:"xy11",      name:"Steam Siege",            year:2016, era:"10s", total:116, hot:false },
  { id:"evolutions",name:"XY Evolutions",          year:2016, era:"10s", total:108, hot:true  },
  { id:"sm1",       name:"Sun & Moon",             year:2017, era:"10s", total:149, hot:false },
  { id:"sm2",       name:"Guardians Rising",       year:2017, era:"10s", total:145, hot:false },
  { id:"sm3",       name:"Burning Shadows",        year:2017, era:"10s", total:169, hot:false },
  { id:"sm35",      name:"Shining Legends",        year:2017, era:"10s", total:73,  hot:false },
  { id:"sm4",       name:"Crimson Invasion",       year:2017, era:"10s", total:124, hot:false },
  { id:"sm5",       name:"Ultra Prism",            year:2018, era:"10s", total:156, hot:false },
  { id:"sm6",       name:"Forbidden Light",        year:2018, era:"10s", total:146, hot:false },
  { id:"sm7",       name:"Celestial Storm",        year:2018, era:"10s", total:183, hot:false },
  { id:"sm75",      name:"Dragon Majesty",         year:2018, era:"10s", total:70,  hot:false },
  { id:"sm8",       name:"Lost Thunder",           year:2018, era:"10s", total:236, hot:false },
  { id:"sm9",       name:"Team Up",                year:2019, era:"10s", total:196, hot:false },
  { id:"sm10",      name:"Unbroken Bonds",         year:2019, era:"10s", total:234, hot:false },
  { id:"sm11",      name:"Unified Minds",          year:2019, era:"10s", total:236, hot:false },
  { id:"sm115",     name:"Hidden Fates",           year:2019, era:"10s", total:69,  hot:true  },
  { id:"sm12",      name:"Cosmic Eclipse",         year:2019, era:"10s", total:272, hot:false },
  { id:"swsh1",     name:"Sword & Shield",         year:2020, era:"20s", total:216, hot:false },
  { id:"swsh2",     name:"Rebel Clash",            year:2020, era:"20s", total:209, hot:false },
  { id:"swsh3",     name:"Darkness Ablaze",        year:2020, era:"20s", total:201, hot:false },
  { id:"swsh35",    name:"Champion's Path",        year:2020, era:"20s", total:80,  hot:false },
  { id:"swsh4",     name:"Vivid Voltage",          year:2020, era:"20s", total:203, hot:false },
  { id:"swsh45",    name:"Shining Fates",          year:2021, era:"20s", total:73,  hot:true  },
  { id:"swsh5",     name:"Battle Styles",          year:2021, era:"20s", total:183, hot:false },
  { id:"swsh6",     name:"Chilling Reign",         year:2021, era:"20s", total:233, hot:false },
  { id:"swsh7",     name:"Evolving Skies",         year:2021, era:"20s", total:237, hot:true  },
  { id:"swsh8",     name:"Fusion Strike",          year:2021, era:"20s", total:284, hot:false },
  { id:"swsh9",     name:"Brilliant Stars",        year:2022, era:"20s", total:186, hot:false },
  { id:"swsh10",    name:"Astral Radiance",        year:2022, era:"20s", total:246, hot:false },
  { id:"swsh11",    name:"Lost Origin",            year:2022, era:"20s", total:217, hot:false },
  { id:"swsh12",    name:"Silver Tempest",         year:2022, era:"20s", total:215, hot:false },
  { id:"swsh12pt5", name:"Crown Zenith",           year:2023, era:"20s", total:160, hot:false },
  { id:"sv1",       name:"Scarlet & Violet",       year:2023, era:"20s", total:198, hot:false },
  { id:"sv2",       name:"Paldea Evolved",         year:2023, era:"20s", total:279, hot:false },
  { id:"sv3",       name:"Obsidian Flames",        year:2023, era:"20s", total:197, hot:true  },
  { id:"sv3pt5",    name:"151",                    year:2023, era:"20s", total:165, hot:true  },
  { id:"sv4",       name:"Paradox Rift",           year:2023, era:"20s", total:266, hot:false },
  { id:"sv4pt5",    name:"Paldean Fates",          year:2024, era:"20s", total:91,  hot:true  },
  { id:"sv5",       name:"Temporal Forces",        year:2024, era:"20s", total:218, hot:false },
  { id:"sv6",       name:"Twilight Masquerade",    year:2024, era:"20s", total:167, hot:false },
  { id:"sv6pt5",    name:"Shrouded Fable",         year:2024, era:"20s", total:99,  hot:false },
  { id:"sv7",       name:"Stellar Crown",          year:2024, era:"20s", total:175, hot:false },
  { id:"sv8",       name:"Surging Sparks",         year:2024, era:"20s", total:252, hot:false },
  { id:"sv8pt5",    name:"Prismatic Evolutions",   year:2025, era:"20s", total:131, hot:true  },
  { id:"sv9",       name:"Journey Together",       year:2025, era:"20s", total:190, hot:false },
];

const ERA_COLOR = { "90s":"#f59e0b","00s":"#22c55e","10s":"#3b82f6","20s":"#8b5cf6" };
const ERAS = ["All","90s","00s","10s","20s"];
const PAGE_SIZE = 60;

// ✅ Filter out card back images from the API
function hasValidImage(card) {
  const url = card.images?.small || "";
  if (!url) return false;
  if (url.includes("cardback")) return false;
  if (url.includes("card-back")) return false;
  if (url.includes("back.png")) return false;
  return true;
}

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
  const logo = apiData?.images?.logo;
  const eraC = ERA_COLOR[set.era] || "#64748b";
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
          {hasValidImage(card)
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
          {hasValidImage(card)
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

// ✅ Pagination controls
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, marginTop:24 }}>
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        style={{ padding:"6px 12px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color: page===1?"var(--text-dim)":"var(--text-muted)", cursor: page===1?"default":"pointer", fontSize:12 }}>← Prev</button>
      {start > 1 && <><button onClick={() => onPage(1)} style={{ padding:"6px 10px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>1</button><span style={{ color:"var(--text-dim)" }}>…</span></>}
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)}
          style={{ padding:"6px 10px", borderRadius:6, border: p===page?"1px solid var(--accent-amber)":"1px solid var(--border)", background: p===page?"#2a1e00":"transparent", color: p===page?"var(--accent-gold)":"var(--text-muted)", cursor:"pointer", fontSize:12, fontFamily:"var(--font-mono)" }}>{p}</button>
      ))}
      {end < totalPages && <><span style={{ color:"var(--text-dim)" }}>…</span><button onClick={() => onPage(totalPages)} style={{ padding:"6px 10px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>{totalPages}</button></>}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        style={{ padding:"6px 12px", borderRadius:6, border:"1px solid var(--border)", background:"transparent", color: page===totalPages?"var(--text-dim)":"var(--text-muted)", cursor: page===totalPages?"default":"pointer", fontSize:12 }}>Next →</button>
    </div>
  );
}

export default function BrowsePage() {
  const [query,       setQuery]       = useState("");
  const [cards,       setCards]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [setsLoading, setSetsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mode,        setMode]        = useState("home");
  const [activeSet,   setActiveSet]   = useState(null);
  const [activeType,  setActiveType]  = useState("All");
  const [view,        setView]        = useState("grid");
  const [filterEra,   setFilterEra]   = useState("All");
  const [sortBy,      setSortBy]      = useState("number");
  const [recent,      setRecent]      = useState([]);
  const [setApiData,  setSetApiData]  = useState({});
  const [totalCount,  setTotalCount]  = useState(0);
  const [typePage,    setTypePage]    = useState(1);
  const debouncedQ = useDebounce(query, 400);
  const abortRef   = useRef(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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

  const fetchSetCards = async (setId) => {
    setLoading(true);
    setCards([]);
    setTotalCount(0);
    setActiveType("All");
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
        hasMore = batch.length === 250;
        page++;
      } catch { hasMore = false; }
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const fetchSearchCards = (q) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setActiveType("All");
    fetch(`/api/cards?pageSize=${PAGE_SIZE}&q=name:${encodeURIComponent(q)}*`, { signal: abortRef.current.signal })
      .then(r => r.json())
      .then(d => { setCards(d.data || []); setTotalCount(d.totalCount || 0); setLoading(false); })
      .catch(e => { if (e.name !== "AbortError") { setCards([]); setLoading(false); } });
  };

  // ✅ fetch by type with clean page support
  const fetchTypeCards = (type, page = 1) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setCards([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetch(`/api/cards?pageSize=${PAGE_SIZE}&page=${page}&q=types:${encodeURIComponent(type)}`, { signal: abortRef.current.signal })
      .then(r => r.json())
      .then(d => {
        setCards(d.data || []);
        setTotalCount(d.totalCount || 0);
        setTypePage(page);
        setLoading(false);
      })
      .catch(e => { if (e.name !== "AbortError") { setCards([]); setLoading(false); } });
  };

  useEffect(() => {
    if (!debouncedQ.trim()) { if (mode === "results") { setMode("home"); setCards([]); } return; }
    setMode("results");
    setActiveType("All");
    saveRecent(debouncedQ.trim());
    fetchSearchCards(debouncedQ.trim());
  }, [debouncedQ]);

  const openSet = (set) => {
    setActiveSet(set);
    setMode("set");
    setQuery("");
    fetchSetCards(set.id);
  };

  const switchType = (type) => {
    if (type === "All") { setActiveType("All"); setMode("home"); setCards([]); return; }
    setActiveType(type);
    setMode("results");
    setQuery("");
    setActiveSet(null);
    fetchTypeCards(type, 1);
  };

  const clearAll = () => {
    setQuery(""); setMode("home"); setActiveSet(null); setCards([]);
    setActiveType("All"); setTotalCount(0); setTypePage(1);
  };

  const filteredSets = SET_CATALOG.filter(s => filterEra === "All" || s.era === filterEra);

  const displayCards = [...cards].sort((a, b) => {
    if (sortBy === "name")   return a.name.localeCompare(b.name);
    if (sortBy === "rarity") return (a.rarity||"").localeCompare(b.rarity||"");
    return (parseInt(a.number)||0) - (parseInt(b.number)||0);
  });

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh", padding:"0 0 60px" }}>

      <div style={{ background:"var(--bg-nav)", borderBottom:"1px solid var(--border)", padding:"12px 24px", position:"sticky", top:52, zIndex:90 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", fontSize:16, pointerEvents:"none" }}>⌕</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search any card, set, or type..."
            style={{ width:"100%", height:44, paddingLeft:42, paddingRight:query?40:16, borderRadius:10, fontSize:14, border:`1px solid ${query?"var(--accent-blue)":"var(--border)"}`, transition:"border-color .2s" }} />
          {query && <button onClick={clearAll} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:24, height:24, borderRadius:"50%", background:"var(--border)", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>✕</button>}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px" }}>

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

            <div style={{ marginBottom:32 }}>
              <SectionLabel style={{ display:"block", marginBottom:14 }}>Browse by type</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                {Object.entries(TYPE_META).map(([type, meta]) => (
                  <TypeButton key={type} type={type} meta={meta} active={activeType===type}
                    onClick={() => switchType(activeType === type ? "All" : type)}
                  />
                ))}
              </div>
            </div>

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

            {mode === "results" && activeType !== "All" && (
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", background:`${TYPE_META[activeType]?.color}18`, border:`1px solid ${TYPE_META[activeType]?.color}44`, borderRadius:12 }}>
                <EnergySVG type={activeType} size={32} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{activeType} type</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                    {loading ? "Loading..." : `${totalCount} cards · page ${typePage} of ${totalPages}`}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {Object.entries(TYPE_META).map(([type, meta]) => (
                    <button key={type} onClick={() => switchType(type)} title={type}
                      style={{ width:28, height:28, borderRadius:5, cursor:"pointer", border: activeType===type?`1px solid ${meta.color}`:"1px solid var(--border)", background: activeType===type?`${meta.color}22`:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:3 }}>
                      <EnergySVG type={type} size={18} />
                    </button>
                  ))}
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
              </div>
            )}

            {displayCards.length > 0 && view === "list" && (
              <Panel style={{ overflow:"hidden" }}>
                {displayCards.map((card, i) => <BrowseRow key={card.id} card={card} last={i===displayCards.length-1} />)}
              </Panel>
            )}

            {/* ✅ Clean page buttons for type browsing */}
            {mode === "results" && activeType !== "All" && !loading && totalPages > 1 && (
              <Pagination
                page={typePage}
                totalPages={totalPages}
                onPage={(p) => fetchTypeCards(activeType, p)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
