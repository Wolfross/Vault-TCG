"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Panel, SectionLabel, PixelText, MonoText, HoloBadge, Button, Spinner } from "@/components/shared/ui";
import { addCard } from "@/lib/collection";

/* ─── Variant question engine (same as prototype) ─── */
const VARIANT_QUESTIONS = {
  "Base Set": [
    {
      id:"print", question:"Which print run is this?",
      why:"Base Set was printed three times. Check the bottom-left corner of the card.",
      required:true,
      hint:{ label:"Where to look", steps:[
        { icon:"①", text:"Bottom-left corner — look for a small ① Edition 1 stamp." },
        { icon:"②", text:"No stamp? Check if artwork box has a shadow beneath it. No shadow = Shadowless." },
        { icon:"③", text:"Has a shadow under the artwork? That's Unlimited." },
      ]},
      options:[
        { value:"1st_edition", label:"1st Edition",  sublabel:"Has the ① stamp, bottom-left",       mult:6.8,  badge:"RAREST",  badgeColor:"#f59e0b" },
        { value:"shadowless",  label:"Shadowless",   sublabel:"No stamp, no shadow under artwork",  mult:1.4,  badge:"RARE",    badgeColor:"#8b5cf6" },
        { value:"unlimited",   label:"Unlimited",    sublabel:"No stamp, shadow under artwork box", mult:1.0,  badge:null,      badgeColor:null      },
        { value:"unsure",      label:"Not sure",     sublabel:"Flag for review later",              mult:null, badge:"FLAG",    badgeColor:"#ef4444" },
      ],
    },
    {
      id:"language", question:"What language?", why:null, required:true, hint:null,
      options:[
        { value:"en",    label:"English",  sublabel:null, mult:1.0,  badge:null, badgeColor:null },
        { value:"jp",    label:"Japanese", sublabel:"Yellow border",  mult:0.3,  badge:null, badgeColor:null },
        { value:"other", label:"Other",    sublabel:null, mult:0.4,  badge:null, badgeColor:null },
      ],
    },
  ],
};
// Alias other sets
["Jungle","Fossil","Team Rocket","Gym Heroes","XY Evolutions","Base Set 2"].forEach(s => {
  VARIANT_QUESTIONS[s] = [
    {
      id:"print", question:"Is this a 1st Edition?",
      why:"1st Edition cards have a stamp and are worth more.",
      required:true,
      hint:{ label:"Where to look", steps:[{ icon:"①", text:"Look for the ① Edition 1 stamp in the bottom-left corner." }] },
      options:[
        { value:"1st_edition", label:"1st Edition", sublabel:"Has the ① stamp", mult:2.8, badge:"HIGHER VALUE", badgeColor:"#f59e0b" },
        { value:"unlimited",   label:"Unlimited",   sublabel:"No stamp",        mult:1.0, badge:null,           badgeColor:null      },
        { value:"unsure",      label:"Not sure",    sublabel:"Flag for review", mult:null, badge:"FLAG",        badgeColor:"#ef4444" },
      ],
    },
    {
      id:"language", question:"Language?", why:null, required:true, hint:null,
      options:[
        { value:"en", label:"English", sublabel:null, mult:1.0, badge:null, badgeColor:null },
        { value:"jp", label:"Japanese", sublabel:null, mult:0.25, badge:null, badgeColor:null },
        { value:"other", label:"Other", sublabel:null, mult:0.35, badge:null, badgeColor:null },
      ],
    },
  ];
});
VARIANT_QUESTIONS["__default__"] = [
  {
    id:"language", question:"Language?", why:null, required:true, hint:null,
    options:[
      { value:"en", label:"English", sublabel:null, mult:1.0, badge:null, badgeColor:null },
      { value:"jp", label:"Japanese", sublabel:null, mult:null, badge:null, badgeColor:null },
      { value:"other", label:"Other", sublabel:null, mult:null, badge:null, badgeColor:null },
    ],
  },
];

function getQuestions(setName) { return VARIANT_QUESTIONS[setName] || VARIANT_QUESTIONS["__default__"]; }

function computePrice(base, questions, answers) {
  let p = base || 0;
  questions.forEach(q => {
    const opt = q.options.find(o => o.value === answers[q.id]);
    if (opt?.mult) p = p * opt.mult;
  });
  return Math.round(p);
}

const CONDITIONS = ["Near Mint (NM)","Lightly Played (LP)","Moderately Played (MP)","Heavily Played (HP)","Damaged (D)"];
const fmt = n => "$" + Number(n||0).toLocaleString("en-US",{maximumFractionDigits:0});

export default function ScanPage() {
  const router = useRouter();
  const [step,         setStep]         = useState(0);
  const [scanPhase,    setScanPhase]    = useState("live");
  const [scanLine,     setScanLine]     = useState(0);
  const [fallback,     setFallback]     = useState(null);
  const [query,        setQuery]        = useState("");
  const [apiResults,   setApiResults]   = useState([]);
  const [apiLoading,   setApiLoading]   = useState(false);
  const [messages,     setMessages]     = useState([{ role:"assistant", content:"Describe your card — the creature, any colours, how old it looks, anything you can read on it." }]);
  const [aiInput,      setAiInput]      = useState("");
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiMatches,    setAiMatches]    = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [varAnswers,   setVarAnswers]   = useState({});
  const [qIndex,       setQIndex]       = useState(0);
  const [expandHint,   setExpandHint]   = useState(false);
  const [condition,    setCondition]    = useState("Near Mint (NM)");
  const [grade,        setGrade]        = useState("Raw");
  const [quantity,     setQuantity]     = useState(1);
  const [purchasePrice,setPurchasePrice]= useState("");
  const [saving,       setSaving]       = useState(false);

  const scanTimer  = useRef(null);
  const lineTimer  = useRef(null);
  const chatEnd    = useRef(null);
  const searchTimer= useRef(null);

  /* ── Auto scan ── */
  useEffect(() => {
    if (step !== 0) return;
    setScanPhase("live"); setScanLine(0);
    let pos=0, dir=1;
    lineTimer.current = setInterval(() => {
      pos += dir*2; if(pos>=100) dir=-1; if(pos<=0) dir=1; setScanLine(pos);
    }, 16);
    scanTimer.current = setTimeout(simulateScan, 2800);
    return () => { clearInterval(lineTimer.current); clearTimeout(scanTimer.current); };
  }, [step]);

  const simulateScan = () => {
    clearInterval(lineTimer.current);
    const hit = Math.random() > 0.5;
    if (hit) {
      setScanPhase("found");
      setTimeout(async () => {
        // Fetch a real card from the API
        const res = await fetch("/api/cards?q=name:Charizard&set=base1&pageSize=1");
        const data = await res.json();
        const card = data.data?.[0];
        if (card) { setSelected(card); setStep(2.5); }
        else setStep(1);
      }, 1200);
    } else {
      setScanPhase("failed");
      setTimeout(() => setStep(1), 900);
    }
  };

  /* ── Search ── */
  useEffect(() => {
    if (!query.trim()) { setApiResults([]); return; }
    clearTimeout(searchTimer.current);
    setApiLoading(true);
    searchTimer.current = setTimeout(async () => {
      const res  = await fetch(`/api/cards?q=name:${encodeURIComponent(query)}*&pageSize=12`);
      const data = await res.json();
      setApiResults(data.data || []);
      setApiLoading(false);
    }, 350);
  }, [query]);

  /* ── AI chat ── */
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, aiMatches]);

  const sendAi = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");
    const newMsgs = [...messages, { role:"user", content:text }];
    setMessages(newMsgs);
    setAiLoading(true);
    setAiMatches([]);
    const cardList = (apiResults.length ? apiResults : []).map(c => `ID:${c.id}|${c.name}|${c.set?.name}|${c.rarity}`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:500,
          system:`You're a TCG card identifier. Reply in 1-2 sentences. End with: MATCHES:[{"id":"...","score":0-100,"reason":"..."}]. If no cards listed, suggest the user try searching by name first. Cards available:\n${cardList||"(user hasn't searched yet — ask them to type the name first)"}`,
          messages:newMsgs.map(m=>({role:m.role,content:m.content}))
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      const ml  = raw.match(/MATCHES:\s*(\[.*\])/s);
      let matches = [];
      if (ml) { try { matches = JSON.parse(ml[1]); } catch(e){} }
      setMessages(m => [...m, { role:"assistant", content:raw.replace(/MATCHES:\s*\[.*\]/s,"").trim() }]);
      setAiMatches(matches.map(m => { const c = apiResults.find(x=>x.id===m.id); return c?{...m,card:c}:null; }).filter(Boolean).slice(0,4));
    } catch(e) {
      setMessages(m => [...m, { role:"assistant", content:"Connection error — try searching by name instead." }]);
    }
    setAiLoading(false);
  };

  /* ── Variant step ── */
  const questions = selected ? getQuestions(selected.set?.name) : [];
  const currentQ  = questions[qIndex];
  const isLastQ   = qIndex === questions.length - 1;

  const selectAnswer = (value) => {
    const newA = { ...varAnswers, [currentQ.id]:value };
    setVarAnswers(newA);
    setExpandHint(false);
    if (isLastQ) setTimeout(() => { setStep(3); }, 300);
    else setTimeout(() => { setQIndex(i=>i+1); }, 300);
  };

  /* ── Price computation ── */
  const basePrice = selected?.tcgplayer?.prices?.holofoil?.market || selected?.tcgplayer?.prices?.normal?.market || 0;
  const finalPrice = computePrice(basePrice, questions, varAnswers);
  const priceSpread = currentQ?.options.filter(o=>o.mult&&o.value!=="unsure").map(o=>({...o,price:Math.round(basePrice*o.mult)})) || [];
  const maxP = Math.max(...priceSpread.map(o=>o.price),0);
  const minP = Math.min(...priceSpread.map(o=>o.price),Infinity);
  const bigSpread = maxP > minP * 1.5 && priceSpread.length > 1;

  /* ── Save ── */
  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const condCode = condition.match(/\(([^)]+)\)/)?.[1] || "NM";
    await addCard({
      card_id:        selected.id,
      name:           selected.name,
      set_name:       selected.set?.name,
      set_id:         selected.set?.id,
      number:         selected.number,
      image_url:      selected.images?.small,
      rarity:         selected.rarity,
      holo:           selected.rarity?.toLowerCase().includes("holo"),
      condition:      condCode,
      grade,
      current_price:  finalPrice,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      print_variant:  varAnswers.print || "unlimited",
      language:       varAnswers.language || "en",
      card_variant:   varAnswers.variant || null,
      flagged:        Object.values(varAnswers).includes("unsure"),
      quantity,
      era:            selected.set?.releaseDate?.slice(0,4) < "2003" ? "90s" : selected.set?.releaseDate?.slice(0,4) < "2010" ? "00s" : selected.set?.releaseDate?.slice(0,4) < "2020" ? "10s" : "20s",
    });
    setSaving(false);
    setStep(4);
  };

  const reset = () => {
    setStep(0); setScanPhase("live"); setFallback(null); setQuery(""); setApiResults([]);
    setMessages([{ role:"assistant", content:"Describe your card — the creature, any colours, how old it looks, anything you can read on it." }]);
    setAiInput(""); setAiMatches([]); setSelected(null); setVarAnswers({});
    setQIndex(0); setCondition("Near Mint (NM)"); setGrade("Raw"); setQuantity(1); setPurchasePrice("");
  };

  const STEPS = ["Scan","Identify","Verify","Confirm","Done"];

  return (
    <div style={{ background:"var(--bg-base)", minHeight:"100vh" }}>
      {/* Breadcrumb progress */}
      <div style={{ background:"var(--bg-nav)", borderBottom:"1px solid var(--border-dim)", padding:"10px 24px" }}>
        <div style={{ maxWidth:640, margin:"0 auto", display:"flex", alignItems:"center" }}>
          {STEPS.map((l,i,arr)=>{
            const active=(l==="Scan"&&step<=1)||(l==="Identify"&&step===2)||(l==="Verify"&&step===2.5)||(l==="Confirm"&&step===3)||(l==="Done"&&step===4);
            const done=(l==="Scan"&&step>1)||(l==="Identify"&&(step===2.5||step>=3))||(l==="Verify"&&step>=3)||(l==="Confirm"&&step===4);
            return (
              <div key={l} style={{ display:"flex", alignItems:"center", flex:i<arr.length-1?1:"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:20,height:20,borderRadius:"50%",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",background:done?"#064e3b":active?"#f59e0b":"var(--bg-card)",border:active?"2px solid #f59e0b":done?"2px solid #22c55e":"1px solid var(--border)",color:done?"#4ade80":active?"#000":"var(--text-dim)" }}>{done?"✓":i+1}</div>
                  <span style={{ fontSize:10,color:active?"var(--accent-gold)":done?"var(--accent-green)":"var(--text-dim)",fontFamily:"var(--font-mono)" }}>{l}</span>
                </div>
                {i<arr.length-1&&<div style={{ flex:1,height:1,background:"var(--border)",margin:"0 8px" }}/>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"20px 20px 60px" }}>

        {/* ── STEP 0: SCAN ── */}
        {step===0&&(
          <div className="fade-up">
            <div style={{ textAlign:"center", marginBottom:14 }}>
              <PixelText size={11} style={{ display:"block", marginBottom:4 }}>CARDEX SCAN</PixelText>
              <div style={{ fontSize:12, color:"var(--text-muted)" }}>Hold card steady — scanning automatically</div>
            </div>
            <div style={{ position:"relative",height:300,borderRadius:14,overflow:"hidden",background:"#050a12",marginBottom:14,border:scanPhase==="found"?"2px solid #22c55e":scanPhase==="failed"?"2px solid #ef4444":"1px solid var(--border)",transition:"border-color .3s,box-shadow .4s",boxShadow:scanPhase==="found"?"0 0 32px #22c55e55":scanPhase==="failed"?"0 0 24px #ef444444":"none" }}>
              {[[{top:10,left:10},{borderTop:"2px solid #f59e0b",borderLeft:"2px solid #f59e0b"}],[{top:10,right:10},{borderTop:"2px solid #f59e0b",borderRight:"2px solid #f59e0b"}],[{bottom:10,left:10},{borderBottom:"2px solid #f59e0b",borderLeft:"2px solid #f59e0b"}],[{bottom:10,right:10},{borderBottom:"2px solid #f59e0b",borderRight:"2px solid #f59e0b"}]].map(([pos,border],i)=>(
                <div key={i} style={{ position:"absolute",width:22,height:22,...pos,...border }}/>
              ))}
              {scanPhase==="live"&&<div style={{ position:"absolute",left:12,right:12,top:`${scanLine}%`,height:2,background:"linear-gradient(90deg,transparent,#f59e0bcc,#f59e0b,#f59e0bcc,transparent)",boxShadow:"0 0 10px #f59e0b99",transition:"top 0.016s linear" }}/>}
              {scanPhase==="found"&&<div style={{ position:"absolute",inset:0,background:"#22c55e0d",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12 }}><div style={{ width:56,height:56,borderRadius:"50%",background:"#064e3b",border:"2px solid #22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,animation:"glowPulse 1s ease-in-out infinite" }}>✓</div><MonoText color="#4ade80">IDENTIFIED — running variant check</MonoText></div>}
              {scanPhase==="failed"&&<div style={{ position:"absolute",inset:0,background:"#ef444408",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8 }}><PixelText size={11} color="#f87171">UNREADABLE</PixelText><div style={{ fontSize:12,color:"var(--text-muted)" }}>Trying manual options...</div></div>}
              <div style={{ position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:7 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:"#f59e0b",animation:"blink 1.2s ease-in-out infinite",boxShadow:"0 0 6px #f59e0b" }}/>
                <MonoText size={10}>SCANNING...</MonoText>
              </div>
            </div>
            <div style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:"var(--accent-amber)",animation:"blink 1.2s infinite",flexShrink:0 }}/>
              <MonoText size={10} style={{ flex:1 }}>Auto-scanning · keep card flat and still · no button needed</MonoText>
              <button onClick={()=>{clearTimeout(scanTimer.current);clearInterval(lineTimer.current);simulateScan();}} style={{ fontSize:10,color:"var(--text-dim)",background:"transparent",border:"none",cursor:"pointer",fontFamily:"var(--font-mono)",textDecoration:"underline",whiteSpace:"nowrap" }}>demo scan →</button>
            </div>
            <div style={{ textAlign:"center" }}>
              <button onClick={()=>setStep(1)} style={{ fontSize:11,color:"var(--text-dim)",background:"transparent",border:"none",cursor:"pointer",fontFamily:"var(--font-mono)",textDecoration:"underline" }}>Skip → log manually</button>
            </div>
          </div>
        )}

        {/* ── STEP 1: FALLBACK ── */}
        {step===1&&(
          <div className="fade-up">
            <div style={{ background:"#130a0a",border:"1px solid #7f1d1d55",borderRadius:10,padding:"14px 16px",marginBottom:20 }}>
              <PixelText size={10} color="#f87171" style={{ display:"block", marginBottom:5 }}>SCAN UNSUCCESSFUL</PixelText>
              <div style={{ fontSize:12,color:"var(--text-muted)",lineHeight:1.6 }}>Choose how to find your card:</div>
            </div>
            {[
              { k:"retry", icon:"↺", label:"Try scanning again", sub:"Better lighting or a flatter surface", color:"var(--text-secondary)", border:"1px solid var(--border)" },
              { k:"search", icon:"🔍", label:"Search by name", sub:"Type the name and pick your exact version", color:"var(--accent-gold)", border:"2px solid #f59e0b44" },
              { k:"visual", icon:"🎨", label:"Browse by artwork & era", sub:"See every version — tap what matches", color:"#a78bfa", border:"1px solid #8b5cf644" },
              { k:"ai", icon:"✦", label:"Describe it to me", sub:'"Big dragon, old card, shiny, breathing fire..."', color:"#93c5fd", border:"2px solid #3b82f655" },
            ].map(({ k,icon,label,sub,color,border })=>(
              <div key={k} onClick={()=>{ if(k==="retry"){setScanPhase("live");setStep(0);}else{setFallback(k);setStep(2);} }} style={{ padding:"14px 16px",borderRadius:10,border,background:"var(--bg-card)",display:"flex",alignItems:"center",gap:14,cursor:"pointer",marginBottom:10,transition:"all .15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#111b2e"}
                onMouseLeave={e=>e.currentTarget.style.background="var(--bg-card)"}>
                <div style={{ width:38,height:38,borderRadius:8,background:`${color}15`,border:`1px solid ${color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:600,color }}>{label}</div>
                  <div style={{ fontSize:11,color:"var(--text-dim)",marginTop:2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 2: IDENTIFY ── */}
        {step===2&&fallback!=="ai"&&(
          <div className="fade-up">
            <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Type a card name..." style={{ width:"100%",padding:"12px 14px",borderRadius:8,fontSize:14,marginBottom:12 }}/>
            {["Charizard","Pikachu","Blastoise","Gengar","Mewtwo","Lugia"].map(n=>(
              <button key={n} onClick={()=>setQuery(n)} style={{ padding:"5px 11px",borderRadius:5,fontSize:11,cursor:"pointer",border:query.toLowerCase()===n.toLowerCase()?"1px solid var(--accent-amber)":"1px solid var(--border)",background:query.toLowerCase()===n.toLowerCase()?"#2a1e00":"var(--bg-card)",color:query.toLowerCase()===n.toLowerCase()?"var(--accent-gold)":"var(--text-muted)",marginRight:6,marginBottom:10 }}>{n}</button>
            ))}
            {apiLoading&&<div style={{ display:"flex",justifyContent:"center",padding:24 }}><Spinner /></div>}
            {apiResults.length>0&&(
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16 }}>
                {apiResults.map(c=>(
                  <div key={c.id} onClick={()=>setSelected(c)} style={{ border:selected?.id===c.id?`2px solid var(--accent-blue)`:"1px solid var(--border)",borderRadius:10,overflow:"hidden",cursor:"pointer",background:selected?.id===c.id?"#1e3a5f22":"var(--bg-card)",transition:"all .15s" }}>
                    <div style={{ height:80,display:"flex",alignItems:"center",justifyContent:"center",borderBottom:"1px solid var(--border-dim)",background:"var(--bg-base)" }}>
                      {c.images?.small?<img src={c.images.small} alt={c.name} style={{ height:72,objectFit:"contain" }}/>:<span style={{ fontSize:24 }}>🃏</span>}
                    </div>
                    <div style={{ padding:"7px 8px" }}>
                      <div style={{ fontSize:11,fontWeight:600,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{c.name}</div>
                      <div style={{ fontSize:9,color:"var(--text-dim)" }}>{c.set?.name} · #{c.number}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selected&&<button onClick={()=>setStep(2.5)} style={{ width:"100%",padding:"13px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3b82f6,#6366f1)",color:"#fff",fontFamily:"var(--font-pixel)",fontSize:11,cursor:"pointer" }}>NEXT: VERIFY VARIANT →</button>}
          </div>
        )}

        {/* ── STEP 2 AI ── */}
        {step===2&&fallback==="ai"&&(
          <div className="fade-up" style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 220px)",minHeight:380 }}>
            <div style={{ flex:1,overflowY:"auto",paddingRight:4,marginBottom:10 }}>
              {messages.map((m,i)=>(
                <div key={i} style={{ display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10 }}>
                  {m.role!=="user"&&<div style={{ width:26,height:26,borderRadius:6,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,marginRight:8,alignSelf:"flex-end" }}>V</div>}
                  <div style={{ maxWidth:"82%",padding:"10px 13px",borderRadius:m.role==="user"?"10px 10px 2px 10px":"10px 10px 10px 2px",background:m.role==="user"?"#1e3a5f":"#12192e",border:m.role==="user"?"1px solid #2d5a8e":"1px solid var(--border)",fontSize:13,color:m.role==="user"?"#93c5fd":"var(--text-secondary)",lineHeight:1.5 }}>{m.content}</div>
                </div>
              ))}
              {aiMatches.length>0&&(
                <div style={{ marginBottom:10 }}>
                  <SectionLabel style={{ marginBottom:8 }}>Top matches</SectionLabel>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8 }}>
                    {aiMatches.map(({card,score})=>(
                      <div key={card.id} onClick={()=>setSelected(card)} style={{ border:selected?.id===card.id?`2px solid var(--accent-blue)`:"1px solid var(--border)",borderRadius:10,overflow:"hidden",cursor:"pointer",background:selected?.id===card.id?"#1e3a5f22":"var(--bg-card)" }}>
                        <div style={{ height:80,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-base)",borderBottom:"1px solid var(--border-dim)" }}>
                          {card.images?.small?<img src={card.images.small} alt={card.name} style={{ height:72,objectFit:"contain" }}/>:<span style={{ fontSize:24 }}>🃏</span>}
                        </div>
                        <div style={{ padding:"7px 8px" }}>
                          <div style={{ fontSize:11,fontWeight:600,color:"var(--text-primary)" }}>{card.name}</div>
                          <div style={{ fontSize:9,color:"var(--text-dim)" }}>{card.set?.name}</div>
                          <div style={{ fontSize:9,color:score>=80?"#4ade80":score>=55?"#f59e0b":"#64748b",marginTop:2,fontFamily:"var(--font-mono)" }}>{score}% match</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selected&&<button onClick={()=>setStep(2.5)} style={{ width:"100%",marginTop:12,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#3b82f6,#6366f1)",color:"#fff",fontFamily:"var(--font-pixel)",fontSize:11,cursor:"pointer" }}>NEXT: VERIFY VARIANT →</button>}
                </div>
              )}
              {aiLoading&&<div style={{ display:"flex",gap:4,padding:"10px 0" }}>{[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"var(--accent-blue)",animation:`blink 1s ease-in-out ${i*0.2}s infinite` }}/>)}</div>}
              <div ref={chatEnd}/>
            </div>
            <div style={{ borderTop:"1px solid var(--border)",paddingTop:12,display:"flex",gap:8 }}>
              <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAi();}}} placeholder="Describe your card..." rows={2}
                style={{ flex:1,padding:"10px 12px",borderRadius:8,fontSize:13,resize:"none",lineHeight:1.5 }}/>
              <button onClick={sendAi} disabled={!aiInput.trim()||aiLoading} style={{ padding:"10px",borderRadius:8,border:"none",background:aiInput.trim()&&!aiLoading?"linear-gradient(135deg,#1d4ed8,#7c3aed)":"var(--border)",color:aiInput.trim()&&!aiLoading?"#fff":"var(--text-muted)",cursor:aiInput.trim()&&!aiLoading?"pointer":"default",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {aiLoading?<Spinner size={14}/>:"↑"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2.5: VARIANT ── */}
        {step===2.5&&selected&&currentQ&&(
          <div className="fade-up">
            <div style={{ display:"flex",gap:6,marginBottom:20 }}>
              {questions.map((_,i)=><div key={i} style={{ flex:1,height:3,borderRadius:2,background:i<qIndex?"var(--accent-green)":i===qIndex?"var(--accent-amber)":"var(--border)",transition:"background .3s" }}/>)}
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:16 }}>
              <SectionLabel style={{ color:"var(--accent-gold)" }}>Question {qIndex+1} of {questions.length}</SectionLabel>
              <MonoText size={10}>{selected.name} · {selected.set?.name}</MonoText>
            </div>

            {bigSpread&&(
              <div style={{ background:"#1a0f00",border:"1px solid #92400e",borderRadius:10,padding:"12px 14px",marginBottom:18,display:"flex",gap:12 }}>
                <span style={{ fontSize:18,flexShrink:0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize:12,fontWeight:600,color:"#fbbf24",marginBottom:3 }}>Your answer significantly changes the value</div>
                  <div style={{ fontSize:11,color:"#78716c",lineHeight:1.5 }}>Range: <span style={{ color:"#f87171" }}>{fmt(minP)}</span> to <span style={{ color:"#4ade80" }}>{fmt(maxP)}</span> — a <span style={{ color:"#fbbf24" }}>{fmt(maxP-minP)}</span> difference.</div>
                </div>
              </div>
            )}

            <Panel style={{ padding:18,marginBottom:16 }}>
              <div style={{ display:"flex",gap:12,alignItems:"center",paddingBottom:14,marginBottom:14,borderBottom:"1px solid var(--border-dim)" }}>
                <div style={{ width:40,height:56,borderRadius:6,overflow:"hidden",flexShrink:0,background:"var(--bg-base)",border:"1px solid var(--border)" }}>
                  {selected.images?.small?<img src={selected.images.small} alt={selected.name} style={{ width:40,height:56,objectFit:"cover" }}/>:<span style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:20 }}>🃏</span>}
                </div>
                <div>
                  <div style={{ fontSize:14,fontWeight:700,color:"var(--text-primary)" }}>{selected.name}</div>
                  <div style={{ fontSize:11,color:"var(--text-muted)" }}>{selected.set?.name} · #{selected.number}</div>
                </div>
              </div>
              <PixelText size={11} style={{ display:"block",lineHeight:1.6,marginBottom:currentQ.why?8:0 }}>{currentQ.question}</PixelText>
              {currentQ.why&&<div style={{ fontSize:12,color:"var(--text-muted)",lineHeight:1.5 }}>{currentQ.why}</div>}
            </Panel>

            {currentQ.hint&&(
              <div style={{ background:"#0a1020",border:"1px solid #1e3a5f",borderRadius:10,marginBottom:14,overflow:"hidden" }}>
                <button onClick={()=>setExpandHint(!expandHint)} style={{ width:"100%",padding:"10px 14px",background:"transparent",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}><span>🔎</span><span style={{ fontSize:12,color:"#93c5fd",fontWeight:500 }}>{currentQ.hint.label}</span></div>
                  <span style={{ color:"var(--text-muted)",fontSize:12,transform:expandHint?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s" }}>▼</span>
                </button>
                {expandHint&&(
                  <div style={{ padding:"0 14px 14px",borderTop:"1px solid var(--border)" }}>
                    {currentQ.hint.steps.map((s,i)=>(
                      <div key={i} style={{ display:"flex",gap:10,marginTop:10,alignItems:"flex-start" }}>
                        <div style={{ width:22,height:22,borderRadius:6,background:"#1e3a5f",border:"1px solid #2d5a8e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#93c5fd",flexShrink:0 }}>{s.icon}</div>
                        <div style={{ fontSize:12,color:"var(--text-secondary)",lineHeight:1.5,marginTop:2 }}>{s.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
              {currentQ.options.map(opt=>{
                const isSel  = varAnswers[currentQ.id]===opt.value;
                const optP   = opt.mult?Math.round(basePrice*opt.mult):null;
                const isHigh = optP===maxP&&bigSpread;
                const isLow  = optP===minP&&bigSpread&&priceSpread.length>1;
                return (
                  <button key={opt.value} onClick={()=>selectAnswer(opt.value)} style={{ padding:"14px 16px",borderRadius:10,border:isSel?`2px solid ${opt.value==="unsure"?"#ef4444":isHigh?"#22c55e":"var(--accent-blue)"}`:opt.value==="unsure"?"1px dashed #2d3f52":"1px solid var(--border)",background:isSel?(opt.value==="unsure"?"#1a0a0a":isHigh?"#052e16":"#1e3a5f"):"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left",transition:"all .15s" }}>
                    <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${isSel?(opt.value==="unsure"?"#ef4444":isHigh?"#22c55e":"var(--accent-blue)"):"#2d3f52"}`,background:isSel?(opt.value==="unsure"?"#ef4444":isHigh?"#22c55e":"var(--accent-blue)"):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s" }}>
                      {isSel&&<span style={{ color:"#000",fontSize:10,fontWeight:900 }}>✓</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:opt.sublabel?3:0 }}>
                        <span style={{ fontSize:14,fontWeight:600,color:isSel?(opt.value==="unsure"?"#fca5a5":isHigh?"#4ade80":"#93c5fd"):"var(--text-primary)" }}>{opt.label}</span>
                        {opt.badge&&<span style={{ fontSize:9,padding:"2px 6px",borderRadius:10,background:`${opt.badgeColor}22`,border:`1px solid ${opt.badgeColor}44`,color:opt.badgeColor,fontWeight:700,fontFamily:"var(--font-mono)" }}>{opt.badge}</span>}
                      </div>
                      {opt.sublabel&&<div style={{ fontSize:11,color:isSel?"#94a3b8":"var(--text-muted)" }}>{opt.sublabel}</div>}
                    </div>
                    {optP?<div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontFamily:"var(--font-mono)",fontSize:15,fontWeight:700,color:isHigh?"#4ade80":isLow?"#f87171":"var(--accent-gold)" }}>{fmt(optP)}</div>
                      {bigSpread&&<div style={{ fontSize:9,color:"var(--text-dim)" }}>{isHigh?"↑ most valuable":isLow?"↓ least valuable":"mid range"}</div>}
                    </div>:<div style={{ textAlign:"right",flexShrink:0 }}><MonoText size={10} color="var(--text-dim)">Flag for<br/>review</MonoText></div>}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop:14,padding:"10px 14px",background:"#050a12",borderRadius:8,border:"1px solid var(--border-dim)" }}>
              <div style={{ fontSize:11,color:"var(--text-dim)",lineHeight:1.5 }}>🔒 We never assume a variant. Flagged cards show a review badge in your collection.</div>
            </div>
          </div>
        )}

        {/* ── STEP 3: CONFIRM ── */}
        {step===3&&selected&&(
          <div className="fade-up">
            <SectionLabel style={{ color:"var(--accent-green)",marginBottom:4 }}>✓ VARIANT CONFIRMED</SectionLabel>
            <PixelText size={11} style={{ display:"block",marginBottom:16 }}>FINAL DETAILS</PixelText>
            <Panel style={{ padding:14,marginBottom:18 }}>
              <div style={{ display:"flex",gap:12,alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:"1px solid var(--border-dim)" }}>
                <div style={{ width:52,height:72,borderRadius:8,overflow:"hidden",flexShrink:0,border:"1px solid var(--border)" }}>
                  {selected.images?.small?<img src={selected.images.small} alt={selected.name} style={{ width:52,height:72,objectFit:"cover" }}/>:<span style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:20 }}>🃏</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:"var(--text-primary)" }}>{selected.name}</div>
                  <div style={{ fontSize:11,color:"var(--text-muted)" }}>{selected.set?.name} · #{selected.number}</div>
                  <div style={{ fontFamily:"var(--font-mono)",fontSize:16,color:"var(--accent-gold)",fontWeight:700,marginTop:6 }}>{fmt(finalPrice)}</div>
                </div>
                <button onClick={()=>setStep(2.5)} style={{ fontSize:10,color:"var(--text-dim)",background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline" }}>Edit</button>
              </div>
              <SectionLabel style={{ marginBottom:8 }}>Logged variant details</SectionLabel>
              {questions.map(q=>{
                const ans = varAnswers[q.id];
                const opt = q.options.find(o=>o.value===ans);
                return (
                  <div key={q.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"var(--bg-base)",borderRadius:6,border:`1px solid ${ans==="unsure"?"#ef444433":"var(--border)"}`,marginBottom:6 }}>
                    <span style={{ fontSize:11,color:"var(--text-muted)" }}>{q.question}</span>
                    <span style={{ fontSize:11,fontWeight:600,color:ans==="unsure"?"#f87171":"var(--text-primary)",fontFamily:"var(--font-mono)" }}>
                      {ans==="unsure"&&<span style={{ fontSize:9,padding:"1px 5px",borderRadius:3,background:"#450a0a",color:"#f87171",border:"1px solid #7f1d1d",marginRight:5 }}>FLAGGED</span>}
                      {opt?.label}
                    </span>
                  </div>
                );
              })}
            </Panel>
            <div style={{ marginBottom:14 }}>
              <SectionLabel style={{ marginBottom:8 }}>Condition</SectionLabel>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {CONDITIONS.map(c=><button key={c} onClick={()=>setCondition(c)} style={{ padding:"6px 11px",borderRadius:6,fontSize:11,cursor:"pointer",border:condition===c?"1px solid var(--accent-amber)":"1px solid var(--border)",background:condition===c?"#2a1e00":"var(--bg-card)",color:condition===c?"var(--accent-gold)":"var(--text-muted)" }}>{c.split(" ")[0]} {c.match(/\(([^)]+)\)/)?.[1]}</button>)}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <SectionLabel style={{ marginBottom:8 }}>Graded?</SectionLabel>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {["Raw","PSA 10","PSA 9","PSA 8","BGS 9.5","BGS 9","CGC 9"].map(g=><button key={g} onClick={()=>setGrade(g)} style={{ padding:"6px 11px",borderRadius:6,fontSize:11,cursor:"pointer",border:grade===g?"1px solid var(--accent-blue)":"1px solid var(--border)",background:grade===g?"#1e3a5f":"var(--bg-card)",color:grade===g?"#93c5fd":"var(--text-dim)" }}>{g}</button>)}
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20 }}>
              <div>
                <SectionLabel style={{ marginBottom:8 }}>Quantity</SectionLabel>
                <div style={{ display:"flex",alignItems:"center",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",background:"var(--bg-card)" }}>
                  <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} style={{ width:38,height:38,background:"transparent",border:"none",color:"var(--text-muted)",fontSize:18,cursor:"pointer" }}>−</button>
                  <div style={{ flex:1,textAlign:"center",fontFamily:"var(--font-pixel)",fontSize:13,color:"var(--accent-gold)" }}>{quantity}</div>
                  <button onClick={()=>setQuantity(q=>q+1)} style={{ width:38,height:38,background:"transparent",border:"none",color:"var(--text-muted)",fontSize:18,cursor:"pointer" }}>+</button>
                </div>
              </div>
              <div>
                <SectionLabel style={{ marginBottom:8 }}>Purchase price</SectionLabel>
                <input value={purchasePrice} onChange={e=>setPurchasePrice(e.target.value)} placeholder="$0.00" style={{ width:"100%",height:38,padding:"0 12px",fontSize:13,borderRadius:8,fontFamily:"var(--font-mono)" }}/>
              </div>
            </div>
            <Button variant="success" onClick={handleSave} disabled={saving} style={{ width:"100%",fontSize:10 }}>
              {saving?"SAVING...":"ADD TO COLLECTION →"}
            </Button>
          </div>
        )}

        {/* ── STEP 4: SUCCESS ── */}
        {step===4&&selected&&(
          <div className="fade-up" style={{ textAlign:"center",paddingTop:24 }}>
            <div style={{ width:72,height:72,borderRadius:"50%",margin:"0 auto 18px",background:"#064e3b",border:"2px solid #22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,animation:"glowPulse 2s ease-in-out infinite" }}>✓</div>
            <PixelText size={12} color="var(--accent-green)" style={{ display:"block",marginBottom:6 }}>LOGGED!</PixelText>
            <div style={{ fontSize:13,color:"var(--text-muted)",marginBottom:22 }}>Added with full variant details</div>
            <div style={{ display:"flex",gap:10 }}>
              <Button variant="primary" onClick={reset} style={{ flex:1,fontSize:10 }}>SCAN NEXT CARD</Button>
              <button onClick={()=>router.push("/collection")} style={{ flex:1,padding:"10px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--text-muted)",fontSize:12,cursor:"pointer" }}>View Collection</button>
            </div>
          </div>
        )}

        {step>0&&step<4&&step!==2.5&&(
          <div style={{ marginTop:18,textAlign:"center" }}>
            <button onClick={()=>step===2?setStep(1):step===3?setStep(2.5):setStep(s=>Math.max(0,s-1))} style={{ fontSize:11,color:"var(--text-dim)",background:"transparent",border:"none",cursor:"pointer",fontFamily:"var(--font-mono)" }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
