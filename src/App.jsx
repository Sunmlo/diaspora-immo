import { useState, useRef } from "react";

const C = {
  terra: "#C4622D", gold: "#D4A017", earth: "#8B5E3C",
  forest: "#1A3C2E", forestMid: "#2D6A4F", cameroun: "#2C7744",
  cream: "#FAF6EE", light: "#FDF9F3", sand: "#F5E6C8",
  dark: "#2C2C2C", muted: "#7A7060", white: "#FFFFFF",
  success: "#2E7D32", successBg: "#E8F5E9",
};

const F = "'Nunito Sans', sans-serif";

const SUPABASE_URL = "https://nhyejaubfxjmmuvetayw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeWVqYXViZnhqbW11dmV0YXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDIzODgsImV4cCI6MjA5NjQxODM4OH0.yIaB8nBbnBVufudtt-FsmoWPlSqOU2uYzLLQjtiTdR4";

// Indicatifs téléphoniques mondiaux
const PHONE_CODES = [
  {code:"+33",label:"🇫🇷 France (+33)"},{code:"+32",label:"🇧🇪 Belgique (+32)"},{code:"+41",label:"🇨🇭 Suisse (+41)"},
  {code:"+1",label:"🇨🇦 Canada (+1)"},{code:"+44",label:"🇬🇧 Royaume-Uni (+44)"},{code:"+49",label:"🇩🇪 Allemagne (+49)"},
  {code:"+39",label:"🇮🇹 Italie (+39)"},{code:"+34",label:"🇪🇸 Espagne (+34)"},{code:"+31",label:"🇳🇱 Pays-Bas (+31)"},
  {code:"+351",label:"🇵🇹 Portugal (+351)"},{code:"+1",label:"🇺🇸 États-Unis (+1)"},
  // Afrique de l'Ouest
  {code:"+221",label:"🇸🇳 Sénégal (+221)"},{code:"+225",label:"🇨🇮 Côte d'Ivoire (+225)"},
  {code:"+223",label:"🇲🇱 Mali (+223)"},{code:"+226",label:"🇧🇫 Burkina Faso (+226)"},
  {code:"+224",label:"🇬🇳 Guinée (+224)"},{code:"+229",label:"🇧🇯 Bénin (+229)"},
  {code:"+228",label:"🇹🇬 Togo (+228)"},{code:"+227",label:"🇳🇪 Niger (+227)"},
  {code:"+222",label:"🇲🇷 Mauritanie (+222)"},{code:"+245",label:"🇬🇼 Guinée-Bissau (+245)"},
  {code:"+234",label:"🇳🇬 Nigeria (+234)"},{code:"+233",label:"🇬🇭 Ghana (+233)"},
  {code:"+220",label:"🇬🇲 Gambie (+220)"},{code:"+232",label:"🇸🇱 Sierra Leone (+232)"},
  // Afrique Centrale
  {code:"+237",label:"🇨🇲 Cameroun (+237)"},{code:"+242",label:"🇨🇬 Congo (+242)"},
  {code:"+243",label:"🇨🇩 RD Congo (+243)"},{code:"+241",label:"🇬🇦 Gabon (+241)"},
  {code:"+236",label:"🇨🇫 Centrafrique (+236)"},{code:"+235",label:"🇹🇩 Tchad (+235)"},
  {code:"+240",label:"🇬🇶 Guinée Équatoriale (+240)"},
  // Afrique de l'Est & Australe
  {code:"+254",label:"🇰🇪 Kenya (+254)"},{code:"+255",label:"🇹🇿 Tanzanie (+255)"},
  {code:"+256",label:"🇺🇬 Ouganda (+256)"},{code:"+250",label:"🇷🇼 Rwanda (+250)"},
  {code:"+257",label:"🇧🇮 Burundi (+257)"},{code:"+251",label:"🇪🇹 Éthiopie (+251)"},
  {code:"+27",label:"🇿🇦 Afrique du Sud (+27)"},{code:"+261",label:"🇲🇬 Madagascar (+261)"},
  {code:"+230",label:"🇲🇺 Maurice (+230)"},{code:"+248",label:"🇸🇨 Seychelles (+248)"},
  // Maghreb & Moyen-Orient
  {code:"+212",label:"🇲🇦 Maroc (+212)"},{code:"+213",label:"🇩🇿 Algérie (+213)"},
  {code:"+216",label:"🇹🇳 Tunisie (+216)"},{code:"+20",label:"🇪🇬 Égypte (+20)"},
  {code:"+971",label:"🇦🇪 Émirats (+971)"},{code:"+974",label:"🇶🇦 Qatar (+974)"},
  // Asie & Autres
  {code:"+86",label:"🇨🇳 Chine (+86)"},{code:"+91",label:"🇮🇳 Inde (+91)"},
  {code:"+81",label:"🇯🇵 Japon (+81)"},{code:"+82",label:"🇰🇷 Corée du Sud (+82)"},
  {code:"+55",label:"🇧🇷 Brésil (+55)"},{code:"+52",label:"🇲🇽 Mexique (+52)"},
];

const COUNTRIES = [
  { name:"Sénégal", flag:"🇸🇳", region:"Ouest", lat:14.69, lng:-17.44 },
  { name:"Côte d'Ivoire", flag:"🇨🇮", region:"Ouest", lat:5.35, lng:-4.00 },
  { name:"Mali", flag:"🇲🇱", region:"Ouest", lat:12.65, lng:-8.00 },
  { name:"Burkina Faso", flag:"🇧🇫", region:"Ouest", lat:12.36, lng:-1.53 },
  { name:"Guinée", flag:"🇬🇳", region:"Ouest", lat:9.53, lng:-13.67 },
  { name:"Bénin", flag:"🇧🇯", region:"Ouest", lat:6.36, lng:2.42 },
  { name:"Togo", flag:"🇹🇬", region:"Ouest", lat:6.13, lng:1.22 },
  { name:"Niger", flag:"🇳🇪", region:"Ouest", lat:13.51, lng:2.11 },
  { name:"Mauritanie", flag:"🇲🇷", region:"Ouest", lat:18.07, lng:-15.96 },
  { name:"Guinée-Bissau", flag:"🇬🇼", region:"Ouest", lat:11.86, lng:-15.60 },
  { name:"Cameroun", flag:"🇨🇲", region:"Centrale", lat:3.86, lng:11.52 },
  { name:"Congo", flag:"🇨🇬", region:"Centrale", lat:-4.27, lng:15.24 },
  { name:"RD Congo", flag:"🇨🇩", region:"Centrale", lat:-4.32, lng:15.32 },
  { name:"Gabon", flag:"🇬🇦", region:"Centrale", lat:0.41, lng:9.47 },
  { name:"Centrafrique", flag:"🇨🇫", region:"Centrale", lat:4.36, lng:18.56 },
  { name:"Tchad", flag:"🇹🇩", region:"Centrale", lat:12.10, lng:15.04 },
];

const PROPERTIES = [
  { id:1, title:"Villa moderne piscine Almadies", type:"Vente", country:"Sénégal", city:"Dakar", neighborhood:"Almadies", price:95000000, price_eur:145000, surface:280, rooms:5, bathrooms:3, verified:true, agent_name:"Mamadou Diallo", tags:["Piscine","Terrasse"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#D4A017)", description:"Magnifique villa contemporaine aux Almadies, 5 min de la mer.", lat:14.7464, lng:-17.5218, demo:true, features:["Piscine","Jardin","Parking"] },
  { id:2, title:"Appartement standing Plateau", type:"Location", country:"Sénégal", city:"Dakar", neighborhood:"Plateau", price:850000, price_eur:1295, surface:120, rooms:3, bathrooms:2, verified:true, agent_name:"Fatou Ndiaye", tags:["Climatisé","Parking"], emoji:"🏢", gradient:"linear-gradient(135deg,#1A3C2E,#2D6A4F)", description:"Appartement haut standing au cœur du Plateau.", lat:14.6928, lng:-17.4467, demo:true, features:["Meublé","Parking"] },
  { id:3, title:"Terrain viabilisé Saly", type:"Terrain", country:"Sénégal", city:"Mbour", neighborhood:"Saly", price:18000000, price_eur:27500, surface:500, rooms:null, bathrooms:null, verified:true, agent_name:"Oumar Sow", tags:["Titre foncier","Bord de mer"], emoji:"🌴", gradient:"linear-gradient(135deg,#8B5E3C,#C4622D)", description:"Terrain titre foncier bord de mer à Saly.", lat:14.4618, lng:-17.0199, demo:true, features:["Titre foncier"] },
  { id:4, title:"Villa duplex Cocody", type:"Vente", country:"Côte d'Ivoire", city:"Abidjan", neighborhood:"Cocody", price:120000000, price_eur:183000, surface:320, rooms:6, bathrooms:4, verified:true, agent_name:"Aïcha Kouassi", tags:["Duplex","Jardin"], emoji:"🏘️", gradient:"linear-gradient(135deg,#D4A017,#C4622D)", description:"Superbe villa duplex à Cocody, proche des ambassades.", lat:5.3600, lng:-3.9800, demo:true, features:["Jardin","Parking","Titre foncier"] },
  { id:5, title:"Appartement Marcory Zone 4", type:"Location", country:"Côte d'Ivoire", city:"Abidjan", neighborhood:"Marcory", price:600000, price_eur:915, surface:95, rooms:2, bathrooms:1, verified:false, agent_name:"Koffi Assi", tags:["Meublé","Sécurisé"], emoji:"🏬", gradient:"linear-gradient(135deg,#2C2C2C,#5C4A3C)", description:"Appartement meublé idéal pour diaspora.", lat:5.2993, lng:-3.9957, demo:true, features:["Meublé"] },
  { id:6, title:"Villa Bonamoussadi Douala", type:"Vente", country:"Cameroun", city:"Douala", neighborhood:"Bonamoussadi", price:65000000, price_eur:99150, surface:220, rooms:5, bathrooms:3, verified:true, agent_name:"Keur Immo Cameroun", tags:["Titre foncier","Parking"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#2C7744)", description:"Belle villa 5 pièces à Bonamoussadi.", lat:4.0711, lng:9.7386, demo:true, features:["Parking","Jardin","Titre foncier"] },
  { id:7, title:"Villa Bastos Yaoundé", type:"Vente", country:"Cameroun", city:"Yaoundé", neighborhood:"Bastos", price:95000000, price_eur:144875, surface:200, rooms:4, bathrooms:3, verified:true, agent_name:"GCS Immo Yaoundé", tags:["Quartier diplomatique","Titre foncier"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#2C7744)", description:"Villa 4 pièces à Bastos, quartier diplomatique.", lat:3.8845, lng:11.5258, demo:true, features:["Jardin","Parking","Titre foncier"] },
  { id:8, title:"Villa moderne ACI 2000 Bamako", type:"Vente", country:"Mali", city:"Bamako", neighborhood:"ACI 2000", price:75000000, price_eur:114375, surface:200, rooms:4, bathrooms:3, verified:true, agent_name:"Immo Mali", tags:["Titre foncier","Quartier résidentiel"], emoji:"🏡", gradient:"linear-gradient(135deg,#2C7744,#D4A017)", description:"Belle villa 4 pièces dans le quartier résidentiel prisé d'ACI 2000 à Bamako.", lat:12.6392, lng:-8.0029, demo:true, features:["Parking","Titre foncier"] },
  { id:9, title:"Terrain Badalabougou Bamako", type:"Terrain", country:"Mali", city:"Bamako", neighborhood:"Badalabougou", price:25000000, price_eur:38125, surface:400, rooms:null, bathrooms:null, verified:true, agent_name:"SahelImmo", tags:["Titre foncier","Zone résidentielle"], emoji:"🌾", gradient:"linear-gradient(135deg,#8B5E3C,#D4A017)", description:"Terrain titré 400m² à Badalabougou, quartier résidentiel de Bamako.", lat:12.6260, lng:-7.9990, demo:true, features:["Titre foncier"] },
  { id:10, title:"Villa 4 pièces Ouaga 2000", type:"Vente", country:"Burkina Faso", city:"Ouagadougou", neighborhood:"Ouaga 2000", price:55000000, price_eur:83875, surface:180, rooms:4, bathrooms:2, verified:true, agent_name:"Faso Immo", tags:["Titre foncier","Quartier résidentiel"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#8B5E3C)", description:"Villa 4 pièces dans le quartier résidentiel Ouaga 2000.", lat:12.3264, lng:-1.5353, demo:true, features:["Jardin","Parking","Titre foncier"] },
  { id:11, title:"Local commercial Ouagadougou", type:"Commercial", country:"Burkina Faso", city:"Ouagadougou", neighborhood:"Zogona", price:800000, price_eur:1220, surface:60, rooms:null, bathrooms:null, verified:false, agent_name:"Particulier", tags:["Vitrine","Rue passante"], emoji:"🏪", gradient:"linear-gradient(135deg,#2C2C2C,#8B5E3C)", description:"Local commercial 60m² en zone commerçante à Zogona.", lat:12.3703, lng:-1.5247, demo:true, features:["Parking"] },
  { id:12, title:"Villa 5 pièces Ratoma Conakry", type:"Vente", country:"Guinée", city:"Conakry", neighborhood:"Ratoma", price:80000000, price_eur:122000, surface:220, rooms:5, bathrooms:3, verified:true, agent_name:"Guinée Immo", tags:["Titre foncier","Vue mer"], emoji:"🏡", gradient:"linear-gradient(135deg,#D4A017,#2C7744)", description:"Belle villa 5 pièces à Ratoma avec vue sur l'océan Atlantique.", lat:9.5370, lng:-13.6729, demo:true, features:["Piscine","Jardin","Titre foncier"] },
  { id:13, title:"Terrain Kipé Conakry", type:"Terrain", country:"Guinée", city:"Conakry", neighborhood:"Kipé", price:20000000, price_eur:30500, surface:300, rooms:null, bathrooms:null, verified:true, agent_name:"Guinée Immo", tags:["Titre foncier","Zone résidentielle"], emoji:"🌾", gradient:"linear-gradient(135deg,#2C7744,#8B5E3C)", description:"Terrain titré 300m² à Kipé, quartier résidentiel calme de Conakry.", lat:9.5700, lng:-13.6400, demo:true, features:["Titre foncier"] },
  { id:14, title:"Villa Cadjehoun Cotonou", type:"Vente", country:"Bénin", city:"Cotonou", neighborhood:"Cadjehoun", price:70000000, price_eur:106750, surface:200, rooms:4, bathrooms:3, verified:true, agent_name:"Bénin Immo", tags:["Titre foncier","Proche aéroport"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#2C7744)", description:"Villa 4 pièces à Cadjehoun, quartier résidentiel proche de l'aéroport de Cotonou.", lat:6.3667, lng:2.4333, demo:true, features:["Jardin","Parking","Titre foncier"] },
  { id:15, title:"Appartement Fidjrossè Cotonou", type:"Location", country:"Bénin", city:"Cotonou", neighborhood:"Fidjrossè", price:400000, price_eur:610, surface:80, rooms:2, bathrooms:1, verified:false, agent_name:"Particulier", tags:["Bord de mer","Climatisé"], emoji:"🏠", gradient:"linear-gradient(135deg,#1A3C2E,#2C7744)", description:"Appartement 2 pièces en bord de mer à Fidjrossè.", lat:6.3420, lng:2.3890, demo:true, features:["Meublé"] },
  { id:16, title:"Villa Agbalépédogan Lomé", type:"Vente", country:"Togo", city:"Lomé", neighborhood:"Agbalépédogan", price:45000000, price_eur:68625, surface:160, rooms:4, bathrooms:2, verified:true, agent_name:"Togo Immo", tags:["Titre foncier","Quartier calme"], emoji:"🏡", gradient:"linear-gradient(135deg,#2C7744,#D4A017)", description:"Villa 4 pièces dans quartier résidentiel calme de Lomé.", lat:6.1375, lng:1.2123, demo:true, features:["Jardin","Titre foncier"] },
  { id:17, title:"Villa Niamey Plateau", type:"Vente", country:"Niger", city:"Niamey", neighborhood:"Plateau", price:50000000, price_eur:76250, surface:180, rooms:4, bathrooms:2, verified:true, agent_name:"Niger Immo", tags:["Titre foncier","Quartier résidentiel"], emoji:"🏡", gradient:"linear-gradient(135deg,#D4A017,#8B5E3C)", description:"Belle villa 4 pièces dans le quartier résidentiel du Plateau à Niamey.", lat:13.5116, lng:2.1254, demo:true, features:["Jardin","Parking","Titre foncier"] },
  { id:18, title:"Villa Tevragh Zeina Nouakchott", type:"Vente", country:"Mauritanie", city:"Nouakchott", neighborhood:"Tevragh Zeina", price:60000000, price_eur:91500, surface:200, rooms:4, bathrooms:3, verified:true, agent_name:"Maurimmo", tags:["Titre foncier","Quartier huppé"], emoji:"🏡", gradient:"linear-gradient(135deg,#2C7744,#C4622D)", description:"Villa 4 pièces à Tevragh Zeina, quartier le plus prisé de Nouakchott.", lat:18.0858, lng:-15.9785, demo:true, features:["Jardin","Parking","Titre foncier"] },
  { id:19, title:"Villa Gombe Brazzaville", type:"Vente", country:"Congo", city:"Brazzaville", neighborhood:"Gombe", price:85000000, price_eur:129625, surface:220, rooms:5, bathrooms:3, verified:true, agent_name:"Congo Immo", tags:["Titre foncier","Vue fleuve"], emoji:"🏡", gradient:"linear-gradient(135deg,#C4622D,#1A3C2E)", description:"Villa 5 pièces avec vue sur le fleuve Congo à la Gombe.", lat:-4.2634, lng:15.2429, demo:true, features:["Piscine","Jardin","Titre foncier"] },
  { id:20, title:"Villa Gombe Kinshasa", type:"Vente", country:"RD Congo", city:"Kinshasa", neighborhood:"Gombe", price:120000000, price_eur:183000, surface:280, rooms:5, bathrooms:4, verified:true, agent_name:"Kinshasa Immo", tags:["Titre foncier","Quartier diplomatique"], emoji:"🏡", gradient:"linear-gradient(135deg,#D4A017,#1A3C2E)", description:"Grande villa 5 pièces dans le quartier diplomatique de la Gombe à Kinshasa.", lat:-4.3276, lng:15.3214, demo:true, features:["Piscine","Jardin","Parking","Titre foncier"] },
  { id:21, title:"Villa Batterie IV Libreville", type:"Vente", country:"Gabon", city:"Libreville", neighborhood:"Batterie IV", price:130000000, price_eur:198250, surface:260, rooms:5, bathrooms:4, verified:true, agent_name:"Gabon Immo", tags:["Titre foncier","Vue mer"], emoji:"🏡", gradient:"linear-gradient(135deg,#2C7744,#D4A017)", description:"Villa 5 pièces avec vue sur l'océan Atlantique à Batterie IV.", lat:0.3901, lng:9.4544, demo:true, features:["Piscine","Jardin","Parking","Titre foncier"] },
  { id:22, title:"Appartement Louis Libreville", type:"Location", country:"Gabon", city:"Libreville", neighborhood:"Louis", price:600000, price_eur:915, surface:90, rooms:2, bathrooms:1, verified:true, agent_name:"Gabon Immo", tags:["Meublé","Climatisé"], emoji:"🏢", gradient:"linear-gradient(135deg,#1A3C2E,#2C7744)", description:"Appartement meublé 2 pièces au quartier Louis, centre de Libreville.", lat:0.4162, lng:9.4673, demo:true, features:["Meublé","Parking"] },
  { id:23, title:"Villa Miskine Bangui", type:"Vente", country:"Centrafrique", city:"Bangui", neighborhood:"Miskine", price:35000000, price_eur:53375, surface:150, rooms:3, bathrooms:2, verified:false, agent_name:"RCA Immo", tags:["Titre foncier","Quartier résidentiel"], emoji:"🏡", gradient:"linear-gradient(135deg,#8B5E3C,#C4622D)", description:"Villa 3 pièces dans le quartier résidentiel de Miskine à Bangui.", lat:4.3612, lng:18.5550, demo:true, features:["Jardin","Titre foncier"] },
  { id:24, title:"Villa Chagoua N'Djamena", type:"Vente", country:"Tchad", city:"N'Djamena", neighborhood:"Chagoua", price:40000000, price_eur:61000, surface:160, rooms:3, bathrooms:2, verified:false, agent_name:"Tchad Immo", tags:["Titre foncier","Quartier résidentiel"], emoji:"🏡", gradient:"linear-gradient(135deg,#D4A017,#8B5E3C)", description:"Villa 3 pièces dans le quartier résidentiel de Chagoua à N'Djamena.", lat:12.1048, lng:15.0445, demo:true, features:["Jardin","Titre foncier"] },
  { id:25, title:"Villa Bairro Militar Bissau", type:"Vente", country:"Guinée-Bissau", city:"Bissau", neighborhood:"Bairro Militar", price:25000000, price_eur:38125, surface:130, rooms:3, bathrooms:2, verified:false, agent_name:"GB Immo", tags:["Titre foncier","Quartier calme"], emoji:"🏡", gradient:"linear-gradient(135deg,#2C7744,#8B5E3C)", description:"Villa 3 pièces dans un quartier calme de Bissau.", lat:11.8636, lng:-15.5977, demo:true, features:["Jardin","Titre foncier"] },
];

const TONTINES = [
  { id:1, name:"Tontine Dakar Almadies", goal:"Achat terrain Saly", monthly_amount:500, members_count:8, max_members:10, cycle_months:10, current_cycle:3, status:"active", country:"Sénégal" },
  { id:2, name:"Tontine Abidjan Cocody", goal:"Construction villa", monthly_amount:800, members_count:6, max_members:8, cycle_months:8, current_cycle:1, status:"active", country:"Côte d'Ivoire" },
  { id:3, name:"Tontine Terrain Thiès", goal:"Achat terrain résidentiel", monthly_amount:300, members_count:5, max_members:12, cycle_months:12, current_cycle:0, status:"recrutement", country:"Sénégal" },
  { id:4, name:"Tontine Douala Diaspora", goal:"Construction maison familiale", monthly_amount:600, members_count:4, max_members:10, cycle_months:10, current_cycle:0, status:"recrutement", country:"Cameroun" },
];

const EQUIPEMENTS = ["Piscine","Jardin","Parking","Meublé","Titre foncier","Terrasse"];
const fmtXOF = n => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
const fmtEUR = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const typeColor = t => t==="Vente"?C.terra:t==="Location"?C.forest:t==="Agricole"?C.cameroun:t==="Commercial"?"#2C2C2C":C.earth;
const countryFlag = name => COUNTRIES.find(c=>c.name===name)?.flag||"🌍";

// ─── AUTH SUPABASE ────────────────────────────────
async function signUp(email, password, name) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
    body:JSON.stringify({email,password,data:{name}}),
  });
  return res.json();
}
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
    body:JSON.stringify({email,password}),
  });
  return res.json();
}

// ─── LOGIN MODAL ──────────────────────────────────
function LoginModal({ onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+33");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!email||!password) return;
    setLoading(true); setError("");
    try {
      if (mode==="signup") {
        const data = await signUp(email, password, name);
        if (data.error) setError(data.error.message||"Erreur lors de l'inscription");
        else setSuccess("Compte créé ! Vérifiez votre email pour confirmer.");
      } else {
        const data = await signIn(email, password);
        if (data.error) setError("Email ou mot de passe incorrect");
        else { onLogin({email,name:data.user?.user_metadata?.name||email.split("@")[0],token:data.access_token}); onClose(); }
      }
    } catch(e) {
      onLogin({email,name:name||email.split("@")[0],token:"demo_token"});
      onClose();
    }
    setLoading(false);
  };

  const handleSocial = (provider) => {
    window.open(`${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${window.location.origin}`,"_blank");
    onLogin({email:`user@${provider}.com`,name:`Utilisateur ${provider}`,token:"demo_token"});
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"24px",maxWidth:"420px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 40px 100px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestMid})`,padding:"24px",position:"relative",textAlign:"center"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"16px"}}>✕</button>
          <div style={{fontSize:"32px",marginBottom:"8px"}}>🌍</div>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"20px"}}>{mode==="login"?"Connexion":"Créer un compte"}</h2>
          <p style={{margin:0,color:"rgba(255,255,255,0.75)",fontSize:"12px",fontFamily:F}}>DiasporaImmo · Investir chez soi</p>
        </div>
        <div style={{padding:"22px"}}>
          {/* Connexion sociale */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"18px"}}>
            <button onClick={()=>handleSocial("google")} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",border:`1.5px solid ${C.sand}`,borderRadius:"12px",padding:"11px",background:C.white,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:"13px",color:C.dark}}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button onClick={()=>handleSocial("facebook")} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",border:`1.5px solid ${C.sand}`,borderRadius:"12px",padding:"11px",background:C.white,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:"13px",color:C.dark}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"18px"}}>
            <div style={{flex:1,height:"1px",background:C.sand}}/><span style={{fontSize:"12px",color:C.muted,fontFamily:F}}>ou avec email</span><div style={{flex:1,height:"1px",background:C.sand}}/>
          </div>
          {mode==="signup"&&(
            <div style={{marginBottom:"12px"}}>
              <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>Prénom et nom</label>
              <input placeholder="Ex: Marie Laurence" value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"11px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
            </div>
          )}
          <div style={{marginBottom:"12px"}}>
            <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>Email</label>
            <input type="email" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"11px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
          </div>
          <div style={{marginBottom:"12px"}}>
            <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>Mot de passe</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"11px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
          </div>
          {mode==="signup"&&(
            <div style={{marginBottom:"14px"}}>
              <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>Téléphone (optionnel)</label>
              <div style={{display:"flex",gap:"6px"}}>
                <select value={phoneCode} onChange={e=>setPhoneCode(e.target.value)} style={{border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"10px 8px",fontSize:"12px",color:C.dark,fontFamily:F,flexShrink:0,maxWidth:"160px"}}>
                  {PHONE_CODES.map((p,i)=><option key={i} value={p.code}>{p.label}</option>)}
                </select>
                <input type="tel" placeholder="6 12 34 56 78" value={phone} onChange={e=>setPhone(e.target.value)} style={{flex:1,border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"11px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
              </div>
            </div>
          )}
          {error&&<div style={{background:"#FEE2E2",color:"#DC2626",borderRadius:"10px",padding:"10px 14px",marginBottom:"14px",fontSize:"13px",fontFamily:F}}>{error}</div>}
          {success&&<div style={{background:C.successBg,color:C.success,borderRadius:"10px",padding:"10px 14px",marginBottom:"14px",fontSize:"13px",fontFamily:F}}>{success}</div>}
          <button onClick={handleSubmit} disabled={!email||!password||loading} style={{width:"100%",background:email&&password?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"12px",padding:"14px",fontWeight:700,fontSize:"15px",cursor:email&&password?"pointer":"not-allowed",fontFamily:F,marginBottom:"14px"}}>
            {loading?"...":(mode==="login"?"Se connecter →":"Créer mon compte →")}
          </button>
          <div style={{textAlign:"center",fontSize:"13px",color:C.muted,fontFamily:F}}>
            {mode==="login"?<>Pas encore de compte ? <span onClick={()=>{setMode("signup");setError("");}} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>S'inscrire gratuitement</span></>:<>Déjà un compte ? <span onClick={()=>{setMode("login");setError("");}} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>Se connecter</span></>}
          </div>
          <p style={{textAlign:"center",fontSize:"11px",color:C.muted,marginTop:"10px",fontFamily:F}}>En continuant, vous acceptez nos conditions d'utilisation.</p>
        </div>
      </div>
    </div>
  );
}

// ─── ALERT MODAL ──────────────────────────────────
function AlertModal({ onClose, filters, user }) {
  const [email, setEmail] = useState(user?.email||"");
  const [name, setName] = useState(user?.name||"");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},
        body:JSON.stringify({name,email,message:`ALERTE: ${JSON.stringify(filters)}`,status:"alerte"}),
      });
    } catch(e) {}
    setLoading(false); setSent(true);
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"24px",maxWidth:"420px",width:"100%",overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestMid})`,padding:"22px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"16px"}}>✕</button>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>🔔</div>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"18px"}}>Créer une alerte</h2>
          <p style={{margin:0,color:"rgba(255,255,255,0.75)",fontSize:"12px",fontFamily:F}}>Recevez les nouvelles annonces par email</p>
        </div>
        <div style={{padding:"22px"}}>
          {sent?(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:"48px",marginBottom:"12px"}}>✅</div>
              <h3 style={{margin:"0 0 8px",color:C.dark,fontFamily:"'Playfair Display',serif"}}>Alerte créée !</h3>
              <p style={{color:C.muted,fontSize:"13px",fontFamily:F}}>Vous recevrez un email dès qu'une annonce correspond.</p>
              <button onClick={onClose} style={{marginTop:"16px",background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"10px 24px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Fermer</button>
            </div>
          ):(
            <>
              {[{label:"Votre prénom",val:name,set:setName,ph:"Ex: Marie"},{label:"Votre email *",val:email,set:setEmail,ph:"votre@email.com",type:"email"}].map(f=>(
                <div key={f.label} style={{marginBottom:"12px"}}>
                  <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>{f.label}</label>
                  <input type={f.type||"text"} placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"10px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
                </div>
              ))}
              <button onClick={handleSubmit} disabled={!email||loading} style={{width:"100%",background:email?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"12px",padding:"14px",fontWeight:700,fontSize:"14px",cursor:email?"pointer":"not-allowed",fontFamily:F}}>
                {loading?"Enregistrement...":"🔔 Activer l'alerte email"}
              </button>
              <p style={{textAlign:"center",fontSize:"11px",color:C.muted,marginTop:"10px",fontFamily:F}}>Gratuit · Désabonnement en un clic</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PARTNER MODAL ────────────────────────────────
function PartnerModal({ onClose, user }) {
  const [type, setType] = useState(null);
  const [form, setForm] = useState({name:user?.name||"",email:user?.email||"",phoneCode:"+33",phone:"",country:"Sénégal",agency:"",description:""});
  const [photos, setPhotos] = useState([]);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = async () => {
    if (!form.name||!form.email) return;
    setLoading(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method:"POST",
        headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},
        body:JSON.stringify({name:form.name,email:form.email,phone:`${form.phoneCode}${form.phone}`,message:`Type: ${type} | Pays: ${form.country} | Agence: ${form.agency} | ${form.description}`,status:"nouveau"}),
      });
    } catch(e) {}
    setLoading(false); setSent(true);
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"24px",maxWidth:"520px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 40px 100px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:`linear-gradient(135deg,${C.terra},${C.gold})`,padding:"22px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:"16px"}}>✕</button>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>🤝</div>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"18px"}}>Publier une annonce</h2>
          <p style={{margin:0,color:"rgba(255,255,255,0.85)",fontSize:"12px",fontFamily:F}}>Gratuit · Visible par +4 millions de diaspora francophone</p>
        </div>
        <div style={{padding:"22px"}}>
          {sent?(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:"48px",marginBottom:"12px"}}>🎉</div>
              <h3 style={{margin:"0 0 8px",color:C.dark,fontFamily:"'Playfair Display',serif"}}>Demande envoyée !</h3>
              <p style={{color:C.muted,fontSize:"13px",fontFamily:F}}>Nous vous contacterons dans les 24h.</p>
              <button onClick={onClose} style={{marginTop:"16px",background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"10px 24px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Fermer</button>
            </div>
          ):!type?(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              {[{id:"particulier",icon:"👤",title:"Particulier",desc:"Je vends ou loue mon bien"},{id:"pro",icon:"🏢",title:"Professionnel",desc:"Agent ou promoteur"}].map(t=>(
                <div key={t.id} onClick={()=>setType(t.id)} style={{background:C.light,borderRadius:"16px",padding:"20px",textAlign:"center",cursor:"pointer",border:`2px solid ${C.sand}`,transition:"all 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.border=`2px solid ${C.terra}`}
                  onMouseLeave={e=>e.currentTarget.style.border=`2px solid ${C.sand}`}>
                  <div style={{fontSize:"32px",marginBottom:"8px"}}>{t.icon}</div>
                  <div style={{fontWeight:700,color:C.dark,fontSize:"15px",marginBottom:"4px",fontFamily:F}}>{t.title}</div>
                  <div style={{fontSize:"12px",color:C.muted,marginBottom:"10px",fontFamily:F}}>{t.desc}</div>
                  <div style={{background:C.terra,color:C.white,borderRadius:"8px",padding:"6px",fontSize:"11px",fontWeight:700,fontFamily:F}}>Gratuit ✓</div>
                </div>
              ))}
            </div>
          ):(
            <>
              <button onClick={()=>setType(null)} style={{background:C.light,border:"none",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"12px",color:C.muted,marginBottom:"16px",fontFamily:F}}>← Retour</button>
              {/* Message d'avertissement - conservé de ton fichier original */}
              <div style={{background:"#FBF3EC",border:"1px solid #D97757",borderLeft:"4px solid #D97757",borderRadius:"8px",padding:"14px 16px",marginBottom:"16px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                <span style={{fontSize:"18px",flexShrink:0}}>⚠️</span>
                <div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontWeight:600,fontSize:"13px",color:"#3D2B1F",margin:"0 0 4px 0"}}>Avant de publier votre annonce</p>
                  <p style={{fontSize:"12px",lineHeight:1.5,color:"#5A4636",margin:0,fontFamily:F}}>Assurez-vous que toutes les informations sont exactes et vérifiables (titre de propriété, photos réelles, prix conforme). DiasporaImmo peut suspendre toute annonce signalée par la communauté ou jugée non conforme. Les fausses annonces exposent leur auteur à une suspension définitive et peuvent engager sa responsabilité légale.</p>
                </div>
              </div>
              {[{label:"Prénom et nom *",key:"name",ph:"Votre nom complet"},{label:"Email *",key:"email",ph:"votre@email.com",type:"email"}].map(f=>(
                <div key={f.key} style={{marginBottom:"12px"}}>
                  <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>{f.label}</label>
                  <input type={f.type||"text"} placeholder={f.ph} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"10px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
                </div>
              ))}
              {/* Téléphone avec indicatif */}
              <div style={{marginBottom:"12px"}}>
                <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>Téléphone WhatsApp</label>
                <div style={{display:"flex",gap:"6px"}}>
                  <select value={form.phoneCode} onChange={e=>set("phoneCode",e.target.value)} style={{border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"9px 8px",fontSize:"11px",color:C.dark,fontFamily:F,flexShrink:0,maxWidth:"160px"}}>
                    {PHONE_CODES.map((p,i)=><option key={i} value={p.code}>{p.label}</option>)}
                  </select>
                  <input type="tel" placeholder="6 12 34 56 78" value={form.phone} onChange={e=>set("phone",e.target.value)} style={{flex:1,border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"10px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
                </div>
              </div>
              <div style={{marginBottom:"12px"}}>
                <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>Pays</label>
                <select value={form.country} onChange={e=>set("country",e.target.value)} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"10px",fontSize:"13px",color:C.dark,fontFamily:F}}>
                  {COUNTRIES.map(c=><option key={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </div>
              <div style={{marginBottom:"12px"}}>
                <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>Description du bien</label>
                <textarea placeholder="Type, localisation, prix, surface..." value={form.description} onChange={e=>set("description",e.target.value)} rows={3} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"10px",padding:"10px 14px",fontSize:"14px",outline:"none",color:C.dark,boxSizing:"border-box",resize:"vertical",fontFamily:F}}/>
              </div>
              <div style={{marginBottom:"16px"}}>
                <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"5px",fontFamily:F}}>📸 Photos du bien</label>
                <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${C.sand}`,borderRadius:"12px",padding:"16px",textAlign:"center",cursor:"pointer",background:C.light}}>
                  <div style={{fontSize:"24px",marginBottom:"4px"}}>📷</div>
                  <div style={{fontSize:"12px",color:C.muted,fontFamily:F}}>Cliquez pour ajouter des photos</div>
                  <input ref={fileRef} type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>setPhotos([...e.target.files])}/>
                </div>
                {photos.length>0&&<div style={{marginTop:"6px",fontSize:"12px",color:C.success,fontWeight:700,fontFamily:F}}>✓ {photos.length} photo{photos.length>1?"s":""}</div>}
              </div>
              <button onClick={handleSubmit} disabled={!form.name||!form.email||loading} style={{width:"100%",background:form.name&&form.email?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"12px",padding:"14px",fontWeight:700,fontSize:"14px",cursor:form.name&&form.email?"pointer":"not-allowed",fontFamily:F}}>
                {loading?"Envoi...":"🚀 Envoyer ma demande"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROPERTY CARD ────────────────────────────────
function PropertyCard({ p, onClick, compact }) {
  const [hov, setHov] = useState(false);
  const shareWA = (e) => {
    e.stopPropagation();
    const txt = `🏠 ${p.title}\n📍 ${p.neighborhood}, ${p.city} ${countryFlag(p.country)}\n💰 ${fmtEUR(p.price_eur)}\n🌍 DiasporaImmo`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  };
  if (compact) return (
    <div onClick={()=>onClick(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:C.white,borderRadius:"14px",overflow:"hidden",cursor:"pointer",border:`1.5px solid ${hov?C.terra+"60":"transparent"}`,boxShadow:hov?"0 8px 30px rgba(196,98,45,0.15)":"0 2px 10px rgba(0,0,0,0.06)",transition:"all 0.25s",display:"flex"}}>
      <div style={{width:80,flexShrink:0,background:p.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px"}}>{p.emoji}</div>
      <div style={{padding:"10px 12px",flex:1,minWidth:0}}>
        <div style={{fontSize:"12px",fontWeight:700,color:C.dark,marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:F}}>{p.title}</div>
        <div style={{fontSize:"11px",color:C.muted,marginBottom:"4px",fontFamily:F}}>📍 {p.neighborhood}, {p.city} {countryFlag(p.country)}</div>
        <div style={{fontSize:"13px",fontWeight:700,color:C.terra,fontFamily:F}}>{fmtEUR(p.price_eur)}</div>
      </div>
    </div>
  );
  return (
    <div onClick={()=>onClick(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:C.white,borderRadius:"16px",overflow:"hidden",cursor:"pointer",border:`1.5px solid ${hov?C.terra+"50":"transparent"}`,boxShadow:hov?"0 16px 48px rgba(196,98,45,0.15)":"0 4px 20px rgba(0,0,0,0.07)",transform:hov?"translateY(-4px)":"translateY(0)",transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <div style={{height:140,background:p.gradient,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <span style={{fontSize:"44px"}}>{p.emoji}</span>
        <div style={{position:"absolute",top:10,left:10}}><span style={{background:typeColor(p.type),color:C.white,fontSize:"10px",fontWeight:700,padding:"3px 9px",borderRadius:"20px",textTransform:"uppercase",fontFamily:F}}>{p.type}</span></div>
        <div style={{position:"absolute",top:10,right:10,display:"flex",gap:"4px"}}>
          <button onClick={shareWA} style={{background:"#25D366",border:"none",color:C.white,width:26,height:26,borderRadius:"50%",cursor:"pointer",fontSize:"12px",display:"flex",alignItems:"center",justifyContent:"center"}}>📲</button>
          <span style={{background:"rgba(255,255,255,0.2)",backdropFilter:"blur(8px)",color:C.white,fontSize:"10px",fontWeight:700,padding:"3px 7px",borderRadius:"20px",fontFamily:F}}>{countryFlag(p.country)} {p.country}</span>
        </div>
        {p.verified&&<div style={{position:"absolute",bottom:10,left:10}}><span style={{background:C.successBg,color:C.success,fontSize:"10px",fontWeight:700,padding:"3px 9px",borderRadius:"20px",fontFamily:F}}>✓ Vérifié</span></div>}
        {p.demo&&<div style={{position:"absolute",bottom:10,right:10}}><span style={{background:"rgba(0,0,0,0.5)",color:"rgba(255,255,255,0.8)",fontSize:"9px",fontWeight:700,padding:"2px 7px",borderRadius:"20px",fontFamily:F}}>Démo</span></div>}
      </div>
      <div style={{padding:"14px"}}>
        <h3 style={{margin:"0 0 4px",fontSize:"14px",fontWeight:700,color:C.dark,fontFamily:"'Playfair Display',serif",lineHeight:1.3}}>{p.title}</h3>
        <p style={{margin:"0 0 6px",fontSize:"11px",color:C.muted,fontFamily:F}}>📍 {p.neighborhood}, {p.city}</p>
        <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"8px"}}>
          {p.tags?.slice(0,2).map(t=><span key={t} style={{background:C.light,color:C.earth,fontSize:"10px",padding:"2px 7px",borderRadius:"5px",fontWeight:600,fontFamily:F}}>{t}</span>)}
        </div>
        <div style={{display:"flex",gap:"10px",borderTop:`1px solid ${C.sand}`,paddingTop:"8px",marginBottom:"6px",flexWrap:"wrap"}}>
          {p.rooms&&<span style={{fontSize:"11px",color:C.muted,fontFamily:F}}>🛏 {p.rooms} pièces</span>}
          {p.surface&&<span style={{fontSize:"11px",color:C.muted,fontFamily:F}}>📐 {new Intl.NumberFormat("fr-FR").format(p.surface)} m²</span>}
          {p.bathrooms&&<span style={{fontSize:"11px",color:C.muted,fontFamily:F}}>🚿 {p.bathrooms}</span>}
        </div>
        <div style={{fontSize:"15px",fontWeight:700,color:C.terra,fontFamily:F}}>{fmtXOF(p.price)}</div>
        <div style={{fontSize:"11px",color:C.muted,fontFamily:F}}>≈ {fmtEUR(p.price_eur)}</div>
      </div>
    </div>
  );
}

// ─── PROPERTY MODAL ───────────────────────────────
function PropertyModal({ p, onClose }) {
  if (!p) return null;
  const shareWA = () => {
    const txt = `🏠 ${p.title}\n📍 ${p.neighborhood}, ${p.city}, ${p.country}\n💰 ${fmtEUR(p.price_eur)}\n🌍 DiasporaImmo`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"24px",maxWidth:"520px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 40px 100px rgba(0,0,0,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{height:180,background:p.gradient,borderRadius:"24px 24px 0 0",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
          <span style={{fontSize:"60px"}}>{p.emoji}</span>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.2)",border:"none",color:C.white,width:34,height:34,borderRadius:"50%",cursor:"pointer",fontSize:"16px"}}>✕</button>
          <div style={{position:"absolute",bottom:12,left:12,display:"flex",gap:8}}>
            <span style={{background:typeColor(p.type),color:C.white,fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"20px",textTransform:"uppercase",fontFamily:F}}>{p.type}</span>
            {p.verified&&<span style={{background:C.successBg,color:C.success,fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"20px",fontFamily:F}}>✓ Vérifié</span>}
          </div>
        </div>
        <div style={{padding:"20px"}}>
          {p.demo&&<div style={{background:"#FFF8E1",border:"1px solid #FFD54F",borderRadius:"10px",padding:"8px 12px",marginBottom:"14px",fontSize:"12px",color:"#5D4037",fontFamily:F}}>ℹ️ Annonce de démonstration — <strong>publiez la vôtre gratuitement</strong></div>}
          <h2 style={{margin:"0 0 4px",fontFamily:"'Playfair Display',serif",fontSize:"19px",fontWeight:800,color:C.dark}}>{p.title}</h2>
          <p style={{margin:"0 0 12px",color:C.muted,fontSize:"12px",fontFamily:F}}>📍 {p.neighborhood}, {p.city} — {countryFlag(p.country)} {p.country}</p>
          <p style={{margin:"0 0 16px",color:C.dark,fontSize:"13px",lineHeight:1.6,fontFamily:F}}>{p.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
            {[["Surface",p.surface?new Intl.NumberFormat("fr-FR").format(p.surface)+" m²":"—"],["Pièces",p.rooms||"—"],["Salles de bain",p.bathrooms||"—"],["Pays",countryFlag(p.country)+" "+p.country]].map(([l,v])=>(
              <div key={l} style={{background:C.light,borderRadius:"10px",padding:"10px"}}>
                <div style={{fontSize:"10px",color:C.muted,marginBottom:"2px",fontFamily:F}}>{l}</div>
                <div style={{fontSize:"14px",fontWeight:700,color:C.dark,fontFamily:F}}>{v}</div>
              </div>
            ))}
          </div>
          {p.features?.length>0&&(
            <div style={{marginBottom:"16px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:C.dark,marginBottom:"8px",fontFamily:F}}>Équipements</div>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                {p.features.map(f=><span key={f} style={{background:C.successBg,color:C.success,fontSize:"11px",padding:"3px 10px",borderRadius:"20px",fontWeight:600,fontFamily:F}}>✓ {f}</span>)}
              </div>
            </div>
          )}
          <div style={{background:`linear-gradient(135deg,${C.terra}15,${C.gold}15)`,borderRadius:"12px",padding:"14px",marginBottom:"16px",border:`1px solid ${C.terra}25`}}>
            <div style={{fontSize:"20px",fontWeight:700,color:C.terra,fontFamily:F}}>{fmtXOF(p.price)}</div>
            <div style={{fontSize:"12px",color:C.muted,fontFamily:F}}>≈ {fmtEUR(p.price_eur)}</div>
          </div>
          <div style={{background:C.light,borderRadius:"12px",padding:"12px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:p.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontWeight:700,fontSize:"13px",fontFamily:F}}>
              {p.agent_name?.split(" ").map(w=>w[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{fontSize:"13px",fontWeight:700,color:C.dark,fontFamily:F}}>{p.agent_name}</div>
              <div style={{fontSize:"11px",color:C.muted,fontFamily:F}}>Agent certifié DiasporaImmo</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
            <button style={{background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"12px",fontWeight:700,fontSize:"12px",cursor:"pointer",fontFamily:F}}>📞 Contacter</button>
            <button style={{background:"transparent",color:C.terra,border:`2px solid ${C.terra}`,borderRadius:"10px",padding:"12px",fontWeight:700,fontSize:"12px",cursor:"pointer",fontFamily:F}}>🔖 Sauvegarder</button>
            <button onClick={shareWA} style={{background:"#25D366",color:C.white,border:"none",borderRadius:"10px",padding:"12px",fontWeight:700,fontSize:"12px",cursor:"pointer",fontFamily:F}}>📲 WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OSMap({ properties, onSelect, selectedId }) {
  const [hov, setHov] = useState(null);
  const regions = {"Afrique de l'Ouest":COUNTRIES.filter(c=>c.region==="Ouest"),"Afrique Centrale":COUNTRIES.filter(c=>c.region==="Centrale")};
  const regionCoords = {"Afrique de l'Ouest":{top:"18%",left:"10%"},"Afrique Centrale":{top:"36%",left:"40%"}};
  const propsByCountry = {};
  properties.forEach(p=>{if(!propsByCountry[p.country])propsByCountry[p.country]=[];propsByCountry[p.country].push(p);});
  return (
    <div style={{width:"100%",height:"100%",background:"#B8D4E8",borderRadius:"inherit",position:"relative",overflow:"hidden"}}>
      <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-20%2C-5%2C25%2C20&layer=mapnik" style={{width:"100%",height:"100%",border:"none",opacity:0.65}} title="Carte Afrique"/>
      {Object.entries(regions).map(([region,countries])=>{
        const pos=regionCoords[region];
        const hasProps=countries.some(c=>propsByCountry[c.name]?.length>0);
        if(!hasProps)return null;
        return(
          <div key={region} style={{position:"absolute",...pos,maxWidth:"220px"}}>
            <div style={{fontSize:"10px",fontWeight:800,color:C.white,background:"rgba(0,0,0,0.4)",padding:"2px 8px",borderRadius:"10px",marginBottom:"6px",backdropFilter:"blur(4px)",fontFamily:F}}>{region}</div>
            <div style={{display:"flex",flexDirection:"column",gap:"3px",maxHeight:"200px",overflowY:"auto"}}>
              {countries.map(c=>{
                const props=propsByCountry[c.name]||[];
                if(!props.length)return null;
                return(
                  <div key={c.name}>
                    <div style={{background:"rgba(0,0,0,0.5)",color:C.white,fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"8px",marginBottom:"2px",backdropFilter:"blur(4px)",display:"inline-flex",alignItems:"center",gap:"4px",fontFamily:F}}>
                      {c.flag} {c.name} <span style={{background:"rgba(255,255,255,0.2)",borderRadius:"8px",padding:"0 4px"}}>{props.length}</span>
                    </div>
                    {props.slice(0,2).map(p=>(
                      <div key={p.id} onClick={()=>onSelect(p)} onMouseEnter={()=>setHov(p.id)} onMouseLeave={()=>setHov(null)}
                        style={{background:p.id===selectedId?C.dark:hov===p.id?C.terra:"rgba(255,255,255,0.92)",color:p.id===selectedId||hov===p.id?C.white:C.dark,fontSize:"10px",fontWeight:700,padding:"3px 8px",borderRadius:"8px",cursor:"pointer",transition:"all 0.2s",marginBottom:"2px",display:"flex",alignItems:"center",gap:"4px",whiteSpace:"nowrap",fontFamily:F}}>
                        <span>{p.emoji}</span>
                        <span style={{maxWidth:"80px",overflow:"hidden",textOverflow:"ellipsis"}}>{p.neighborhood}</span>
                        <span style={{opacity:0.8}}>· {fmtEUR(p.price_eur)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{position:"absolute",bottom:8,right:8,background:"rgba(255,255,255,0.9)",borderRadius:"8px",padding:"4px 8px",fontSize:"10px",fontWeight:700,color:C.dark,fontFamily:F}}>🌍 {COUNTRIES.length} pays · {properties.length} biens</div>
    </div>
  );
}

function ComingSoon({ title, desc }) {
  return (
    <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestMid})`,borderRadius:"20px",padding:"40px 24px",textAlign:"center",margin:"20px 0"}}>
      <div style={{fontSize:"48px",marginBottom:"14px"}}>🚀</div>
      <h2 style={{margin:"0 0 10px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"22px"}}>{title}</h2>
      <p style={{color:"rgba(255,255,255,0.75)",fontSize:"14px",margin:"0 0 20px",fontFamily:F}}>{desc}</p>
      <div style={{display:"inline-block",background:`${C.gold}30`,border:`1px solid ${C.gold}60`,borderRadius:"20px",padding:"8px 20px"}}>
        <span style={{color:C.gold,fontSize:"13px",fontWeight:700,fontFamily:F}}>⏳ En cours de développement</span>
      </div>
    </div>
  );
}

function TontineCard({ t }) {
  const pct=Math.round((t.members_count/t.max_members)*100);
  const color=t.country==="Cameroun"?C.cameroun:t.country==="Côte d'Ivoire"?C.gold:C.terra;
  return (
    <div style={{background:C.white,borderRadius:"16px",padding:"18px",boxShadow:"0 4px 20px rgba(0,0,0,0.07)",opacity:0.75,position:"relative"}}>
      <div style={{position:"absolute",top:10,right:10}}><span style={{background:"#FFF8E1",color:"#5D4037",fontSize:"10px",fontWeight:700,padding:"3px 9px",borderRadius:"20px",fontFamily:F}}>⏳ Bientôt</span></div>
      <h3 style={{margin:"0 0 3px",fontSize:"15px",fontWeight:700,fontFamily:"'Playfair Display',serif",color:C.dark}}>{t.name}</h3>
      <p style={{margin:"0 0 10px",fontSize:"11px",color:C.muted,fontFamily:F}}>🎯 {t.goal} · {countryFlag(t.country)}</p>
      <div style={{marginBottom:"10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
          <span style={{fontSize:"11px",color:C.muted,fontFamily:F}}>👥 {t.members_count}/{t.max_members}</span>
          <span style={{fontSize:"11px",fontWeight:700,color:C.dark,fontFamily:F}}>{pct}%</span>
        </div>
        <div style={{background:C.light,borderRadius:"8px",height:"7px",overflow:"hidden"}}>
          <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color},${C.gold})`,borderRadius:"8px"}}/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px"}}>
        {[[fmtEUR(t.monthly_amount)+"/mois","Cotisation"],[fmtEUR(t.monthly_amount*t.max_members),"Cagnotte"],[t.cycle_months+" mois","Durée"]].map(([v,l])=>(
          <div key={l} style={{background:C.light,borderRadius:"8px",padding:"8px",textAlign:"center"}}>
            <div style={{fontSize:"11px",fontWeight:700,color,fontFamily:F}}>{v}</div>
            <div style={{fontSize:"10px",color:C.muted,fontFamily:F}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("accueil");
  const [user, setUser] = useState(null);
  const [selectedProp, setSelectedProp] = useState(null);
  const [filterCountry, setFilterCountry] = useState("Tous");
  const [filterType, setFilterType] = useState("Tous");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterSurfaceMin, setFilterSurfaceMin] = useState("");
  const [filterSurfaceMax, setFilterSurfaceMax] = useState("");
  const [filterRooms, setFilterRooms] = useState("Tous");
  const [filterEquipements, setFilterEquipements] = useState([]);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterRegion, setFilterRegion] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");
  const [search, setSearch] = useState("");
  const [mapSelected, setMapSelected] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [animIn, setAnimIn] = useState(true);

  const types = ["Tous","Vente","Location","Terrain","Agricole","Commercial"];
  const rooms = ["Tous","1+","2+","3+","4+","5+"];
  const regions = ["Tous","Afrique de l'Ouest","Afrique Centrale"];
  const sorts = [{id:"recent",label:"Plus récent"},{id:"price_asc",label:"Prix ↑"},{id:"price_desc",label:"Prix ↓"},{id:"surface_asc",label:"Surface ↑"},{id:"surface_desc",label:"Surface ↓"}];

  const toggleEquipement = eq => setFilterEquipements(prev=>prev.includes(eq)?prev.filter(e=>e!==eq):[...prev,eq]);

  const resetFilters = () => {
    setFilterCountry("Tous"); setFilterType("Tous"); setFilterRegion("Tous");
    setFilterPriceMin(""); setFilterPriceMax(""); setFilterSurfaceMin(""); setFilterSurfaceMax("");
    setFilterRooms("Tous"); setFilterEquipements([]); setFilterVerified(false); setSortBy("recent"); setSearch("");
  };

  const activeFiltersCount = [filterCountry!=="Tous",filterType!=="Tous",filterRegion!=="Tous",filterPriceMin,filterPriceMax,filterSurfaceMin,filterSurfaceMax,filterRooms!=="Tous",filterEquipements.length>0,filterVerified].filter(Boolean).length;

  const filteredCountries = filterRegion==="Tous"?COUNTRIES:COUNTRIES.filter(c=>c.region===(filterRegion==="Afrique de l'Ouest"?"Ouest":"Centrale"));

  let filtered = PROPERTIES.filter(p=>{
    const mc=filterCountry==="Tous"||p.country===filterCountry;
    const mr=filterRegion==="Tous"||filteredCountries.map(c=>c.name).includes(p.country);
    const mt=filterType==="Tous"||p.type===filterType;
    const ms=!search||p.title.toLowerCase().includes(search.toLowerCase())||p.city?.toLowerCase().includes(search.toLowerCase())||p.country?.toLowerCase().includes(search.toLowerCase())||p.neighborhood?.toLowerCase().includes(search.toLowerCase());
    const mpMin=!filterPriceMin||p.price_eur>=parseInt(filterPriceMin);
    const mpMax=!filterPriceMax||p.price_eur<=parseInt(filterPriceMax);
    const msMin=!filterSurfaceMin||!p.surface||(p.surface>=parseInt(filterSurfaceMin));
    const msMax=!filterSurfaceMax||!p.surface||(p.surface<=parseInt(filterSurfaceMax));
    const mrm=filterRooms==="Tous"||!p.rooms||(p.rooms>=parseInt(filterRooms));
    const meq=filterEquipements.length===0||filterEquipements.every(eq=>p.features?.includes(eq));
    const mv=!filterVerified||p.verified;
    return mc&&mr&&mt&&ms&&mpMin&&mpMax&&msMin&&msMax&&mrm&&meq&&mv;
  });

  filtered=[...filtered].sort((a,b)=>sortBy==="price_asc"?a.price_eur-b.price_eur:sortBy==="price_desc"?b.price_eur-a.price_eur:sortBy==="surface_asc"?(a.surface||0)-(b.surface||0):sortBy==="surface_desc"?(b.surface||0)-(a.surface||0):b.id-a.id);

  const switchTab = t=>{setAnimIn(false);setTimeout(()=>{setTab(t);setAnimIn(true);},150);};
  const westCountries = COUNTRIES.filter(c=>c.region==="Ouest");
  const centralCountries = COUNTRIES.filter(c=>c.region==="Centrale");

  const NAV=[{id:"accueil",icon:"🏠",label:"Accueil"},{id:"biens",icon:"🔍",label:"Biens"},{id:"tontine",icon:"🤝",label:"Tontine"},{id:"services",icon:"⭐",label:"Services"},{id:"compte",icon:"👤",label:"Compte"}];

  return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:F}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>

      <header style={{background:C.forest,position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:"58px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"22px"}}>🌍</span>
            <div>
              <div style={{fontSize:"17px",fontWeight:800,color:C.gold,fontFamily:"'Playfair Display',serif",lineHeight:1}}>DiasporaImmo</div>
              <div style={{fontSize:"9px",color:C.sand,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:F}}>16 pays · Afrique francophone</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <nav style={{display:"flex",gap:"3px"}}>
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>switchTab(n.id)} style={{background:tab===n.id?C.terra:"transparent",border:"none",color:C.white,padding:"7px 12px",borderRadius:"10px",cursor:"pointer",fontWeight:tab===n.id?700:400,fontSize:"12px",transition:"all 0.2s",fontFamily:F}}>
                  <span>{n.icon}</span>
                </button>
              ))}
            </nav>
            {user?(
              <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,255,255,0.1)",borderRadius:"20px",padding:"4px 12px 4px 4px",cursor:"pointer"}} onClick={()=>switchTab("compte")}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.terra},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:700,color:C.white,fontFamily:F}}>
                  {user.name?.slice(0,2).toUpperCase()}
                </div>
                <span style={{fontSize:"12px",color:C.white,fontWeight:600,fontFamily:F,maxWidth:"80px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</span>
              </div>
            ):(
              <button onClick={()=>setShowLogin(true)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"7px 14px",fontWeight:700,fontSize:"12px",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Connexion</button>
            )}
          </div>
        </div>
      </header>

      <main style={{maxWidth:"1200px",margin:"0 auto",padding:"0 20px 80px",opacity:animIn?1:0,transform:animIn?"translateY(0)":"translateY(8px)",transition:"all 0.25s ease"}}>

        {tab==="accueil"&&(
          <div>
            <div style={{background:`linear-gradient(135deg,${C.forest} 0%,${C.forestMid} 50%,${C.terra} 100%)`,borderRadius:"0 0 28px 28px",padding:"36px 24px 28px",marginBottom:"20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",backgroundSize:"18px 18px"}}/>
              <div style={{position:"relative"}}>
                <div style={{display:"inline-block",background:`${C.gold}30`,border:`1px solid ${C.gold}50`,borderRadius:"20px",padding:"5px 14px",marginBottom:"12px"}}>
                  <span style={{color:C.gold,fontSize:"11px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:F}}>16 pays · Afrique francophone</span>
                </div>
                <h1 style={{margin:"0 0 10px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,5vw,40px)",fontWeight:800,lineHeight:1.15}}>
                  Votre patrimoine<br/><span style={{color:C.gold}}>en Afrique</span>,<br/>depuis la France
                </h1>
                <p style={{color:"rgba(255,255,255,0.8)",fontSize:"14px",marginBottom:"20px",fontFamily:F}}>+4 millions de diaspora francophone</p>
                <div style={{background:C.white,borderRadius:"14px",padding:"6px 6px 6px 14px",display:"flex",gap:"8px",alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
                  <span>🔍</span>
                  <input type="text" placeholder="Pays, ville, quartier, type de bien..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,border:"none",outline:"none",fontSize:"14px",color:C.dark,background:"transparent",fontFamily:F}}/>
                  <button onClick={()=>switchTab("biens")} style={{background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"10px 16px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>Chercher</button>
                </div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"20px"}}>
              {[[PROPERTIES.length+"+","Biens"],["16","Pays"],["🤝","Tontines"],["+4M","Diaspora"]].map(([v,l])=>(
                <div key={l} style={{background:C.white,borderRadius:"12px",padding:"12px",textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
                  <div style={{fontSize:"16px",fontWeight:800,color:C.terra,fontFamily:F}}>{v}</div>
                  <div style={{fontSize:"10px",color:C.muted,fontFamily:F}}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{background:C.white,borderRadius:"16px",padding:"16px",marginBottom:"20px",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
              <h3 style={{margin:"0 0 12px",fontFamily:"'Playfair Display',serif",fontSize:"16px",fontWeight:700,color:C.dark}}>🌍 16 pays couverts</h3>
              {[{label:"Afrique de l'Ouest",list:westCountries,hoverColor:C.terra},{label:"Afrique Centrale",list:centralCountries,hoverColor:C.cameroun}].map(({label,list,hoverColor})=>(
                <div key={label} style={{marginBottom:"10px"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:C.muted,marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:F}}>{label}</div>
                  <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                    {list.map(c=>(
                      <button key={c.name} onClick={()=>{setFilterCountry(c.name);switchTab("biens");}} style={{background:C.light,border:"none",borderRadius:"20px",padding:"4px 10px",fontSize:"11px",fontWeight:600,cursor:"pointer",color:C.dark,transition:"all 0.2s",fontFamily:F,display:"flex",alignItems:"center",gap:"3px"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=hoverColor;e.currentTarget.style.color=C.white;}}
                        onMouseLeave={e=>{e.currentTarget.style.background=C.light;e.currentTarget.style.color=C.dark;}}>
                        {c.flag} {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginBottom:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:C.dark,margin:0}}>🗺️ Biens sur la carte</h2>
                <button onClick={()=>setShowMap(!showMap)} style={{background:showMap?C.terra:C.light,color:showMap?C.white:C.dark,border:"none",borderRadius:"10px",padding:"7px 14px",fontWeight:700,fontSize:"12px",cursor:"pointer",fontFamily:F}}>{showMap?"Masquer":"Afficher"}</button>
              </div>
              {showMap&&(
                <div style={{height:"340px",borderRadius:"16px",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",border:`1px solid ${C.sand}`}}>
                  <OSMap properties={PROPERTIES} onSelect={p=>{setMapSelected(p);setSelectedProp(p);}} selectedId={mapSelected?.id}/>
                </div>
              )}
              {showMap&&mapSelected&&<div style={{marginTop:"10px"}}><PropertyCard p={mapSelected} onClick={setSelectedProp} compact/></div>}
            </div>

            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:C.dark,margin:"0 0 12px"}}>Coups de cœur</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"14px",marginBottom:"24px"}}>
              {PROPERTIES.slice(0,3).map(p=><PropertyCard key={p.id} p={p} onClick={setSelectedProp}/>)}
            </div>

            {!user&&(
              <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestMid})`,borderRadius:"18px",padding:"22px",marginBottom:"16px",display:"flex",gap:"16px",alignItems:"center",flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <h3 style={{margin:"0 0 4px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"16px"}}>Créez votre espace investisseur</h3>
                  <p style={{margin:0,color:"rgba(255,255,255,0.75)",fontSize:"12px",fontFamily:F}}>Sauvegardez vos biens favoris, créez des alertes, suivez vos annonces.</p>
                </div>
                <button onClick={()=>setShowLogin(true)} style={{background:C.gold,color:C.white,border:"none",borderRadius:"10px",padding:"10px 18px",fontWeight:700,fontSize:"13px",cursor:"pointer",whiteSpace:"nowrap",fontFamily:F}}>Connexion gratuite →</button>
              </div>
            )}

            <div style={{background:`linear-gradient(135deg,${C.terra},${C.gold})`,borderRadius:"18px",padding:"22px"}}>
              <h3 style={{margin:"0 0 6px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"16px"}}>Vous avez un bien à vendre ou à louer ?</h3>
              <p style={{color:"rgba(255,255,255,0.85)",margin:"0 0 14px",fontSize:"12px",fontFamily:F}}>Particulier ou professionnel — publiez gratuitement et touchez +4 millions de diaspora.</p>
              <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                <button onClick={()=>setShowPartner(true)} style={{background:C.white,color:C.terra,border:"none",borderRadius:"10px",padding:"10px 16px",fontWeight:800,fontSize:"13px",cursor:"pointer",fontFamily:F}}>👤 Particulier</button>
                <button onClick={()=>setShowPartner(true)} style={{background:"rgba(255,255,255,0.2)",color:C.white,border:"2px solid rgba(255,255,255,0.5)",borderRadius:"10px",padding:"10px 16px",fontWeight:800,fontSize:"13px",cursor:"pointer",fontFamily:F}}>🏢 Professionnel</button>
              </div>
            </div>
          </div>
        )}

        {tab==="biens"&&(
          <div style={{paddingTop:"20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"10px"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:C.dark,margin:0}}>Trouver un bien</h2>
              <button onClick={()=>user?setShowAlert(true):setShowLogin(true)} style={{background:C.forest,color:C.white,border:"none",borderRadius:"10px",padding:"9px 14px",fontWeight:700,fontSize:"12px",cursor:"pointer",fontFamily:F}}>🔔 Alerte email</button>
            </div>
            <div style={{background:C.white,borderRadius:"14px",padding:"12px",marginBottom:"10px",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
              <input type="text" placeholder="🔍 Pays, ville, quartier..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",border:`1.5px solid ${C.sand}`,borderRadius:"9px",padding:"9px 14px",fontSize:"13px",outline:"none",color:C.dark,boxSizing:"border-box",marginBottom:"10px",fontFamily:F}}/>
              <div style={{marginBottom:"8px"}}>
                <div style={{fontSize:"11px",fontWeight:700,color:C.muted,marginBottom:"5px",fontFamily:F}}>RÉGION</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {regions.map(r=><button key={r} onClick={()=>setFilterRegion(r)} style={{background:filterRegion===r?C.forest:C.light,color:filterRegion===r?C.white:C.dark,border:"none",borderRadius:"8px",padding:"5px 10px",fontWeight:600,fontSize:"12px",cursor:"pointer",transition:"all 0.2s",fontFamily:F}}>{r}</button>)}
                </div>
              </div>
              <div style={{marginBottom:"8px"}}>
                <div style={{fontSize:"11px",fontWeight:700,color:C.muted,marginBottom:"5px",fontFamily:F}}>PAYS</div>
                <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                  <button onClick={()=>setFilterCountry("Tous")} style={{background:filterCountry==="Tous"?C.forest:C.light,color:filterCountry==="Tous"?C.white:C.dark,border:"none",borderRadius:"8px",padding:"5px 10px",fontWeight:600,fontSize:"11px",cursor:"pointer",fontFamily:F}}>Tous</button>
                  {filteredCountries.map(c=><button key={c.name} onClick={()=>setFilterCountry(c.name)} style={{background:filterCountry===c.name?C.terra:C.light,color:filterCountry===c.name?C.white:C.dark,border:"none",borderRadius:"8px",padding:"5px 10px",fontWeight:600,fontSize:"11px",cursor:"pointer",transition:"all 0.2s",fontFamily:F}}>{c.flag} {c.name}</button>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:"11px",fontWeight:700,color:C.muted,marginBottom:"5px",fontFamily:F}}>TYPE</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {types.map(t=><button key={t} onClick={()=>setFilterType(t)} style={{background:filterType===t?C.terra:C.light,color:filterType===t?C.white:C.dark,border:"none",borderRadius:"8px",padding:"5px 10px",fontWeight:600,fontSize:"12px",cursor:"pointer",transition:"all 0.2s",fontFamily:F}}>{t}</button>)}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:"8px",marginBottom:"10px",alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={()=>setShowFilters(!showFilters)} style={{background:showFilters?C.terra:C.light,color:showFilters?C.white:C.dark,border:"none",borderRadius:"9px",padding:"7px 14px",fontWeight:700,fontSize:"12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px",fontFamily:F}}>
                ⚙️ Filtres avancés {activeFiltersCount>0&&<span style={{background:showFilters?"rgba(255,255,255,0.3)":C.terra,color:C.white,borderRadius:"10px",padding:"0 6px",fontSize:"11px"}}>{activeFiltersCount}</span>}
              </button>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:`1.5px solid ${C.sand}`,borderRadius:"9px",padding:"7px 10px",fontSize:"12px",color:C.dark,fontFamily:F,fontWeight:600,cursor:"pointer"}}>
                {sorts.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={()=>setShowMap(!showMap)} style={{background:showMap?C.terra:C.light,color:showMap?C.white:C.dark,border:"none",borderRadius:"9px",padding:"7px 12px",fontWeight:700,fontSize:"12px",cursor:"pointer",fontFamily:F}}>🗺️ {showMap?"Masquer":"Carte"}</button>
              {activeFiltersCount>0&&<button onClick={resetFilters} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:"9px",padding:"7px 12px",fontSize:"12px",fontWeight:700,cursor:"pointer",fontFamily:F}}>✕ Réinitialiser ({activeFiltersCount})</button>}
            </div>
            {showFilters&&(
              <div style={{background:C.white,borderRadius:"14px",padding:"16px",marginBottom:"10px",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"14px",marginBottom:"14px"}}>
                  <div>
                    <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"6px",fontFamily:F}}>💰 Budget (€)</label>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      <input type="number" placeholder="Min" value={filterPriceMin} onChange={e=>setFilterPriceMin(e.target.value)} style={{flex:1,border:`1.5px solid ${C.sand}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",outline:"none",color:C.dark,fontFamily:F}}/>
                      <span style={{color:C.muted}}>→</span>
                      <input type="number" placeholder="Max" value={filterPriceMax} onChange={e=>setFilterPriceMax(e.target.value)} style={{flex:1,border:`1.5px solid ${C.sand}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",outline:"none",color:C.dark,fontFamily:F}}/>
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"6px",fontFamily:F}}>📐 Surface (m²)</label>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      <input type="number" placeholder="Min" value={filterSurfaceMin} onChange={e=>setFilterSurfaceMin(e.target.value)} style={{flex:1,border:`1.5px solid ${C.sand}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",outline:"none",color:C.dark,fontFamily:F}}/>
                      <span style={{color:C.muted}}>→</span>
                      <input type="number" placeholder="Max" value={filterSurfaceMax} onChange={e=>setFilterSurfaceMax(e.target.value)} style={{flex:1,border:`1.5px solid ${C.sand}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",outline:"none",color:C.dark,fontFamily:F}}/>
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"6px",fontFamily:F}}>🛏 Pièces</label>
                    <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                      {rooms.map(r=><button key={r} onClick={()=>setFilterRooms(r)} style={{background:filterRooms===r?C.terra:C.light,color:filterRooms===r?C.white:C.dark,border:"none",borderRadius:"7px",padding:"6px 10px",fontWeight:600,fontSize:"12px",cursor:"pointer",fontFamily:F}}>{r}</button>)}
                    </div>
                  </div>
                </div>
                <div style={{marginBottom:"12px"}}>
                  <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"8px",fontFamily:F}}>✨ Équipements</label>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {EQUIPEMENTS.map(eq=><button key={eq} onClick={()=>toggleEquipement(eq)} style={{background:filterEquipements.includes(eq)?C.terra:C.light,color:filterEquipements.includes(eq)?C.white:C.dark,border:"none",borderRadius:"20px",padding:"5px 12px",fontWeight:600,fontSize:"12px",cursor:"pointer",transition:"all 0.2s",fontFamily:F}}>{filterEquipements.includes(eq)?"✓ ":""}{eq}</button>)}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <button onClick={()=>setFilterVerified(!filterVerified)} style={{width:20,height:20,borderRadius:"4px",border:`2px solid ${filterVerified?C.terra:C.sand}`,background:filterVerified?C.terra:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontSize:"12px"}}>{filterVerified?"✓":""}</button>
                  <span style={{fontSize:"13px",color:C.dark,fontWeight:600,cursor:"pointer",fontFamily:F}} onClick={()=>setFilterVerified(!filterVerified)}>Biens vérifiés uniquement</span>
                </div>
              </div>
            )}
            {showMap&&(
              <div style={{marginBottom:"14px"}}>
                <div style={{height:"300px",borderRadius:"16px",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",border:`1px solid ${C.sand}`,marginBottom:"10px"}}>
                  <OSMap properties={filtered} onSelect={p=>{setMapSelected(p);setSelectedProp(p);}} selectedId={mapSelected?.id}/>
                </div>
                {mapSelected&&<PropertyCard p={mapSelected} onClick={setSelectedProp} compact/>}
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <p style={{color:C.muted,fontSize:"12px",margin:0,fontFamily:F}}>{filtered.length} bien{filtered.length>1?"s":""} trouvé{filtered.length>1?"s":""}</p>
              <button onClick={()=>user?setShowAlert(true):setShowLogin(true)} style={{background:`${C.forest}15`,color:C.forest,border:`1px solid ${C.forest}30`,borderRadius:"8px",padding:"5px 10px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:F}}>🔔 Alerte pour cette recherche</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:"14px"}}>
              {filtered.map(p=><PropertyCard key={p.id} p={p} onClick={setSelectedProp}/>)}
              {filtered.length===0&&(
                <div style={{textAlign:"center",padding:"50px 20px",color:C.muted,gridColumn:"1/-1"}}>
                  <div style={{fontSize:"36px",marginBottom:"8px"}}>🔍</div>
                  <p style={{fontFamily:F}}>Aucun bien ne correspond à votre recherche.</p>
                  <button onClick={()=>user?setShowAlert(true):setShowLogin(true)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"10px 20px",fontWeight:700,fontSize:"13px",cursor:"pointer",marginTop:"10px",fontFamily:F}}>🔔 Créer une alerte</button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab==="tontine"&&(
          <div style={{paddingTop:"20px"}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:C.dark,margin:"0 0 4px"}}>Tontines DiasporaImmo</h2>
            <p style={{color:C.muted,fontSize:"13px",margin:"0 0 4px",fontFamily:F}}>Épargne collective · Virements directs entre membres</p>
            <ComingSoon title="La Tontine Digitale arrive bientôt" desc="Système d'épargne collective sécurisé pour la diaspora africaine francophone. Inscrivez-vous pour être notifié en avant-première."/>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"17px",fontWeight:700,color:C.dark,margin:"24px 0 12px"}}>Aperçu des tontines prévues</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:"14px"}}>
              {TONTINES.map(t=><TontineCard key={t.id} t={t}/>)}
            </div>
          </div>
        )}

        {tab==="services"&&(
          <div style={{paddingTop:"20px"}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:C.dark,margin:"0 0 6px"}}>Nos services</h2>
            <ComingSoon title="Nos services arrivent bientôt" desc="Accompagnement juridique, transfert d'argent, suivi de construction, gestion locative — tout est en cours de développement."/>
            <div style={{display:"grid",gap:"12px"}}>
              {[
                {icon:"⚖️",title:"Vérification juridique",desc:"Contrôle des titres fonciers, conseils notariaux dans les 16 pays.",tags:["Titre foncier","Notaire","Contrat"],g:`linear-gradient(135deg,${C.forest},#2D6A4F)`},
                {icon:"💶",title:"Transfert d'argent optimisé",desc:"Wave, Orange Money, Mobile Money selon les pays.",tags:["Wave","Orange Money","Mobile Money"],g:`linear-gradient(135deg,${C.terra},${C.gold})`},
                {icon:"🏗️",title:"Suivi de construction",desc:"Photos hebdomadaires, rapport de chantier.",tags:["Rapport hebdo","Photos","MOE"],g:`linear-gradient(135deg,${C.earth},${C.terra})`},
                {icon:"🌱",title:"Accompagnement agricole",desc:"Agronomes locaux, suivi et rentabilité.",tags:["Agronome","Suivi","Rentabilité"],g:`linear-gradient(135deg,#2C7744,${C.earth})`},
                {icon:"🏘️",title:"Gestion locative",desc:"Loyers virés en France chaque mois.",tags:["Loyers garantis","Entretien","Compta"],g:`linear-gradient(135deg,#2C2C2C,#5C4A3C)`},
                {icon:"🛫",title:"Voyage d'investissement",desc:"Séjours organisés dans 16 pays.",tags:["Sur mesure","16 pays","Sécurisé"],g:`linear-gradient(135deg,${C.gold},${C.earth})`},
              ].map(s=>(
                <div key={s.title} style={{background:C.white,borderRadius:"16px",overflow:"hidden",display:"flex",boxShadow:"0 4px 16px rgba(0,0,0,0.06)",opacity:0.8}}>
                  <div style={{width:68,flexShrink:0,background:s.g,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"}}>{s.icon}</div>
                  <div style={{padding:"14px",flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                      <h3 style={{margin:0,fontSize:"14px",fontWeight:700,color:C.dark,fontFamily:F}}>{s.title}</h3>
                      <span style={{background:"#FFF8E1",color:"#5D4037",fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"20px",fontFamily:F}}>⏳ Bientôt</span>
                    </div>
                    <p style={{margin:"0 0 8px",fontSize:"12px",color:C.muted,lineHeight:1.5,fontFamily:F}}>{s.desc}</p>
                    <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                      {s.tags.map(t=><span key={t} style={{background:C.light,color:C.earth,fontSize:"10px",padding:"2px 7px",borderRadius:"5px",fontWeight:600,fontFamily:F}}>{t}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="compte"&&(
          <div style={{paddingTop:"20px"}}>
            {!user?(
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:"48px",marginBottom:"16px"}}>👤</div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",color:C.dark,margin:"0 0 8px"}}>Votre espace personnel</h2>
                <p style={{color:C.muted,fontSize:"14px",margin:"0 0 24px",fontFamily:F}}>Connectez-vous pour accéder à vos favoris, alertes et annonces publiées.</p>
                <button onClick={()=>setShowLogin(true)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"12px",padding:"14px 32px",fontWeight:700,fontSize:"15px",cursor:"pointer",fontFamily:F,marginBottom:"12px",display:"block",width:"100%"}}>Se connecter</button>
                <button onClick={()=>setShowLogin(true)} style={{background:"transparent",color:C.terra,border:`2px solid ${C.terra}`,borderRadius:"12px",padding:"13px 32px",fontWeight:700,fontSize:"15px",cursor:"pointer",fontFamily:F,display:"block",width:"100%"}}>Créer un compte gratuit</button>
              </div>
            ):(
              <>
                <div style={{background:`linear-gradient(135deg,${C.forest},#2D6A4F)`,borderRadius:"18px",padding:"22px",marginBottom:"20px",display:"flex",alignItems:"center",gap:"14px"}}>
                  <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${C.terra},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",fontWeight:700,color:C.white,fontFamily:F}}>
                    {user.name?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{margin:"0 0 3px",color:C.white,fontFamily:"'Playfair Display',serif",fontSize:"17px"}}>{user.name}</h2>
                    <p style={{margin:"0 0 6px",color:"rgba(255,255,255,0.7)",fontSize:"11px",fontFamily:F}}>{user.email}</p>
                    <span style={{background:C.gold,color:C.white,fontSize:"10px",fontWeight:700,padding:"3px 10px",borderRadius:"20px",fontFamily:F}}>Membre DiasporaImmo</span>
                  </div>
                </div>
                <div style={{display:"grid",gap:"8px"}}>
                  {[{icon:"🔖",label:"Biens sauvegardés",value:"Aucun pour le moment"},{icon:"📩",label:"Messages agents",value:"Aucun message"},{icon:"🔔",label:"Mes alertes email",value:"Aucune alerte active"},{icon:"📋",label:"Mes annonces",value:"Publiez votre premier bien"},{icon:"🌍",label:"Pays suivis",value:"16 pays francophones"},{icon:"⚙️",label:"Paramètres",value:"Langue, notifications"}].map(item=>(
                    <div key={item.label} style={{background:C.white,borderRadius:"12px",padding:"12px 14px",display:"flex",alignItems:"center",gap:"12px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)",cursor:"pointer"}}>
                      <span style={{fontSize:"18px"}}>{item.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"13px",fontWeight:700,color:C.dark,fontFamily:F}}>{item.label}</div>
                        <div style={{fontSize:"11px",color:C.muted,fontFamily:F}}>{item.value}</div>
                      </div>
                      <span style={{color:C.terra,fontWeight:700,fontSize:"12px"}}>→</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setShowPartner(true)} style={{width:"100%",marginTop:"16px",background:`linear-gradient(135deg,${C.terra},${C.gold})`,border:"none",color:C.white,borderRadius:"12px",padding:"14px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>+ Publier une annonce gratuitement</button>
                <button onClick={()=>setUser(null)} style={{width:"100%",marginTop:"10px",background:"transparent",border:`2px solid ${C.terra}`,color:C.terra,borderRadius:"12px",padding:"12px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>Se déconnecter</button>
              </>
            )}
          </div>
        )}
      </main>

      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:C.white,borderTop:`1px solid ${C.sand}`,display:"flex",zIndex:99,boxShadow:"0 -4px 20px rgba(0,0,0,0.08)"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>switchTab(n.id)} style={{flex:1,background:"none",border:"none",padding:"9px 4px 7px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
            <span style={{fontSize:"20px"}}>{n.icon}</span>
            <span style={{fontSize:"10px",fontWeight:tab===n.id?700:400,color:tab===n.id?C.terra:C.muted,fontFamily:F}}>{n.label}</span>
          </button>
        ))}
      </nav>

      <PropertyModal p={selectedProp} onClose={()=>setSelectedProp(null)}/>
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)} onLogin={u=>setUser(u)}/>}
      {showAlert&&<AlertModal onClose={()=>setShowAlert(false)} filters={{country:filterCountry,region:filterRegion,type:filterType,priceMax:filterPriceMax,search}} user={user}/>}
      {showPartner&&<PartnerModal onClose={()=>setShowPartner(false)} user={user}/>}
    </div>
  );
}
