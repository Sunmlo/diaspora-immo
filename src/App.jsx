import { useState, useRef, useEffect } from "react";

const C = {
  // Charte Sokilé (identique à la page Qui sommes-nous)
  terra: "#B85C3A", gold: "#C9A84C", earth: "#8B5E3C",
  forest: "#1A3C2E", forestMid: "#2D5E45", forestDark: "#0D2019",
  cream: "#F5F0E8", light: "#FFFFFF", sand: "#E8DFD0",
  dark: "#1C1A17", muted: "#7A7264", sub: "#8F8676", white: "#FFFFFF",
  success: "#2E7D32", successBg: "#E8F5E9",
};

const F = "'DM Sans', sans-serif";
const FT = "'Fraunces', serif";

const SUPABASE_URL = "https://nhyejaubfxjmmuvetayw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oeWVqYXViZnhqbW11dmV0YXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDIzODgsImV4cCI6MjA5NjQxODM4OH0.yIaB8nBbnBVufudtt-FsmoWPlSqOU2uYzLLQjtiTdR4";

const PHONE_CODES = [
  // Classement alphabétique par pays
  {code:"+27",label:"🇿🇦 Afrique du Sud (+27)"},{code:"+49",label:"🇩🇪 Allemagne (+49)"},
  {code:"+213",label:"🇩🇿 Algérie (+213)"},{code:"+966",label:"🇸🇦 Arabie Saoudite (+966)"},
  {code:"+54",label:"🇦🇷 Argentine (+54)"},{code:"+61",label:"🇦🇺 Australie (+61)"},
  {code:"+43",label:"🇦🇹 Autriche (+43)"},{code:"+973",label:"🇧🇭 Bahreïn (+973)"},
  {code:"+32",label:"🇧🇪 Belgique (+32)"},{code:"+229",label:"🇧🇯 Bénin (+229)"},
  {code:"+267",label:"🇧🇼 Botswana (+267)"},{code:"+55",label:"🇧🇷 Brésil (+55)"},
  {code:"+226",label:"🇧🇫 Burkina Faso (+226)"},{code:"+257",label:"🇧🇮 Burundi (+257)"},
  {code:"+237",label:"🇨🇲 Cameroun (+237)"},{code:"+1",label:"🇨🇦 Canada (+1)"},
  {code:"+238",label:"🇨🇻 Cap-Vert (+238)"},{code:"+236",label:"🇨🇫 Centrafrique (+236)"},
  {code:"+56",label:"🇨🇱 Chili (+56)"},{code:"+86",label:"🇨🇳 Chine (+86)"},
  {code:"+57",label:"🇨🇴 Colombie (+57)"},{code:"+269",label:"🇰🇲 Comores (+269)"},
  {code:"+242",label:"🇨🇬 Congo (+242)"},{code:"+82",label:"🇰🇷 Corée du Sud (+82)"},
  {code:"+225",label:"🇨🇮 Côte d'Ivoire (+225)"},{code:"+45",label:"🇩🇰 Danemark (+45)"},
  {code:"+253",label:"🇩🇯 Djibouti (+253)"},{code:"+20",label:"🇪🇬 Égypte (+20)"},
  {code:"+971",label:"🇦🇪 Émirats Arabes Unis (+971)"},{code:"+291",label:"🇪🇷 Érythrée (+291)"},
  {code:"+34",label:"🇪🇸 Espagne (+34)"},{code:"+268",label:"🇸🇿 Eswatini (+268)"},
  {code:"+251",label:"🇪🇹 Éthiopie (+251)"},{code:"+1",label:"🇺🇸 États-Unis (+1)"},
  {code:"+358",label:"🇫🇮 Finlande (+358)"},{code:"+33",label:"🇫🇷 France (+33)"},
  {code:"+241",label:"🇬🇦 Gabon (+241)"},{code:"+220",label:"🇬🇲 Gambie (+220)"},
  {code:"+233",label:"🇬🇭 Ghana (+233)"},{code:"+30",label:"🇬🇷 Grèce (+30)"},
  {code:"+224",label:"🇬🇳 Guinée (+224)"},{code:"+245",label:"🇬🇼 Guinée-Bissau (+245)"},
  {code:"+240",label:"🇬🇶 Guinée Équatoriale (+240)"},{code:"+62",label:"🇮🇩 Indonésie (+62)"},
  {code:"+353",label:"🇮🇪 Irlande (+353)"},{code:"+972",label:"🇮🇱 Israël (+972)"},
  {code:"+39",label:"🇮🇹 Italie (+39)"},{code:"+81",label:"🇯🇵 Japon (+81)"},
  {code:"+962",label:"🇯🇴 Jordanie (+962)"},{code:"+254",label:"🇰🇪 Kenya (+254)"},
  {code:"+965",label:"🇰🇼 Koweït (+965)"},{code:"+961",label:"🇱🇧 Liban (+961)"},
  {code:"+231",label:"🇱🇷 Liberia (+231)"},{code:"+218",label:"🇱🇾 Libye (+218)"},
  {code:"+266",label:"🇱🇸 Lesotho (+266)"},{code:"+352",label:"🇱🇺 Luxembourg (+352)"},
  {code:"+261",label:"🇲🇬 Madagascar (+261)"},{code:"+60",label:"🇲🇾 Malaisie (+60)"},
  {code:"+223",label:"🇲🇱 Mali (+223)"},{code:"+212",label:"🇲🇦 Maroc (+212)"},
  {code:"+230",label:"🇲🇺 Maurice (+230)"},{code:"+222",label:"🇲🇷 Mauritanie (+222)"},
  {code:"+52",label:"🇲🇽 Mexique (+52)"},{code:"+258",label:"🇲🇿 Mozambique (+258)"},
  {code:"+264",label:"🇳🇦 Namibie (+264)"},{code:"+227",label:"🇳🇪 Niger (+227)"},
  {code:"+234",label:"🇳🇬 Nigeria (+234)"},{code:"+47",label:"🇳🇴 Norvège (+47)"},
  {code:"+64",label:"🇳🇿 Nouvelle-Zélande (+64)"},{code:"+968",label:"🇴🇲 Oman (+968)"},
  {code:"+256",label:"🇺🇬 Ouganda (+256)"},{code:"+31",label:"🇳🇱 Pays-Bas (+31)"},
  {code:"+51",label:"🇵🇪 Pérou (+51)"},{code:"+63",label:"🇵🇭 Philippines (+63)"},
  {code:"+48",label:"🇵🇱 Pologne (+48)"},{code:"+351",label:"🇵🇹 Portugal (+351)"},
  {code:"+974",label:"🇶🇦 Qatar (+974)"},{code:"+243",label:"🇨🇩 RD Congo (+243)"},
  {code:"+420",label:"🇨🇿 République tchèque (+420)"},{code:"+44",label:"🇬🇧 Royaume-Uni (+44)"},
  {code:"+7",label:"🇷🇺 Russie (+7)"},{code:"+250",label:"🇷🇼 Rwanda (+250)"},
  {code:"+239",label:"🇸🇹 São Tomé (+239)"},{code:"+221",label:"🇸🇳 Sénégal (+221)"},
  {code:"+248",label:"🇸🇨 Seychelles (+248)"},{code:"+232",label:"🇸🇱 Sierra Leone (+232)"},
  {code:"+65",label:"🇸🇬 Singapour (+65)"},{code:"+252",label:"🇸🇴 Somalie (+252)"},
  {code:"+249",label:"🇸🇩 Soudan (+249)"},{code:"+46",label:"🇸🇪 Suède (+46)"},
  {code:"+41",label:"🇨🇭 Suisse (+41)"},{code:"+255",label:"🇹🇿 Tanzanie (+255)"},
  {code:"+235",label:"🇹🇩 Tchad (+235)"},{code:"+66",label:"🇹🇭 Thaïlande (+66)"},
  {code:"+228",label:"🇹🇬 Togo (+228)"},{code:"+216",label:"🇹🇳 Tunisie (+216)"},
  {code:"+84",label:"🇻🇳 Vietnam (+84)"},{code:"+260",label:"🇿🇲 Zambie (+260)"},
  {code:"+263",label:"🇿🇼 Zimbabwe (+263)"},
];

const COUNTRIES = [
  // Afrique de l'Ouest — ordre alphabétique
  {name:"Bénin",flag:"🇧🇯",region:"Ouest"},{name:"Burkina Faso",flag:"🇧🇫",region:"Ouest"},
  {name:"Cap-Vert",flag:"🇨🇻",region:"Autres"},{name:"Côte d'Ivoire",flag:"🇨🇮",region:"Ouest"},
  {name:"Guinée",flag:"🇬🇳",region:"Ouest"},{name:"Guinée-Bissau",flag:"🇬🇼",region:"Autres"},{name:"Mali",flag:"🇲🇱",region:"Ouest"},
  {name:"Mauritanie",flag:"🇲🇷",region:"Ouest"},{name:"Niger",flag:"🇳🇪",region:"Ouest"},{name:"Sénégal",flag:"🇸🇳",region:"Ouest"},{name:"Togo",flag:"🇹🇬",region:"Ouest"},
  // Afrique Centrale — ordre alphabétique
  {name:"Burundi",flag:"🇧🇮",region:"Centrale"},{name:"Cameroun",flag:"🇨🇲",region:"Centrale"},
  {name:"Centrafrique",flag:"🇨🇫",region:"Centrale"},{name:"Congo",flag:"🇨🇬",region:"Centrale"},
  {name:"Gabon",flag:"🇬🇦",region:"Centrale"},{name:"Guinée Équatoriale",flag:"🇬🇶",region:"Autres"},
  {name:"RD Congo",flag:"🇨🇩",region:"Centrale"},{name:"Rwanda",flag:"🇷🇼",region:"Centrale"},
  {name:"São Tomé",flag:"🇸🇹",region:"Autres"},{name:"Tchad",flag:"🇹🇩",region:"Centrale"},
  // Afrique de l'Est
  {name:"Djibouti",flag:"🇩🇯",region:"Est"},{name:"Érythrée",flag:"🇪🇷",region:"Est"},
  {name:"Éthiopie",flag:"🇪🇹",region:"Est"},{name:"Kenya",flag:"🇰🇪",region:"Est"},
  {name:"Somalie",flag:"🇸🇴",region:"Est"},{name:"Tanzanie",flag:"🇹🇿",region:"Est"},
  {name:"Ouganda",flag:"🇺🇬",region:"Est"},
  // Afrique Australe
  {name:"Afrique du Sud",flag:"🇿🇦",region:"Australe"},{name:"Botswana",flag:"🇧🇼",region:"Australe"},
  {name:"Eswatini",flag:"🇸🇿",region:"Australe"},{name:"Lesotho",flag:"🇱🇸",region:"Australe"},
  {name:"Madagascar",flag:"🇲🇬",region:"Australe"},{name:"Maurice",flag:"🇲🇺",region:"Australe"},
  {name:"Mozambique",flag:"🇲🇿",region:"Australe"},{name:"Namibie",flag:"🇳🇦",region:"Australe"},
  {name:"Seychelles",flag:"🇸🇨",region:"Australe"},{name:"Zambie",flag:"🇿🇲",region:"Australe"},
  {name:"Zimbabwe",flag:"🇿🇼",region:"Australe"},
  // Maghreb
  {name:"Algérie",flag:"🇩🇿",region:"Maghreb"},{name:"Comores",flag:"🇰🇲",region:"Maghreb"},
  {name:"Égypte",flag:"🇪🇬",region:"Maghreb"},{name:"Libye",flag:"🇱🇾",region:"Maghreb"},
  {name:"Maroc",flag:"🇲🇦",region:"Maghreb"},{name:"Soudan",flag:"🇸🇩",region:"Maghreb"},
  {name:"Tunisie",flag:"🇹🇳",region:"Maghreb"},
];

// Pays disponibles pour les ANNONCES (Ouest + Centrale uniquement)
const COUNTRIES_ANNONCES = COUNTRIES.filter(c=>["Ouest","Centrale"].includes(c.region));

const PROPERTIES = [
  {id:1,title:"Villa moderne Almadies",type:"Vente",country:"Sénégal",city:"Dakar",neighborhood:"Almadies",price:95000000,price_eur:145000,surface:280,rooms:5,bathrooms:3,verified:true,agent_name:"Mamadou Diallo",tags:["Piscine","Titre foncier"],bg:"linear-gradient(160deg,#1A3C2E,#2D6A4F)",description:"Magnifique villa contemporaine aux Almadies, 5 min de la mer.",demo:true,features:["Piscine","Jardin","Parking"]},
  {id:2,title:"Appartement standing Plateau",type:"Location",country:"Sénégal",city:"Dakar",neighborhood:"Plateau",price:850000,price_eur:1295,surface:120,rooms:3,bathrooms:2,verified:true,agent_name:"Fatou Ndiaye",tags:["Climatisé","Parking"],bg:"linear-gradient(160deg,#2C2822,#1A1A2E)",description:"Appartement haut standing au cœur du Plateau.",demo:true,features:["Meublé","Parking"]},
  {id:3,title:"Terrain viabilisé Saly",type:"Terrain",country:"Sénégal",city:"Mbour",neighborhood:"Saly",price:18000000,price_eur:27500,surface:500,verified:true,agent_name:"Oumar Sow",tags:["Titre foncier","Bord de mer"],bg:"linear-gradient(160deg,#3A2A1E,#2C1A0E)",description:"Terrain titre foncier bord de mer à Saly.",demo:true,features:["Titre foncier"]},
  {id:4,title:"Villa duplex Cocody",type:"Vente",country:"Côte d'Ivoire",city:"Abidjan",neighborhood:"Cocody",price:120000000,price_eur:183000,surface:320,rooms:6,bathrooms:4,verified:true,agent_name:"Aïcha Kouassi",tags:["Duplex","Jardin"],bg:"linear-gradient(160deg,#2C2C2C,#3D2B1F)",description:"Superbe villa duplex à Cocody, proche des ambassades.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:5,title:"Appartement Marcory Zone 4",type:"Location",country:"Côte d'Ivoire",city:"Abidjan",neighborhood:"Marcory",price:600000,price_eur:915,surface:95,rooms:2,bathrooms:1,verified:false,agent_name:"Koffi Assi",tags:["Meublé","Sécurisé"],bg:"linear-gradient(160deg,#1A2C2E,#0E1E20)",description:"Appartement meublé idéal pour diaspora.",demo:true,features:["Meublé"]},
  {id:6,title:"Villa Bonamoussadi",type:"Vente",country:"Cameroun",city:"Douala",neighborhood:"Bonamoussadi",price:65000000,price_eur:99150,surface:220,rooms:5,bathrooms:3,verified:true,agent_name:"Keur Immo Cameroun",tags:["Titre foncier","Parking"],bg:"linear-gradient(160deg,#1E2E28,#2C3E35)",description:"Belle villa 5 pièces à Bonamoussadi.",demo:true,features:["Parking","Jardin","Titre foncier"]},
  {id:7,title:"Villa Bastos Yaoundé",type:"Vente",country:"Cameroun",city:"Yaoundé",neighborhood:"Bastos",price:95000000,price_eur:144875,surface:200,rooms:4,bathrooms:3,verified:true,agent_name:"GCS Immo Yaoundé",tags:["Diplomatique","Titre foncier"],bg:"linear-gradient(160deg,#1A3C2E,#2D3A2E)",description:"Villa 4 pièces à Bastos, quartier diplomatique.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:8,title:"Villa ACI 2000 Bamako",type:"Vente",country:"Mali",city:"Bamako",neighborhood:"ACI 2000",price:75000000,price_eur:114375,surface:200,rooms:4,bathrooms:3,verified:true,agent_name:"Immo Mali",tags:["Titre foncier","Résidentiel"],bg:"linear-gradient(160deg,#2C2018,#1A1410)",description:"Belle villa 4 pièces dans le quartier ACI 2000.",demo:true,features:["Parking","Titre foncier"]},
  {id:9,title:"Terrain Badalabougou",type:"Terrain",country:"Mali",city:"Bamako",neighborhood:"Badalabougou",price:25000000,price_eur:38125,surface:400,verified:true,agent_name:"SahelImmo",tags:["Titre foncier","Résidentiel"],bg:"linear-gradient(160deg,#3A2A1E,#281E14)",description:"Terrain titré 400m² à Badalabougou.",demo:true,features:["Titre foncier"]},
  {id:10,title:"Villa Ouaga 2000",type:"Vente",country:"Burkina Faso",city:"Ouagadougou",neighborhood:"Ouaga 2000",price:55000000,price_eur:83875,surface:180,rooms:4,bathrooms:2,verified:true,agent_name:"Faso Immo",tags:["Titre foncier","Résidentiel"],bg:"linear-gradient(160deg,#2E1E0E,#1E140A)",description:"Villa 4 pièces dans le quartier résidentiel Ouaga 2000.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:11,title:"Villa Ratoma Conakry",type:"Vente",country:"Guinée",city:"Conakry",neighborhood:"Ratoma",price:80000000,price_eur:122000,surface:220,rooms:5,bathrooms:3,verified:true,agent_name:"Guinée Immo",tags:["Vue mer","Titre foncier"],bg:"linear-gradient(160deg,#1A2E28,#0E1E18)",description:"Belle villa 5 pièces à Ratoma avec vue sur l'Atlantique.",demo:true,features:["Piscine","Jardin","Titre foncier"]},
  {id:12,title:"Villa Cadjehoun Cotonou",type:"Vente",country:"Bénin",city:"Cotonou",neighborhood:"Cadjehoun",price:70000000,price_eur:106750,surface:200,rooms:4,bathrooms:3,verified:true,agent_name:"Bénin Immo",tags:["Titre foncier","Aéroport"],bg:"linear-gradient(160deg,#1E2A1E,#141E14)",description:"Villa 4 pièces à Cadjehoun.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:13,title:"Villa Lomé Agbalépédogan",type:"Vente",country:"Togo",city:"Lomé",neighborhood:"Agbalépédogan",price:45000000,price_eur:68625,surface:160,rooms:4,bathrooms:2,verified:true,agent_name:"Togo Immo",tags:["Titre foncier","Calme"],bg:"linear-gradient(160deg,#1A2C1A,#101C10)",description:"Villa 4 pièces dans quartier résidentiel calme.",demo:true,features:["Jardin","Titre foncier"]},
  {id:14,title:"Villa Gombe Kinshasa",type:"Vente",country:"RD Congo",city:"Kinshasa",neighborhood:"Gombe",price:120000000,price_eur:183000,surface:280,rooms:5,bathrooms:4,verified:true,agent_name:"Kinshasa Immo",tags:["Diplomatique","Titre foncier"],bg:"linear-gradient(160deg,#2C1E2C,#1A101A)",description:"Grande villa 5 pièces dans le quartier diplomatique.",demo:true,features:["Piscine","Jardin","Parking","Titre foncier"]},
  {id:15,title:"Villa Batterie IV Libreville",type:"Vente",country:"Gabon",city:"Libreville",neighborhood:"Batterie IV",price:130000000,price_eur:198250,surface:260,rooms:5,bathrooms:4,verified:true,agent_name:"Gabon Immo",tags:["Vue mer","Titre foncier"],bg:"linear-gradient(160deg,#1E2C1E,#101810)",description:"Villa 5 pièces vue Atlantique.",demo:true,features:["Piscine","Jardin","Parking","Titre foncier"]},
  {id:16,title:"Villa Tevragh Zeina",type:"Vente",country:"Mauritanie",city:"Nouakchott",neighborhood:"Tevragh Zeina",price:60000000,price_eur:91500,surface:200,rooms:4,bathrooms:3,verified:true,agent_name:"Maurimmo",tags:["Quartier huppé","Titre foncier"],bg:"linear-gradient(160deg,#2C2010,#1C1408)",description:"Villa 4 pièces à Tevragh Zeina.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:17,title:"Villa Gombe Brazzaville",type:"Vente",country:"Congo",city:"Brazzaville",neighborhood:"Gombe",price:85000000,price_eur:129625,surface:220,rooms:5,bathrooms:3,verified:true,agent_name:"Congo Immo",tags:["Vue fleuve","Titre foncier"],bg:"linear-gradient(160deg,#1A1E2C,#0E1018)",description:"Villa 5 pièces vue fleuve Congo.",demo:true,features:["Piscine","Jardin","Titre foncier"]},
  {id:18,title:"Local commercial Ouagadougou",type:"Commercial",country:"Burkina Faso",city:"Ouagadougou",neighborhood:"Zogona",price:800000,price_eur:1220,surface:60,verified:false,agent_name:"Particulier",tags:["Vitrine","Rue passante"],bg:"linear-gradient(160deg,#2C2C2C,#1C1C1C)",description:"Local commercial 60m² en zone commerçante.",demo:true,features:["Parking"]},
  {id:19,title:"Villa Niamey Plateau",type:"Vente",country:"Niger",city:"Niamey",neighborhood:"Plateau",price:50000000,price_eur:76250,surface:180,rooms:4,bathrooms:2,verified:true,agent_name:"Niger Immo",tags:["Résidentiel","Titre foncier"],bg:"linear-gradient(160deg,#2C1C10,#1C1008)",description:"Belle villa 4 pièces au Plateau.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:20,title:"Villa Miskine Bangui",type:"Vente",country:"Centrafrique",city:"Bangui",neighborhood:"Miskine",price:35000000,price_eur:53375,surface:150,rooms:3,bathrooms:2,verified:false,agent_name:"RCA Immo",tags:["Résidentiel","Titre foncier"],bg:"linear-gradient(160deg,#2A1E10,#1A1208)",description:"Villa 3 pièces à Miskine.",demo:true,features:["Jardin","Titre foncier"]},
  {id:21,title:"Villa Chagoua N'Djamena",type:"Vente",country:"Tchad",city:"N'Djamena",neighborhood:"Chagoua",price:40000000,price_eur:61000,surface:160,rooms:3,bathrooms:2,verified:false,agent_name:"Tchad Immo",tags:["Résidentiel","Titre foncier"],bg:"linear-gradient(160deg,#281C10,#181008)",description:"Villa 3 pièces à Chagoua.",demo:true,features:["Jardin","Titre foncier"]},
];

const EQUIPEMENTS = ["Piscine","Jardin","Parking","Meublé","Titre foncier","Terrasse"];
const fmtXOF = n => new Intl.NumberFormat("fr-FR").format(n)+" FCFA";
const fmtEUR = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const typeColor = t => t==="Vente"?C.terra:t==="Location"?C.forest:t==="Terrain"?C.earth:t==="Commercial"?"#444":C.earth;
const countryFlag = name => COUNTRIES.find(c=>c.name===name)?.flag||"🌍";
// Drapeaux en image (Windows n'affiche pas les emojis drapeaux)
const isoOf = f => f?[...f].map(ch=>String.fromCharCode(ch.codePointAt(0)-0x1F1E6+97)).join(""):"";
const noFlag = s => s.replace(/[\u{1F1E6}-\u{1F1FF}]{2}\s*/gu,"");
function Flag({ name, flag, size=16 }) {
  const f = flag || COUNTRIES.find(c=>c.name===name)?.flag;
  if (!f) return null;
  return <img src={`https://flagcdn.com/w40/${isoOf(f)}.png`} alt="" width={size} height={Math.round(size*0.75)} style={{display:"inline-block",verticalAlign:"middle",borderRadius:"2px",objectFit:"cover",marginRight:"5px"}}/>;
}

// ─── ICONS ───────────────────────────────────────
const Icon = {
  briefcase: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2zm0 2v1h4V6h-4z"/></svg>,
  home: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
  search: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>,
  group: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  star: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  person: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  searchSm: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  wa: <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
};

// ─── AUTH ─────────────────────────────────────────
async function signUp(email, password, meta) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
    body:JSON.stringify({email,password,data:meta}),
  });
  return res.json();
}
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
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
  const [accountType, setAccountType] = useState("particulier");
  const [agency, setAgency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputStyle = {width:"100%",border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"11px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F};

  const handleSubmit = async () => {
    if (!email||!password) return;
    if (mode==="signup"&&accountType==="pro"&&!agency) { setError("Indiquez le nom de votre agence ou société"); return; }
    setLoading(true); setError("");
    try {
      if (mode==="signup") {
        const d = await signUp(email, password, {name, phone:phone?`${phoneCode} ${phone}`:"", account_type:accountType, agency:accountType==="pro"?agency:""});
        if (d.error) setError(d.error.message||"Erreur lors de l'inscription");
        else setSuccess("Compte créé ! Vérifiez votre email.");
      } else {
        const d = await signIn(email, password);
        if (d.error) setError("Email ou mot de passe incorrect");
        else { const m=d.user?.user_metadata||{}; onLogin({email,name:m.name||email.split("@")[0],account_type:m.account_type||"particulier",agency:m.agency||"",phone:m.phone||"",token:d.access_token}); onClose(); }
      }
    } catch(e) {
      onLogin({email,name:name||email.split("@")[0],account_type:accountType,agency,token:"demo"});
      onClose();
    }
    setLoading(false);
  };

  

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"400px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:C.forest,padding:"22px",borderRadius:"16px 16px 0 0",textAlign:"center",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.1)",border:"none",color:C.white,width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:"16px"}}>✕</button>
          <div style={{width:40,height:40,borderRadius:"50%",background:C.gold,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={C.forest}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"21px"}}>{mode==="login"?"Connexion":"Créer un compte"}</h2>
                  </div>
        <div style={{padding:"20px"}}>

{mode==="signup"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
              {[["particulier","Particulier","Je cherche ou je vends un bien"],["pro","Professionnel","Agence, promoteur ou prestataire"]].map(([id,ti,de])=>(
                <button key={id} type="button" onClick={()=>setAccountType(id)} style={{border:`1.5px solid ${accountType===id?C.terra:C.sand}`,background:accountType===id?"#FBF3EC":C.white,borderRadius:"10px",padding:"10px",textAlign:"left",cursor:"pointer",fontFamily:F}}>
                  <div style={{fontSize:"15px",fontWeight:700,color:C.dark}}>{ti}</div>
                  <div style={{fontSize:"12px",color:C.sub,marginTop:"2px",lineHeight:1.3}}>{de}</div>
                </button>
              ))}
            </div>
          )}
          {mode==="signup"&&accountType==="pro"&&(
            <div style={{marginBottom:"10px"}}><label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Nom de l'agence ou de la société *</label><input placeholder="Ex : Teranga Immobilier" value={agency} onChange={e=>setAgency(e.target.value)} style={inputStyle}/></div>
          )}
          {mode==="signup"&&<div style={{marginBottom:"10px"}}><label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Prénom et nom</label><input placeholder="Marie Laurence" value={name} onChange={e=>setName(e.target.value)} style={inputStyle}/></div>}
          <div style={{marginBottom:"10px"}}><label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Email</label><input type="email" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/></div>
          <div style={{marginBottom:mode==="signup"?"10px":"16px"}}><label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Mot de passe</label><input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/></div>
          {mode==="signup"&&(
            <div style={{marginBottom:"16px"}}>
              <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Téléphone (optionnel)</label>
              <div style={{display:"flex",gap:"6px"}}>
                <select value={phoneCode} onChange={e=>setPhoneCode(e.target.value)} style={{border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"10px 8px",fontSize:"13px",color:C.dark,fontFamily:F,flexShrink:0,maxWidth:"155px"}}>
                  {PHONE_CODES.map((p,i)=><option key={i} value={p.code}>{noFlag(p.label)}</option>)}
                </select>
                <input type="tel" placeholder="6 12 34 56 78" value={phone} onChange={e=>setPhone(e.target.value)} style={{...inputStyle,flex:1}}/>
              </div>
            </div>
          )}
          {error&&<div style={{background:"#FEE2E2",color:"#DC2626",borderRadius:"8px",padding:"9px 12px",marginBottom:"12px",fontSize:"14px",fontFamily:F}}>{error}</div>}
          {success&&<div style={{background:C.successBg,color:C.success,borderRadius:"8px",padding:"9px 12px",marginBottom:"12px",fontSize:"14px",fontFamily:F}}>{success}</div>}
          <button onClick={handleSubmit} disabled={!email||!password||loading||(mode==="signup"&&accountType==="pro"&&!agency)} style={{width:"100%",background:email&&password?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"16px",cursor:email&&password?"pointer":"not-allowed",fontFamily:F,marginBottom:"12px",letterSpacing:"0.03em"}}>
            {loading?"...":(mode==="login"?"Se connecter":"Créer mon compte")}
          </button>
          <div style={{textAlign:"center",fontSize:"14px",color:C.sub,fontFamily:F}}>
            {mode==="login"?<>Pas encore de compte ? <span onClick={()=>{setMode("signup");setError("");}} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>S'inscrire gratuitement</span></>:<>Déjà un compte ? <span onClick={()=>{setMode("login");setError("");}} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>Se connecter</span></>}
          </div>
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
    try { await fetch(`${SUPABASE_URL}/rest/v1/leads`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},body:JSON.stringify({name,email,message:`ALERTE: ${JSON.stringify(filters)}`,status:"alerte"})}); } catch(e){}
    setLoading(false); setSent(true);
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"400px",width:"100%",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:C.forest,padding:"20px",textAlign:"center"}}>
          <button onClick={onClose} style={{position:"absolute",marginLeft:"140px",marginTop:"-8px",background:"rgba(255,255,255,0.1)",border:"none",color:C.white,width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:"15px"}}>✕</button>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"19px"}}>Créer une alerte</h2>
          <p style={{margin:0,color:"rgba(255,255,255,0.6)",fontSize:"13px",fontFamily:F}}>Recevez les nouvelles annonces par email</p>
        </div>
        <div style={{padding:"20px"}}>
          {sent?(<div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:"42px",marginBottom:"10px"}}>✅</div>
            <h3 style={{margin:"0 0 6px",color:C.dark,fontFamily:FT,fontSize:"18px"}}>Alerte créée !</h3>
            <p style={{color:C.sub,fontSize:"14px",fontFamily:F}}>Vous recevrez un email dès qu'une annonce correspond.</p>
            <button onClick={onClose} style={{marginTop:"14px",background:C.terra,color:C.white,border:"none",borderRadius:"8px",padding:"9px 20px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Fermer</button>
          </div>):(
            <>
              {[{label:"Prénom",val:name,set:setName,ph:"Marie"},{label:"Email *",val:email,set:setEmail,ph:"votre@email.com",type:"email"}].map(f=>(
                <div key={f.label} style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>{f.label}</label>
                  <input type={f.type||"text"} placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} style={{width:"100%",border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"10px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F}}/>
                </div>
              ))}
              <button onClick={handleSubmit} disabled={!email||loading} style={{width:"100%",background:email?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"8px",padding:"12px",fontWeight:700,fontSize:"15px",cursor:email?"pointer":"not-allowed",fontFamily:F}}>
                {loading?"Enregistrement...":"Activer l'alerte email"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PARTNER MODAL ────────────────────────────────
function PartnerModal({ onClose, user, defaultType }) {
  const [type, setType] = useState(defaultType||user?.account_type||null);
  const [form, setForm] = useState({agency:user?.agency||"",name:user?.name||"",email:user?.email||"",phoneCode:"+33",phone:"",country:"Sénégal",type:"",title:"",city:"",neighborhood:"",price_eur:"",price_xof:"",surface:"",rooms:"",bathrooms:"",features:[],description:""});
  const [photos, setPhotos] = useState([]);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inputStyle = {width:"100%",border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"10px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F};

  const handleSubmit = async () => {
    if (!form.name||!form.email||(type==="pro"&&!form.agency)) return;
    setLoading(true);
    try {
      // Sauvegarder dans properties avec status en_attente
      await fetch(`${SUPABASE_URL}/rest/v1/properties`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},body:JSON.stringify({
        user_email:form.email, user_name:form.name, user_phone:`${form.phoneCode}${form.phone}`,
        title:form.title||`${form.type} - ${form.city}`, type:form.type||type,
        country:form.country, city:form.city, neighborhood:form.neighborhood,
        description:form.description, price_eur:parseInt(form.price_eur)||null,
        price_xof:parseInt(form.price_xof)||null, surface:parseInt(form.surface)||null,
        rooms:parseInt(form.rooms)||null, bathrooms:parseInt(form.bathrooms)||null,
        features:form.features||[], status:"en_attente", advertiser_type:type,
        agency_name:form.agency||null,
      })});
      // Notifier dans leads aussi
      await fetch(`${SUPABASE_URL}/rest/v1/leads`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},body:JSON.stringify({name:form.name,email:form.email,phone:`${form.phoneCode}${form.phone}`,message:`NOUVELLE ANNONCE en attente | Type: ${type} | ${form.type} | ${form.country} - ${form.city} | Prix: ${form.price_eur}€ | ${form.description}`,status:"annonce_en_attente"})});
    } catch(e){}
    setLoading(false); setSent(true);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"480px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:C.terra,padding:"20px",borderRadius:"16px 16px 0 0",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:"15px"}}>✕</button>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"21px"}}>Publier une annonce{type==="pro"?" · Professionnel":type==="particulier"?" · Particulier":""}</h2>
          <p style={{margin:0,color:"rgba(255,255,255,0.75)",fontSize:"13px",fontFamily:F}}>Gratuit · Afrique de l'Ouest & Centrale</p>
        </div>
        <div style={{padding:"20px"}}>
          {sent?(<div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:"42px",marginBottom:"10px"}}>🎉</div>
            <h3 style={{margin:"0 0 6px",color:C.dark,fontFamily:FT,fontSize:"18px"}}>Demande envoyée !</h3>
            <p style={{color:C.sub,fontSize:"14px",fontFamily:F}}>Nous vous contacterons dans les 24h.</p>
            <button onClick={onClose} style={{marginTop:"14px",background:C.terra,color:C.white,border:"none",borderRadius:"8px",padding:"9px 20px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Fermer</button>
          </div>):!type?(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              {[{id:"particulier",title:"Particulier",desc:"Je vends ou loue mon bien"},{id:"pro",title:"Professionnel",desc:"Agent ou promoteur"}].map(t=>(
                <div key={t.id} onClick={()=>setType(t.id)} style={{border:`1px solid ${C.sand}`,borderRadius:"10px",padding:"18px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.terra}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.sand}>
                  <div style={{fontWeight:700,color:C.dark,fontSize:"16px",marginBottom:"4px",fontFamily:F}}>{t.title}</div>
                  <div style={{fontSize:"13px",color:C.sub,marginBottom:"12px",fontFamily:F}}>{t.desc}</div>
                  <div style={{background:C.terra,color:C.white,borderRadius:"6px",padding:"6px",fontSize:"13px",fontWeight:700,fontFamily:F}}>Gratuit</div>
                </div>
              ))}
            </div>
          ):(
            <>
              {!(defaultType||user?.account_type)&&<button onClick={()=>setType(null)} style={{background:"transparent",border:"none",color:C.sub,cursor:"pointer",fontSize:"14px",marginBottom:"14px",fontFamily:F,padding:0}}>← Retour</button>}
              {/* Message avertissement */}
              <div style={{background:"#FBF3EC",border:"1px solid #D97757",borderLeft:"4px solid #D97757",borderRadius:"8px",padding:"12px 14px",marginBottom:"14px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                <span style={{fontSize:"18px",flexShrink:0}}>⚠️</span>
                <div>
                  <p style={{fontFamily:FT,fontWeight:600,fontSize:"14px",color:"#3D2B1F",margin:"0 0 3px"}}>Avant de publier votre annonce</p>
                  <p style={{fontSize:"13px",lineHeight:1.5,color:"#5A4636",margin:0,fontFamily:F}}>Assurez-vous que toutes les informations sont exactes et vérifiables. Sokilé peut suspendre toute annonce signalée. Les fausses annonces exposent leur auteur à une suspension définitive et peuvent engager sa responsabilité légale.</p>
                </div>
              </div>
              {type==="pro"&&(
                <div style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Nom de l'agence *</label>
                  <input placeholder="Ex : Teranga Immobilier" value={form.agency||""} onChange={e=>set("agency",e.target.value)} style={inputStyle}/>
                </div>
              )}
              {[{label:"Prénom et nom *",key:"name",ph:"Votre nom"},{label:"Email *",key:"email",ph:"votre@email.com",type:"email"}].map(f=>(
                <div key={f.key} style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>{f.label}</label>
                  <input type={f.type||"text"} placeholder={f.ph} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} style={inputStyle}/>
                </div>
              ))}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Téléphone WhatsApp</label>
                <div style={{display:"flex",gap:"6px"}}>
                  <select value={form.phoneCode} onChange={e=>set("phoneCode",e.target.value)} style={{border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"9px 8px",fontSize:"13px",color:C.dark,fontFamily:F,flexShrink:0,maxWidth:"155px"}}>
                    {PHONE_CODES.map((p,i)=><option key={i} value={p.code}>{noFlag(p.label)}</option>)}
                  </select>
                  <input type="tel" placeholder="6 12 34 56 78" value={form.phone} onChange={e=>set("phone",e.target.value)} style={{...inputStyle,flex:1}}/>
                </div>
              </div>
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Pays</label>
                <select value={form.country} onChange={e=>set("country",e.target.value)} style={{...inputStyle}}>
                  {COUNTRIES_ANNONCES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {/* Type de bien */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Type de bien *</label>
                <select value={form.type||""} onChange={e=>set("type",e.target.value)} style={{...inputStyle}}>
                  <option value="">Sélectionner...</option>
                  {["Vente","Location","Terrain","Commercial","Agricole"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              {/* Titre */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Titre de l'annonce *</label>
                <input placeholder="Ex: Villa 4 pièces avec piscine à Cocody" value={form.title||""} onChange={e=>set("title",e.target.value)} style={inputStyle}/>
              </div>
              {/* Ville + Quartier */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Ville *</label>
                  <input placeholder="Ex: Abidjan" value={form.city||""} onChange={e=>set("city",e.target.value)} style={inputStyle}/>
                </div>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Quartier</label>
                  <input placeholder="Ex: Cocody" value={form.neighborhood||""} onChange={e=>set("neighborhood",e.target.value)} style={inputStyle}/>
                </div>
              </div>
              {/* Prix */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Prix</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  <div style={{position:"relative"}}>
                    <input type="number" placeholder="Prix en €" value={form.price_eur||""} onChange={e=>{set("price_eur",e.target.value);set("price_xof",Math.round(e.target.value*655.957));}} style={{...inputStyle,paddingRight:"28px"}}/>
                    <span style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",fontSize:"13px",color:C.sub,fontFamily:F}}>€</span>
                  </div>
                  <div style={{position:"relative"}}>
                    <input type="number" placeholder="Prix en FCFA" value={form.price_xof||""} onChange={e=>{set("price_xof",e.target.value);set("price_eur",Math.round(e.target.value/655.957));}} style={{...inputStyle,paddingRight:"40px"}}/>
                    <span style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"12px",color:C.sub,fontFamily:F}}>FCFA</span>
                  </div>
                </div>
                {form.price_eur&&<div style={{fontSize:"12px",color:C.terra,marginTop:"4px",fontFamily:F}}>≈ {new Intl.NumberFormat("fr-FR").format(Math.round(form.price_eur*655.957))} FCFA · {new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(form.price_eur)}</div>}
              </div>
              {/* Surface + Pièces + SDB */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Surface m²</label>
                  <input type="number" placeholder="Ex: 150" value={form.surface||""} onChange={e=>set("surface",e.target.value)} style={inputStyle}/>
                </div>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Pièces</label>
                  <select value={form.rooms||""} onChange={e=>set("rooms",e.target.value)} style={{...inputStyle}}>
                    <option value="">—</option>
                    {[1,2,3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>S. de bain</label>
                  <select value={form.bathrooms||""} onChange={e=>set("bathrooms",e.target.value)} style={{...inputStyle}}>
                    <option value="">—</option>
                    {[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {/* Équipements */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"6px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Équipements</label>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {["Piscine","Jardin","Parking","Meublé","Titre foncier","Terrasse","Gardien","Groupe électrogène","Eau courante","Climatisation"].map(eq=>{
                    const selected=(form.features||[]).includes(eq);
                    return <button key={eq} type="button" onClick={()=>set("features",selected?(form.features||[]).filter(f=>f!==eq):[...(form.features||[]),eq])} style={{background:selected?C.terra:C.cream,color:selected?C.white:C.dark,border:`1px solid ${selected?C.terra:C.sand}`,borderRadius:"5px",padding:"4px 9px",fontSize:"12px",fontWeight:selected?700:500,cursor:"pointer",fontFamily:F}}>{selected?"✓ ":""}{eq}</button>
                  })}
                </div>
              </div>
              {/* Description */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Description du bien</label>
                <textarea placeholder="Décrivez votre bien : emplacement, atouts, accès, environnement..." value={form.description||""} onChange={e=>set("description",e.target.value)} rows={4} style={{...inputStyle,resize:"vertical"}}/>
              </div>
              <div style={{marginBottom:"14px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Photos</label>
                <div onClick={()=>fileRef.current?.click()} style={{border:`1px dashed ${C.sand}`,borderRadius:"8px",padding:"14px",textAlign:"center",cursor:"pointer",background:"#FAFAF8"}}>
                  <div style={{fontSize:"13px",color:C.sub,fontFamily:F}}>Cliquez pour ajouter des photos</div>
                  <input ref={fileRef} type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>setPhotos([...e.target.files])}/>
                </div>
                {photos.length>0&&<div style={{marginTop:"4px",fontSize:"13px",color:C.success,fontWeight:700,fontFamily:F}}>✓ {photos.length} photo{photos.length>1?"s":""} ajoutée{photos.length>1?"s":""}</div>}
              </div>
              <button onClick={handleSubmit} disabled={!form.name||!form.email||loading} style={{width:"100%",background:form.name&&form.email?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"16px",cursor:form.name&&form.email?"pointer":"not-allowed",fontFamily:F}}>
                {loading?"Envoi en cours...":"Envoyer ma demande"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROPERTY CARD ────────────────────────────────
function PropertyCard({ p, onClick, compact, onSave, saved }) {
  const [hov, setHov] = useState(false);
  const shareWA = (e) => {
    e.stopPropagation();
    const txt = `${p.title}\n${p.neighborhood}, ${p.city} ${countryFlag(p.country)}\n${fmtEUR(p.price_eur)}\nSokilé`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  };
  if (compact) return (
    <div onClick={()=>onClick(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:C.white,borderRadius:"10px",overflow:"hidden",cursor:"pointer",border:`1px solid ${hov?C.terra:C.sand}`,transition:"all 0.2s",display:"flex"}}>
      <div style={{width:72,flexShrink:0,background:p.bg}}/>
      <div style={{padding:"10px 12px",flex:1,minWidth:0}}>
        <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"2px"}}>{p.city}, <Flag name={p.country} size={14}/>{p.country}</div>
        <div style={{fontSize:"14px",fontWeight:700,color:C.dark,marginBottom:"4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:F}}>{p.title}</div>
        <div style={{fontSize:"15px",fontWeight:700,color:C.terra,fontFamily:F}}>{fmtEUR(p.price_eur)}</div>
      </div>
    </div>
  );
  return (
    <div onClick={()=>onClick(p)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:C.white,borderRadius:"10px",overflow:"hidden",cursor:"pointer",border:`1px solid ${hov?C.terra:C.sand}`,transition:"border-color 0.2s"}}>
      <div style={{height:110,background:p.bg,position:"relative",display:"flex",alignItems:"flex-end",padding:"8px"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)"}}/>
        {p.demo&&<div style={{position:"absolute",top:7,left:7,background:"rgba(0,0,0,0.35)",color:"rgba(255,255,255,0.75)",fontSize:"11px",padding:"2px 6px",borderRadius:"3px",fontFamily:F}}>Démo</div>}
        {p.verified&&<div style={{position:"absolute",top:7,right:7,background:"rgba(46,125,50,0.9)",color:C.white,fontSize:"11px",fontWeight:700,padding:"2px 7px",borderRadius:"3px",fontFamily:F}}>Vérifié</div>}
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:"6px",width:"100%"}}>
          <span style={{background:typeColor(p.type),color:C.white,fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"3px",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{p.type}</span>
          <div style={{marginLeft:"auto",display:"flex",gap:"5px"}}>
            <span onClick={e=>{e.stopPropagation();onSave&&onSave(p);}} style={{background:"rgba(255,255,255,0.9)",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"15px"}}>{saved?"❤️":"🤍"}</span>
            <span style={{background:"rgba(255,255,255,0.9)",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={shareWA}>{Icon.wa}</span>
          </div>
        </div>
      </div>
      <div style={{padding:"12px"}}>
        <div style={{fontSize:"12px",color:C.sub,fontFamily:F,marginBottom:"3px"}}>{p.neighborhood}, {p.city} · <Flag name={p.country} size={14}/>{p.country}</div>
        {p.advertiser_type==="pro"&&<div style={{display:"inline-block",background:C.forest,color:C.white,fontSize:"11px",fontWeight:700,padding:"2px 7px",borderRadius:"3px",fontFamily:F,marginBottom:"4px"}}>Pro{p.agency_name?` · ${p.agency_name}`:""}</div>}
        <div style={{fontSize:"15px",fontWeight:500,color:C.dark,fontFamily:FT,marginBottom:"6px",lineHeight:1.3}}>{p.title}</div>
        <div style={{display:"flex",gap:"8px",marginBottom:"8px",flexWrap:"wrap"}}>
          {p.rooms&&<span style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{p.rooms} pièces</span>}
          {p.rooms&&p.surface&&<span style={{fontSize:"12px",color:C.sand}}>|</span>}
          {p.surface&&<span style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{new Intl.NumberFormat("fr-FR").format(p.surface)} m²</span>}
          {p.surface&&p.tags?.[0]&&<span style={{fontSize:"12px",color:C.sand}}>|</span>}
          {p.tags?.[0]&&<span style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{p.tags[0]}</span>}
        </div>
        <div style={{borderTop:`1px solid ${C.sand}`,paddingTop:"8px"}}>
          <div style={{fontSize:"16px",fontWeight:700,color:C.terra,fontFamily:F}}>{fmtEUR(p.price_eur)}</div>
          <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{fmtXOF(p.price)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── PROPERTY MODAL ───────────────────────────────
function PropertyModal({ p, onClose, onSaveFromModal, onVerify }) {
  if (!p) return null;
  const shareWA = () => {
    const txt = `${p.title}\n${p.neighborhood}, ${p.city}, ${p.country}\n${fmtEUR(p.price_eur)}\nSokilé`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"500px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{height:180,background:p.bg,borderRadius:"16px 16px 0 0",position:"relative",display:"flex",alignItems:"flex-end",padding:"14px"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.6) 100%)",borderRadius:"16px 16px 0 0"}}/>
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:"15px"}}>✕</button>
          <div style={{position:"relative",zIndex:1}}>
            <span style={{background:typeColor(p.type),color:C.white,fontSize:"12px",fontWeight:700,padding:"3px 9px",borderRadius:"3px",textTransform:"uppercase",fontFamily:F,letterSpacing:"0.06em"}}>{p.type}</span>
            {p.verified&&<span style={{marginLeft:"6px",background:"rgba(46,125,50,0.9)",color:C.white,fontSize:"12px",fontWeight:700,padding:"3px 9px",borderRadius:"3px",fontFamily:F}}>Vérifié</span>}
          </div>
        </div>
        <div style={{padding:"18px"}}>
          {p.demo&&<div style={{background:"#FFF8E1",border:"1px solid #FFD54F",borderRadius:"7px",padding:"7px 11px",marginBottom:"12px",fontSize:"13px",color:"#5D4037",fontFamily:F}}>Annonce de démonstration — publiez la vôtre gratuitement</div>}
          <h2 style={{margin:"0 0 4px",fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.dark}}>{p.title}</h2>
          <p style={{margin:"0 0 12px",color:C.sub,fontSize:"13px",fontFamily:F}}>{p.neighborhood}, {p.city} — <Flag name={p.country} size={14}/>{p.country}</p>
          <p style={{margin:"0 0 14px",color:C.dark,fontSize:"14px",lineHeight:1.6,fontFamily:F}}>{p.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"14px"}}>
            {[["Surface",p.surface?`${new Intl.NumberFormat("fr-FR").format(p.surface)} m²`:"—"],["Pièces",p.rooms||"—"],["Salles de bain",p.bathrooms||"—"],["Pays",<><Flag name={p.country}/>{p.country}</>]].map(([l,v])=>(
              <div key={l} style={{background:C.cream,borderRadius:"7px",padding:"9px"}}>
                <div style={{fontSize:"12px",color:C.sub,marginBottom:"2px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</div>
                <div style={{fontSize:"15px",fontWeight:700,color:C.dark,fontFamily:F}}>{v}</div>
              </div>
            ))}
          </div>
          {p.features?.length>0&&<div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:C.dark,marginBottom:"7px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Équipements</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {p.features.map(f=><span key={f} style={{background:C.successBg,color:C.success,fontSize:"12px",padding:"3px 9px",borderRadius:"3px",fontWeight:600,fontFamily:F}}>✓ {f}</span>)}
            </div>
          </div>}
          <div style={{background:C.cream,borderRadius:"8px",padding:"12px",marginBottom:"14px",borderLeft:`3px solid ${C.terra}`}}>
            <div style={{fontSize:"21px",fontWeight:700,color:C.terra,fontFamily:F}}>{fmtEUR(p.price_eur)}</div>
            <div style={{fontSize:"13px",color:C.sub,fontFamily:F}}>{fmtXOF(p.price)}</div>
          </div>
          <div style={{background:C.cream,borderRadius:"8px",padding:"10px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:C.forest,display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontWeight:700,fontSize:"14px",fontFamily:F}}>
              {p.agent_name?.split(" ").map(w=>w[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{fontSize:"14px",fontWeight:700,color:C.dark,fontFamily:F}}>{p.agent_name}</div>
              <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{p.advertiser_type==="pro"?"Professionnel":p.advertiser_type==="particulier"?"Particulier":"Agent certifié Sokilé"}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px"}}>
            <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent('Bonjour, je suis intéressé(e) par votre annonce : '+p.title+' - '+p.city+', '+p.country)}`,'_blank')} style={{background:C.terra,color:C.white,border:"none",borderRadius:"7px",padding:"11px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>Contacter</button>
            <button onClick={()=>onSaveFromModal&&onSaveFromModal(p)} style={{background:"transparent",color:C.terra,border:`1px solid ${C.terra}`,borderRadius:"7px",padding:"11px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>Sauvegarder</button>
            <button onClick={shareWA} style={{background:"#25D366",color:C.white,border:"none",borderRadius:"7px",padding:"11px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>WhatsApp</button>
          </div>
          {onVerify&&<button onClick={()=>onVerify(p)} style={{width:"100%",marginTop:"8px",background:C.cream,color:C.forest,border:`1px solid ${C.forest}`,borderRadius:"7px",padding:"11px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Faire vérifier ce bien</button>}
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title, desc }) {
  return (
    <div style={{background:C.forest,borderRadius:"12px",padding:"36px 24px",textAlign:"center",margin:"16px 0"}}>
      <h2 style={{margin:"0 0 8px",color:C.white,fontFamily:FT,fontSize:"23px"}}>{title}</h2>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:"15px",margin:"0 0 16px",fontFamily:F}}>{desc}</p>
      <div style={{display:"inline-block",border:`1px solid ${C.gold}`,borderRadius:"20px",padding:"6px 18px"}}>
        <span style={{color:C.gold,fontSize:"14px",fontWeight:700,fontFamily:F}}>En cours de développement</span>
      </div>
    </div>
  );
}




// ─── PRESTATAIRES : ANNUAIRE + FORMULAIRES ────────
const SPECIALITES = ["Géomètre","Notaire","Architecte","BTP / Construction","Vérification terrain","Juridique","Financement","Déménagement"];

// Fiches d'exemple (remplacées par les vrais prestataires une fois validés)
const PRESTATAIRES_DEMO = [
  {id:1,emoji:"📐",name:"Cabinet Diallo & Associés",specs:["Géomètre","Vérification terrain"],pays:["Sénégal","Côte d'Ivoire"],desc:"Vérification de titres fonciers, bornage et levés topographiques avant achat.",zones:"Dakar, Thiès, Mbour, Abidjan",tarifs:"Vérification de titre à partir de 150 000 FCFA"},
  {id:2,emoji:"⚖️",name:"Me Koné, notaire",specs:["Notaire","Juridique"],pays:["Côte d'Ivoire"],desc:"Actes de vente, successions et donations immobilières. Rendez-vous à distance pour la diaspora.",zones:"Abidjan et environs",tarifs:"Selon barème notarial"},
  {id:3,emoji:"🏛️",name:"Archi Dakar Studio",specs:["Architecte","BTP / Construction"],pays:["Sénégal"],desc:"Conception de plans et suivi de chantier avec compte rendu photo hebdomadaire.",zones:"Tout le Sénégal",tarifs:"Plans à partir de 800 000 FCFA"},
  {id:4,emoji:"🚚",name:"Transit Sahel Déménagement",specs:["Déménagement"],pays:["Mali","Burkina Faso","Niger"],desc:"Déménagement et transport de mobilier entre l'Europe et l'Afrique de l'Ouest.",zones:"Bamako, Ouagadougou, Niamey",tarifs:"Sur devis"},
];

const lbl = {fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"};
const inp = {width:"100%",border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"10px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F,background:C.white};

function sendLead(payload) {
  return fetch(`${SUPABASE_URL}/rest/v1/leads`,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`},body:JSON.stringify(payload)});
}

function ModalShell({ title, subtitle, color, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"480px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:color||C.forest,padding:"20px",borderRadius:"16px 16px 0 0",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:"15px"}}>✕</button>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"21px"}}>{title}</h2>
          {subtitle&&<p style={{margin:0,color:"rgba(255,255,255,0.75)",fontSize:"13px",fontFamily:F}}>{subtitle}</p>}
        </div>
        <div style={{padding:"20px"}}>{children}</div>
      </div>
    </div>
  );
}

function SentMessage({ title, text, onClose }) {
  return (
    <div style={{textAlign:"center",padding:"16px 0"}}>
      <div style={{fontSize:"42px",marginBottom:"10px"}}>✅</div>
      <h3 style={{margin:"0 0 6px",color:C.dark,fontFamily:FT,fontSize:"18px"}}>{title}</h3>
      <p style={{color:C.sub,fontSize:"14px",fontFamily:F,lineHeight:1.5}}>{text}</p>
      <button onClick={onClose} style={{marginTop:"14px",background:C.forest,color:C.white,border:"none",borderRadius:"8px",padding:"9px 20px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Fermer</button>
    </div>
  );
}

function ServiceFormModal({ onClose }) {
  const [f, setF] = useState({name:"",spec:"",pays:[],email:"",phoneCode:"+221",phone:"",site:"",zones:"",tarifs:"",desc:""});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const togglePays = n => set("pays", f.pays.includes(n)?f.pays.filter(x=>x!==n):[...f.pays,n]);
  const ok = f.name && f.spec && f.email && f.pays.length>0;
  const submit = async () => {
    if (!ok) return;
    setLoading(true);
    try {
      await sendLead({name:f.name,email:f.email,phone:`${f.phoneCode}${f.phone}`,status:"prestataire",
        message:`DEMANDE PRESTATAIRE | Spécialité: ${f.spec} | Pays: ${f.pays.join(", ")} | Zones: ${f.zones} | Tarifs: ${f.tarifs} | Site: ${f.site} | ${f.desc}`});
    } catch(e){}
    setLoading(false); setSent(true);
  };
  return (
    <ModalShell title="Rejoindre l'annuaire" subtitle="Votre fiche sera publiée après vérification" onClose={onClose}>
      {sent ? <SentMessage title="Demande envoyée" text="Nous vérifions votre profil et revenons vers vous sous 48 h." onClose={onClose}/> : (<>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Nom ou société *</label><input style={inp} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Ex : Cabinet Diallo"/></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Spécialité *</label>
          <select style={inp} value={f.spec} onChange={e=>set("spec",e.target.value)}>
            <option value="">Choisir…</option>
            {SPECIALITES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Pays d'intervention *</label>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {COUNTRIES_ANNONCES.map(c=>{const on=f.pays.includes(c.name);return(
              <button key={c.name} type="button" onClick={()=>togglePays(c.name)} style={{background:on?C.forest:C.cream,color:on?C.white:C.dark,border:`1px solid ${on?C.forest:C.sand}`,borderRadius:"20px",padding:"4px 10px",fontSize:"13px",cursor:"pointer",fontFamily:F}}><Flag flag={c.flag} size={14}/>{c.name}</button>);})}
          </div>
        </div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Villes ou zones couvertes</label><input style={inp} value={f.zones} onChange={e=>set("zones",e.target.value)} placeholder="Ex : Dakar, Thiès, Mbour"/></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Email *</label><input type="email" style={inp} value={f.email} onChange={e=>set("email",e.target.value)} placeholder="contact@exemple.com"/></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Téléphone / WhatsApp</label>
          <div style={{display:"flex",gap:"6px"}}>
            <select value={f.phoneCode} onChange={e=>set("phoneCode",e.target.value)} style={{...inp,width:"110px",flexShrink:0}}>
              {PHONE_CODES.map((p,i)=><option key={i} value={p.code}>{noFlag(p.label)}</option>)}
            </select>
            <input type="tel" style={inp} value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="77 123 45 67"/>
          </div>
        </div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Site web</label><input style={inp} value={f.site} onChange={e=>set("site",e.target.value)} placeholder="www.exemple.com"/></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Tarifs indicatifs</label><input style={inp} value={f.tarifs} onChange={e=>set("tarifs",e.target.value)} placeholder="Ex : à partir de 150 000 FCFA"/></div>
        <div style={{marginBottom:"14px"}}><label style={lbl}>Présentation</label><textarea rows={4} style={{...inp,resize:"vertical"}} value={f.desc} onChange={e=>set("desc",e.target.value)} placeholder="Vos services, votre expérience, vos références…"/></div>
        <button onClick={submit} disabled={!ok||loading} style={{width:"100%",background:ok?C.forest:"#ccc",color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"16px",cursor:ok?"pointer":"default",fontFamily:F}}>{loading?"Envoi en cours…":"Envoyer ma demande"}</button>
      </>)}
    </ModalShell>
  );
}

function PubFormModal({ onClose }) {
  const FORMATS = ["Bannière page d'accueil","Encart sous les pays couverts","Encart dans l'annuaire prestataires","Je ne sais pas encore"];
  const [f, setF] = useState({name:"",company:"",email:"",phoneCode:"+221",phone:"",format:"",message:""});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const ok = f.name && f.email && f.format;
  const submit = async () => {
    if (!ok) return;
    setLoading(true);
    try {
      await sendLead({name:f.name,email:f.email,phone:`${f.phoneCode}${f.phone}`,status:"publicite",
        message:`DEMANDE PUBLICITÉ | Société: ${f.company} | Format: ${f.format} | ${f.message}`});
    } catch(e){}
    setLoading(false); setSent(true);
  };
  return (
    <ModalShell title="Faire de la publicité" subtitle="Présentez votre activité aux acheteurs et vendeurs" color={C.gold} onClose={onClose}>
      {sent ? <SentMessage title="Demande envoyée" text="Nous vous recontactons avec nos formats et tarifs." onClose={onClose}/> : (<>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Nom *</label><input style={inp} value={f.name} onChange={e=>set("name",e.target.value)}/></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Société</label><input style={inp} value={f.company} onChange={e=>set("company",e.target.value)}/></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Email *</label><input type="email" style={inp} value={f.email} onChange={e=>set("email",e.target.value)}/></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Téléphone / WhatsApp</label>
          <div style={{display:"flex",gap:"6px"}}>
            <select value={f.phoneCode} onChange={e=>set("phoneCode",e.target.value)} style={{...inp,width:"110px",flexShrink:0}}>
              {PHONE_CODES.map((p,i)=><option key={i} value={p.code}>{noFlag(p.label)}</option>)}
            </select>
            <input type="tel" style={inp} value={f.phone} onChange={e=>set("phone",e.target.value)}/>
          </div>
        </div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Format souhaité *</label>
          <select style={inp} value={f.format} onChange={e=>set("format",e.target.value)}>
            <option value="">Choisir…</option>
            {FORMATS.map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div style={{marginBottom:"14px"}}><label style={lbl}>Votre message</label><textarea rows={3} style={{...inp,resize:"vertical"}} value={f.message} onChange={e=>set("message",e.target.value)} placeholder="Votre activité, votre budget, la période souhaitée…"/></div>
        <button onClick={submit} disabled={!ok||loading} style={{width:"100%",background:ok?C.gold:"#ccc",color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"16px",cursor:ok?"pointer":"default",fontFamily:F}}>{loading?"Envoi en cours…":"Envoyer ma demande"}</button>
      </>)}
    </ModalShell>
  );
}

function Annuaire({ initialSpec="Tous", initialPays="Tous" }) {
  const [spec, setSpec] = useState(initialSpec);
  const [pays, setPays] = useState(initialPays);
  const [sel, setSel] = useState(null);
  const list = PRESTATAIRES_DEMO.filter(p=>(spec==="Tous"||p.specs.includes(spec))&&(pays==="Tous"||p.pays.includes(pays)));
  const chip = on => ({background:on?C.forest:C.white,color:on?C.white:C.dark,border:`1px solid ${on?C.forest:C.sand}`,borderRadius:"20px",padding:"5px 12px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:F,whiteSpace:"nowrap",flexShrink:0});
  return (
    <>
      <h2 style={{fontFamily:FT,fontSize:"18px",fontWeight:500,color:C.dark,margin:"0 0 10px"}}>Annuaire prestataires</h2>
      <div style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"8px",paddingBottom:"2px"}}>
        {["Tous",...SPECIALITES].map(s=><button key={s} onClick={()=>setSpec(s)} style={chip(spec===s)}>{s}</button>)}
      </div>
      <select value={pays} onChange={e=>setPays(e.target.value)} style={{...inp,marginBottom:"12px",fontSize:"14px",padding:"8px 12px"}}>
        <option value="Tous">Tous les pays</option>
        {COUNTRIES_ANNONCES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
      </select>
      <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"10px"}}>Fiches d'exemple, en attendant les premiers prestataires vérifiés.</div>
      {list.length===0&&(
        <div style={{background:C.white,border:`1px dashed ${C.sand}`,borderRadius:"10px",padding:"16px",textAlign:"center",fontSize:"14px",color:C.sub,fontFamily:F,marginBottom:"8px"}}>
          Aucun prestataire pour ce choix. Vous exercez dans ce domaine ? Rejoignez l'annuaire ci-dessous.
        </div>
      )}
      {list.map(p=>(
        <div key={p.id} onClick={()=>setSel(p)} style={{background:C.white,borderRadius:"10px",border:`1px solid ${C.sand}`,padding:"12px",marginBottom:"8px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"6px"}}>
            <div style={{width:42,height:42,borderRadius:"8px",background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"21px",flexShrink:0}}>{p.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:FT,fontSize:"15px",fontWeight:500,color:C.dark}}>{p.name}</div>
              <div style={{fontSize:"12px",color:C.terra,fontWeight:700,fontFamily:F}}>{p.specs.join(", ")}</div>
              <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{p.pays.map(n=><span key={n} style={{marginRight:"8px",whiteSpace:"nowrap"}}><Flag name={n} size={14}/>{n}</span>)}</div>
            </div>
            <span style={{background:"rgba(0,0,0,0.06)",color:C.sub,fontSize:"11px",fontWeight:700,padding:"2px 7px",borderRadius:"3px",fontFamily:F,flexShrink:0}}>Exemple</span>
          </div>
          <div style={{fontSize:"13px",color:C.muted,fontFamily:F,lineHeight:1.4}}>{p.desc}</div>
        </div>
      ))}
      {sel&&(
        <ModalShell title={sel.name} subtitle={sel.specs.join(", ")} onClose={()=>setSel(null)}>
          <div style={{fontSize:"15px",color:C.dark,fontFamily:F,lineHeight:1.6,marginBottom:"14px"}}>{sel.desc}</div>
          {[["Pays",sel.pays.map(n=><span key={n} style={{marginRight:"10px",whiteSpace:"nowrap"}}><Flag name={n}/>{n}</span>)],["Zones couvertes",sel.zones],["Tarifs",sel.tarifs]].map(([k,v])=>(
            <div key={k} style={{marginBottom:"10px"}}>
              <div style={{fontSize:"13px",fontWeight:700,color:C.sub,fontFamily:F}}>{k}</div>
              <div style={{fontSize:"15px",color:C.dark,fontFamily:F}}>{v}</div>
            </div>
          ))}
          <div style={{background:C.cream,borderRadius:"8px",padding:"12px",fontSize:"13px",color:C.sub,fontFamily:F,lineHeight:1.5}}>
            Fiche d'exemple. Pour les prestataires vérifiés, vous trouverez ici leur WhatsApp, leur email et leur site web.
          </div>
        </ModalShell>
      )}
    </>
  );
}

// ─── HERO CARROUSEL ───────────────────────────────
const SLIDES = [
  {url:"https://nhyejaubfxjmmuvetayw.supabase.co/storage/v1/object/public/photos-verified/prix-construction-maison-senegal-HUB-CEPHAS.webp",label:"🏡 Villa moderne, Dakar"},
  {url:"https://nhyejaubfxjmmuvetayw.supabase.co/storage/v1/object/public/photos-verified/photo%20baobab.webp",label:"🌳 Terres agricoles, Afrique"},
  {url:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",label:"🏠 Immobilier Afrique"},
];

function HeroCarousel({ search, setSearch, onSearch }) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % SLIDES.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{position:"relative",height:"280px",overflow:"hidden"}}>
      {/* Image de fond */}
      <div style={{
        position:"absolute",inset:0,
        backgroundImage:`url('${SLIDES[current].url}')`,
        backgroundSize:"cover",backgroundPosition:"center",
        opacity:fade?1:0,
        transition:"opacity 0.5s ease",
      }}/>
      {/* Overlay */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(8,20,12,0.78) 0%,rgba(26,60,46,0.7) 50%,rgba(196,98,45,0.3) 100%)"}}/>
      {/* Ligne dorée bas */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"3px",background:"linear-gradient(90deg,transparent,#D4A017 30%,#D4A017 70%,transparent)",zIndex:2}}/>
      {/* Label pays */}
      {/* Dots */}
      <div style={{position:"absolute",bottom:14,right:14,display:"flex",gap:"5px",zIndex:2}}>
        {SLIDES.map((_,i)=>(
          <button key={i} onClick={()=>{setCurrent(i);setFade(true);}} style={{width:i===current?18:6,height:6,borderRadius:i===current?"3px":"50%",background:i===current?C.gold:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",transition:"all 0.3s",padding:0}}/>
        ))}
      </div>
      {/* Contenu */}
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"20px 18px 22px",zIndex:1}}>
        <div style={{fontSize:"11px",fontWeight:700,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:"10px",fontFamily:F}}>Immobilier · Afrique de l'Ouest & Centrale</div>
        <h1 style={{margin:"0 0 16px",color:C.white,fontFamily:FT,fontSize:"clamp(28px,6vw,44px)",fontWeight:300,lineHeight:1.1,letterSpacing:"-0.02em",textShadow:"0 2px 10px rgba(0,0,0,0.45)"}}>
          Votre patrimoine en Afrique,<br/><em style={{color:C.gold,fontStyle:"italic",fontWeight:300}}>où que vous soyez</em>
        </h1>
        <div style={{background:"rgba(255,255,255,0.97)",borderRadius:"8px",display:"flex",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:"8px",padding:"0 12px",minWidth:0}}>
            <span style={{color:C.sub,flexShrink:0}}>{Icon.searchSm}</span>
            <input type="text" placeholder="Ville, quartier, pays..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,border:"none",outline:"none",fontSize:"14px",color:C.dark,background:"transparent",fontFamily:F,padding:"11px 0",minWidth:0}}/>
          </div>
          <button onClick={onSearch} style={{background:C.terra,color:C.white,border:"none",padding:"0 16px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F,flexShrink:0,whiteSpace:"nowrap"}}>Chercher</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────


// ─── ENCART PUBLICITAIRE ──────────────────────────
function AdSlot({ onClick, style }) {
  return (
    <div style={{borderRadius:"12px",border:`2px solid ${C.gold}`,background:C.cream,padding:"20px 18px",textAlign:"center",...style}}>
      <div style={{fontSize:"11px",fontWeight:700,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:F,marginBottom:"6px"}}>Espace publicitaire</div>
      <div style={{fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.dark,marginBottom:"6px"}}>Votre publicité ici</div>
      <div style={{fontSize:"14px",color:C.sub,fontFamily:F,marginBottom:"14px",lineHeight:1.55}}>Touchez des milliers d'acheteurs et vendeurs en Afrique</div>
      <button onClick={onClick} style={{border:"none",cursor:"pointer",background:C.gold,color:C.white,borderRadius:"9px",padding:"11px 22px",fontSize:"14px",fontWeight:700,fontFamily:F}}>Nous contacter</button>
    </div>
  );
}

// ─── PIED DE PAGE ─────────────────────────────────
function SiteFooter({ onNav, onPub }) {
  const link = {color:"rgba(255,255,255,0.72)",fontSize:"14px",fontFamily:F,textDecoration:"none",cursor:"pointer",background:"none",border:"none",padding:0,textAlign:"left",lineHeight:1.9,display:"block"};
  return (
    <footer style={{background:`linear-gradient(160deg,${C.forest},${C.forestDark})`,borderTop:`2px solid ${C.gold}`,marginTop:"32px",padding:"34px 20px calc(96px + env(safe-area-inset-bottom))"}}>
      <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",flexWrap:"wrap",gap:"30px 48px"}}>
        <div style={{flex:"1 1 220px",minWidth:0}}>
          <div style={{fontSize:"30px",fontWeight:500,color:C.white,fontFamily:FT,lineHeight:1,letterSpacing:"-0.02em"}}>So<span style={{color:C.gold,fontStyle:"italic"}}>ki</span><span style={{color:"#E8A07E"}}>lé</span></div>
          <div style={{fontSize:"14px",color:"rgba(255,255,255,0.6)",fontFamily:F,marginTop:"10px",lineHeight:1.65,maxWidth:"320px"}}>
            L'immobilier en Afrique de l'Ouest &amp; Centrale, où que vous soyez.
          </div>
        </div>
        <div style={{flex:"0 1 150px"}}>
          <div style={{fontSize:"11.5px",fontWeight:700,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:F,marginBottom:"10px"}}>Naviguer</div>
          <a href="/about.html" style={link}>Qui sommes-nous</a>
          <button onClick={()=>onNav("biens")} style={link}>Voir les annonces</button>
          <button onClick={()=>onNav("prestataires")} style={link}>Trouver un prestataire</button>
          <button onClick={onPub} style={link}>Publier un bien</button>
        </div>
        <div style={{flex:"0 1 200px"}}>
          <div style={{fontSize:"11.5px",fontWeight:700,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:F,marginBottom:"10px"}}>Nous contacter</div>
          <a href="mailto:contact@diasporaimmo.com" style={{...link,color:"#E8A07E",fontWeight:600,wordBreak:"break-word"}}>contact@diasporaimmo.com</a>
          <a href="https://www.sokile.com" style={link}>www.sokile.com</a>
        </div>
      </div>
      <div style={{maxWidth:"1200px",margin:"26px auto 0",paddingTop:"18px",borderTop:"1px solid rgba(255,255,255,0.12)",display:"flex",flexWrap:"wrap",gap:"8px 18px",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.45)",fontFamily:F}}>© 2026 Sokilé — Tous droits réservés</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.45)",fontFamily:F}}>Annonces modérées avant publication</div>
      </div>
    </footer>
  );
}

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
  const [showAlert, setShowAlert] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [partnerType, setPartnerType] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [savedProps, setSavedProps] = useState([]);
  const [animIn, setAnimIn] = useState(true);
  const [showPub, setShowPub] = useState(false);
  const [dbProps, setDbProps] = useState([]);
  const [annFilter, setAnnFilter] = useState({spec:"Tous",pays:"Tous"});
  const openAnnuaire = (spec="Tous",pays="Tous") => { setAnnFilter({spec,pays}); setSelectedProp(null); switchTab("prestataires"); };

  // Annonces réelles validées (status = validee)
  useEffect(()=>{
    fetch(`${SUPABASE_URL}/rest/v1/properties?status=eq.validee&select=id,title,type,country,city,neighborhood,description,price_eur,price_xof,surface,rooms,bathrooms,features,advertiser_type,agency_name`,{headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}})
      .then(r=>r.ok?r.json():[])
      .then(rows=>{ if(Array.isArray(rows)) setDbProps(rows.map(r=>({...r,id:`db-${r.id}`,price_eur:r.price_eur||0,price:r.price_xof||0,features:r.features||[],tags:r.features||[],bg:`linear-gradient(135deg,${C.forestMid},${C.forest})`,verified:false,agent_name:r.agency_name||"Particulier"}))); })
      .catch(()=>{});
  },[]);
  const ALL_PROPS = [...dbProps, ...PROPERTIES];

  const types = ["Tous","Vente","Location","Terrain","Commercial"];
  const rooms = ["Tous","1+","2+","3+","4+","5+"];
  const sorts = [{id:"recent",label:"Plus récent"},{id:"price_asc",label:"Prix ↑"},{id:"price_desc",label:"Prix ↓"},{id:"surface_asc",label:"Surface ↑"},{id:"surface_desc",label:"Surface ↓"}];

  const toggleEquipement = eq => setFilterEquipements(prev=>prev.includes(eq)?prev.filter(e=>e!==eq):[...prev,eq]);
  const resetFilters = () => { setFilterCountry("Tous"); setFilterType("Tous"); setFilterRegion("Tous"); setFilterPriceMin(""); setFilterPriceMax(""); setFilterSurfaceMin(""); setFilterSurfaceMax(""); setFilterRooms("Tous"); setFilterEquipements([]); setFilterVerified(false); setSortBy("recent"); setSearch(""); };

  const activeFiltersCount = [filterCountry!=="Tous",filterType!=="Tous",filterRegion!=="Tous",filterPriceMin,filterPriceMax,filterSurfaceMin,filterSurfaceMax,filterRooms!=="Tous",filterEquipements.length>0,filterVerified].filter(Boolean).length;
  const filteredCountries = filterRegion==="Tous"?COUNTRIES:COUNTRIES.filter(c=>c.region===(filterRegion==="Afrique de l'Ouest"?"Ouest":"Centrale"));

  let filtered = ALL_PROPS.filter(p=>{
    const mc=filterCountry==="Tous"||p.country===filterCountry;
    const mr=filterRegion==="Tous"||filteredCountries.map(c=>c.name).includes(p.country);
    const mt=filterType==="Tous"||p.type===filterType;
    const ms=!search||[p.title,p.city,p.country,p.neighborhood].some(s=>s?.toLowerCase().includes(search.toLowerCase()));
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
  const handleSave = (p) => {
    if (!user) { setShowLogin(true); return; }
    setSavedProps(prev => prev.find(s=>s.id===p.id) ? prev.filter(s=>s.id!==p.id) : [...prev, p]);
  };

  const NAV = [
    {id:"accueil",label:"Accueil",icon:Icon.home},
    {id:"biens",label:"Biens",icon:Icon.search},
    {id:"prestataires",label:"Prestataires",icon:Icon.group},
    {id:"pro",label:"Espace pro",icon:Icon.briefcase},
    {id:"compte",label:"Compte",icon:Icon.person},
  ];

  const inputBase = {border:`1px solid ${C.sand}`,borderRadius:"9px",padding:"11px 13px",fontSize:"15px",outline:"none",color:C.dark,fontFamily:F};
  const chipBase = (active) => ({background:active?C.forest:C.white,color:active?C.white:C.dark,border:`1px solid ${active?C.forest:C.sand}`,borderRadius:"22px",padding:"9px 16px",fontSize:"14px",fontWeight:active?700:500,cursor:"pointer",fontFamily:F,transition:"all 0.15s"});

  return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:F,overflowX:"hidden",display:"flex",flexDirection:"column"}}>
      <style>{`*{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}body{margin:0;line-height:1.55}button,input,select,textarea{font-size:inherit}@media(min-width:900px){.desktop-nav{visibility:visible!important;position:static!important}}`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <header style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 16px rgba(0,0,0,0.25)",borderBottom:`2px solid ${C.gold}`}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"0 14px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"78px",gap:"8px",boxSizing:"border-box"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div>
              <div onClick={()=>switchTab("accueil")} style={{fontSize:"clamp(27px,6.6vw,38px)",fontWeight:500,color:C.white,fontFamily:FT,lineHeight:1,letterSpacing:"-0.02em",cursor:"pointer",whiteSpace:"nowrap"}}>So<span style={{color:C.gold,fontStyle:"italic"}}>ki</span><span style={{color:"#E8A07E"}}>lé</span></div>
              <div style={{fontSize:"11.5px",color:"rgba(255,255,255,0.6)",fontFamily:F,marginTop:"5px",letterSpacing:"0.02em",whiteSpace:"nowrap"}}>L'immobilier en Afrique</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            {/* Nav desktop uniquement */}
            <nav style={{display:"flex",gap:"2px",visibility:"hidden",position:"absolute"}} className="desktop-nav">
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>switchTab(n.id)} style={{background:tab===n.id?"rgba(255,255,255,0.12)":"transparent",border:"none",color:tab===n.id?C.white:"rgba(255,255,255,0.5)",padding:"6px 10px",borderRadius:"7px",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{color:tab===n.id?C.white:"rgba(255,255,255,0.5)"}}>{n.icon}</span>
                </button>
              ))}
            </nav>
            <a href="/about.html" style={{background:C.gold,color:C.forestDark,fontSize:"13px",fontWeight:700,fontFamily:F,textDecoration:"none",whiteSpace:"nowrap",padding:"9px 12px",borderRadius:"8px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>Qui sommes-nous</a>

            {user?(
              <div onClick={()=>switchTab("compte")} style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,255,255,0.1)",borderRadius:"20px",padding:"4px 10px 4px 4px",cursor:"pointer"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:C.terra,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:700,color:C.white,fontFamily:F,flexShrink:0}}>
                  {user.name?.slice(0,2).toUpperCase()}
                </div>
                <span style={{fontSize:"13px",color:C.white,fontWeight:600,fontFamily:F,maxWidth:"60px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</span>
              </div>
            ):(
              <button onClick={()=>setShowLogin(true)} style={{background:"transparent",color:C.white,border:"1px solid rgba(255,255,255,0.4)",borderRadius:"8px",padding:"9px 13px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Connexion</button>
            )}
          </div>
        </div>
      </header>

      <main style={{flex:"1 0 auto",width:"100%",boxSizing:"border-box",maxWidth:"1200px",margin:"0 auto",padding:"0 20px 8px",opacity:animIn?1:0,transform:animIn?"translateY(0)":"translateY(6px)",transition:"all 0.2s ease"}}>

        {/* ── ACCUEIL ── */}
        {tab==="accueil"&&(
          <div>
            {/* Hero Carrousel */}
            <HeroCarousel search={search} setSearch={setSearch} onSearch={()=>switchTab("biens")}/>

            {/* Filtres rapides */}
            <div style={{background:C.white,borderBottom:`1px solid ${C.sand}`,padding:"10px 20px",display:"flex",gap:"7px",overflowX:"auto",marginBottom:"1px"}}>
              {["Tous","Vente","Location","Terrain","Commercial"].map(t=>(
                <button key={t} onClick={()=>setFilterType(t)} style={chipBase(filterType===t)}>{t}</button>
              ))}
              <button onClick={()=>setFilterVerified(!filterVerified)} style={chipBase(filterVerified)}>Vérifié</button>
            </div>

            {/* Stats */}
            <div style={{display:"flex",background:C.white,borderBottom:`1px solid ${C.sand}`,marginBottom:"20px"}}>
              {[[ALL_PROPS.length+"+","Biens"],["17","Pays"],["100%","Annonces modérées"],["Gratuit","Publication"]].map(([v,l],i)=>(
                <div key={l} style={{flex:1,padding:"12px 8px",textAlign:"center",borderRight:i<3?`1px solid ${C.sand}`:"none"}}>
                  <div style={{fontSize:"19px",fontWeight:800,color:C.forest,fontFamily:F}}>{v}</div>
                  <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Sélection */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"14px"}}>
              <h2 style={{fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.dark,margin:0}}>Sélection du moment</h2>
              <span onClick={()=>switchTab("biens")} style={{fontSize:"13px",color:C.terra,fontWeight:700,cursor:"pointer",fontFamily:F}}>Voir tout →</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"10px",marginBottom:"24px"}}>
              {ALL_PROPS.slice(0,4).map(p=><PropertyCard key={p.id} p={p} onClick={setSelectedProp} onSave={handleSave} saved={savedProps.some(s=>s.id===p.id)}/>)}
            </div>

            {/* CTA */}
            <div style={{background:C.forest,borderRadius:"12px",padding:"20px",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}>
              <div>
                <h3 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"18px"}}>Publiez votre bien gratuitement</h3>
                <p style={{margin:0,color:"rgba(255,255,255,0.6)",fontSize:"13px",fontFamily:F}}>Particulier ou professionnel · Afrique de l'Ouest & Centrale</p>
              </div>
              <div style={{display:"flex",gap:"7px",flexShrink:0}}>
                <button onClick={()=>{setPartnerType("particulier");user?setShowPartner(true):setShowLogin(true);}} style={{background:C.gold,color:C.white,border:"none",borderRadius:"7px",padding:"9px 16px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Particulier</button>
                <button onClick={()=>{setPartnerType("pro");user?setShowPartner(true):setShowLogin(true);}} style={{background:"transparent",color:C.white,border:"1px solid rgba(255,255,255,0.25)",borderRadius:"7px",padding:"9px 16px",fontWeight:600,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Professionnel</button>
              </div>
            </div>

            {/* Accès annuaire */}
            <div onClick={()=>openAnnuaire()} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"12px",padding:"16px 18px",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",cursor:"pointer",flexWrap:"wrap"}}>
              <div>
                <h3 style={{margin:"0 0 4px",color:C.dark,fontFamily:FT,fontSize:"18px"}}>Besoin d'un géomètre, d'un notaire, d'un architecte ?</h3>
                <p style={{margin:0,color:C.sub,fontSize:"13px",fontFamily:F}}>Des professionnels vérifiés dans le pays de votre projet</p>
              </div>
              <button style={{background:C.forest,color:C.white,border:"none",borderRadius:"7px",padding:"9px 16px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F,flexShrink:0}}>Trouver un prestataire</button>
            </div>

            {/* Pays — Option B fond vert sombre */}
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"20px 16px"}}>
              <div style={{fontSize:"15px",color:"rgba(255,255,255,0.8)",fontFamily:F,marginBottom:"16px"}}>Cliquez sur un pays pour voir les annonces</div>
              {["Afrique de l'Ouest","Afrique Centrale"].map(region=>{
                const regionKey = region==="Afrique de l'Ouest"?"Ouest":"Centrale";
                const pays = COUNTRIES.filter(c=>c.region===regionKey);
                if(!pays.length) return null;
                return(
                  <div key={region} style={{marginBottom:"14px"}}>
                    <div style={{fontSize:"11px",fontWeight:700,color:"rgba(212,160,23,0.8)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"8px",paddingBottom:"6px",borderBottom:"1px solid rgba(255,255,255,0.08)",fontFamily:F}}>{region}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                      {pays.map(p=>(
                        <button key={p.name} onClick={()=>{setFilterCountry(p.name);switchTab("biens");}} style={{display:"flex",alignItems:"center",gap:"5px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"6px",padding:"5px 10px",fontSize:"13px",fontWeight:600,color:"rgba(255,255,255,0.75)",cursor:"pointer",fontFamily:F}}>
                          <Flag flag={p.flag}/>{p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Encart publicitaire — Option A */}
            <div style={{margin:"16px",borderRadius:"10px",border:`2px solid ${C.gold}`,background:C.cream,padding:"18px",textAlign:"center"}}>
              <div style={{fontSize:"11px",fontWeight:700,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:F,marginBottom:"5px"}}>Espace publicitaire</div>
              <div style={{fontFamily:FT,fontSize:"17px",fontWeight:500,color:C.dark,marginBottom:"4px"}}>Votre publicité ici</div>
              <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"12px"}}>Touchez des milliers d'acheteurs et vendeurs en Afrique</div>
              <button onClick={()=>setShowPub(true)} style={{border:"none",cursor:"pointer",display:"inline-block",background:C.gold,color:C.white,borderRadius:"7px",padding:"8px 18px",fontSize:"13px",fontWeight:700,fontFamily:F,textDecoration:"none"}}>Nous contacter</button>
            </div>
          </div>
        )}

        {/* ── BIENS ── */}
        {tab==="biens"&&(
          <div style={{paddingTop:"20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"10px"}}>
              <h2 style={{fontFamily:FT,fontSize:"23px",fontWeight:500,color:C.dark,margin:0}}>Trouver un bien</h2>
              <button onClick={()=>user?setShowAlert(true):setShowLogin(true)} style={{background:C.forest,color:C.white,border:"none",borderRadius:"7px",padding:"8px 14px",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:F}}>Créer une alerte</button>
            </div>

            <div style={{background:C.white,borderRadius:"10px",padding:"14px",marginBottom:"10px",border:`1px solid ${C.sand}`}}>
              <input type="text" placeholder="Rechercher par ville, quartier, pays..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",border:`1px solid ${C.sand}`,borderRadius:"7px",padding:"9px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",marginBottom:"10px",fontFamily:F}}/>
              <div style={{marginBottom:"8px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:C.sub,marginBottom:"5px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em"}}>Région</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {["Tous","Afrique de l'Ouest","Afrique Centrale"].map(r=><button key={r} onClick={()=>setFilterRegion(r)} style={chipBase(filterRegion===r)}>{r}</button>)}
                </div>
              </div>
              <div style={{marginBottom:"8px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:C.sub,marginBottom:"5px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em"}}>Pays</div>
                <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                  <button onClick={()=>setFilterCountry("Tous")} style={chipBase(filterCountry==="Tous")}>Tous</button>
                  {filteredCountries.map(c=><button key={c.name} onClick={()=>setFilterCountry(c.name)} style={{...chipBase(filterCountry===c.name),background:filterCountry===c.name?C.terra:C.white,borderColor:filterCountry===c.name?C.terra:C.sand}}><Flag flag={c.flag} size={14}/>{c.name}</button>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:"12px",fontWeight:700,color:C.sub,marginBottom:"5px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em"}}>Type</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {types.map(t=><button key={t} onClick={()=>setFilterType(t)} style={{...chipBase(filterType===t),background:filterType===t?C.terra:C.white,borderColor:filterType===t?C.terra:C.sand}}>{t}</button>)}
                </div>
              </div>
            </div>

            <div style={{display:"flex",gap:"7px",marginBottom:"10px",alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={()=>setShowFilters(!showFilters)} style={{...chipBase(showFilters),display:"flex",alignItems:"center",gap:"4px"}}>
                Filtres avancés {activeFiltersCount>0&&<span style={{background:showFilters?"rgba(255,255,255,0.3)":C.terra,color:C.white,borderRadius:"10px",padding:"0 5px",fontSize:"12px"}}>{activeFiltersCount}</span>}
              </button>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:`1px solid ${C.sand}`,borderRadius:"20px",padding:"5px 10px",fontSize:"13px",color:C.dark,fontFamily:F,fontWeight:500,cursor:"pointer",background:C.white}}>
                {sorts.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {activeFiltersCount>0&&<button onClick={resetFilters} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:"20px",padding:"5px 12px",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:F}}>✕ Réinitialiser</button>}
            </div>

            {showFilters&&(
              <div style={{background:C.white,borderRadius:"10px",padding:"14px",marginBottom:"10px",border:`1px solid ${C.sand}`}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"12px",marginBottom:"12px"}}>
                  <div>
                    <label style={{fontSize:"12px",fontWeight:700,color:C.sub,display:"block",marginBottom:"5px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em"}}>Budget (€)</label>
                    <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
                      <input type="number" placeholder="Min" value={filterPriceMin} onChange={e=>setFilterPriceMin(e.target.value)} style={{...inputBase,flex:1}}/>
                      <span style={{color:C.sub,fontSize:"14px"}}>—</span>
                      <input type="number" placeholder="Max" value={filterPriceMax} onChange={e=>setFilterPriceMax(e.target.value)} style={{...inputBase,flex:1}}/>
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:"12px",fontWeight:700,color:C.sub,display:"block",marginBottom:"5px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em"}}>Surface (m²)</label>
                    <div style={{display:"flex",gap:"5px",alignItems:"center"}}>
                      <input type="number" placeholder="Min" value={filterSurfaceMin} onChange={e=>setFilterSurfaceMin(e.target.value)} style={{...inputBase,flex:1}}/>
                      <span style={{color:C.sub,fontSize:"14px"}}>—</span>
                      <input type="number" placeholder="Max" value={filterSurfaceMax} onChange={e=>setFilterSurfaceMax(e.target.value)} style={{...inputBase,flex:1}}/>
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:"12px",fontWeight:700,color:C.sub,display:"block",marginBottom:"5px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em"}}>Pièces</label>
                    <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                      {rooms.map(r=><button key={r} onClick={()=>setFilterRooms(r)} style={{...chipBase(filterRooms===r),padding:"4px 9px",borderRadius:"5px"}}>{r}</button>)}
                    </div>
                  </div>
                </div>
                <div style={{marginBottom:"10px"}}>
                  <label style={{fontSize:"12px",fontWeight:700,color:C.sub,display:"block",marginBottom:"6px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em"}}>Équipements</label>
                  <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                    {EQUIPEMENTS.map(eq=><button key={eq} onClick={()=>toggleEquipement(eq)} style={{...chipBase(filterEquipements.includes(eq)),background:filterEquipements.includes(eq)?C.terra:C.white,borderColor:filterEquipements.includes(eq)?C.terra:C.sand,borderRadius:"5px"}}>{filterEquipements.includes(eq)?"✓ ":""}{eq}</button>)}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                  <button onClick={()=>setFilterVerified(!filterVerified)} style={{width:18,height:18,borderRadius:"3px",border:`1.5px solid ${filterVerified?C.terra:C.sand}`,background:filterVerified?C.terra:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontSize:"13px"}}>{filterVerified?"✓":""}</button>
                  <span style={{fontSize:"14px",color:C.dark,fontWeight:500,cursor:"pointer",fontFamily:F}} onClick={()=>setFilterVerified(!filterVerified)}>Biens vérifiés uniquement</span>
                </div>
              </div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <p style={{color:C.sub,fontSize:"13px",margin:0,fontFamily:F}}>{filtered.length} bien{filtered.length>1?"s":""} trouvé{filtered.length>1?"s":""}</p>
              <button onClick={()=>user?setShowAlert(true):setShowLogin(true)} style={{background:"transparent",color:C.forest,border:`1px solid ${C.forest}`,borderRadius:"20px",padding:"4px 10px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:F}}>+ Alerte email</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"10px"}}>
              {filtered.map((p,i)=>(
                <div key={p.id} style={{display:"contents"}}>
                  <PropertyCard p={p} onClick={setSelectedProp} onSave={handleSave} saved={savedProps.some(s=>s.id===p.id)}/>
                  {i===2&&<AdSlot onClick={()=>setShowPub(true)}/>}
                </div>
              ))}
              {filtered.length===0&&(
                <div style={{textAlign:"center",padding:"48px 20px",color:C.sub,gridColumn:"1/-1"}}>
                  <div style={{fontSize:"34px",marginBottom:"8px",opacity:0.4}}>○</div>
                  <p style={{fontFamily:F,fontSize:"15px"}}>Aucun bien ne correspond à votre recherche.</p>
                  <button onClick={()=>user?setShowAlert(true):setShowLogin(true)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"7px",padding:"9px 18px",fontWeight:700,fontSize:"14px",cursor:"pointer",marginTop:"12px",fontFamily:F}}>Créer une alerte</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRESTATAIRES (particuliers) ── */}
        {tab==="prestataires"&&(
          <div>
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"20px 16px"}}>
              <div style={{fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.white,marginBottom:"6px"}}>Des professionnels de confiance sur place</div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,0.75)",fontFamily:F,lineHeight:1.6,maxWidth:"560px"}}>Vous achetez ou faites construire à distance ? Faites vérifier un terrain, trouvez un notaire, un géomètre ou un architecte dans le pays de votre projet. Chaque prestataire est vérifié par Sokilé avant d'apparaître dans l'annuaire, et vous le contactez directement.</div>
            </div>
            <div style={{padding:"16px"}}>
              <Annuaire key={`${annFilter.spec}|${annFilter.pays}`} initialSpec={annFilter.spec} initialPays={annFilter.pays}/>
              <AdSlot onClick={()=>setShowPub(true)} style={{marginTop:"18px"}}/>
              <div style={{textAlign:"center",marginTop:"16px",fontSize:"14px",color:C.sub,fontFamily:F}}>
                Vous êtes prestataire ? <span onClick={()=>switchTab("pro")} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>Rejoignez l'annuaire</span>
              </div>
            </div>
          </div>
        )}

        {/* ── ESPACE PRO ── */}
        {tab==="pro"&&(
          <div>
            {/* Hero Pro */}
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"20px 16px 16px"}}>
              <div style={{fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.white,marginBottom:"4px"}}>Espace Professionnel</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",fontFamily:F,marginBottom:"16px"}}>Rejoignez notre communauté en Afrique de l'Ouest et Centrale</div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {/* Déposer une annonce pro */}
                <button onClick={()=>{setPartnerType("pro");user?setShowPartner(true):setShowLogin(true);}} style={{background:C.terra,color:C.white,border:"none",borderRadius:"8px",padding:"12px 14px",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:F}}>
                  <div style={{width:36,height:36,borderRadius:"8px",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"21px",flexShrink:0}}>🏠</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:700,color:C.white,fontFamily:F}}>Déposer une annonce</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",fontFamily:F}}>Agence ou promoteur immobilier</div>
                  </div>
                </button>
                {/* Proposer un service */}
                <button onClick={()=>setShowServiceForm(true)} style={{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"8px",padding:"12px 14px",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:F}}>
                  <div style={{width:36,height:36,borderRadius:"8px",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"21px",flexShrink:0}}>🛠️</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:700,fontFamily:F}}>Proposer mes services</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.55)",fontFamily:F}}>Géomètre, notaire, architecte, BTP...</div>
                  </div>
                </button>
                {/* Publicité */}
                <button onClick={()=>setShowPub(true)} style={{width:"100%",background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"8px",padding:"12px 14px",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:F,textDecoration:"none"}}>
                  <div style={{width:36,height:36,borderRadius:"8px",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"21px",flexShrink:0}}>📢</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:700,fontFamily:F}}>Faire de la publicité</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.55)",fontFamily:F}}>Bannières et encarts sponsorisés</div>
                  </div>
                </button>
              </div>
            </div>

            <div style={{padding:"16px"}}>
              {/* Encart pub Option A */}
              <div style={{borderRadius:"10px",border:`2px solid ${C.gold}`,background:C.cream,padding:"18px",textAlign:"center",marginTop:"8px"}}>
                <div style={{fontSize:"11px",fontWeight:700,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:F,marginBottom:"5px"}}>Espace publicitaire</div>
                <div style={{fontFamily:FT,fontSize:"17px",fontWeight:500,color:C.dark,marginBottom:"4px"}}>Votre publicité ici</div>
                <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"12px"}}>Touchez des milliers d'acheteurs et vendeurs en Afrique</div>
                <button onClick={()=>setShowPub(true)} style={{border:"none",cursor:"pointer",display:"inline-block",background:C.gold,color:C.white,borderRadius:"7px",padding:"8px 18px",fontSize:"13px",fontWeight:700,fontFamily:F,textDecoration:"none"}}>Nous contacter</button>
              </div>

              {/* Bouton rejoindre annuaire */}
              <button onClick={()=>setShowServiceForm(true)} style={{width:"100%",marginTop:"12px",background:C.forest,color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"15px",cursor:"pointer",fontFamily:F}}>
                Rejoindre l'annuaire prestataires
              </button>
            </div>
          </div>
        )}

        {/* ── COMPTE ── */}
        {tab==="compte"&&(
          <div style={{paddingTop:"20px"}}>
            {!user?(
              <div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:C.cream,border:`1px solid ${C.sand}`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",color:C.sub}}>{Icon.person}</div>
                <h2 style={{fontFamily:FT,fontSize:"23px",color:C.dark,margin:"0 0 8px"}}>Votre espace personnel</h2>
                <p style={{color:C.sub,fontSize:"15px",margin:"0 0 24px",fontFamily:F}}>Connectez-vous pour accéder à vos favoris, alertes et annonces.</p>
                <button onClick={()=>setShowLogin(true)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"8px",padding:"13px 32px",fontWeight:700,fontSize:"16px",cursor:"pointer",fontFamily:F,marginBottom:"10px",display:"block",width:"100%"}}>Se connecter</button>
                <button onClick={()=>setShowLogin(true)} style={{background:"transparent",color:C.terra,border:`1px solid ${C.terra}`,borderRadius:"8px",padding:"12px 32px",fontWeight:700,fontSize:"16px",cursor:"pointer",fontFamily:F,display:"block",width:"100%"}}>Créer un compte gratuit</button>
              </div>
            ):(
              <>
                <div style={{background:C.forest,borderRadius:"12px",padding:"20px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"14px"}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:C.terra,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:700,color:C.white,fontFamily:F}}>
                    {user.name?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{margin:"0 0 2px",color:C.white,fontFamily:FT,fontSize:"18px"}}>{user.name}</h2>
                    <p style={{margin:"0 0 5px",color:"rgba(255,255,255,0.6)",fontSize:"13px",fontFamily:F}}>{user.email}</p>
                    <span style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",fontSize:"12px",fontWeight:600,padding:"2px 9px",borderRadius:"3px",fontFamily:F}}>Membre Sokilé</span>
                  </div>
                </div>
                <div style={{display:"grid",gap:"7px"}}>
                                      {/* Biens sauvegardés */}
                    <div style={{background:C.white,borderRadius:"8px",padding:"12px 14px",border:`1px solid ${C.sand}`}}>
                      <div style={{fontSize:"14px",fontWeight:600,color:C.dark,fontFamily:F,marginBottom:"8px"}}>Biens sauvegardés <span style={{color:C.sub,fontWeight:400}}>({savedProps.length})</span></div>
                      {savedProps.length===0?(
                        <div style={{fontSize:"13px",color:C.sub,fontFamily:F}}>Aucun bien sauvegardé — cliquez sur ❤️ sur une annonce</div>
                      ):(
                        <div style={{display:"grid",gap:"6px"}}>
                          {savedProps.map(p=>(
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}} onClick={()=>setSelectedProp(p)}>
                              <div style={{width:40,height:40,borderRadius:"6px",background:p.bg,flexShrink:0}}/>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:"14px",fontWeight:600,color:C.dark,fontFamily:F,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
                                <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{p.city} · {fmtEUR(p.price_eur)}</div>
                              </div>
                              <span onClick={e=>{e.stopPropagation();handleSave(p);}} style={{fontSize:"16px",cursor:"pointer"}}>❤️</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Autres items */}
                    {[{label:"Messages agents",value:"Fonctionnalité à venir"},{label:"Mes alertes",value:"Fonctionnalité à venir"},{label:"Mes annonces",value:"Fonctionnalité à venir"}].map(item=>(
                    <div key={item.label} style={{background:C.white,borderRadius:"8px",padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",border:`1px solid ${C.sand}`}}>
                      <div>
                        <div style={{fontSize:"14px",fontWeight:600,color:C.dark,fontFamily:F}}>{item.label}</div>
                        <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{item.value}</div>
                      </div>
                      <span style={{color:C.sub,fontSize:"16px"}}>›</span>
                    </div>
                  ))}
                    {/* Contact / Support */}
                    <div style={{background:C.white,borderRadius:"8px",padding:"14px",border:`1px solid ${C.sand}`}}>
                      <div style={{fontSize:"14px",fontWeight:600,color:C.dark,fontFamily:F,marginBottom:"10px"}}>Contact & Support</div>
                      <a href="mailto:contact@sokile.com" style={{display:"flex",alignItems:"center",gap:"8px",textDecoration:"none"}}>
                        <div style={{width:32,height:32,borderRadius:"6px",background:C.cream,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>✉️</div>
                        <div>
                          <div style={{fontSize:"14px",fontWeight:600,color:C.terra,fontFamily:F}}>contact@sokile.com</div>
                          <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>Réponse sous 24h</div>
                        </div>
                      </a>
                    </div>
                </div>
                <button onClick={()=>{setPartnerType("particulier");setShowPartner(true);}} style={{width:"100%",marginTop:"14px",background:C.terra,border:"none",color:C.white,borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"15px",cursor:"pointer",fontFamily:F}}>Publier une annonce</button>
                <button onClick={()=>setUser(null)} style={{width:"100%",marginTop:"8px",background:"transparent",border:`1px solid ${C.sand}`,color:C.sub,borderRadius:"8px",padding:"11px",fontWeight:600,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Se déconnecter</button>
              </>
            )}
          </div>
        )}
        {tab==="compte"&&<div style={{textAlign:"center",padding:"4px 0 24px"}}><a href="/about.html" style={{color:C.terra,fontSize:"14px",fontWeight:700,fontFamily:F,textDecoration:"none"}}>Qui sommes-nous ?</a></div>}
      </main>

      <SiteFooter onNav={switchTab} onPub={()=>{setPartnerType(null);setShowPartner(true);}}/>

      {/* BOTTOM NAV */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.96)",backdropFilter:"blur(12px)",borderTop:`1px solid ${C.sand}`,display:"flex",zIndex:99,boxShadow:"0 -3px 18px rgba(26,60,46,0.10)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>switchTab(n.id)} style={{flex:1,background:"none",border:"none",padding:"11px 4px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",transition:"all 0.15s"}}>
            <span style={{color:tab===n.id?C.terra:C.sub}}>{n.icon}</span>
            <span style={{fontSize:"11.5px",fontWeight:tab===n.id?700:500,color:tab===n.id?C.terra:C.sub,fontFamily:F,letterSpacing:"0.01em"}}>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* MODALS */}
      <PropertyModal p={selectedProp} onClose={()=>setSelectedProp(null)} onSaveFromModal={handleSave} onVerify={p=>openAnnuaire("Vérification terrain",p.country)}/>
      {showLogin&&<LoginModal onClose={()=>setShowLogin(false)} onLogin={u=>setUser(u)}/>}
      {showAlert&&<AlertModal onClose={()=>setShowAlert(false)} filters={{country:filterCountry,type:filterType,search}} user={user}/>}
      {showPartner&&<PartnerModal onClose={()=>setShowPartner(false)} user={user} defaultType={partnerType}/>}
      {showServiceForm&&<ServiceFormModal onClose={()=>setShowServiceForm(false)}/>}
      {showPub&&<PubFormModal onClose={()=>setShowPub(false)}/>}
    </div>
  );
}
