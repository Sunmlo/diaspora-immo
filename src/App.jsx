import { useState, useEffect, useRef } from "react";

const C = {
  terra: "#C4622D", terraDark: "#A04E22", gold: "#D4A017",
  earth: "#8B5E3C", forest: "#1A3C2E", forestMid: "#2D6A4F",
  cameroun: "#2C7744", cream: "#FAF6EE", light: "#FDF9F3",
  sand: "#F5E6C8", dark: "#2C2C2C", muted: "#7A7060",
  white: "#FFFFFF", success: "#2E7D32", successBg: "#E8F5E9",
};

const PROPERTIES = [
  { id:1, title:"Villa moderne piscine", type:"Vente", country:"Sénégal", city:"Dakar", neighborhood:"Almadies", price:95000000, price_eur:145000, surface:280, rooms:5, bathrooms:3, verified:true, agent_name:"Mamadou Diallo", tags:["Piscine","Terrasse","Gardien"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#D4A017)", description:"Magnifique villa contemporaine aux Almadies, 5 min de la mer.", lat:14.7464, lng:-17.5218 },
  { id:2, title:"Appartement standing Plateau", type:"Location", country:"Sénégal", city:"Dakar", neighborhood:"Plateau", price:850000, price_eur:1295, surface:120, rooms:3, bathrooms:2, verified:true, agent_name:"Fatou Ndiaye", tags:["Climatisé","Parking"], emoji:"🏢", gradient:"linear-gradient(135deg,#1A3C2E,#2D6A4F)", description:"Appartement haut standing au cœur du Plateau.", lat:14.6928, lng:-17.4467 },
  { id:3, title:"Terrain viabilisé Saly", type:"Terrain", country:"Sénégal", city:"Mbour", neighborhood:"Saly", price:18000000, price_eur:27500, surface:500, rooms:null, bathrooms:null, verified:true, agent_name:"Oumar Sow", tags:["Titre foncier","Bord de mer"], emoji:"🌴", gradient:"linear-gradient(135deg,#8B5E3C,#C4622D)", description:"Terrain titre foncier bord de mer à Saly.", lat:14.4618, lng:-17.0199 },
  { id:4, title:"Villa duplex Cocody", type:"Vente", country:"Côte d'Ivoire", city:"Abidjan", neighborhood:"Cocody", price:120000000, price_eur:183000, surface:320, rooms:6, bathrooms:4, verified:true, agent_name:"Aïcha Kouassi", tags:["Duplex","Jardin"], emoji:"🏘️", gradient:"linear-gradient(135deg,#D4A017,#C4622D)", description:"Superbe villa duplex à Cocody, proche des ambassades.", lat:5.3600, lng:-3.9800 },
  { id:5, title:"Terrain résidentiel Thiès", type:"Terrain", country:"Sénégal", city:"Thiès", neighborhood:"Cité Malick Sy", price:8500000, price_eur:13000, surface:300, rooms:null, bathrooms:null, verified:true, agent_name:"Ibrahima Fall", tags:["Titre foncier","Asphalte"], emoji:"🌾", gradient:"linear-gradient(135deg,#1A3C2E,#8B5E3C)", description:"Terrain zone résidentielle calme, document en règle.", lat:14.7886, lng:-16.9260 },
  { id:6, title:"Appartement Marcory Zone 4", type:"Location", country:"Côte d'Ivoire", city:"Abidjan", neighborhood:"Marcory", price:600000, price_eur:915, surface:95, rooms:2, bathrooms:1, verified:false, agent_name:"Koffi Assi", tags:["Mixte","Sécurisé"], emoji:"🏬", gradient:"linear-gradient(135deg,#2C2C2C,#5C4A3C)", description:"Bien mixte idéal pour entrepreneur diaspora.", lat:5.2993, lng:-3.9957 },
  { id:7, title:"Villa 5 pièces Bonamoussadi", type:"Vente", country:"Cameroun", city:"Douala", neighborhood:"Bonamoussadi", price:65000000, price_eur:99150, surface:220, rooms:5, bathrooms:3, verified:true, agent_name:"Keur Immo Cameroun", tags:["Titre foncier","Parking","Jardinet"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#2C7744)", description:"Belle villa 5 pièces à Bonamoussadi, quartier résidentiel de Douala.", lat:4.0711, lng:9.7386 },
  { id:8, title:"Terrain titré Bonapriso", type:"Terrain", country:"Cameroun", city:"Douala", neighborhood:"Bonapriso", price:26250000, price_eur:40050, surface:375, rooms:null, bathrooms:null, verified:true, agent_name:"Keur Immo Cameroun", tags:["Titre foncier","Quartier prisé"], emoji:"🌍", gradient:"linear-gradient(135deg,#2C7744,#1A5C34)", description:"Terrain titré 375m² à Bonapriso, quartier le plus prisé de Douala.", lat:4.0480, lng:9.6951 },
  { id:9, title:"Villa Bastos Yaoundé", type:"Vente", country:"Cameroun", city:"Yaoundé", neighborhood:"Bastos", price:95000000, price_eur:144875, surface:200, rooms:4, bathrooms:3, verified:true, agent_name:"GCS Immo Yaoundé", tags:["Quartier diplomatique","Titre foncier"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#2C7744)", description:"Villa 4 pièces à Bastos, quartier diplomatique de Yaoundé.", lat:3.8845, lng:11.5258 },
  { id:10, title:"Appartement F3 Mvan", type:"Location", country:"Cameroun", city:"Yaoundé", neighborhood:"Mvan", price:180000, price_eur:274, surface:80, rooms:3, bathrooms:1, verified:false, agent_name:"Particulier", tags:["Eau courante","Proche université"], emoji:"🏠", gradient:"linear-gradient(135deg,#4A7C6F,#2C7744)", description:"Appartement F3 à Mvan, proche université et commerces.", lat:3.8366, lng:11.5116 },
  { id:11, title:"Villa piscine Ngor", type:"Vente", country:"Sénégal", city:"Dakar", neighborhood:"Ngor", price:180000000, price_eur:274500, surface:350, rooms:6, bathrooms:4, verified:true, agent_name:"Cabinet Diallo Immo", tags:["Piscine","Vue mer","Titre foncier"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#D4A017)", description:"Villa R+1 avec piscine privée à Ngor, vue dégagée sur la mer.", lat:14.7491, lng:-17.5135 },
  { id:12, title:"Villa piscine Cocody", type:"Location", country:"Côte d'Ivoire", city:"Abidjan", neighborhood:"Deux-Plateaux", price:1800000, price_eur:2745, surface:280, rooms:5, bathrooms:4, verified:true, agent_name:"MD Immobilier", tags:["Piscine","Garage","Gardien"], emoji:"🏘️", gradient:"linear-gradient(135deg,#1A3C2E,#D4A017)", description:"Villa duplex 5 pièces à Cocody Riviera 2, piscine et jardin.", lat:5.3836, lng:-3.9831 },
];

const TONTINES = [
  { id:1, name:"Tontine Dakar Almadies", goal:"Achat terrain Saly", monthly_amount:500, members_count:8, max_members:10, cycle_months:10, current_cycle:3, next_beneficiary:"Aminata D.", next_date:"2026-07-01", status:"active", country:"Sénégal" },
  { id:2, name:"Tontine Abidjan Cocody", goal:"Construction villa", monthly_amount:800, members_count:6, max_members:8, cycle_months:8, current_cycle:1, next_beneficiary:"Kofi M.", next_date:"2026-07-15", status:"active", country:"Côte d'Ivoire" },
  { id:3, name:"Tontine Terrain Thiès", goal:"Achat terrain résidentiel", monthly_amount:300, members_count:5, max_members:12, cycle_months:12, current_cycle:0, next_beneficiary:"—", next_date:"2026-08-01", status:"recrutement", country:"Sénégal" },
  { id:4, name:"Tontine Douala Diaspora", goal:"Construction maison familiale", monthly_amount:600, members_count:4, max_members:10, cycle_months:10, current_cycle:0, next_beneficiary:"—", next_date:"2026-09-01", status:"recrutement", country:"Cameroun" },
];

const fmtXOF = n => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtEUR = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const typeColor = t => t==="Vente"?C.terra:t==="Location"?C.forest:C.earth;
const countryFlag = c => c==="Sénégal"?"🇸🇳":c==="Côte d'Ivoire"?"🇨🇮":"🇨🇲";

function FallbackMap({ properties, onSelectProperty, selectedId }) {
  const [hoverId, setHoverId] = useState(null);
  const groups = {
    "Sénégal": properties.filter(p=>p.country==="Sénégal"),
    "Côte d'Ivoire": properties.filter(p=>p.country==="Côte d'Ivoire"),
    "Cameroun": properties.filter(p=>p.country==="Cameroun"),
  };
  const countryColors = { "Sénégal":C.terra, "Côte d'Ivoire":C.gold, "Cameroun":C.cameroun };
  const countryCoords = {
    "Sénégal": { top:"22%", left:"18%" },
    "Côte d'Ivoire": { top:"38%", left:"28%" },
    "Cameroun": { top:"32%", left:"48%" },
  };
  return (
    <div style={{ width:"100%", height:"100%", background:"#E8F4F0", borderRadius:"inherit", position:"relative", overflow:"hidden" }}>
      <svg viewBox="0 0 400 500" style={{ width:"100%", height:"100%", position:"absolute", inset:0 }}>
        <defs>
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C8E6F0" />
            <stop offset="100%" stopColor="#A8D4E6" />
          </radialGradient>
        </defs>
        <rect width="400" height="500" fill="url(#oceanGrad)" />
        <path d="M120,40 L280,40 L310,100 L320,160 L300,220 L290,280 L260,340 L230,390 L200,420 L170,390 L140,340 L110,280 L100,220 L80,160 L90,100 Z" fill="#D4E8D0" stroke="#B8D4B0" strokeWidth="1"/>
      </svg>
      {Object.entries(groups).map(([country, props]) => {
        if (props.length === 0) return null;
        const pos = countryCoords[country];
        const color = countryColors[country];
        return (
          <div key={country} style={{ position:"absolute", ...pos }}>
            <div style={{ background:color, color:C.white, fontSize:"11px", fontWeight:800, padding:"4px 10px", borderRadius:"20px", display:"inline-flex", alignItems:"center", gap:"4px", boxShadow:"0 2px 8px rgba(0,0,0,0.2)", marginBottom:"6px" }}>
              {countryFlag(country)} {country} <span style={{ background:"rgba(255,255,255,0.25)", borderRadius:"10px", padding:"0 5px" }}>{props.length}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"4px", maxHeight:"180px", overflowY:"auto" }}>
              {props.map(p => (
                <div key={p.id} onClick={() => onSelectProperty(p)} onMouseEnter={() => setHoverId(p.id)} onMouseLeave={() => setHoverId(null)}
                  style={{ background:p.id===selectedId?C.dark:hoverId===p.id?color:"rgba(255,255,255,0.92)", color:p.id===selectedId||hoverId===p.id?C.white:C.dark, fontSize:"11px", fontWeight:700, padding:"5px 10px", borderRadius:"10px", cursor:"pointer", transition:"all 0.2s", boxShadow:"0 2px 8px rgba(0,0,0,0.12)", display:"flex", alignItems:"center", gap:"5px", whiteSpace:"nowrap" }}>
                  <span>{p.emoji}</span>
                  <span style={{ maxWidth:"100px", overflow:"hidden", textOverflow:"ellipsis" }}>{p.neighborhood}</span>
                  <span style={{ opacity:0.8 }}>· {fmtEUR(p.price_eur)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{ position:"absolute", bottom:10, right:12, fontSize:"10px", color:"rgba(0,0,0,0.3)" }}>DiasporaImmo · Carte interactive</div>
    </div>
  );
}
function PropertyCard({ p, onClick, compact }) {
  const [hov, setHov] = useState(false);
  if (compact) return (
    <div onClick={() => onClick(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:C.white, borderRadius:"14px", overflow:"hidden", cursor:"pointer", border:`1.5px solid ${hov?C.terra+"60":"transparent"}`, boxShadow:hov?"0 8px 30px rgba(196,98,45,0.15)":"0 2px 10px rgba(0,0,0,0.06)", transition:"all 0.25s", display:"flex" }}>
      <div style={{ width:80, flexShrink:0, background:p.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px" }}>{p.emoji}</div>
      <div style={{ padding:"10px 12px", flex:1, minWidth:0 }}>
        <div style={{ fontSize:"12px", fontWeight:700, color:C.dark, marginBottom:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</div>
        <div style={{ fontSize:"11px", color:C.muted, marginBottom:"4px" }}>📍 {p.neighborhood}, {p.city}</div>
        <div style={{ fontSize:"13px", fontWeight:800, color:C.terra }}>{fmtEUR(p.price_eur)}</div>
      </div>
    </div>
  );
  return (
    <div onClick={()=>onClick(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:C.white, borderRadius:"16px", overflow:"hidden", cursor:"pointer", border:`1.5px solid ${hov?C.terra+"50":"transparent"}`, boxShadow:hov?"0 16px 48px rgba(196,98,45,0.15)":"0 4px 20px rgba(0,0,0,0.07)", transform:hov?"translateY(-4px)":"translateY(0)", transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ height:140, background:p.gradient, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <span style={{ fontSize:"44px" }}>{p.emoji}</span>
        <div style={{ position:"absolute", top:10, left:10 }}><span style={{ background:typeColor(p.type), color:C.white, fontSize:"10px", fontWeight:700, padding:"3px 9px", borderRadius:"20px", textTransform:"uppercase" }}>{p.type}</span></div>
        <div style={{ position:"absolute", top:10, right:10 }}><span style={{ background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", color:C.white, fontSize:"10px", fontWeight:700, padding:"3px 9px", borderRadius:"20px" }}>{countryFlag(p.country)} {p.country}</span></div>
        {p.verified && <div style={{ position:"absolute", bottom:10, left:10 }}><span style={{ background:C.successBg, color:C.success, fontSize:"10px", fontWeight:700, padding:"3px 9px", borderRadius:"20px" }}>✓ Vérifié</span></div>}
      </div>
      <div style={{ padding:"14px" }}>
        <h3 style={{ margin:"0 0 4px", fontSize:"14px", fontWeight:700, color:C.dark, fontFamily:"'Playfair Display',serif", lineHeight:1.3 }}>{p.title}</h3>
        <p style={{ margin:"0 0 8px", fontSize:"11px", color:C.muted }}>📍 {p.neighborhood}, {p.city}</p>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"8px" }}>
          {p.tags?.slice(0,2).map(t=><span key={t} style={{ background:C.light, color:C.earth, fontSize:"10px", padding:"2px 7px", borderRadius:"5px", fontWeight:500 }}>{t}</span>)}
        </div>
        <div style={{ borderTop:`1px solid ${C.sand}`, paddingTop:"8px" }}>
          <div style={{ fontSize:"16px", fontWeight:800, color:C.terra }}>{fmtXOF(p.price)}</div>
          <div style={{ fontSize:"11px", color:C.muted }}>≈ {fmtEUR(p.price_eur)}</div>
        </div>
      </div>
    </div>
  );
}

function PropertyModal({ p, onClose }) {
  if (!p) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }} onClick={onClose}>
      <div style={{ background:C.white, borderRadius:"24px", maxWidth:"520px", width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 40px 100px rgba(0,0,0,0.3)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ height:180, background:p.gradient, borderRadius:"24px 24px 0 0", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
          <span style={{ fontSize:"60px" }}>{p.emoji}</span>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.2)", border:"none", color:C.white, width:34, height:34, borderRadius:"50%", cursor:"pointer", fontSize:"16px" }}>✕</button>
          <div style={{ position:"absolute", bottom:12, left:12, display:"flex", gap:8 }}>
            <span style={{ background:typeColor(p.type), color:C.white, fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"20px", textTransform:"uppercase" }}>{p.type}</span>
            {p.verified && <span style={{ background:C.successBg, color:C.success, fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"20px" }}>✓ Vérifié</span>}
          </div>
        </div>
        <div style={{ padding:"20px" }}>
          <h2 style={{ margin:"0 0 4px", fontFamily:"'Playfair Display',serif", fontSize:"19px", fontWeight:800, color:C.dark }}>{p.title}</h2>
          <p style={{ margin:"0 0 12px", color:C.muted, fontSize:"12px" }}>📍 {p.neighborhood}, {p.city} — {countryFlag(p.country)} {p.country}</p>
          <p style={{ margin:"0 0 16px", color:C.dark, fontSize:"13px", lineHeight:1.6 }}>{p.description}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"16px" }}>
            {[["Surface",p.surface?p.surface+" m²":"—"],["Pièces",p.rooms||"—"],["Salles de bain",p.bathrooms||"—"],["Pays",countryFlag(p.country)+" "+p.country]].map(([l,v])=>(
              <div key={l} style={{ background:C.light, borderRadius:"10px", padding:"10px" }}>
                <div style={{ fontSize:"10px", color:C.muted, marginBottom:"2px" }}>{l}</div>
                <div style={{ fontSize:"14px", fontWeight:700, color:C.dark }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background:`linear-gradient(135deg,${C.terra}15,${C.gold}15)`, borderRadius:"12px", padding:"14px", marginBottom:"16px", border:`1px solid ${C.terra}25` }}>
            <div style={{ fontSize:"20px", fontWeight:800, color:C.terra }}>{fmtXOF(p.price)}</div>
            <div style={{ fontSize:"12px", color:C.muted }}>≈ {fmtEUR(p.price_eur)}</div>
          </div>
          <div style={{ background:C.light, borderRadius:"12px", padding:"12px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:p.gradient, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:800, fontSize:"13px" }}>
              {p.agent_name?.split(" ").map(w=>w[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{ fontSize:"13px", fontWeight:700, color:C.dark }}>{p.agent_name}</div>
              <div style={{ fontSize:"11px", color:C.muted }}>Agent certifié DiasporaImmo</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            <button style={{ background:C.terra, color:C.white, border:"none", borderRadius:"10px", padding:"12px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>📞 Contacter</button>
            <button style={{ background:"transparent", color:C.terra, border:`2px solid ${C.terra}`, borderRadius:"10px", padding:"12px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>🔖 Sauvegarder</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TontineCard({ t, onJoin }) {
  const pct = Math.round((t.members_count/t.max_members)*100);
  const isRec = t.status==="recrutement";
  const color = t.country==="Cameroun"?C.cameroun:t.country==="Côte d'Ivoire"?C.gold:C.terra;
  return (
    <div style={{ background:C.white, borderRadius:"16px", padding:"18px", boxShadow:"0 4px 20px rgba(0,0,0,0.07)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div>
          <h3 style={{ margin:"0 0 3px", fontSize:"15px", fontWeight:800, fontFamily:"'Playfair Display',serif", color:C.dark }}>{t.name}</h3>
          <p style={{ margin:0, fontSize:"11px", color:C.muted }}>🎯 {t.goal} · {countryFlag(t.country)}</p>
        </div>
        <span style={{ background:isRec?`${C.gold}20`:C.successBg, color:isRec?C.earth:C.success, fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"20px" }}>{isRec?"🔓 Ouvert":"✅ Actif"}</span>
      </div>
      <div style={{ marginBottom:"12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
          <span style={{ fontSize:"11px", color:C.muted }}>👥 {t.members_count}/{t.max_members} membres</span>
          <span style={{ fontSize:"11px", fontWeight:700, color:C.dark }}>{pct}%</span>
        </div>
        <div style={{ background:C.light, borderRadius:"8px", height:"7px", overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${color},${C.gold})`, borderRadius:"8px" }} />
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"14px" }}>
        {[[fmtEUR(t.monthly_amount)+"/mois","Cotisation"],[fmtEUR(t.monthly_amount*t.max_members),"Cagnotte"],[t.cycle_months+" mois","Durée"]].map(([v,l])=>(
          <div key={l} style={{ background:C.light, borderRadius:"8px", padding:"8px", textAlign:"center" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color }}>{v}</div>
            <div style={{ fontSize:"10px", color:C.muted }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${C.sand}`, paddingTop:"12px", display:"flex", gap:"8px" }}>
        {isRec
          ? <button onClick={()=>onJoin(t)} style={{ flex:1, background:color, color:C.white, border:"none", borderRadius:"10px", padding:"10px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>🤝 Rejoindre</button>
          : <button style={{ flex:1, background:"transparent", color, border:`2px solid ${color}`, borderRadius:"10px", padding:"10px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>📊 Tableau de bord</button>
        }
        <button style={{ background:C.light, border:"none", borderRadius:"10px", padding:"10px 14px", cursor:"pointer", fontSize:"16px" }}>💬</button>
      </div>
    </div>
  );
}
export default function App() {
  const [tab, setTab] = useState("accueil");
  const [selectedProp, setSelectedProp] = useState(null);
  const [filterCountry, setFilterCountry] = useState("Tous");
  const [filterType, setFilterType] = useState("Tous");
  const [search, setSearch] = useState("");
  const [mapSelected, setMapSelected] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [animIn, setAnimIn] = useState(true);

  const countries = ["Tous","Sénégal","Côte d'Ivoire","Cameroun"];
  const types = ["Tous","Vente","Location","Terrain","Agricole","Commercial"];

  const filtered = PROPERTIES.filter(p => {
    const mc = filterCountry==="Tous"||p.country===filterCountry;
    const mt = filterType==="Tous"||p.type===filterType;
    const ms = !search||p.title.toLowerCase().includes(search.toLowerCase())||p.city?.toLowerCase().includes(search.toLowerCase())||p.neighborhood?.toLowerCase().includes(search.toLowerCase());
    return mc&&mt&&ms;
  });

  const switchTab = t => {
    setAnimIn(false);
    setTimeout(()=>{setTab(t);setAnimIn(true);},150);
  };

  const NAV = [
    {id:"accueil",icon:"🏠",label:"Accueil"},
    {id:"biens",icon:"🔍",label:"Biens"},
    {id:"tontine",icon:"🤝",label:"Tontine"},
    {id:"services",icon:"⭐",label:"Services"},
    {id:"compte",icon:"👤",label:"Compte"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.cream, fontFamily:"'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet"/>

      <header style={{ background:C.forest, position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:"58px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"22px" }}>🌍</span>
            <div>
              <div style={{ fontSize:"17px", fontWeight:800, color:C.gold, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>DiasporaImmo</div>
              <div style={{ fontSize:"9px", color:C.sand, letterSpacing:"0.14em", textTransform:"uppercase" }}>🇸🇳 🇨🇮 🇨🇲 Investir chez soi</div>
            </div>
          </div>
          <nav style={{ display:"flex", gap:"3px" }}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>switchTab(n.id)} style={{ background:tab===n.id?C.terra:"transparent", border:"none", color:C.white, padding:"7px 12px", borderRadius:"10px", cursor:"pointer", fontWeight:tab===n.id?700:400, fontSize:"12px", display:"flex", alignItems:"center", gap:"5px", transition:"all 0.2s" }}>
                <span>{n.icon}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 20px 80px", opacity:animIn?1:0, transform:animIn?"translateY(0)":"translateY(8px)", transition:"all 0.25s ease" }}>

        {tab==="accueil" && (
          <div>
            <div style={{ background:`linear-gradient(135deg,${C.forest} 0%,${C.forestMid} 50%,${C.terra} 100%)`, borderRadius:"0 0 28px 28px", padding:"36px 24px 28px", marginBottom:"20px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize:"18px 18px" }}/>
              <div style={{ position:"relative" }}>
                <div style={{ display:"inline-block", background:`${C.gold}30`, border:`1px solid ${C.gold}50`, borderRadius:"20px", padding:"5px 14px", marginBottom:"12px" }}>
                  <span style={{ color:C.gold, fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>🇸🇳 Sénégal · 🇨🇮 Côte d'Ivoire · 🇨🇲 Cameroun</span>
                </div>
                <h1 style={{ margin:"0 0 10px", color:C.white, fontFamily:"'Playfair Display',serif", fontSize:"clamp(24px,5vw,40px)", fontWeight:800, lineHeight:1.15 }}>
                  Votre patrimoine<br/><span style={{ color:C.gold }}>en Afrique</span>,<br/>depuis la France
                </h1>
                <p style={{ color:"rgba(255,255,255,0.8)", fontSize:"14px", marginBottom:"20px" }}>Biens vérifiés · Agents certifiés · Tontine digitale</p>
                <div style={{ background:C.white, borderRadius:"14px", padding:"6px 6px 6px 14px", display:"flex", gap:"8px", alignItems:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
                  <span>🔍</span>
                  <input type="text" placeholder="Ville, quartier, type de bien..." value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1, border:"none", outline:"none", fontSize:"14px", color:C.dark, background:"transparent" }}/>
                  <button onClick={()=>switchTab("biens")} style={{ background:C.terra, color:C.white, border:"none", borderRadius:"10px", padding:"10px 16px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>Chercher</button>
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"20px" }}>
              {[["36+","Biens"],["3","Pays"],["🤝","Tontines"],["6 800+","Diaspora"]].map(([v,l])=>(
                <div key={l} style={{ background:C.white, borderRadius:"12px", padding:"12px", textAlign:"center", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize:"18px", fontWeight:800, color:C.terra }}>{v}</div>
                  <div style={{ fontSize:"10px", color:C.muted }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:"20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", fontWeight:800, color:C.dark, margin:0 }}>🗺️ Biens sur la carte</h2>
                <button onClick={()=>setShowMap(!showMap)} style={{ background:showMap?C.terra:C.light, color:showMap?C.white:C.dark, border:"none", borderRadius:"10px", padding:"7px 14px", fontWeight:700, fontSize:"12px", cursor:"pointer" }}>{showMap?"Masquer":"Afficher"}</button>
              </div>
              {showMap && (
                <div style={{ height:"320px", borderRadius:"16px", overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", border:`1px solid ${C.sand}` }}>
                  <FallbackMap properties={PROPERTIES} onSelectProperty={p=>{setMapSelected(p);setSelectedProp(p);}} selectedId={mapSelected?.id}/>
                </div>
              )}
              {showMap && mapSelected && <div style={{ marginTop:"10px" }}><PropertyCard p={mapSelected} onClick={setSelectedProp} compact/></div>}
            </div>

            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", fontWeight:800, color:C.dark, margin:"0 0 12px" }}>Coups de cœur</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"14px", marginBottom:"24px" }}>
              {PROPERTIES.slice(0,3).map(p=><PropertyCard key={p.id} p={p} onClick={setSelectedProp}/>)}
            </div>

            <div style={{ background:`linear-gradient(135deg,${C.forest},#1F5C44)`, borderRadius:"18px", padding:"22px", marginBottom:"16px", display:"flex", gap:"16px", alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"24px", marginBottom:"6px" }}>🤝</div>
                <h3 style={{ margin:"0 0 4px", color:C.white, fontFamily:"'Playfair Display',serif", fontSize:"16px" }}>La Tontine Digitale</h3>
                <p style={{ margin:0, color:"rgba(255,255,255,0.75)", fontSize:"12px" }}>Épargnez collectivement. Virements directs entre membres.</p>
              </div>
              <button onClick={()=>switchTab("tontine")} style={{ background:C.gold, color:C.white, border:"none", borderRadius:"10px", padding:"10px 18px", fontWeight:700, fontSize:"13px", cursor:"pointer", whiteSpace:"nowrap" }}>Découvrir →</button>
            </div>

            <div style={{ background:`linear-gradient(135deg,${C.terra},${C.gold})`, borderRadius:"18px", padding:"22px", textAlign:"center" }}>
              <h3 style={{ margin:"0 0 6px", color:C.white, fontFamily:"'Playfair Display',serif", fontSize:"16px" }}>Agent ou promoteur ?</h3>
              <p style={{ color:"rgba(255,255,255,0.85)", margin:"0 0 14px", fontSize:"12px" }}>Touchez 6 800+ acheteurs de la diaspora française.</p>
              <button style={{ background:C.white, color:C.terra, border:"none", borderRadius:"10px", padding:"10px 20px", fontWeight:800, fontSize:"13px", cursor:"pointer" }}>Devenir partenaire →</button>
            </div>
          </div>
        )}

        {tab==="biens" && (
          <div style={{ paddingTop:"20px" }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", fontWeight:800, color:C.dark, margin:"0 0 16px" }}>Trouver un bien</h2>
            <div style={{ background:C.white, borderRadius:"14px", padding:"14px", marginBottom:"14px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)", display:"flex", flexWrap:"wrap", gap:"8px", alignItems:"center" }}>
              <input type="text" placeholder="🔍 Ville, quartier..." value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1, minWidth:"140px", border:`1.5px solid ${C.sand}`, borderRadius:"9px", padding:"8px 12px", fontSize:"13px", outline:"none", color:C.dark }}/>
              <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                {countries.map(c=>(
                  <button key={c} onClick={()=>setFilterCountry(c)} style={{ background:filterCountry===c?C.forest:C.light, color:filterCountry===c?C.white:C.dark, border:"none", borderRadius:"8px", padding:"6px 11px", fontWeight:600, fontSize:"12px", cursor:"pointer", transition:"all 0.2s" }}>{c}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                {types.map(t=>(
                  <button key={t} onClick={()=>setFilterType(t)} style={{ background:filterType===t?C.terra:C.light, color:filterType===t?C.white:C.dark, border:"none", borderRadius:"8px", padding:"6px 11px", fontWeight:600, fontSize:"12px", cursor:"pointer", transition:"all 0.2s" }}>{t}</button>
                ))}
              </div>
              <button onClick={()=>setShowMap(!showMap)} style={{ background:showMap?C.terra:C.light, color:showMap?C.white:C.dark, border:"none", borderRadius:"8px", padding:"6px 12px", fontWeight:700, fontSize:"12px", cursor:"pointer" }}>🗺️ {showMap?"Masquer":"Carte"}</button>
            </div>
            {showMap && (
              <div style={{ marginBottom:"16px" }}>
                <div style={{ height:"300px", borderRadius:"16px", overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", border:`1px solid ${C.sand}`, marginBottom:"10px" }}>
                  <FallbackMap properties={filtered} onSelectProperty={p=>{setMapSelected(p);setSelectedProp(p);}} selectedId={mapSelected?.id}/>
                </div>
                {mapSelected && <PropertyCard p={mapSelected} onClick={setSelectedProp} compact/>}
              </div>
            )}
            <p style={{ color:C.muted, fontSize:"12px", margin:"0 0 12px" }}>{filtered.length} bien{filtered.length>1?"s":""} trouvé{filtered.length>1?"s":""}</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))", gap:"14px" }}>
              {filtered.map(p=><PropertyCard key={p.id} p={p} onClick={setSelectedProp}/>)}
              {filtered.length===0 && (
                <div style={{ textAlign:"center", padding:"50px 20px", color:C.muted, gridColumn:"1/-1" }}>
                  <div style={{ fontSize:"36px", marginBottom:"8px" }}>🔍</div>
                  <p>Aucun bien ne correspond à votre recherche.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab==="tontine" && (
          <div style={{ paddingTop:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px", flexWrap:"wrap", gap:"10px" }}>
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", fontWeight:800, color:C.dark, margin:"0 0 4px" }}>Tontines DiasporaImmo</h2>
                <p style={{ color:C.muted, fontSize:"13px", margin:0 }}>Épargne collective · Virements directs entre membres</p>
              </div>
              <button style={{ background:C.terra, color:C.white, border:"none", borderRadius:"10px", padding:"10px 16px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>+ Créer</button>
            </div>
            <div style={{ background:"#FFF8E1", border:"1px solid #FFD54F", borderRadius:"12px", padding:"10px 14px", marginBottom:"18px", fontSize:"12px", color:"#5D4037" }}>
              🔒 DiasporaImmo ne collecte jamais d'argent. Les virements se font directement entre membres via Wave, Orange Money ou virement bancaire.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:"14px" }}>
              {TONTINES.map(t=><TontineCard key={t.id} t={t} onJoin={t=>alert(`Demande envoyée pour "${t.name}" !`)}/>)}
            </div>
          </div>
        )}

        {tab==="services" && (
          <div style={{ paddingTop:"20px" }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", fontWeight:800, color:C.dark, margin:"0 0 6px" }}>Nos services</h2>
            <p style={{ color:C.muted, margin:"0 0 20px", fontSize:"13px" }}>Tout pour investir sereinement depuis la France.</p>
            <div style={{ display:"grid", gap:"12px" }}>
              {[
                {icon:"⚖️",title:"Vérification juridique",desc:"Contrôle des titres fonciers, conseils notariaux au Sénégal, Côte d'Ivoire et Cameroun.",tags:["Titre foncier","Notaire","Contrat"],gradient:`linear-gradient(135deg,${C.forest},#2D6A4F)`},
                {icon:"💶",title:"Transfert d'argent optimisé",desc:"Partenariats Wave et Orange Money pour des transferts sécurisés depuis la France.",tags:["Wave","Orange Money","SEPA"],gradient:`linear-gradient(135deg,${C.terra},${C.gold})`},
                {icon:"🏗️",title:"Suivi de construction",desc:"Photos hebdomadaires, rapport de chantier, maîtres d'œuvre certifiés.",tags:["Rapport hebdo","Photos","MOE"],gradient:`linear-gradient(135deg,${C.earth},${C.terra})`},
                {icon:"🌱",title:"Accompagnement agricole",desc:"Mise en relation avec agronomes locaux, suivi d'exploitation et rentabilité.",tags:["Agronome","Suivi","Rentabilité"],gradient:`linear-gradient(135deg,#2C7744,${C.earth})`},
                {icon:"🏘️",title:"Gestion locative",desc:"Votre bien loué, entretenu, et loyers virés en France chaque mois.",tags:["Loyers garantis","Entretien","Compta"],gradient:`linear-gradient(135deg,#2C2C2C,#5C4A3C)`},
                {icon:"🛫",title:"Voyage d'investissement",desc:"Séjours organisés Dakar, Abidjan ou Douala pour visiter et signer.",tags:["Dakar","Abidjan","Douala"],gradient:`linear-gradient(135deg,${C.gold},${C.earth})`},
              ].map(s=>(
                <div key={s.title} style={{ background:C.white, borderRadius:"16px", overflow:"hidden", display:"flex", boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ width:68, flexShrink:0, background:s.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px" }}>{s.icon}</div>
                  <div style={{ padding:"14px", flex:1 }}>
                    <h3 style={{ margin:"0 0 4px", fontSize:"14px", fontWeight:700, color:C.dark }}>{s.title}</h3>
                    <p style={{ margin:"0 0 8px", fontSize:"12px", color:C.muted, lineHeight:1.5 }}>{s.desc}</p>
                    <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                      {s.tags.map(t=><span key={t} style={{ background:C.light, color:C.earth, fontSize:"10px", padding:"2px 7px", borderRadius:"5px", fontWeight:500 }}>{t}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="compte" && (
          <div style={{ paddingTop:"20px" }}>
            <div style={{ background:`linear-gradient(135deg,${C.forest},#2D6A4F)`, borderRadius:"18px", padding:"22px", marginBottom:"20px", display:"flex", alignItems:"center", gap:"14px" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg,${C.terra},${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", fontWeight:800, color:C.white }}>ML</div>
              <div>
                <h2 style={{ margin:"0 0 3px", color:C.white, fontFamily:"'Playfair Display',serif", fontSize:"17px" }}>Marie Laurence</h2>
                <p style={{ margin:"0 0 6px", color:"rgba(255,255,255,0.7)", fontSize:"11px" }}>Le Raincy, France 🇫🇷</p>
                <span style={{ background:C.gold, color:C.white, fontSize:"10px", fontWeight:700, padding:"3px 10px", borderRadius:"20px" }}>Investisseur vérifié</span>
              </div>
            </div>
            <div style={{ display:"grid", gap:"8px" }}>
              {[
                {icon:"🔖",label:"Biens sauvegardés",value:"3 biens"},
                {icon:"📩",label:"Messages agents",value:"2 non lus"},
                {icon:"🔔",label:"Alertes",value:"Sénégal · Vente · Terrain"},
                {icon:"📄",label:"Mes documents",value:"Passeport · RIB · Impôts"},
                {icon:"🌍",label:"Pays suivis",value:"🇸🇳 🇨🇮 🇨🇲"},
                {icon:"⚙️",label:"Paramètres",value:"Langue, notifications"},
              ].map(item=>(
                <div key={item.label} style={{ background:C.white, borderRadius:"12px", padding:"12px 14px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", cursor:"pointer" }}>
                  <span style={{ fontSize:"18px" }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"13px", fontWeight:700, color:C.dark }}>{item.label}</div>
                    <div style={{ fontSize:"11px", color:C.muted }}>{item.value}</div>
                  </div>
                  <span style={{ color:C.terra, fontWeight:700, fontSize:"12px" }}>→</span>
                </div>
              ))}
            </div>
            <button style={{ width:"100%", marginTop:"16px", background:"transparent", border:`2px solid ${C.terra}`, color:C.terra, borderRadius:"12px", padding:"12px", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>Se déconnecter</button>
          </div>
        )}
      </main>

      <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:C.white, borderTop:`1px solid ${C.sand}`, display:"flex", zIndex:99, boxShadow:"0 -4px 20px rgba(0,0,0,0.08)" }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>switchTab(n.id)} style={{ flex:1, background:"none", border:"none", padding:"9px 4px 7px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
            <span style={{ fontSize:"20px" }}>{n.icon}</span>
            <span style={{ fontSize:"10px", fontWeight:tab===n.id?700:400, color:tab===n.id?C.terra:C.muted }}>{n.label}</span>
          </button>
        ))}
      </nav>

      <PropertyModal p={selectedProp} onClose={()=>setSelectedProp(null)}/>
    </div>
  );
}
