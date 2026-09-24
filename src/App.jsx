import { useState, useRef, useEffect } from "react";
import { Simulateurs } from "./simulations.jsx";
import { initialSimulation, simulationFromListing } from "./simulations.mjs";
import { listingForm, splitPhone, normalizePhone, propertyNature, propertyTransaction, contactError, websiteUrl, photoUrlsInOrder, readAllProperties, isDocumentAvailable } from "./form-fields.mjs";
import { GUIDES, guideReadingTime } from "./guides";
import { addCalendarMonths, publicationMonths, isExpired } from "./lifecycle.mjs";
import { AlertModal, MesAlertes, CancelAlertPage } from "./alerts.jsx";
import { canManagePrograms } from "./auth-session.mjs";
import { ProfessionalActions, PersonalAccountTools } from "./professional-account.jsx";
import { ProgramHome, ProgramList, ProgramPage, ProgramEditor, ProgramManager } from "./programs.jsx";
import { AdPreviewNotice, AdPreviewSlot } from "./ad-preview.jsx";
import { previewOffer } from "./ad-preview.mjs";
import { HomeDiscovery } from "./home-discovery.jsx";
import { PaidOffers } from "./paid-offers.jsx";
import { PaymentsAdmin } from "./payments.jsx";
import { paymentGateway } from "./payments.mjs";
import { normalizeEmail, authFormError, authCallbackState, readAuthResponse, userSessionFromAuth, isAdminSession, applySessionRefresh } from "./auth-session.mjs";
import { buildDecisionMessage, validateModerationResponse, MAX_RESPONSE_LENGTH } from "../supabase/functions/notify-admin/moderation.mjs";

const C = {
  // Charte Sokilé — mêmes teintes que la page « Qui sommes-nous »
  terra: "#B85C3A", gold: "#C9A84C", earth: "#8B5E3C",
  forest: "#1A3C2E", forestMid: "#2D5E45", forestDark: "#0D2019",
  cacao: "#3A2923", cream: "#F5F0E8", light: "#FFFFFF", sand: "#E8DFD0",
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
  {name:"Guinée",flag:"🇬🇳",region:"Autres"},{name:"Guinée-Bissau",flag:"🇬🇼",region:"Autres"},{name:"Mali",flag:"🇲🇱",region:"Ouest"},
  {name:"Mauritanie",flag:"🇲🇷",region:"Autres"},{name:"Niger",flag:"🇳🇪",region:"Ouest"},{name:"Sénégal",flag:"🇸🇳",region:"Ouest"},{name:"Togo",flag:"🇹🇬",region:"Ouest"},
  // Afrique Centrale — ordre alphabétique
  {name:"Burundi",flag:"🇧🇮",region:"Autres"},{name:"Cameroun",flag:"🇨🇲",region:"Centrale"},
  {name:"Centrafrique",flag:"🇨🇫",region:"Centrale"},{name:"Congo",flag:"🇨🇬",region:"Centrale"},
  {name:"Gabon",flag:"🇬🇦",region:"Centrale"},{name:"Guinée Équatoriale",flag:"🇬🇶",region:"Autres"},
  {name:"RD Congo",flag:"🇨🇩",region:"Autres"},{name:"Rwanda",flag:"🇷🇼",region:"Autres"},
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

// Pays disponibles pour les ANNONCES — zone franc CFA francophone
// UEMOA (XOF) : Bénin, Burkina Faso, Côte d'Ivoire, Mali, Niger, Sénégal, Togo
// CEMAC (XAF) : Cameroun, Centrafrique, Congo, Gabon, Tchad
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
  {id:12,title:"Villa Cadjehoun Cotonou",type:"Vente",country:"Bénin",city:"Cotonou",neighborhood:"Cadjehoun",price:70000000,price_eur:106750,surface:200,rooms:4,bathrooms:3,verified:true,agent_name:"Bénin Immo",tags:["Titre foncier","Aéroport"],bg:"linear-gradient(160deg,#1E2A1E,#141E14)",description:"Villa 4 pièces à Cadjehoun.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:13,title:"Villa Lomé Agbalépédogan",type:"Vente",country:"Togo",city:"Lomé",neighborhood:"Agbalépédogan",price:45000000,price_eur:68625,surface:160,rooms:4,bathrooms:2,verified:true,agent_name:"Togo Immo",tags:["Titre foncier","Calme"],bg:"linear-gradient(160deg,#1A2C1A,#101C10)",description:"Villa 4 pièces dans quartier résidentiel calme.",demo:true,features:["Jardin","Titre foncier"]},
  {id:15,title:"Villa Batterie IV Libreville",type:"Vente",country:"Gabon",city:"Libreville",neighborhood:"Batterie IV",price:130000000,price_eur:198250,surface:260,rooms:5,bathrooms:4,verified:true,agent_name:"Gabon Immo",tags:["Vue mer","Titre foncier"],bg:"linear-gradient(160deg,#1E2C1E,#101810)",description:"Villa 5 pièces vue Atlantique.",demo:true,features:["Piscine","Jardin","Parking","Titre foncier"]},
  {id:17,title:"Villa Gombe Brazzaville",type:"Vente",country:"Congo",city:"Brazzaville",neighborhood:"Gombe",price:85000000,price_eur:129625,surface:220,rooms:5,bathrooms:3,verified:true,agent_name:"Congo Immo",tags:["Vue fleuve","Titre foncier"],bg:"linear-gradient(160deg,#1A1E2C,#0E1018)",description:"Villa 5 pièces vue fleuve Congo.",demo:true,features:["Piscine","Jardin","Titre foncier"]},
  {id:18,title:"Local commercial Ouagadougou",type:"Commercial",country:"Burkina Faso",city:"Ouagadougou",neighborhood:"Zogona",price:800000,price_eur:1220,surface:60,verified:false,agent_name:"Particulier",tags:["Vitrine","Rue passante"],bg:"linear-gradient(160deg,#2C2C2C,#1C1C1C)",description:"Local commercial 60m² en zone commerçante.",demo:true,features:["Parking"]},
  {id:19,title:"Villa Niamey Plateau",type:"Vente",country:"Niger",city:"Niamey",neighborhood:"Plateau",price:50000000,price_eur:76250,surface:180,rooms:4,bathrooms:2,verified:true,agent_name:"Niger Immo",tags:["Résidentiel","Titre foncier"],bg:"linear-gradient(160deg,#2C1C10,#1C1008)",description:"Belle villa 4 pièces au Plateau.",demo:true,features:["Jardin","Parking","Titre foncier"]},
  {id:20,title:"Villa Miskine Bangui",type:"Vente",country:"Centrafrique",city:"Bangui",neighborhood:"Miskine",price:35000000,price_eur:53375,surface:150,rooms:3,bathrooms:2,verified:false,agent_name:"RCA Immo",tags:["Résidentiel","Titre foncier"],bg:"linear-gradient(160deg,#2A1E10,#1A1208)",description:"Villa 3 pièces à Miskine.",demo:true,features:["Jardin","Titre foncier"]},
  {id:21,title:"Villa Chagoua N'Djamena",type:"Vente",country:"Tchad",city:"N'Djamena",neighborhood:"Chagoua",price:40000000,price_eur:61000,surface:160,rooms:3,bathrooms:2,verified:false,agent_name:"Tchad Immo",tags:["Résidentiel","Titre foncier"],bg:"linear-gradient(160deg,#281C10,#181008)",description:"Villa 3 pièces à Chagoua.",demo:true,features:["Jardin","Titre foncier"]},
];

const EQUIPEMENTS = ["Piscine","Jardin","Parking","Meublé","Titre foncier","Terrasse"];

/* GUIDES_MOVED_TO_SRC_GUIDES_JS
  {
    id:"verifier-terrain",
    category:"Acheter",
    country:"Afrique francophone",
    icon:"📄",
    title:"Acheter un terrain : les vérifications avant de signer",
    excerpt:"Les documents, interlocuteurs et contrôles à prévoir avant tout engagement.",
    reading:"6 min",
    sections:[
      {title:"Identifier le propriétaire",text:"Demandez l'identité complète du vendeur et vérifiez qu'elle correspond aux documents présentés. Une procuration doit également être contrôlée."},
      {title:"Faire localiser la parcelle",text:"Faites confirmer les limites, la superficie, l'accès et la situation réelle du terrain par un professionnel compétent sur place."},
      {title:"Contrôler les documents",text:"Les documents attendus varient selon le pays et le statut du terrain. Faites-les examiner par un notaire, un juriste ou l'administration compétente avant tout versement."},
      {title:"Tracer chaque paiement",text:"Évitez les paiements en espèces sans justificatif. Conservez les échanges, reçus, contrats et preuves de virement."},
    ],
  },
  {
    id:"choisir-geometre",
    category:"Prestataires",
    country:"Tous pays",
    icon:"📐",
    title:"Comment choisir un géomètre pour votre projet ?",
    excerpt:"Les questions à poser avant une délimitation, un bornage ou une construction.",
    reading:"4 min",
    sections:[
      {title:"Vérifier son activité",text:"Demandez son identité professionnelle, sa zone d'intervention et des exemples de missions comparables."},
      {title:"Définir la mission",text:"Précisez par écrit la parcelle concernée, les mesures attendues, les documents livrés, les délais et le prix."},
      {title:"Comparer les propositions",text:"Un devis clair doit distinguer les honoraires, les déplacements, les démarches administratives et les éventuels frais supplémentaires."},
    ],
  },
  {
    id:"acheter-distance",
    category:"Diaspora",
    country:"International",
    icon:"🌍",
    title:"Acheter depuis l'étranger sans avancer à l'aveugle",
    excerpt:"Une méthode simple pour organiser les visites, les documents et les paiements à distance.",
    reading:"7 min",
    sections:[
      {title:"Créer une équipe locale",text:"Identifiez séparément la personne qui visite, le professionnel qui vérifie les documents et celui qui formalise la transaction."},
      {title:"Exiger des preuves datées",text:"Demandez des vidéos récentes, la localisation précise et des documents lisibles. Vérifiez les informations auprès de sources indépendantes."},
      {title:"Avancer par étapes",text:"Ne versez pas l'intégralité du prix avant les contrôles nécessaires. Chaque étape doit correspondre à un document ou à un engagement écrit."},
    ],
  },
  {
    id:"xof-xaf",
    category:"Comprendre",
    country:"Zone franc CFA",
    icon:"💱",
    title:"XOF et XAF : comprendre les deux francs CFA",
    excerpt:"Deux monnaies distinctes, utilisées dans deux zones économiques différentes.",
    reading:"3 min",
    sections:[
      {title:"Deux zones monétaires",text:"Le XOF est utilisé dans plusieurs pays d'Afrique de l'Ouest, tandis que le XAF circule dans plusieurs pays d'Afrique centrale."},
      {title:"Afficher les prix clairement",text:"Sur Sokilé, le prix local reste la référence. La conversion en euros sert uniquement de repère et peut être arrondie."},
      {title:"Prévoir les frais",text:"Pour une transaction réelle, renseignez-vous sur les frais bancaires, les justificatifs et les règles de transfert applicables."},
    ],
  },
  {
    id:"budget-construction",
    category:"Construire",
    country:"Tous pays",
    icon:"🏗️",
    title:"Préparer le budget d'une construction",
    excerpt:"Terrain, études, matériaux, main-d'œuvre et imprévus : les postes à anticiper.",
    reading:"5 min",
    sections:[
      {title:"Séparer terrain et construction",text:"Le coût d'acquisition du terrain ne doit pas masquer les dépenses de préparation, de raccordement et d'accès au chantier."},
      {title:"Faire chiffrer le même projet",text:"Pour comparer plusieurs entreprises, transmettez un descriptif identique et demandez ce qui est inclus ou exclu de chaque devis."},
      {title:"Conserver une marge",text:"Prévoyez une réserve pour les variations de prix, les adaptations techniques et les retards éventuels."},
    ],
  },
  {
    id:"eviter-fausses-annonces",
    category:"Sécurité",
    country:"Tous pays",
    icon:"🛡️",
    title:"Reconnaître une annonce immobilière à risque",
    excerpt:"Les signaux qui doivent vous inciter à vérifier davantage avant de poursuivre.",
    reading:"4 min",
    sections:[
      {title:"Un prix anormalement bas",text:"Un écart important avec les prix habituellement constatés doit conduire à demander davantage de justificatifs."},
      {title:"Une urgence artificielle",text:"Méfiez-vous des demandes de paiement immédiat, des interlocuteurs qui refusent une visite ou qui évitent les questions précises."},
      {title:"Des informations incohérentes",text:"Comparez les photos, la localisation, le nom du propriétaire et les documents. Une incohérence doit être éclaircie avant de continuer."},
    ],
  },
*/

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
  book: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H8a4 4 0 0 0-4 4v13a3 3 0 0 0 3 3h11a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 18H7a1 1 0 0 1 0-2h11v2zm0-4H8a4.9 4.9 0 0 0-2 .42V6a2 2 0 0 1 2-2h10v12z"/></svg>,
  star: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  person: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
  searchSm: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  wa: <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
};


// ─── PHOTOS D'ANNONCE ─────────────────────────────
const MAX_PHOTOS = 10;

// ─── MÉMOIRE DU NAVIGATEUR ────────────────────────
// Le site oubliait tout au rechargement : session et favoris sont désormais conservés.
const CLE_SESSION = "sokile.session";
const CLE_FAVORIS = "sokile.favoris";
function lireLocal(cle, defaut) {
  try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch(e) { return defaut; }
}
function ecrireLocal(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch(e) {}
}
function effacerLocal(cle) {
  try { localStorage.removeItem(cle); } catch(e) {}
}
const CONTACT_MAIL = "contact@sokile.com";

// Personne ne tape les accents sur un clavier de téléphone
const sansAccent = (s) => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const PHOTO_BUCKET = "photos-verified";

// Réduit la photo avant envoi : indispensable sur connexion mobile africaine
function compresserPhoto(file, maxSide = 1600, qualite = 0.82) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(null);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (Math.max(w, h) > maxSide) {
        const r = maxSide / Math.max(w, h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      cv.toBlob(b => resolve(b || file), "image/jpeg", qualite);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function envoyerPhotos(files, user, onProgress) {
  if (!user?.id || !user?.token) throw new Error("AUTH_REQUIRED");
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const blob = await compresserPhoto(files[i]);
      if (!blob) continue;
      const chemin = `annonces/${user.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${chemin}`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${user.token}`, "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (res.ok) urls.push(`${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${chemin}`);
    } catch (e) { /* on continue avec les suivantes */ }
    onProgress && onProgress(i + 1, files.length);
  }
  return urls;
}


// ─── ENVOI FIABLE ─────────────────────────────────
// Toute écriture passe par ici : on lit la réponse, on ne fait plus semblant.
async function ecrire(table, donnees, accessToken = null) {
  // Les demandes publiques sont en écriture seule : RETURNING exigerait un droit de lecture.
  const writeOnly = table === "leads" || table === "reports";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${accessToken || SUPABASE_KEY}`,
      "Prefer": writeOnly ? "return=minimal" : "return=representation",
    },
    body: JSON.stringify(donnees),
  });
  if (res.ok) return { ok: true, data: await res.json().catch(()=>null) };
  let motif = "";
  try { const j = await res.json(); motif = j.message || j.hint || j.details || ""; } catch(e) {}
  return { ok: false, statut: res.status, motif };
}

async function lire(table, query = "", accessToken = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${accessToken || SUPABASE_KEY}` },
  });
  if (res.ok) return { ok:true, data:await res.json() };
  return { ok:false, statut:res.status, motif:await res.text().catch(()=>"") };
}

async function modifier(table, id, donnees, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method:"PATCH",
    headers:{
      "Content-Type":"application/json", "apikey":SUPABASE_KEY,
      "Authorization":`Bearer ${accessToken}`, "Prefer":"return=representation",
    },
    body:JSON.stringify(donnees),
  });
  if (res.ok) return { ok:true, data:await res.json().catch(()=>null) };
  let motif=""; try { const j=await res.json(); motif=j.message||j.hint||j.details||""; } catch(e) {}
  return { ok:false, statut:res.status, motif };
}

// Message compréhensible, sans jargon technique
function messageErreur(r) {
  if (r.statut === 401 || r.statut === 403)
    return "Le serveur a refusé l'enregistrement. Réessayez dans un instant ; si le problème persiste, écrivez-nous à " + CONTACT_MAIL + ".";
  if (r.statut === 409)
    return "Cette demande semble avoir déjà été envoyée.";
  if (r.statut >= 500)
    return "Le serveur est momentanément indisponible. Réessayez dans quelques minutes.";
  if (!r.statut)
    return "Connexion interrompue. Vérifiez votre connexion internet et réessayez.";
  return "L'enregistrement a échoué" + (r.motif ? ` (${r.motif})` : "") + ". Réessayez, ou écrivez-nous à " + CONTACT_MAIL + ".";
}

// Bandeau d'erreur réutilisable
function BandeauErreur({ texte, onRetry }) {
  if (!texte) return null;
  return (
    <div style={{background:"#FDECEA",border:"1px solid #F5C6C2",borderRadius:"9px",padding:"12px 14px",marginBottom:"12px"}}>
      <div style={{fontSize:"14px",fontWeight:700,color:"#A93226",fontFamily:F,marginBottom:"3px"}}>L'envoi n'a pas abouti</div>
      <div style={{fontSize:"13.5px",color:"#7B241C",fontFamily:F,lineHeight:1.55}}>{texte}</div>
      {onRetry&&<button onClick={onRetry} style={{marginTop:"9px",background:"#A93226",color:C.white,border:"none",borderRadius:"8px",padding:"9px 16px",fontWeight:700,fontSize:"13.5px",cursor:"pointer",fontFamily:F}}>Réessayer</button>}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────
async function signUp(email, password, meta) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
    body:JSON.stringify({email:normalizeEmail(email),password,data:meta}),
  });
  return readAuthResponse(res);
}
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
    body:JSON.stringify({email:normalizeEmail(email),password}),
  });
  return readAuthResponse(res);
}
async function refreshSession(refreshToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
    body:JSON.stringify({refresh_token:refreshToken}),
  });
  return readAuthResponse(res);
}
async function requestPasswordReset(email) {
  const redirectTo = `${window.location.origin}/`;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method:"POST", headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
    body:JSON.stringify({email:normalizeEmail(email)}),
  });
  return readAuthResponse(res);
}
async function updatePassword(accessToken, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method:"PUT",
    headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${accessToken}`},
    body:JSON.stringify({password}),
  });
  return readAuthResponse(res);
}
// ─── LOGIN MODAL ──────────────────────────────────
function LoginModal({ onClose, onLogin, initialMode="login" }) {
  const [callback] = useState(() => authCallbackState(window.location.hash));
  const recoveryToken = callback?.token || "";
  const [mode, setMode] = useState(callback?.mode || initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneCode, setPhoneCode] = useState("+33");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState("particulier");
  const [agency, setAgency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(callback?.error || "");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (callback) window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }, [callback]);

  const inputStyle = {width:"100%",border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"11px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F};

  const handleSubmit = async () => {
    if (loading) return;
    const validation = authFormError(mode, {email, password, agency, accountType});
    if (validation) { setError(validation); return; }
    if (mode === "signup" && phone.trim() && !normalizePhone(phoneCode, phone)) {
      setError("Indiquez un numéro de téléphone valide avec son indicatif."); return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode==="forgot") {
        const d = await requestPasswordReset(email);
        if (d.error) setError(d.error.message||"Impossible d’envoyer l’e-mail de réinitialisation.");
        else setSuccess("Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé. Vérifiez aussi vos courriers indésirables.");
      } else if (mode==="reset") {
        if (!recoveryToken) {
          setError("Ce lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien.");
        } else {
          const d = await updatePassword(recoveryToken,password);
          if (d.error) setError(d.error.message||"Impossible de modifier le mot de passe.");
          else {
            window.history.replaceState({}, document.title, window.location.pathname+window.location.search);
            setPassword(""); setMode("login");
            setSuccess("Mot de passe modifié. Vous pouvez maintenant vous connecter.");
          }
        }
      } else if (mode==="signup") {
        const d = await signUp(email, password, {name, phone:normalizePhone(phoneCode,phone)||"", account_type:accountType, agency:accountType==="pro"?agency:""});
        if (d.error) setError(d.error.message||"Erreur lors de l'inscription");
        else setSuccess("Compte créé ! Vérifiez votre email.");
      } else {
        const d = await signIn(email, password);
        const session = userSessionFromAuth(d);
        if (!session) setError(d.error?.message || "Connexion non confirmée par le serveur. Veuillez réessayer.");
        else { onLogin(session); onClose(); }
      }
    } catch(e) {
      setError("Connexion impossible pour le moment. Vérifiez votre connexion et réessayez.");
    }
    setLoading(false);
  };

  const canSubmit = !loading && (
    mode==="forgot" ? Boolean(email) :
    mode==="reset" ? password.length>=8 :
    Boolean(email&&password) && !(mode==="signup"&&accountType==="pro"&&!agency)
  );

  

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"400px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:C.forest,padding:"22px",borderRadius:"16px 16px 0 0",textAlign:"center",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.1)",border:"none",color:C.white,width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:"16px"}}>✕</button>
          <div style={{width:40,height:40,borderRadius:"50%",background:C.gold,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={C.forest}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"21px"}}>{mode==="login"?"Connexion":mode==="signup"?"Créer un compte":mode==="forgot"?"Mot de passe oublié":"Nouveau mot de passe"}</h2>
                  </div>
        <form onSubmit={e=>{e.preventDefault();handleSubmit();}} style={{padding:"20px"}}>

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
          {mode!=="reset"&&<div style={{marginBottom:"10px"}}><label htmlFor="auth-email" style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Email</label><input id="auth-email" autoComplete="email" required type="email" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/></div>}
          {mode!=="forgot"&&<div style={{marginBottom:mode==="signup"?"10px":"8px"}}><label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}} htmlFor="auth-password">{mode==="reset"?"Nouveau mot de passe":"Mot de passe"}</label><input id="auth-password" required autoComplete={mode==="login"?"current-password":"new-password"} minLength={mode==="login"?undefined:8} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/></div>}
          {mode==="login"&&<div style={{textAlign:"right",marginBottom:"16px"}}><button type="button" onClick={()=>{setMode("forgot");setError("");setSuccess("");}} style={{background:"none",border:"none",padding:0,color:C.terra,fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Mot de passe oublié ?</button></div>}
          {mode==="forgot"&&<p style={{fontSize:"13px",lineHeight:1.5,color:C.sub,fontFamily:F,margin:"0 0 16px"}}>Saisissez votre adresse e-mail. Vous recevrez un lien sécurisé pour choisir un nouveau mot de passe.</p>}
          {mode==="reset"&&<p style={{fontSize:"13px",lineHeight:1.5,color:C.sub,fontFamily:F,margin:"0 0 16px"}}>Choisissez au moins 8 caractères.</p>}
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
          {error&&<div role="alert" style={{background:"#FEE2E2",color:"#DC2626",borderRadius:"8px",padding:"9px 12px",marginBottom:"12px",fontSize:"14px",fontFamily:F}}>{error}</div>}
          {success&&<div role="status" style={{background:C.successBg,color:C.success,borderRadius:"8px",padding:"9px 12px",marginBottom:"12px",fontSize:"14px",fontFamily:F}}>{success}</div>}
          <button type="submit" disabled={!canSubmit} style={{width:"100%",background:canSubmit?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"16px",cursor:canSubmit?"pointer":"not-allowed",fontFamily:F,marginBottom:"12px",letterSpacing:"0.03em"}}>
            {loading?"...":mode==="login"?"Se connecter":mode==="signup"?"Créer mon compte":mode==="forgot"?"Envoyer le lien":"Modifier le mot de passe"}
          </button>
          <div style={{textAlign:"center",fontSize:"14px",color:C.sub,fontFamily:F}}>
            {mode==="login"?<>Pas encore de compte ? <span onClick={()=>{setMode("signup");setError("");setSuccess("");}} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>S'inscrire gratuitement</span></>:mode==="signup"?<>Déjà un compte ? <span onClick={()=>{setMode("login");setError("");setSuccess("");}} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>Se connecter</span></>:mode==="forgot"?<span onClick={()=>{setMode("login");setError("");setSuccess("");}} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>Retour à la connexion</span>:null}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ALERT MODAL ──────────────────────────────────
// ─── PARTNER MODAL ────────────────────────────────
function PartnerModal({ onClose, user, defaultType, existing=null, onSaved }) {
  const [type, setType] = useState(existing?.advertiser_type||defaultType||user?.account_type||null);
  const [form, setForm] = useState(() => listingForm(existing, user, PHONE_CODES));
  const [photos, setPhotos] = useState(() => (Array.isArray(existing?.photos)?existing.photos:[]).map(url=>({url,apercu:url})));
  const [envoiPhoto, setEnvoiPhoto] = useState("");
  const [photoErr, setPhotoErr] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [manquants, setManquants] = useState([]);
  const fileRef = useRef();

  const ajouterPhotos = (liste) => {
    setPhotoErr("");
    const choisies = [...liste].filter(f=>f.type.startsWith("image/"));
    const trop = choisies.filter(f=>f.size > 8*1024*1024);
    const ok = choisies.filter(f=>f.size <= 8*1024*1024);
    const place = MAX_PHOTOS - photos.length;
    if (choisies.length < liste.length) setPhotoErr("Seules les images sont acceptées.");
    else if (trop.length) setPhotoErr(`${trop.length} photo(s) ignorée(s) : plus de 8 Mo.`);
    else if (ok.length > place) setPhotoErr(`Vous pouvez ajouter ${MAX_PHOTOS} photos au maximum.`);
    const retenues = ok.slice(0, Math.max(0, place));
    setPhotos(p => [...p, ...retenues.map(f => ({ file: f, apercu: URL.createObjectURL(f) }))]);
  };
  const retirerPhoto = (i) => setPhotos(p => { const c=[...p]; try{if(c[i].file)URL.revokeObjectURL(c[i].apercu);}catch(e){} c.splice(i,1); return c; });
  const mettreEnCouverture = (i) => setPhotos(p => { const c=[...p]; const [x]=c.splice(i,1); return [x,...c]; });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setDetail = (k,v) => setForm(f=>({...f,details:{...(f.details||{}),[k]:v}}));
  const inputStyle = {width:"100%",border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"10px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F};
  const champ = (k) => manquants.includes(k) ? {...inputStyle, border:"2px solid #C0392B", background:"#FDF3F2"} : inputStyle;

  // Champs indispensables pour qu'une annonce serve à quelque chose
  const CHAMPS_REQUIS = [
    ["name","Votre nom"], ["email","Votre email"], ["phone","Votre téléphone"],
    ["transaction","Vendre ou louer"], ["nature","Nature du bien"], ["title","Titre de l'annonce"],
    ["country","Pays"], ["city","Ville"], ["price_eur","Prix"], ["description","Description"],
  ];

  const verifier = () => {
    const vides = CHAMPS_REQUIS.filter(([k])=>!String(form[k]||"").trim()).map(([k,l])=>({k,l}));
    if (type==="pro" && !String(form.agency||"").trim()) vides.push({k:"agency",l:"Nom de l'agence"});
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(form.email)) vides.push({k:"email",l:"Email (format invalide)"});
    if (form.phone && !normalizePhone(form.phoneCode, form.phone)) vides.push({k:"phone",l:"Téléphone (numéro invalide)"});
    if (form.price_eur && !(parseInt(form.price_eur)>0)) vides.push({k:"price_eur",l:"Prix (doit être supérieur à 0)"});
    if (String(form.description||"").trim().length>0 && String(form.description).trim().length<30)
      vides.push({k:"description",l:"Description (30 caractères minimum)"});
    // Champs obligatoires propres à la nature de bien choisie
    if (form.nature) {
      champsDe(form.nature, form.transaction)
        .filter(c=>c.requis)
        .forEach(c=>{
          const v = form.details?.[c.k];
          if (v===undefined || String(v).trim()==="") vides.push({k:"d_"+c.k, l:c.l});
        });
    }
    if (!(photos.length)) vides.push({k:"photos",l:"Au moins une photo"});
    return vides;
  };

  const handleSubmit = async () => {
    setErreur("");
    if (!user?.id || !user?.token) {
      setErreur("Votre session a expiré. Reconnectez-vous avant de publier l'annonce.");
      return;
    }
    const vides = verifier();
    setManquants(vides.map(v=>v.k));
    if (vides.length) {
      setErreur("Complétez les champs suivants : " + vides.map(v=>v.l).join(", ") + ".");
      const el = document.querySelector("[data-modal-scroll]");
      if (el) el.scrollTo({top:0,behavior:"smooth"});
      return;
    }
    setLoading(true);
    let urlsPhotos = [];
    const nouvellesPhotos = photos.filter(p=>p.file);
    try {
      setEnvoiPhoto(`Envoi des photos… 0/${nouvellesPhotos.length}`);
      urlsPhotos = await envoyerPhotos(nouvellesPhotos.map(p=>p.file), user, (n,tot)=>setEnvoiPhoto(`Envoi des photos… ${n}/${tot}`));
      setEnvoiPhoto("");
    } catch(e){ setEnvoiPhoto(""); }

    let toutesPhotos;
    try { toutesPhotos = photoUrlsInOrder(photos, urlsPhotos); }
    catch(e) { setLoading(false); setErreur(e.message); return; }

    const payload = {
      owner_id:user.id,
      user_email:normalizeEmail(form.email), user_name:form.name.trim(), user_phone:normalizePhone(form.phoneCode,form.phone),
      title:form.title,
      type: form.transaction==="location" ? "Location" : "Vente",
      transaction: form.transaction,
      nature: form.nature,
      details: Object.fromEntries(Object.entries(form.details||{}).filter(([,v])=>String(v).trim()!=="")),
      country:form.country, city:form.city, neighborhood:form.neighborhood,
      description:form.description, price_eur:parseInt(form.price_eur)||null,
      price:parseInt(form.price_xof)||null, surface:parseInt(form.surface)||null,
      rooms:parseInt(form.rooms)||null, bathrooms:parseInt(form.bathrooms)||null,
      tags:form.features||[], status:"en_attente", active:false, verified:false, advertiser_type:type,
      agency_name:form.agency||null, photos:toutesPhotos, moderation_note:null, motif_rejet:null,
    };
    const r = await (existing
      ? modifier("properties", existing.id, payload, user.token)
      : ecrire("properties", payload, user.token)
    ).catch(e=>({ok:false,statut:0,motif:String(e)}));

    if (!r.ok) {
      setLoading(false);
      setErreur(messageErreur(r));
      return;   // le formulaire reste rempli
    }

    // trace interne, sans conséquence pour l'utilisateur si elle échoue
    setLoading(false); setSent(true); onSaved?.();
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div data-modal-scroll style={{background:C.white,borderRadius:"16px",maxWidth:"480px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:C.terra,padding:"20px",borderRadius:"16px 16px 0 0",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:"15px"}}>✕</button>
          <h2 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"21px"}}>{existing?"Modifier mon annonce":"Publier une annonce"}{type==="pro"?" · Professionnel":type==="particulier"?" · Particulier":""}</h2>
          <p style={{margin:0,color:"rgba(255,255,255,0.75)",fontSize:"13px",fontFamily:F}}>Gratuit · Afrique de l'Ouest & Centrale</p>
        </div>
        <div style={{padding:"20px"}}>
          {sent?(<div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:"42px",marginBottom:"10px"}}>🎉</div>
            <h3 style={{margin:"0 0 6px",color:C.dark,fontFamily:FT,fontSize:"18px"}}>{existing?"Modification envoyée !":"Demande envoyée !"}</h3>
            <p style={{color:C.sub,fontSize:"14px",fontFamily:F}}>Votre annonce est maintenant en attente de validation par Sokilé.</p>
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
                  <input placeholder="Ex : Teranga Immobilier" value={form.agency||""} onChange={e=>set("agency",e.target.value)} style={champ("agency")}/>
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
                  <input type="tel" placeholder="6 12 34 56 78" value={form.phone} onChange={e=>set("phone",e.target.value)} style={{...champ("phone"),flex:1}}/>
                </div>
              </div>
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Pays</label>
                <select value={form.country} onChange={e=>set("country",e.target.value)} style={{...champ("country")}}>
                  {COUNTRIES_ANNONCES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {/* Vendre ou louer */}
              <div style={{marginBottom:"14px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"6px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Vous souhaitez *</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {[["vente","Vendre"],["location","Louer"]].map(([v,l])=>(
                    <button key={v} type="button" onClick={()=>{set("transaction",v);set("type",v==="location"?"Location":"Vente");}}
                      style={{background:form.transaction===v?C.forest:C.white,color:form.transaction===v?C.white:C.dark,border:`1px solid ${form.transaction===v?C.forest:(manquants.includes("transaction")?"#C0392B":C.sand)}`,borderRadius:"10px",padding:"14px",fontWeight:700,fontSize:"15px",cursor:"pointer",fontFamily:F}}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Nature du bien */}
              <div style={{marginBottom:"14px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"6px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Nature du bien *</label>
                {FAMILLES.map(fam=>(
                  <div key={fam} style={{marginBottom:"10px"}}>
                    <div style={{fontSize:"11.5px",fontWeight:700,color:C.sub,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:F,marginBottom:"6px"}}>{fam}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
                      {naturesDeFamille(fam).map(([k,v])=>(
                        <button key={k} type="button" onClick={()=>set("nature",k)}
                          style={{background:form.nature===k?C.forest:C.white,color:form.nature===k?C.white:C.dark,border:`1px solid ${form.nature===k?C.forest:(manquants.includes("nature")?"#C0392B":C.sand)}`,borderRadius:"20px",padding:"9px 14px",fontSize:"14px",fontWeight:form.nature===k?700:500,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",gap:"6px"}}>
                          <span>{v.icone}</span>{v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Titre */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Titre de l'annonce *</label>
                <input placeholder="Ex: Villa 4 pièces avec piscine à Cocody" value={form.title||""} onChange={e=>set("title",e.target.value)} style={champ("title")}/>
              </div>
              {/* Ville + Quartier */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Ville *</label>
                  <input placeholder="Ex: Abidjan" value={form.city||""} onChange={e=>set("city",e.target.value)} style={champ("city")}/>
                </div>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Quartier</label>
                  <input placeholder="Ex: Cocody" value={form.neighborhood||""} onChange={e=>set("neighborhood",e.target.value)} style={inputStyle}/>
                </div>
              </div>
              {/* Prix */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>{form.transaction==="location"?"Loyer mensuel":"Prix de vente"}</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  <div style={{position:"relative"}}>
                    <input type="number" placeholder={form.transaction==="location"?"Loyer en €":"Prix en €"} value={form.price_eur||""} onChange={e=>{set("price_eur",e.target.value);set("price_xof",Math.round(e.target.value*655.957));}} style={{...champ("price_eur"),paddingRight:"28px"}}/>
                    <span style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",fontSize:"13px",color:C.sub,fontFamily:F}}>€</span>
                  </div>
                  <div style={{position:"relative"}}>
                    <input type="number" placeholder={form.transaction==="location"?"Loyer en FCFA":"Prix en FCFA"} value={form.price_xof||""} onChange={e=>{set("price_xof",e.target.value);set("price_eur",Math.round(e.target.value/655.957));}} style={{...inputStyle,paddingRight:"40px"}}/>
                    <span style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",fontSize:"12px",color:C.sub,fontFamily:F}}>FCFA</span>
                  </div>
                </div>
                {form.price_eur&&<div style={{fontSize:"12px",color:C.terra,marginTop:"4px",fontFamily:F}}>≈ {new Intl.NumberFormat("fr-FR").format(Math.round(form.price_eur*655.957))} FCFA · {new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(form.price_eur)}</div>}
              </div>
              {/* Caractéristiques propres à la nature du bien */}
              {form.nature ? (
                <div style={{background:C.cream,border:`1px solid ${C.sand}`,borderRadius:"12px",padding:"15px",marginBottom:"12px"}}>
                  <div style={{fontSize:"12px",fontWeight:700,color:C.forest,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:F,marginBottom:"12px",display:"flex",alignItems:"center",gap:"7px"}}>
                    <span style={{fontSize:"16px"}}>{NATURES[form.nature].icone}</span>
                    {NATURES[form.nature].label}{form.transaction==="location"?" · à louer":""}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"10px"}}>
                    {champsDe(form.nature, form.transaction).map(c=>{
                      const val = form.details?.[c.k] ?? "";
                      const enDefaut = manquants.includes("d_"+c.k);
                      const st = enDefaut ? {...inputStyle,border:"2px solid #C0392B",background:"#FDF3F2"} : inputStyle;
                      return (
                        <div key={c.k}>
                          <label style={{fontSize:"12px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F}}>
                            {c.l}{c.requis?" *":""}
                          </label>
                          {c.t==="choix" ? (
                            <select aria-label={c.l} value={val} onChange={e=>setDetail(c.k,e.target.value)} style={st}>
                              <option value="">—</option>
                              {c.options.map(o=><option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input aria-label={c.l} type={c.t==="nombre"?"number":"text"} inputMode={c.t==="nombre"?"numeric":undefined}
                              placeholder={c.aide||""} value={val} onChange={e=>setDetail(c.k,e.target.value)} style={st}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{background:C.cream,border:`1px dashed ${C.sand}`,borderRadius:"12px",padding:"18px",marginBottom:"12px",textAlign:"center"}}>
                  <div style={{fontSize:"14px",color:C.sub,fontFamily:F,lineHeight:1.55}}>
                    Choisissez la nature du bien ci-dessus : les caractéristiques à renseigner s'adapteront.
                  </div>
                </div>
              )}

              {/* Surface générale */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Surface habitable ou utile (m²)</label>
                <input type="number" placeholder="Ex: 150" value={form.surface||""} onChange={e=>set("surface",e.target.value)} style={inputStyle}/>
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
                <textarea placeholder="Décrivez votre bien : emplacement, atouts, accès, environnement..." value={form.description||""} onChange={e=>set("description",e.target.value)} rows={4} style={{...champ("description"),resize:"vertical"}}/>
              </div>
              <div style={{marginBottom:"14px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Photos * <span style={{color:C.sub,fontWeight:500,textTransform:"none",letterSpacing:0}}>· {photos.length}/{MAX_PHOTOS}</span></label>

                {photos.length>0&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:"8px",marginBottom:"10px"}}>
                    {photos.map((ph,i)=>(
                      <div key={i} style={{position:"relative",paddingTop:"75%",borderRadius:"9px",overflow:"hidden",border:`1px solid ${i===0?C.gold:C.sand}`,background:C.cream}}>
                        <img src={ph.apercu} alt={`Photo ${i+1}${i===0?" — couverture":""}`} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                        {i===0&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:C.gold,color:C.forestDark,fontSize:"10px",fontWeight:700,textAlign:"center",padding:"2px",fontFamily:F}}>COUVERTURE</div>}
                        {i!==0&&<button type="button" onClick={()=>mettreEnCouverture(i)} aria-label={`Mettre la photo ${i+1} en couverture`} title="Mettre en couverture" style={{position:"absolute",bottom:4,left:4,background:"rgba(0,0,0,0.55)",color:C.white,border:"none",borderRadius:"5px",fontSize:"10px",padding:"3px 6px",cursor:"pointer",fontFamily:F,fontWeight:600}}>Couverture</button>}
                        <button type="button" onClick={()=>retirerPhoto(i)} aria-label={`Retirer la photo ${i+1}`} title="Retirer" style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.6)",color:C.white,border:"none",width:22,height:22,borderRadius:"50%",cursor:"pointer",fontSize:"12px",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length<MAX_PHOTOS&&(
                  <div onClick={()=>fileRef.current?.click()}
                    onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();ajouterPhotos(e.dataTransfer.files);}}
                    style={{border:`2px dashed ${C.sand}`,borderRadius:"10px",padding:"18px 14px",textAlign:"center",cursor:"pointer",background:"#FAFAF8"}}>
                    <div style={{fontSize:"15px",fontWeight:700,color:C.forest,fontFamily:F,marginBottom:"3px"}}>+ Ajouter des photos</div>
                    <div style={{fontSize:"13px",color:C.sub,fontFamily:F}}>Jusqu'à {MAX_PHOTOS} photos · la première sert de couverture</div>
                  </div>
                )}
                <input ref={fileRef} type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>{ajouterPhotos(e.target.files);e.target.value="";}}/>
                {photoErr&&<div style={{marginTop:"6px",fontSize:"13px",color:C.terra,fontWeight:600,fontFamily:F}}>{photoErr}</div>}
                {envoiPhoto&&<div style={{marginTop:"6px",fontSize:"13px",color:C.forest,fontWeight:700,fontFamily:F}}>{envoiPhoto}</div>}
              </div>
              <BandeauErreur texte={erreur} onRetry={erreur&&!manquants.length?handleSubmit:null}/>
              <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:loading?"#bbb":C.terra,color:C.white,border:"none",borderRadius:"9px",padding:"15px",fontWeight:700,fontSize:"16px",cursor:loading?"default":"pointer",fontFamily:F}}>
                {loading?(envoiPhoto||"Envoi en cours…"):(existing?"Envoyer mes modifications":"Publier mon annonce")}
              </button>
              <p style={{margin:"10px 0 0",fontSize:"12.5px",color:C.sub,fontFamily:F,textAlign:"center",lineHeight:1.5}}>
                Votre annonce est vérifiée par Sokilé avant publication. Les champs marqués * sont obligatoires.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}






// ─── NATURES DE BIEN ──────────────────────────────
// Chaque nature décrit ses propres champs. Le formulaire, la carte, la fiche
// et les filtres se construisent à partir d'ici : ajouter une nature ou un
// champ se fait en un seul endroit.
//
// type des champs : texte | nombre | choix | bool | surface
// only: "vente" ou "location" quand le champ ne concerne qu'une transaction

const OUI_NON = ["Oui","Non","À vérifier"];

const NATURES = {
  maison: {
    label:"Maison ou villa", famille:"Habitation", icone:"🏡",
    resume:(d)=>[d.pieces&&`${d.pieces} pièces`, d.chambres&&`${d.chambres} ch.`, d.surface_terrain&&`terrain ${d.surface_terrain} m²`],
    champs:[
      {k:"pieces",         l:"Nombre de pièces",        t:"nombre", requis:true},
      {k:"chambres",       l:"Chambres",                t:"nombre", requis:true},
      {k:"sdb",            l:"Salles de bain",          t:"nombre"},
      {k:"niveaux",        l:"Niveaux",                 t:"nombre"},
      {k:"surface_terrain",l:"Surface du terrain (m²)", t:"nombre"},
      {k:"annee",          l:"Année de construction",   t:"nombre"},
      {k:"etat",           l:"État",                    t:"choix", options:["Neuf","Bon état","À rafraîchir","À rénover","Sur plan"]},
      {k:"titre_foncier",  l:"Titre foncier",           t:"choix", options:OUI_NON, only:"vente"},
    ],
  },
  appartement: {
    label:"Appartement", famille:"Habitation", icone:"🏢",
    resume:(d)=>[d.pieces&&`${d.pieces} pièces`, d.chambres&&`${d.chambres} ch.`, d.etage!==undefined&&d.etage!==""&&`étage ${d.etage}`],
    champs:[
      {k:"pieces",      l:"Nombre de pièces",  t:"nombre", requis:true},
      {k:"chambres",    l:"Chambres",          t:"nombre", requis:true},
      {k:"sdb",         l:"Salles de bain",    t:"nombre"},
      {k:"etage",       l:"Étage",             t:"nombre"},
      {k:"etages_imm",  l:"Étages de l'immeuble", t:"nombre"},
      {k:"ascenseur",   l:"Ascenseur",         t:"choix", options:["Oui","Non"]},
      {k:"charges",     l:"Charges de copropriété (FCFA/mois)", t:"nombre", only:"vente"},
      {k:"etat",        l:"État",              t:"choix", options:["Neuf","Bon état","À rafraîchir","À rénover","Sur plan"]},
    ],
  },
  immeuble: {
    label:"Immeuble", famille:"Habitation", icone:"🏬",
    resume:(d)=>[d.lots&&`${d.lots} lots`, d.etages&&`${d.etages} étages`, d.revenu_mensuel&&`revenu ${d.revenu_mensuel} FCFA/mois`],
    champs:[
      {k:"lots",           l:"Nombre de lots ou logements", t:"nombre", requis:true},
      {k:"etages",         l:"Nombre d'étages",             t:"nombre", requis:true},
      {k:"surface_totale", l:"Surface totale bâtie (m²)",   t:"nombre"},
      {k:"surface_terrain",l:"Surface du terrain (m²)",     t:"nombre"},
      {k:"occupation",     l:"Taux d'occupation",           t:"choix", options:["Entièrement loué","Partiellement loué","Vide","En construction"]},
      {k:"revenu_mensuel", l:"Revenu locatif mensuel (FCFA)", t:"nombre", only:"vente"},
      {k:"annee",          l:"Année de construction",       t:"nombre"},
      {k:"titre_foncier",  l:"Titre foncier",               t:"choix", options:OUI_NON, only:"vente"},
    ],
  },
  terrain: {
    label:"Terrain à bâtir", famille:"Terrain", icone:"📐",
    resume:(d)=>[d.superficie&&`${d.superficie} m²`, d.statut_juridique, d.viabilise&&`viabilisé : ${d.viabilise}`],
    champs:[
      {k:"superficie",       l:"Superficie (m²)",     t:"nombre", requis:true},
      {k:"statut_juridique", l:"Statut juridique",    t:"choix", requis:true, options:["Titre foncier","Bail emphytéotique","Délibération","Acte administratif","Non titré"]},
      {k:"viabilise",        l:"Viabilisé",           t:"choix", options:["Eau et électricité","Eau seulement","Électricité seulement","Non viabilisé"]},
      {k:"cloture",          l:"Clôturé",             t:"choix", options:["Oui","Partiellement","Non"]},
      {k:"acces",            l:"Accès",               t:"choix", options:["Route bitumée","Piste carrossable","Difficile"]},
      {k:"constructible",    l:"Constructible",       t:"choix", options:OUI_NON},
      {k:"bornage",          l:"Bornage effectué",    t:"choix", options:OUI_NON},
    ],
  },
  agricole: {
    label:"Terrain agricole ou exploitation", famille:"Terrain", icone:"🌾",
    resume:(d)=>[d.superficie_ha&&`${d.superficie_ha} ha`, d.eau, d.cultures],
    champs:[
      {k:"superficie_ha",    l:"Superficie (hectares)", t:"nombre", requis:true},
      {k:"statut_juridique", l:"Statut juridique",      t:"choix", requis:true, options:["Titre foncier","Bail emphytéotique","Délibération","Acte administratif","Non titré"]},
      {k:"eau",              l:"Accès à l'eau",         t:"choix", options:["Forage","Rivière ou marigot","Réseau","Aucun"]},
      {k:"cultures",         l:"Cultures en place",     t:"texte", aide:"Ex : manguiers, arachide, maraîchage"},
      {k:"batiments",        l:"Bâtiments",             t:"texte", aide:"Ex : hangar, logement de gardien"},
      {k:"cloture",          l:"Clôturé",               t:"choix", options:["Oui","Partiellement","Non"]},
      {k:"acces",            l:"Accès",                 t:"choix", options:["Route bitumée","Piste carrossable","Difficile"]},
    ],
  },
  commerce: {
    label:"Local commercial", famille:"Professionnel", icone:"🏪",
    resume:(d)=>[d.surface_local&&`${d.surface_local} m²`, d.vitrine&&`vitrine ${d.vitrine}`, d.emplacement],
    champs:[
      {k:"surface_local", l:"Surface du local (m²)", t:"nombre", requis:true},
      {k:"emplacement",   l:"Emplacement",           t:"choix", options:["Rue passante","Centre commercial","Marché","Quartier résidentiel","Zone industrielle"]},
      {k:"vitrine",       l:"Linéaire de vitrine (m)", t:"nombre"},
      {k:"activite",      l:"Activité précédente",   t:"texte", aide:"Ex : restaurant, boutique de prêt-à-porter"},
      {k:"etat",          l:"État",                  t:"choix", options:["Neuf","Bon état","À rafraîchir","Brut de béton"]},
      {k:"bail_reprise",  l:"Droit au bail à reprendre", t:"choix", options:["Oui","Non"], only:"location"},
    ],
  },
  bureau: {
    label:"Bureau", famille:"Professionnel", icone:"💼",
    resume:(d)=>[d.surface_bureau&&`${d.surface_bureau} m²`, d.postes&&`${d.postes} postes`, d.etage!==undefined&&d.etage!==""&&`étage ${d.etage}`],
    champs:[
      {k:"surface_bureau", l:"Surface (m²)",        t:"nombre", requis:true},
      {k:"postes",         l:"Postes de travail",   t:"nombre"},
      {k:"bureaux_fermes", l:"Bureaux fermés",      t:"nombre"},
      {k:"etage",          l:"Étage",               t:"nombre"},
      {k:"ascenseur",      l:"Ascenseur",           t:"choix", options:["Oui","Non"]},
      {k:"clim",           l:"Climatisation",       t:"choix", options:["Centralisée","Split","Aucune"]},
      {k:"etat",           l:"État",                t:"choix", options:["Neuf","Bon état","À rafraîchir","Brut de béton"]},
    ],
  },
  entrepot: {
    label:"Entrepôt ou local industriel", famille:"Professionnel", icone:"🏭",
    resume:(d)=>[d.surface_couverte&&`${d.surface_couverte} m² couverts`, d.hauteur&&`${d.hauteur} m sous plafond`],
    champs:[
      {k:"surface_couverte",l:"Surface couverte (m²)", t:"nombre", requis:true},
      {k:"surface_terrain", l:"Surface du terrain (m²)", t:"nombre"},
      {k:"hauteur",         l:"Hauteur sous plafond (m)", t:"nombre"},
      {k:"quais",           l:"Quais de chargement",   t:"nombre"},
      {k:"acces_camion",    l:"Accès poids lourds",    t:"choix", options:["Oui","Difficile","Non"]},
      {k:"electricite",     l:"Puissance électrique",  t:"texte", aide:"Ex : triphasé 60 kVA"},
    ],
  },
  hotel: {
    label:"Hôtel ou résidence", famille:"Professionnel", icone:"🏨",
    resume:(d)=>[d.chambres_hotel&&`${d.chambres_hotel} chambres`, d.categorie, d.exploitation],
    champs:[
      {k:"chambres_hotel", l:"Nombre de chambres",  t:"nombre", requis:true},
      {k:"categorie",      l:"Catégorie",           t:"choix", options:["Non classé","1 étoile","2 étoiles","3 étoiles","4 étoiles","5 étoiles","Résidence meublée"]},
      {k:"surface_totale", l:"Surface totale (m²)", t:"nombre"},
      {k:"exploitation",   l:"Exploitation",        t:"choix", options:["En activité","À l'arrêt","En construction"]},
      {k:"restaurant",     l:"Restaurant",          t:"choix", options:["Oui","Non"]},
      {k:"piscine_h",      l:"Piscine",             t:"choix", options:["Oui","Non"]},
      {k:"revenu_mensuel", l:"Chiffre d'affaires mensuel (FCFA)", t:"nombre", only:"vente"},
    ],
  },
};

// Champs communs à toutes les locations
const CHAMPS_LOCATION = [
  {k:"meuble",       l:"Meublé",                t:"choix", requis:true, options:["Meublé","Non meublé","Partiellement"]},
  {k:"charges_loc",  l:"Charges mensuelles (FCFA)", t:"nombre"},
  {k:"caution",      l:"Caution (nombre de mois)", t:"nombre"},
  {k:"duree_bail",   l:"Durée du bail",         t:"choix", options:["Courte durée","1 an","2 ans","3 ans et plus","Négociable"]},
  {k:"disponibilite",l:"Disponible à partir du", t:"texte", aide:"Ex : immédiatement, ou 1er décembre"},
];

const FAMILLES = ["Habitation","Terrain","Professionnel"];
const naturesDeFamille = (fam) => Object.entries(NATURES).filter(([,v])=>v.famille===fam);

// Les champs à afficher pour une nature et une transaction données
function champsDe(nature, transaction) {
  const n = NATURES[nature];
  if (!n) return [];
  const propres = n.champs.filter(c => !c.only || c.only === transaction);
  return transaction === "location" ? [...propres, ...CHAMPS_LOCATION.filter(c=>c.k!=="meuble"||!["terrain","agricole"].includes(nature))] : propres;
}

// Résumé court d'un bien, pour les cartes
function resumeBien(p) {
  const d = p.details || {};
  const n = NATURES[natureDe(p)];
  const base = n?.resume ? n.resume(d).filter(Boolean) : [];
  if (base.length) return base.slice(0,3);
  return [p.rooms&&`${p.rooms} pièces`, p.surface&&`${p.surface} m²`, p.tags?.[0]].filter(Boolean).slice(0,3);
}

// Une annonce déposée avant la refonte n'a ni nature ni transaction en base.
// Les mêmes règles de reprise sont utilisées par l’affichage et le formulaire.
const transactionDe = propertyTransaction;
const natureDe = propertyNature;
const libelleNature = (p) => NATURES[natureDe(p)]?.label || p?.type || "Bien";

// Caractéristiques d'une fiche : celles de la nature du bien, plus la surface.
// Un champ non renseigné n'apparaît pas — mieux vaut rien qu'un tiret.
function caracteristiques(p) {
  const d = p.details || {};
  const out = [["Nature", libelleNature(p)]];
  if (p.surface) out.push(["Surface", new Intl.NumberFormat("fr-FR").format(p.surface) + " m²"]);
  champsDe(natureDe(p), transactionDe(p)).forEach(c => {
    const v = d[c.k];
    if (v === undefined || String(v).trim() === "") return;
    const est = c.t === "nombre" && !isNaN(Number(v));
    const unite = /\(m²\)/.test(c.l) ? " m²" : /hectares/.test(c.l) ? " ha" : /FCFA/.test(c.l) ? " FCFA" : "";
    out.push([c.l.replace(/\s*\([^)]*\)\s*$/, ""), est ? new Intl.NumberFormat("fr-FR").format(Number(v)) + unite : String(v)]);
  });
  if (out.length === 1 && p.rooms) out.push(["Pièces", String(p.rooms)]);
  return out.slice(0, 10);
}
const libelleTransaction = (p) => transactionDe(p) === "location" ? "Location" : "Vente";

// ─── ADRESSES DES ANNONCES ────────────────────────
// Une annonce = une vraie page, partageable sur WhatsApp et indexable.
const idPublic = (p) => String(p.id).startsWith("db-") ? String(p.id).slice(3) : `demo-${p.id}`;
const cheminAnnonce = (p) => `/annonce/${idPublic(p)}`;
const urlAnnonce = (p) => `https://www.sokile.com${cheminAnnonce(p)}`;
const cheminGuide = (g) => `/guide/${g.id}`;

function lireRoute() {
  if (typeof window === "undefined") return { nom: "accueil" };
  if(window.location.pathname==="/programmes-neufs") return {nom:"programmes"};
  const programme=window.location.pathname.match(/^\/programme\/([0-9a-f-]+)\/?$/i);
  if(programme) return {nom:"programme",id:programme[1]};
  const annonce = window.location.pathname.match(/^\/annonce\/([^/?#]+)/);
  if (annonce) return { nom:"annonce", id:decodeURIComponent(annonce[1]) };
  const guide = window.location.pathname.match(/^\/guide\/([^/?#]+)/);
  if (guide) return { nom:"guide", id:decodeURIComponent(guide[1]) };
  return { nom:"accueil" };
}

function correspond(p, id) {
  return idPublic(p) === id || String(p.id) === id || String(p.id) === `db-${id}`;
}


// ─── OUTILS À TÉLÉCHARGER ─────────────────────────
// Les ressources sont versionnées et publiées avec le site.
const DOCUMENTS = [
  {
    id:"checklist-terrain",
    titre:"Check-list : vérifier un terrain avant d'acheter",
    resume:"Les 24 points à contrôler, les documents à exiger et les questions à poser au vendeur.",
    pages:"4 pages · PDF",
    fichier:"checklist-verifier-terrain.pdf",
  },
  {
    id:"budget-construction",
    titre:"Tableau de suivi d'un chantier",
    resume:"Suivez votre budget poste par poste et comparez les devis de vos artisans.",
    pages:"Tableur · XLSX",
    fichier:"suivi-chantier-sokile.xlsx",
  },
  {
    id:"questions-agence",
    titre:"20 questions à poser avant de signer",
    resume:"À emporter lors d'une visite ou d'un rendez-vous chez le notaire.",
    pages:"2 pages · PDF",
    fichier:"questions-avant-signature.pdf",
  },
];
const urlDocument = (f) => `/documents/${f}`;

function Telechargements({ user }) {
  const [ouvert, setOuvert] = useState(null);
  return (
    <div>
      <p style={{margin:"0 0 18px",fontSize:"15px",color:C.sub,fontFamily:F,lineHeight:1.65,maxWidth:"640px"}}>
        Des documents à emporter sur le terrain, chez le notaire ou devant un devis. Gratuits, sans contrepartie autre que votre adresse email.
      </p>
      <div className="sok-grid">
        {DOCUMENTS.map(d=>(
          <div key={d.id} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"20px",display:"flex",flexDirection:"column"}}>
            <div style={{fontSize:"11.5px",fontWeight:700,color:C.terra,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:F,marginBottom:"8px"}}>{d.pages}</div>
            <h3 style={{margin:"0 0 8px",fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.dark,lineHeight:1.3}}>{d.titre}</h3>
            <p style={{margin:"0 0 16px",fontSize:"14.5px",color:C.sub,fontFamily:F,lineHeight:1.6,flex:1}}>{d.resume}</p>
            <button onClick={()=>setOuvert(d)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"13px",fontWeight:700,fontSize:"14.5px",cursor:"pointer",fontFamily:F}}>Télécharger</button>
          </div>
        ))}
      </div>
      {ouvert&&<DemandeDocument doc={ouvert} user={user} onClose={()=>setOuvert(null)}/>}
    </div>
  );
}

function DemandeDocument({ doc, user, onClose }) {
  const [email, setEmail] = useState(user?.email||"");
  const [prenom, setPrenom] = useState(user?.name||"");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [pret, setPret] = useState(false);
  const [documentReady, setDocumentReady] = useState(null);
  useEffect(() => {
    let active = true;
    isDocumentAvailable(urlDocument(doc.fichier)).then(ready => { if (active) setDocumentReady(ready); });
    return () => { active = false; };
  }, [doc.fichier]);

  const valide = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) && consent;

  const envoyer = async () => {
    if (!valide || !documentReady || loading) return;
    setErreur(""); setLoading(true);
    const r = await ecrire("leads", {
      name: prenom || "—", email, status: "telechargement",
      message: `TÉLÉCHARGEMENT | ${doc.titre} | consentement newsletter : oui`,
    }).catch(e=>({ok:false,statut:0,motif:String(e)}));
    setLoading(false);
    if (!r.ok) { setErreur(messageErreur(r)); return; }
    setPret(true);
  };

  return (
    <ModalShell title={doc.titre} subtitle={doc.pages} onClose={onClose}>
      {documentReady !== true ? (
        documentReady === null
          ? <p role="status">Vérification de la disponibilité du document…</p>
          : <SentMessage title="Document temporairement indisponible" text="Ce document ne peut pas être téléchargé pour le moment. Revenez un peu plus tard." onClose={onClose}/>
      ) : pret ? (
        <div style={{textAlign:"center",padding:"10px 0"}}>
          <div style={{fontSize:"40px",marginBottom:"10px"}}>📄</div>
          <h3 style={{margin:"0 0 8px",color:C.dark,fontFamily:FT,fontSize:"19px"}}>Votre document est prêt</h3>
          <p style={{color:C.sub,fontSize:"14.5px",fontFamily:F,lineHeight:1.6,marginBottom:"18px"}}>Le téléchargement démarre en cliquant ci-dessous.</p>
          <a href={urlDocument(doc.fichier)} download target="_blank" rel="noopener noreferrer"
             style={{display:"block",background:C.terra,color:C.white,borderRadius:"10px",padding:"14px",fontWeight:700,fontSize:"15px",fontFamily:F,textDecoration:"none"}}>Télécharger le document</a>
          <button onClick={onClose} style={{marginTop:"10px",background:"transparent",border:"none",color:C.sub,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Fermer</button>
        </div>
      ) : (<>
        <p style={{margin:"0 0 16px",fontSize:"14.5px",color:C.sub,fontFamily:F,lineHeight:1.65}}>
          Indiquez votre adresse pour accéder au document.
        </p>
        <div style={{marginBottom:"12px"}}>
          <label style={lbl}>Prénom</label>
          <input style={inp} value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Facultatif"/>
        </div>
        <div style={{marginBottom:"14px"}}>
          <label style={lbl}>Email *</label>
          <input type="email" style={inp} value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com"/>
        </div>
        <label style={{display:"flex",gap:"10px",alignItems:"flex-start",marginBottom:"16px",cursor:"pointer"}}>
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} style={{marginTop:"3px",width:18,height:18,flexShrink:0,accentColor:C.forest}}/>
          <span style={{fontSize:"13.5px",color:C.sub,fontFamily:F,lineHeight:1.55}}>
            J'accepte que Sokilé conserve mon adresse pour m'envoyer ce document et, occasionnellement, ses prochaines publications. Je peux me désinscrire à tout moment en écrivant à {CONTACT_MAIL}. <a href="/confidentialites.html" target="_blank" rel="noopener noreferrer" style={{color:C.terra}}>Politique de confidentialité</a>
          </span>
        </label>
        <BandeauErreur texte={erreur} onRetry={envoyer}/>
        <button onClick={envoyer} disabled={!valide||loading} style={{width:"100%",background:valide?C.terra:"#ccc",color:C.white,border:"none",borderRadius:"10px",padding:"14px",fontWeight:700,fontSize:"15px",cursor:valide?"pointer":"default",fontFamily:F}}>
          {loading?"Un instant…":"Recevoir le document"}
        </button>
      </>)}
    </ModalShell>
  );
}


// ─── ACTUALITÉ IMMOBILIÈRE ────────────────────────
// Les articles vivent dans la table Supabase "articles".
// L'écriture est protégée par une règle RLS côté serveur : seul le compte
// dont l'email figure dans la politique peut publier. Masquer le bouton
// ne protégerait rien, c'est le serveur qui refuse.
const EMAIL_REDACTION = "contact@sokile.com";   // doit correspondre à la politique SQL

// Écriture authentifiée : on envoie le jeton de l'utilisateur, pas la clé publique
async function ecrireAuth(chemin, donnees, token, methode="POST") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${chemin}`, {
    method: methode,
    headers: {
      "Content-Type":"application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(donnees),
  });
  if (res.ok) return { ok:true, data: await res.json().catch(()=>null) };
  let motif=""; try { const j=await res.json(); motif=j.message||j.hint||j.details||""; } catch(e){}
  return { ok:false, statut:res.status, motif };
}

const alertRpc = (name, data, token=SUPABASE_KEY) => ecrireAuth(`rpc/${name}`,data,token);
async function uploadProgramDocument(file,user) {
  if(file.type!=="application/pdf"||file.size>10*1024*1024)throw new Error("Choisissez un PDF de 10 Mo maximum.");
  const prefix=new Uint8Array(await file.slice(0,5).arrayBuffer());
  if(String.fromCharCode(...prefix)!=="%PDF-")throw new Error("Le fichier ne semble pas être un PDF valide.");
  const path=`${user.id}/${crypto.randomUUID()}.pdf`;
  const response=await fetch(`${SUPABASE_URL}/storage/v1/object/program-documents/${path}`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${user.token}`,"Content-Type":"application/pdf"},body:file});
  if(!response.ok)throw new Error("Le document n’a pas pu être envoyé. Réessayez.");
  return `${SUPABASE_URL}/storage/v1/object/public/program-documents/${path}`;
}
const programApi={load:lire,rpc:alertRpc,uploadPhotos:envoyerPhotos,uploadDocument:uploadProgramDocument};

const peutRediger = (user) => isAdminSession(user, EMAIL_REDACTION);

function dateCourte(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}); }
  catch(e) { return ""; }
}

function BandeauActualites({ onOpen }) {
  const [articles, setArticles] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(()=>{
    fetch(`${SUPABASE_URL}/rest/v1/articles?publie=eq.true&select=id,titre,pays,date_publication&order=date_publication.desc&limit=8`,
      {headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}})
      .then(r=>r.ok?r.json():[])
      .then(rows=>setArticles(Array.isArray(rows)?rows:[]))
      .catch(()=>setArticles([]));
  },[]);

  useEffect(()=>{
    if (articles.length<2) return;
    const timer=setInterval(()=>setIndex(i=>(i+1)%articles.length),5200);
    return ()=>clearInterval(timer);
  },[articles.length]);

  const article=articles[index];
  return (
    <button className="sok-newsbar" onClick={onOpen} aria-label="Voir les actualités immobilières">
      <span className="sok-newsbar-label"><i/>Le fil Sokilé</span>
      <span className="sok-newsbar-story" key={article?.id||"intro"}>
        {article ? <><b>{article.pays||"Afrique"}</b><span>{article.titre}</span></> : <span>Actualité immobilière, foncier et investissement en Afrique francophone</span>}
      </span>
      <span className="sok-newsbar-date">{article?dateCourte(article.date_publication):"Découvrir"}</span>
      <span className="sok-newsbar-arrow" aria-hidden="true">→</span>
    </button>
  );
}

function Actualite({ user }) {
  const [articles, setArticles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [lecture, setLecture] = useState(null);
  const [edition, setEdition] = useState(null);   // null | {} | article

  const charger = () => {
    setChargement(true);
    // un an d'historique, les plus récents d'abord
    const limite = new Date(); limite.setFullYear(limite.getFullYear()-1);
    fetch(`${SUPABASE_URL}/rest/v1/articles?publie=eq.true&date_publication=gte.${limite.toISOString()}&select=*&order=date_publication.desc&limit=60`,
      {headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`}})
      .then(r=>r.ok?r.json():[])
      .then(rows=>setArticles(Array.isArray(rows)?rows:[]))
      .catch(()=>setArticles([]))
      .finally(()=>setChargement(false));
  };
  useEffect(charger, []);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"14px",flexWrap:"wrap",marginBottom:"18px"}}>
        <p style={{margin:0,fontSize:"15px",color:C.sub,fontFamily:F,lineHeight:1.65,maxWidth:"620px"}}>
          Ce qui bouge dans l'immobilier en Afrique de l'Ouest et Centrale : réformes foncières, prix, nouveaux quartiers, financement.
        </p>
        {peutRediger(user)&&(
          <button onClick={()=>setEdition({})} style={{background:C.forest,color:C.white,border:"none",borderRadius:"10px",padding:"12px 18px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F,flexShrink:0}}>+ Écrire un article</button>
        )}
      </div>

      {chargement ? (
        <p style={{color:C.sub,fontFamily:F,fontSize:"15px"}}>Chargement…</p>
      ) : articles.length===0 ? (
        <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"36px 22px",textAlign:"center"}}>
          <p style={{margin:0,fontSize:"15px",color:C.sub,fontFamily:F,lineHeight:1.6}}>
            Aucun article pour le moment.{peutRediger(user)?" Cliquez sur « Écrire un article » pour publier le premier.":" Revenez bientôt."}
          </p>
        </div>
      ) : (
        <div className="sok-grid">
          {articles.map(a=>(
            <article key={a.id} onClick={()=>setLecture(a)} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",overflow:"hidden",cursor:"pointer",display:"flex",flexDirection:"column"}}>
              {a.image_url&&<div style={{height:170,backgroundImage:`url('${a.image_url}')`,backgroundSize:"cover",backgroundPosition:"center"}}/>}
              <div style={{padding:"18px",flex:1,display:"flex",flexDirection:"column"}}>
                <div style={{fontSize:"11.5px",fontWeight:700,color:C.terra,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:F,marginBottom:"7px"}}>
                  {a.pays||"Afrique de l'Ouest & Centrale"} · {dateCourte(a.date_publication)}
                </div>
                <h3 style={{margin:"0 0 8px",fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.dark,lineHeight:1.3}}>{a.titre}</h3>
                <p style={{margin:0,fontSize:"14.5px",color:C.sub,fontFamily:F,lineHeight:1.6,flex:1}}>{a.chapo}</p>
                {peutRediger(user)&&(
                  <button onClick={e=>{e.stopPropagation();setEdition(a);}} style={{alignSelf:"flex-start",marginTop:"12px",background:"transparent",border:`1px solid ${C.sand}`,color:C.sub,borderRadius:"8px",padding:"7px 13px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:F}}>Modifier</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {lecture&&<LectureArticle a={lecture} onClose={()=>setLecture(null)}/>}
      {edition&&<EditeurArticle article={edition} user={user} onClose={()=>setEdition(null)} onEnregistre={()=>{setEdition(null);charger();}}/>}
    </div>
  );
}

function LectureArticle({ a, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:2500,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"720px",width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        {a.image_url&&<div style={{height:240,backgroundImage:`url('${a.image_url}')`,backgroundSize:"cover",backgroundPosition:"center",borderRadius:"16px 16px 0 0"}}/>}
        <div style={{padding:"24px"}}>
          <button onClick={onClose} style={{float:"right",background:"transparent",border:"none",fontSize:"20px",cursor:"pointer",color:C.sub}}>✕</button>
          <div style={{fontSize:"11.5px",fontWeight:700,color:C.terra,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:F,marginBottom:"9px"}}>
            {a.pays||"Afrique de l'Ouest & Centrale"} · {dateCourte(a.date_publication)}
          </div>
          <h1 style={{margin:"0 0 12px",fontFamily:FT,fontSize:"clamp(23px,3.2vw,32px)",fontWeight:500,color:C.dark,lineHeight:1.25}}>{a.titre}</h1>
          <p style={{margin:"0 0 18px",fontSize:"17px",color:C.sub,fontFamily:F,lineHeight:1.65,fontWeight:500}}>{a.chapo}</p>
          <div style={{fontSize:"16px",color:C.dark,fontFamily:F,lineHeight:1.75,whiteSpace:"pre-line"}}>{a.contenu}</div>
          {a.source_url&&(
            <p style={{marginTop:"20px",paddingTop:"14px",borderTop:`1px solid ${C.sand}`,fontSize:"14px",fontFamily:F}}>
              Source : <a href={a.source_url} target="_blank" rel="noopener noreferrer" style={{color:C.terra}}>{a.source_nom||a.source_url}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EditeurArticle({ article, user, onClose, onEnregistre }) {
  const nouveau = !article?.id;
  const [f, setF] = useState({
    titre: article.titre||"", chapo: article.chapo||"", contenu: article.contenu||"",
    pays: article.pays||"", image_url: article.image_url||"",
    source_nom: article.source_nom||"", source_url: article.source_url||"",
    publie: article.publie!==undefined ? article.publie : true,
  });
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const set = (k,v)=>setF(p=>({...p,[k]:v}));
  const manque = !f.titre.trim() || !f.chapo.trim() || f.contenu.trim().length<80;

  const enregistrer = async () => {
    if (manque) { setErreur("Titre, chapô et un contenu d'au moins 80 caractères sont nécessaires."); return; }
    setErreur(""); setLoading(true);
    const corps = {...f, date_publication: article.date_publication || new Date().toISOString()};
    const r = nouveau
      ? await ecrireAuth("articles", corps, user.token).catch(e=>({ok:false,statut:0,motif:String(e)}))
      : await ecrireAuth(`articles?id=eq.${article.id}`, corps, user.token, "PATCH").catch(e=>({ok:false,statut:0,motif:String(e)}));
    setLoading(false);
    if (!r.ok) {
      setErreur(r.statut===401||r.statut===403
        ? "Votre compte n'est pas autorisé à publier. Vérifiez que vous êtes connectée avec " + EMAIL_REDACTION + "."
        : messageErreur(r));
      return;
    }
    onEnregistre();
  };

  return (
    <ModalShell title={nouveau?"Écrire un article":"Modifier l'article"} subtitle="Actualité immobilière" onClose={onClose}>
      <div style={{marginBottom:"12px"}}><label style={lbl}>Titre *</label>
        <input style={inp} value={f.titre} onChange={e=>set("titre",e.target.value)} placeholder="Ex : Le Sénégal réforme le cadastre"/></div>
      <div style={{marginBottom:"12px"}}><label style={lbl}>Chapô *</label>
        <textarea style={{...inp,minHeight:"70px",resize:"vertical"}} value={f.chapo} onChange={e=>set("chapo",e.target.value)} placeholder="Deux lignes qui résument l'essentiel"/></div>
      <div style={{marginBottom:"12px"}}><label style={lbl}>Article *</label>
        <textarea style={{...inp,minHeight:"220px",resize:"vertical",lineHeight:1.6}} value={f.contenu} onChange={e=>set("contenu",e.target.value)} placeholder="Le texte. Laissez une ligne vide entre les paragraphes."/>
        <div style={{fontSize:"12.5px",color:C.sub,fontFamily:F,marginTop:"4px"}}>{f.contenu.trim().length} caractères</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
        <div><label style={lbl}>Pays concerné</label>
          <select style={inp} value={f.pays} onChange={e=>set("pays",e.target.value)}>
            <option value="">Toute la zone</option>
            {COUNTRIES_ANNONCES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
          </select></div>
        <div><label style={lbl}>Image (adresse)</label>
          <input style={inp} value={f.image_url} onChange={e=>set("image_url",e.target.value)} placeholder="https://…"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
        <div><label style={lbl}>Source (nom)</label>
          <input style={inp} value={f.source_nom} onChange={e=>set("source_nom",e.target.value)} placeholder="Ex : Le Soleil"/></div>
        <div><label style={lbl}>Source (lien)</label>
          <input style={inp} value={f.source_url} onChange={e=>set("source_url",e.target.value)} placeholder="https://…"/></div>
      </div>
      <label style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"16px",cursor:"pointer"}}>
        <input type="checkbox" checked={f.publie} onChange={e=>set("publie",e.target.checked)} style={{width:18,height:18,accentColor:C.forest}}/>
        <span style={{fontSize:"14px",color:C.dark,fontFamily:F}}>Publier immédiatement</span>
      </label>
      <BandeauErreur texte={erreur} onRetry={enregistrer}/>
      <button onClick={enregistrer} disabled={loading} style={{width:"100%",background:loading?"#bbb":C.forest,color:C.white,border:"none",borderRadius:"10px",padding:"14px",fontWeight:700,fontSize:"15px",cursor:loading?"default":"pointer",fontFamily:F}}>
        {loading?"Enregistrement…":(nouveau?"Publier l'article":"Enregistrer les modifications")}
      </button>
      <p style={{margin:"10px 0 0",fontSize:"12.5px",color:C.sub,fontFamily:F,textAlign:"center",lineHeight:1.5}}>
        Les articles restent affichés un an, puis disparaissent automatiquement de la liste.
      </p>
    </ModalShell>
  );
}


// ─── ESPACE ADMINISTRATEUR ────────────────────────
// Tout passe par le jeton de l'utilisateur : c'est la base de données qui
// autorise ou refuse, via la fonction est_admin(). Masquer l'onglet ne
// protégerait rien.
const estAdmin = (user) => isAdminSession(user, EMAIL_REDACTION);

async function lireAuth(chemin, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${chemin}`, {
    headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${token}`},
  });
  if (!res.ok) return { ok:false, statut:res.status };
  return { ok:true, data: await res.json().catch(()=>[]) };
}

async function appelerFonction(nom, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nom}`, {
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":`Bearer ${token}`},
    body:"{}",
  });
  if (!res.ok) return null;
  return res.json().catch(()=>null);
}

const RUBRIQUES_ADMIN = [
  {id:"moderation",   label:"Annonces"},
  {id:"programmes",   label:"Programmes neufs"},
  {id:"demandes",     label:"Demandes"},
  {id:"publicites",   label:"Publicités"},
  {id:"paiements",    label:"Paiements"},
  {id:"prestataires", label:"Prestataires"},
  {id:"actualites",   label:"Actualités"},
  {id:"chiffres",     label:"Chiffres"},
  {id:"apercu",       label:"Aperçu"},
];

const billingApi={load:lire,rpc:(name,data,token)=>ecrireAuth(`rpc/${name}`,data,token),gateway:paymentGateway(SUPABASE_URL,SUPABASE_KEY)};

function EspaceAdmin({ user, onApercu, apercu, programRefresh }) {
  const [rub, setRub] = useState(()=>new URLSearchParams(window.location.search).get("paiement")==="test"?"paiements":"moderation");
  if (!estAdmin(user)) return null;
  return (
    <div>
      <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"24px 20px",borderBottom:`3px solid ${C.gold}`,marginBottom:"18px",borderRadius:"0 0 14px 14px"}}>
        <div style={{fontSize:"11px",fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:"0.14em",fontFamily:F,marginBottom:"7px"}}>Administration</div>
        <h1 style={{fontFamily:FT,fontSize:"clamp(24px,4vw,32px)",fontWeight:400,color:C.white,margin:0,lineHeight:1.2}}>Piloter Sokilé</h1>
      </div>
      <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"6px",marginBottom:"18px"}}>
        {RUBRIQUES_ADMIN.map(r=>(
          <button key={r.id} onClick={()=>setRub(r.id)} style={{flexShrink:0,background:rub===r.id?C.forest:C.white,color:rub===r.id?C.white:C.dark,border:`1px solid ${rub===r.id?C.forest:C.sand}`,borderRadius:"22px",padding:"10px 18px",fontSize:"14.5px",fontWeight:rub===r.id?700:500,cursor:"pointer",fontFamily:F}}>{r.label}</button>
        ))}
      </div>
      {rub==="moderation"&&<AdminModeration user={user}/>}
      {rub==="programmes"&&<ProgramManager api={programApi} user={user} admin refreshKey={programRefresh}/>}
      {rub==="demandes"&&<AdminDemandes user={user}/>}
      {rub==="publicites"&&<AdminPublicites user={user}/>}
      {rub==="paiements"&&<PaymentsAdmin api={billingApi} user={user}/>}
      {rub==="prestataires"&&<AdminPrestataires user={user}/>}
      {rub==="actualites"&&<Actualite user={user}/>}
      {rub==="chiffres"&&<AdminChiffres user={user}/>}
      {rub==="apercu"&&<AdminApercu apercu={apercu} onApercu={onApercu}/>}
    </div>
  );
}

function ReponseModeration({ table, dossier, value, onChange, onRefuse, busy, error }) {
  const [apercu,setApercu]=useState(false);
  const statut=table==="properties"?"rejetee":"refusee";
  const champ=table==="properties"?"motif_rejet":"moderation_note";
  const id=`reponse-${table}-${dossier.id}`;
  let message=null, erreurApercu="";
  if(apercu){
    try { message=buildDecisionMessage(table,{...dossier,status:statut,[champ]:value}); }
    catch(e){ erreurApercu=e.message; }
  }
  return <section style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.sand}`}}>
    <label htmlFor={id} style={lbl}>Réponse personnalisée au déposant</label>
    <p id={`${id}-aide`} style={{fontFamily:F,fontSize:13,color:C.sub,lineHeight:1.6,margin:"0 0 9px"}}>Pour un refus ou une demande de précisions, expliquez ce qui pose problème dans ce dossier et indiquez les corrections possibles ou la raison d'un refus définitif. Ce texte sera visible dans le compte et repris dans l'email.</p>
    <textarea id={id} aria-describedby={`${id}-aide`} value={value} disabled={busy} maxLength={MAX_RESPONSE_LENGTH} onChange={e=>{onChange(e.target.value);setApercu(false);}} style={{...inp,minHeight:130,resize:"vertical",marginBottom:5}} placeholder="Rédigez ici votre réponse après avoir examiné ce dossier…"/>
    <div style={{fontFamily:F,fontSize:12,color:C.sub,marginBottom:12}}>30 caractères minimum pour justifier la décision · {Array.from(value.trim()).length} / {MAX_RESPONSE_LENGTH}</div>
    {(error||erreurApercu)&&<p role="alert" style={{background:"#FDE8E8",color:"#9B2C2C",padding:12,borderRadius:9,fontFamily:F,fontSize:14,lineHeight:1.6}}>{error||erreurApercu}</p>}
    {!message&&<button type="button" disabled={busy} onClick={()=>setApercu(true)} style={{background:"transparent",color:"#A93226",border:"1px solid #A93226",borderRadius:9,padding:12,fontWeight:700,cursor:busy?"wait":"pointer",fontFamily:F,width:"100%"}}>Préparer le refus</button>}
    {message&&<section aria-label="Aperçu de la réponse de refus" style={{background:C.cream,border:`1px solid ${C.sand}`,padding:15,borderRadius:10}}>
      <div style={{fontFamily:F,fontSize:14,fontWeight:700,color:C.dark}}>Relisez la réponse avant de confirmer</div>
      <div style={{fontFamily:F,fontSize:12,color:C.sub,margin:"8px 0",wordBreak:"break-word"}}>À : {message.to[0]}<br/>{message.subject}</div>
      <div style={{fontFamily:F,fontSize:14,lineHeight:1.7,color:C.dark,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{message.text}</div>
      <button type="button" disabled={busy} onClick={onRefuse} style={{marginTop:14,width:"100%",background:"#A93226",color:C.white,border:0,borderRadius:9,padding:13,fontWeight:700,cursor:busy?"wait":"pointer",fontFamily:F}}>{busy?"Enregistrement…":"Confirmer le refus et transmettre la réponse"}</button>
    </section>}
  </section>;
}

function AdminPublicites({ user }) {
  const [liste,setListe]=useState([]);
  const [statut,setStatut]=useState("en_attente");
  const [chargement,setChargement]=useState(true);
  const [erreur,setErreur]=useState("");
  const [ouverte,setOuverte]=useState(null);
  const [note,setNote]=useState("");
  const [enregistrement,setEnregistrement]=useState(false);
  const [erreurDecision,setErreurDecision]=useState("");

  const charger=()=>{
    setChargement(true); setErreur("");
    lireAuth(`advertising_requests?status=eq.${statut}&select=*&order=created_at.desc&limit=100`,user.token)
      .then(r=>{if(r.ok)setListe(r.data||[]);else setErreur("La liste des demandes publicitaires n'est pas accessible.");})
      .finally(()=>setChargement(false));
  };
  useEffect(charger,[statut]);

  const decider=async (demande,nouveau)=>{
    if(enregistrement)return;
    const invalide=validateModerationResponse(nouveau,note);
    if(invalide){setErreurDecision(invalide);return;}
    setErreurDecision("");setEnregistrement(true);
    const r=await ecrireAuth(`advertising_requests?id=eq.${demande.id}`,{status:nouveau,moderation_note:["validee","acceptee"].includes(nouveau)?null:note.trim()||null},user.token,"PATCH").catch(()=>({ok:false}));
    setEnregistrement(false);
    if(!r.ok){setErreurDecision("La décision n'a pas pu être enregistrée. Votre réponse est conservée ici pour réessayer.");return;}
    setOuverte(null);setNote("");charger();
  };

  const libelles={en_attente:"À étudier",en_cours:"En discussion",acceptee:"Acceptées",refusee:"Refusées",modifications_demandees:"À compléter"};
  return <div>
    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,marginBottom:16}}>
      {Object.entries(libelles).map(([k,l])=><button key={k} onClick={()=>setStatut(k)} style={{flexShrink:0,background:statut===k?C.terra:C.white,color:statut===k?C.white:C.dark,border:`1px solid ${statut===k?C.terra:C.sand}`,borderRadius:20,padding:"9px 15px",fontSize:14,fontWeight:statut===k?700:500,cursor:"pointer",fontFamily:F}}>{l}</button>)}
      <button onClick={charger} style={{marginLeft:"auto",background:"transparent",border:`1px solid ${C.sand}`,color:C.sub,borderRadius:20,padding:"9px 14px",fontSize:13.5,cursor:"pointer",fontFamily:F}}>Actualiser</button>
    </div>
    <BandeauErreur texte={erreur}/>
    {chargement?<p style={{color:C.sub,fontFamily:F}}>Chargement…</p>:liste.length===0?
      <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:14,padding:34,textAlign:"center",color:C.sub,fontFamily:F}}>Aucune demande dans cette catégorie.</div>:
      <div style={{display:"grid",gap:10}}>{liste.map(d=><button key={d.id} onClick={()=>{setOuverte(d);setNote(d.moderation_note||"");setErreurDecision("");}} style={{textAlign:"left",background:C.white,border:`1px solid ${C.sand}`,borderRadius:12,padding:"15px 17px",cursor:"pointer",fontFamily:F}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><strong style={{fontSize:16,color:C.dark}}>{d.company||d.contact_name}</strong><span style={{fontSize:12.5,color:C.sub}}>{dateCourte(d.created_at)}</span></div>
        <div style={{fontSize:13.5,color:C.terra,fontWeight:700,marginTop:4}}>{d.format}{d.objective?` · ${d.objective}`:""}</div>
        <div style={{fontSize:13.5,color:C.sub,marginTop:5}}>{(d.target_countries||[]).join(" · ")||"Tous pays"}{d.budget?` · Budget ${d.budget}`:""}{d.desired_period?` · ${d.desired_period}`:""}</div>
      </button>)}</div>}
    {ouverte&&<ModalShell title={ouverte.company||ouverte.contact_name} subtitle="Demande de publicité" onClose={()=>setOuverte(null)}>
      <div style={{display:"grid",gap:9,marginBottom:15}}>
        {[["Contact",ouverte.contact_name],["Email",ouverte.email],["Téléphone",ouverte.phone],["Format",ouverte.format],["Objectif",ouverte.objective],["Pays",(ouverte.target_countries||[]).join(", ")],["Budget",ouverte.budget],["Période",ouverte.desired_period],["Destination",ouverte.destination_url],["Message",ouverte.message]].filter(([,v])=>v).map(([l,v])=><div key={l} style={{background:C.cream,borderRadius:8,padding:"9px 11px"}}><div style={{fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:".06em",fontFamily:F}}>{l}</div><div style={{fontSize:14.5,color:C.dark,fontFamily:F,whiteSpace:"pre-line",wordBreak:"break-word"}}>{v}</div></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button disabled={enregistrement} onClick={()=>decider(ouverte,"en_cours")} style={{background:C.gold,color:C.forestDark,border:0,borderRadius:9,padding:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Mettre en discussion</button>
        <button disabled={enregistrement} onClick={()=>decider(ouverte,"acceptee")} style={{background:C.success,color:C.white,border:0,borderRadius:9,padding:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Accepter</button>
        <button disabled={enregistrement} onClick={()=>decider(ouverte,"modifications_demandees")} style={{background:C.forest,color:C.white,border:0,borderRadius:9,padding:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Demander des précisions</button>
      </div>
      <ReponseModeration key={ouverte.id} table="advertising_requests" dossier={ouverte} value={note} onChange={v=>{setNote(v);setErreurDecision("");}} onRefuse={()=>decider(ouverte,"refusee")} busy={enregistrement} error={erreurDecision}/>
    </ModalShell>}
  </div>;
}

// ── Modération des annonces ──
function AdminModeration({ user }) {
  const [liste, setListe] = useState([]);
  const [statut, setStatut] = useState("en_attente");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState(null);
  const [motif, setMotif] = useState("");
  const [enregistrement,setEnregistrement]=useState(false);
  const [erreurDecision,setErreurDecision]=useState("");

  const charger = () => {
    setChargement(true); setErreur("");
    lireAuth(`properties?${statut==="expiree"?`status=eq.validee&expires_at=lte.${new Date().toISOString()}`:statut==="validee"?`status=eq.validee&expires_at=gt.${new Date().toISOString()}`:`status=eq.${statut}`}&select=*&order=created_at.desc&limit=100`, user.token)
      .then(r=>{ if(r.ok) setListe(r.data||[]); else setErreur("Lecture refusée par le serveur. Vérifiez que vous êtes connectée avec "+EMAIL_REDACTION+"."); })
      .finally(()=>setChargement(false));
  };
  useEffect(charger, [statut]);

  const decider = async (p, nouveau, motifRejet) => {
    if(enregistrement)return;
    const invalide=validateModerationResponse(nouveau,motifRejet);
    if(invalide){setErreurDecision(invalide);return;}
    setErreurDecision("");setEnregistrement(true);
    const r = await ecrireAuth(`properties?id=eq.${p.id}`, {status:nouveau, motif_rejet:motifRejet?.trim()||null, modere_le:new Date().toISOString()}, user.token, "PATCH")
      .catch(e=>({ok:false,statut:0}));
    setEnregistrement(false);
    if (!r.ok) { setErreurDecision("La décision n'a pas pu être enregistrée. Votre réponse est conservée ici pour réessayer."); setErreur("La décision n'a pas pu être enregistrée."); return; }
    setOuvert(null); setMotif(""); charger();
  };

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
        {[["en_attente","En attente"],["validee","Publiées"],["expiree","Expirées"],["rejetee","Rejetées"]].map(([k,l])=>(
          <button key={k} onClick={()=>setStatut(k)} style={{background:statut===k?C.terra:C.white,color:statut===k?C.white:C.dark,border:`1px solid ${statut===k?C.terra:C.sand}`,borderRadius:"20px",padding:"9px 16px",fontSize:"14px",fontWeight:statut===k?700:500,cursor:"pointer",fontFamily:F}}>{l}</button>
        ))}
        <button onClick={charger} style={{marginLeft:"auto",background:"transparent",border:`1px solid ${C.sand}`,color:C.sub,borderRadius:"20px",padding:"9px 14px",fontSize:"13.5px",cursor:"pointer",fontFamily:F}}>Actualiser</button>
      </div>
      <BandeauErreur texte={erreur}/>
      {chargement ? <p style={{color:C.sub,fontFamily:F}}>Chargement…</p>
       : liste.length===0 ? (
        <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"34px",textAlign:"center",color:C.sub,fontFamily:F,fontSize:"15px"}}>
          {statut==="en_attente"?"Aucune annonce en attente. Tout est traité.":"Aucune annonce dans cette catégorie."}
        </div>
      ) : (
        <div style={{display:"grid",gap:"12px"}}>
          {liste.map(p=>(
            <div key={p.id} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",overflow:"hidden",display:"flex",flexWrap:"wrap"}}>
              <div style={{width:150,minHeight:120,flexShrink:0,backgroundColor:C.forest,backgroundImage:p.photos?.[0]?`url('${p.photos[0]}')`:undefined,backgroundSize:"cover",backgroundPosition:"center"}}/>
              <div style={{flex:1,minWidth:240,padding:"15px 17px"}}>
                <div style={{fontSize:"12px",color:C.sub,fontFamily:F,marginBottom:"4px"}}>
                  {libelleTransaction(p)} · {libelleNature(p)} · {p.city}, {p.country} · {dateCourte(p.created_at)}
                </div>
                <div style={{fontSize:"17px",fontWeight:700,color:C.dark,fontFamily:F,marginBottom:"5px"}}>{p.title}</div>
                <div style={{fontSize:"15px",fontWeight:700,color:C.terra,fontFamily:F,marginBottom:"8px"}}>{fmtEUR(p.price_eur)} · {p.photos?.length||0} photo(s)</div>
                <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"10px"}}>
                  {p.user_name} · {p.user_email} · {p.user_phone}
                </div>
                {p.expires_at&&<p style={{fontFamily:F,fontSize:13,color:C.sub}}>{isExpired(p)?"Expirée le":"Expiration le"} {dateCourte(p.expires_at)}</p>}
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                  <button onClick={()=>{setOuvert(p);setMotif(p.motif_rejet||"");setErreurDecision("");}} style={{background:"transparent",border:`1px solid ${C.forest}`,color:C.forest,borderRadius:"8px",padding:"8px 14px",fontSize:"13.5px",fontWeight:600,cursor:"pointer",fontFamily:F}}>Examiner</button>
                  {statut!=="validee"&&statut!=="expiree"&&<button disabled={enregistrement} onClick={()=>decider(p,"validee")} style={{background:C.success,color:C.white,border:"none",borderRadius:"8px",padding:"8px 14px",fontSize:"13.5px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Publier · {publicationMonths(p)===6?"6 mois":"1 an"}</button>}
                  {statut!=="rejetee"&&<button onClick={()=>{setOuvert(p);setMotif("");setErreurDecision("");}} style={{background:"transparent",border:"1px solid #C0392B",color:"#C0392B",borderRadius:"8px",padding:"8px 14px",fontSize:"13.5px",fontWeight:600,cursor:"pointer",fontFamily:F}}>Rejeter…</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ouvert&&(
        <ModalShell title={ouvert.title} subtitle={`${libelleTransaction(ouvert)} · ${libelleNature(ouvert)}`} onClose={()=>setOuvert(null)}>
          {ouvert.photos?.length>0&&(
            <div style={{display:"flex",gap:"8px",overflowX:"auto",marginBottom:"14px"}}>
              {ouvert.photos.map((u,i)=><div key={i} style={{width:110,height:82,flexShrink:0,borderRadius:"8px",backgroundImage:`url('${u}')`,backgroundSize:"cover",backgroundPosition:"center"}}/>)}
            </div>
          )}
          <div style={{fontSize:"14.5px",color:C.dark,fontFamily:F,lineHeight:1.7,whiteSpace:"pre-line",marginBottom:"14px"}}>{ouvert.description}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"8px",marginBottom:"16px"}}>
            {caracteristiques(ouvert).map(([l,v])=>(
              <div key={l} style={{background:C.cream,borderRadius:"8px",padding:"9px 11px"}}>
                <div style={{fontSize:"11px",color:C.sub,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
                <div style={{fontSize:"14.5px",fontWeight:700,color:C.dark,fontFamily:F}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gap:"9px"}}>
            <p style={{fontFamily:F,fontSize:14,lineHeight:1.6,background:C.cream,padding:12,borderRadius:8}}>{ouvert.status==="validee"?`Expiration : ${dateCourte(ouvert.expires_at)}. ${isExpired(ouvert)?"Le propriétaire doit confirmer la disponibilité et soumettre à nouveau son annonce.":""}`:`Durée de publication : ${publicationMonths(ouvert)===6?"6 mois":"1 an"} à partir de votre validation. Si vous validez aujourd’hui : jusqu’au ${dateCourte(addCalendarMonths(new Date(),publicationMonths(ouvert)))}.`}</p>
          <button disabled={enregistrement||ouvert.status==="validee"} onClick={()=>decider(ouvert,"validee")} style={{background:C.success,color:C.white,border:"none",borderRadius:"9px",padding:"13px",fontWeight:700,fontSize:"14.5px",cursor:"pointer",fontFamily:F}}>Publier</button>
          </div>
          <ReponseModeration key={ouvert.id} table="properties" dossier={ouvert} value={motif} onChange={v=>{setMotif(v);setErreurDecision("");}} onRefuse={()=>decider(ouvert,"rejetee",motif)} busy={enregistrement} error={erreurDecision}/>
        </ModalShell>
      )}
    </div>
  );
}


// ── Les demandes reçues ──
const NATURES_DEMANDE = {
  prestataire:         {label:"Candidature prestataire", couleur:"#2D6A4F"},
  publicite:           {label:"Demande de publicité",    couleur:"#C9A84C"},
  alerte:              {label:"Alerte email",            couleur:"#8F8676"},
  signalement:         {label:"Signalement",             couleur:"#A93226"},
  telechargement:      {label:"Téléchargement",          couleur:"#B85C3A"},
  annonce_en_attente:  {label:"Dépôt d'annonce",         couleur:"#1A3C2E"},
};

function AdminDemandes({ user }) {
  const [liste, setListe] = useState([]);
  const [filtre, setFiltre] = useState("nouvelles");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = () => {
    setChargement(true); setErreur("");
    const f = filtre==="nouvelles" ? "&traite=is.false" : filtre==="traitees" ? "&traite=is.true" : "";
    lireAuth(`leads?select=*${f}&order=created_at.desc&limit=200`, user.token)
      .then(r=>{ if(r.ok) setListe(r.data||[]); else setErreur("Lecture refusée par le serveur."); })
      .finally(()=>setChargement(false));
  };
  useEffect(charger, [filtre]);

  const marquer = async (d, traite) => {
    const r = await ecrireAuth(`leads?id=eq.${d.id}`, {traite, traite_le: traite?new Date().toISOString():null}, user.token, "PATCH")
      .catch(()=>({ok:false}));
    if (r.ok) charger(); else setErreur("La modification a été refusée par le serveur.");
  };

  const parType = liste.reduce((acc,d)=>{ const k=d.status||"autre"; (acc[k]=acc[k]||[]).push(d); return acc; }, {});

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
        {[["nouvelles","À traiter"],["traitees","Traitées"],["toutes","Toutes"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFiltre(k)} style={{background:filtre===k?C.terra:C.white,color:filtre===k?C.white:C.dark,border:`1px solid ${filtre===k?C.terra:C.sand}`,borderRadius:"20px",padding:"9px 16px",fontSize:"14px",fontWeight:filtre===k?700:500,cursor:"pointer",fontFamily:F}}>{l}</button>
        ))}
        <button onClick={charger} style={{marginLeft:"auto",background:"transparent",border:`1px solid ${C.sand}`,color:C.sub,borderRadius:"20px",padding:"9px 14px",fontSize:"13.5px",cursor:"pointer",fontFamily:F}}>Actualiser</button>
      </div>
      <BandeauErreur texte={erreur}/>
      {chargement ? <p style={{color:C.sub,fontFamily:F}}>Chargement…</p>
       : liste.length===0 ? (
        <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"34px",textAlign:"center",color:C.sub,fontFamily:F,fontSize:"15px"}}>Rien à afficher ici.</div>
      ) : Object.entries(parType).map(([type,items])=>{
        const n = NATURES_DEMANDE[type] || {label:type, couleur:C.sub};
        return (
          <div key={type} style={{marginBottom:"22px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"10px"}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:n.couleur,flexShrink:0}}/>
              <span style={{fontSize:"13px",fontWeight:700,color:C.dark,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.08em"}}>{n.label}</span>
              <span style={{fontSize:"13px",color:C.sub,fontFamily:F}}>({items.length})</span>
            </div>
            <div style={{display:"grid",gap:"9px"}}>
              {items.map(d=>(
                <div key={d.id} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"11px",padding:"13px 15px",opacity:d.traite?0.6:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:"12px",flexWrap:"wrap",marginBottom:"6px"}}>
                    <div style={{fontSize:"15px",fontWeight:700,color:C.dark,fontFamily:F}}>{d.name||"—"}</div>
                    <div style={{fontSize:"12.5px",color:C.sub,fontFamily:F}}>{dateCourte(d.created_at)}</div>
                  </div>
                  <div style={{fontSize:"13.5px",color:C.terra,fontFamily:F,marginBottom:"6px"}}>
                    {d.email&&<a href={`mailto:${d.email}`} style={{color:C.terra}}>{d.email}</a>}{d.phone?` · ${d.phone}`:""}
                  </div>
                  <div style={{fontSize:"14px",color:C.sub,fontFamily:F,lineHeight:1.6,marginBottom:"9px",whiteSpace:"pre-line"}}>{d.message}</div>
                  <button onClick={()=>marquer(d, !d.traite)} style={{background:"transparent",border:`1px solid ${d.traite?C.sand:C.forest}`,color:d.traite?C.sub:C.forest,borderRadius:"8px",padding:"7px 13px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:F}}>
                    {d.traite?"Remettre à traiter":"Marquer comme traitée"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Annuaire des prestataires ──
function AdminPrestataires({ user }) {
  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [statut, setStatut] = useState("en_attente");
  const [ouverte, setOuverte] = useState(null);
  const [note, setNote] = useState("");
  const [enregistrement,setEnregistrement]=useState(false);
  const [erreurDecision,setErreurDecision]=useState("");

  const charger = () => {
    setChargement(true); setErreur("");
    lireAuth(`professionals?status=eq.${statut}&select=*&order=created_at.desc&limit=100`, user.token)
      .then(r=>{ if(r.ok) setListe(r.data||[]); else setErreur("Les candidatures annuaire ne sont pas accessibles. Le script Supabase v34 doit être exécuté."); })
      .finally(()=>setChargement(false));
  };
  useEffect(charger, [statut]);

  const decider = async (p, nouveau) => {
    if(enregistrement)return;
    const invalide=validateModerationResponse(nouveau,note);
    if(invalide){setErreurDecision(invalide);return;}
    setErreurDecision("");setEnregistrement(true);
    const r = await ecrireAuth(`professionals?id=eq.${p.id}`, {
      status:nouveau,
      active:nouveau==="validee",
      moderation_note:["validee","acceptee"].includes(nouveau)?null:note.trim()||null,
    }, user.token, "PATCH").catch(()=>({ok:false}));
    setEnregistrement(false);
    if (!r.ok) { setErreurDecision("La décision n'a pas pu être enregistrée. Votre réponse est conservée ici pour réessayer."); return; }
    setOuverte(null); setNote(""); charger();
  };

  const libelles={en_attente:"À vérifier",validee:"Publiés",modifications_demandees:"À compléter",refusee:"Refusés"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px",flexWrap:"wrap",marginBottom:"12px"}}>
        <p style={{margin:0,fontSize:"14.5px",color:C.sub,fontFamily:F,maxWidth:"520px",lineHeight:1.6}}>
          Vérifiez l'identité, l'immatriculation et les coordonnées avant toute publication dans l'annuaire.
        </p>
        <button onClick={charger} style={{background:"transparent",border:`1px solid ${C.sand}`,color:C.sub,borderRadius:20,padding:"9px 14px",fontSize:13.5,cursor:"pointer",fontFamily:F}}>Actualiser</button>
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,marginBottom:16}}>
        {Object.entries(libelles).map(([k,l])=><button key={k} onClick={()=>setStatut(k)} style={{flexShrink:0,background:statut===k?C.terra:C.white,color:statut===k?C.white:C.dark,border:`1px solid ${statut===k?C.terra:C.sand}`,borderRadius:20,padding:"9px 15px",fontSize:14,fontWeight:statut===k?700:500,cursor:"pointer",fontFamily:F}}>{l}</button>)}
      </div>
      <BandeauErreur texte={erreur}/>
      {chargement ? <p style={{color:C.sub,fontFamily:F}}>Chargement…</p>
       : liste.length===0 ? (
        <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"34px",textAlign:"center",color:C.sub,fontFamily:F,fontSize:"15px"}}>
          Aucune candidature dans cette catégorie.
        </div>
      ) : (
        <div style={{display:"grid",gap:"10px"}}>
          {liste.map(p=>(
            <button key={p.id} onClick={()=>{setOuverte(p);setNote(p.moderation_note||"");setErreurDecision("");}} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"12px",padding:"14px 16px",display:"flex",gap:"13px",alignItems:"flex-start",flexWrap:"wrap",textAlign:"left",cursor:"pointer"}}>
              <div style={{fontSize:"24px",flexShrink:0}}>🏛️</div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"3px"}}>
                  <span style={{fontSize:"16px",fontWeight:700,color:C.dark,fontFamily:F}}>{p.business_name}</span>
                  {p.active&&<span style={{background:C.successBg,color:C.success,fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"12px",fontFamily:F}}>Visible</span>}
                </div>
                <div style={{fontSize:"13.5px",color:C.terra,fontFamily:F,marginBottom:"3px"}}>{p.specialty}</div>
                <div style={{fontSize:"13px",color:C.sub,fontFamily:F}}>{(p.countries||[]).join(" · ")}{p.zones?` · ${p.zones}`:""}</div>
              </div>
              <span style={{fontSize:12.5,color:C.sub,fontFamily:F}}>{dateCourte(p.created_at)}</span>
            </button>
          ))}
        </div>
      )}
      {ouverte&&<ModalShell title={ouverte.business_name} subtitle="Candidature à l'annuaire" onClose={()=>setOuverte(null)}>
        <div style={{display:"grid",gap:9,marginBottom:15}}>
          {[["Spécialité",ouverte.specialty],["Pays",(ouverte.countries||[]).join(", ")],["Zones",ouverte.zones],["Email",ouverte.email],["Téléphone",ouverte.phone],["Site",ouverte.website],["Immatriculation / ordre",ouverte.verification_reference],["Tarifs",ouverte.pricing],["Présentation",ouverte.description]].filter(([,v])=>v).map(([l,v])=><div key={l} style={{background:C.cream,borderRadius:8,padding:"9px 11px"}}><div style={{fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:".06em",fontFamily:F}}>{l}</div><div style={{fontSize:14.5,color:C.dark,fontFamily:F,whiteSpace:"pre-line",wordBreak:"break-word"}}>{v}</div></div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <button disabled={enregistrement} onClick={()=>decider(ouverte,"validee")} style={{background:C.success,color:C.white,border:0,borderRadius:9,padding:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Valider et publier</button>
          <button disabled={enregistrement} onClick={()=>decider(ouverte,"modifications_demandees")} style={{background:C.gold,color:C.forestDark,border:0,borderRadius:9,padding:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Demander à compléter</button>
        </div>
        <ReponseModeration key={ouverte.id} table="professionals" dossier={ouverte} value={note} onChange={v=>{setNote(v);setErreurDecision("");}} onRefuse={()=>decider(ouverte,"refusee")} busy={enregistrement} error={erreurDecision}/>
      </ModalShell>}
    </div>
  );
}

// ── Les chiffres ──
function AdminChiffres({ user }) {
  const [s, setS] = useState(null);
  const [erreur, setErreur] = useState("");
  useEffect(()=>{
    appelerFonction("statistiques_sokile", user.token)
      .then(d=>{ if(d) setS(d); else setErreur("Les statistiques n'ont pas pu être calculées. Le script admin.sql a-t-il été exécuté ?"); });
  }, []);
  if (erreur) return <BandeauErreur texte={erreur}/>;
  if (!s) return <p style={{color:C.sub,fontFamily:F}}>Calcul en cours…</p>;

  const tuiles = [
    ["Annonces publiées", s.annonces_publiees, C.forest],
    ["En attente de modération", s.annonces_attente, s.annonces_attente>0?C.terra:C.forest],
    ["Déposées cette semaine", s.annonces_semaine, C.forest],
    ["Demandes à traiter", s.demandes_nouvelles, s.demandes_nouvelles>0?C.terra:C.forest],
    ["Signalements en attente", s.signalements, s.signalements>0?"#A93226":C.forest],
    ["Téléchargements", s.telechargements, C.forest],
    ["Prestataires", s.prestataires, C.forest],
    ["Articles publiés", s.articles, C.forest],
  ];
  const maxPays = Math.max(1, ...(s.par_pays||[]).map(x=>x.n));

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:"11px",marginBottom:"24px"}}>
        {tuiles.map(([l,v,c])=>(
          <div key={l} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"12px",padding:"16px"}}>
            <div style={{fontSize:"30px",fontWeight:700,color:c,fontFamily:F,lineHeight:1.1}}>{v ?? 0}</div>
            <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginTop:"4px",lineHeight:1.4}}>{l}</div>
          </div>
        ))}
      </div>
      {(s.par_pays||[]).length>0&&(
        <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"18px"}}>
          <div style={{fontSize:"13px",fontWeight:700,color:C.dark,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"14px"}}>Annonces par pays</div>
          {s.par_pays.map(x=>(
            <div key={x.pays} style={{marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"14px",fontFamily:F,color:C.dark,marginBottom:"4px"}}>
                <span>{x.pays}</span><span style={{fontWeight:700}}>{x.n}</span>
              </div>
              <div style={{height:7,background:C.cream,borderRadius:"4px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(x.n/maxPays*100)}%`,background:C.forest,borderRadius:"4px"}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Aperçu des autres vues ──
function AdminApercu({ apercu, onApercu }) {
  const choix = [
    ["", "Vue administratrice", "Ce que vous voyez normalement : l'onglet Administration et tous vos droits."],
    ["particulier", "Vue particulier", "Ce que voit une personne connectée avec un compte particulier : dépôt d'annonce en mode particulier, pas d'espace pro."],
    ["pro", "Vue professionnel", "Ce que voit une agence : l'espace pro, le dépôt en mode professionnel avec le nom d'agence."],
    ["visiteur", "Vue visiteur", "Ce que voit quelqu'un qui n'est pas connecté : tout est consultable, rien n'est déposable."],
  ];
  return (
    <div>
      <p style={{margin:"0 0 18px",fontSize:"15px",color:C.sub,fontFamily:F,lineHeight:1.65,maxWidth:"620px"}}>
        Naviguez sur le site comme le voient vos utilisateurs, sans vous déconnecter. Un bandeau vous rappellera que vous êtes en aperçu, et vous pourrez revenir d'un clic.
      </p>
      <div style={{display:"grid",gap:"10px"}}>
        {choix.map(([v,titre,desc])=>(
          <button key={v||"admin"} onClick={()=>onApercu(v)} style={{textAlign:"left",background:apercu===v?C.forest:C.white,color:apercu===v?C.white:C.dark,border:`1px solid ${apercu===v?C.forest:C.sand}`,borderRadius:"12px",padding:"16px 18px",cursor:"pointer",fontFamily:F}}>
            <div style={{fontSize:"16px",fontWeight:700,marginBottom:"4px"}}>{titre}{apercu===v?" · en cours":""}</div>
            <div style={{fontSize:"13.5px",opacity:0.75,lineHeight:1.55}}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SIGNALER UNE ANNONCE ─────────────────────────
// Obligation d'hébergeur : permettre à chacun de signaler un contenu illicite.
const MOTIFS_SIGNALEMENT = [
  "Le bien n'existe pas / annonce fictive",
  "Prix manifestement trompeur",
  "Photos qui ne correspondent pas au bien",
  "Demande d'argent avant toute visite",
  "Coordonnées injoignables",
  "Contenu choquant ou illégal",
  "Autre",
];

function SignalerModal({ p, onClose }) {
  const [motif, setMotif] = useState("");
  const [detail, setDetail] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [erreur, setErreur] = useState("");

  const envoyer = async () => {
    if (!motif) return;
    setErreur(""); setLoading(true);
    const idBrut = String(p.id).replace(/^db-/, "");
    // trace principale, toujours enregistrée
    const r = await ecrire("leads", {
      name: "Signalement", email: email || CONTACT_MAIL, status: "signalement",
      message: `SIGNALEMENT | Annonce #${idBrut} — ${p.title} (${p.city}, ${p.country}) | Motif : ${motif} | ${detail}`,
    }).catch(e=>({ok:false,statut:0,motif:String(e)}));
    // table dédiée si elle existe, sans bloquer l'utilisateur
    ecrire("reports", { property_id: idBrut, reason: motif, details: detail || null, reporter_email: email || null }).catch(()=>{});
    setLoading(false);
    if (!r.ok) { setErreur(messageErreur(r)); return; }
    setSent(true);
  };

  return (
    <ModalShell title="Signaler cette annonce" subtitle={p.title} color="#A93226" onClose={onClose}>
      {sent ? (
        <SentMessage title="Signalement transmis"
          text="Merci. Nous examinons cette annonce et la retirons si elle enfreint nos règles. Vous pouvez fermer cette fenêtre." onClose={onClose}/>
      ) : (<>
        <p style={{margin:"0 0 14px",fontSize:"14px",color:C.sub,fontFamily:F,lineHeight:1.6}}>
          Signalez une annonce qui vous paraît frauduleuse, trompeuse ou illégale. Chaque signalement est examiné.
        </p>
        <div style={{marginBottom:"12px"}}>
          <label style={lbl}>Motif *</label>
          <select style={inp} value={motif} onChange={e=>setMotif(e.target.value)}>
            <option value="">Choisir…</option>
            {MOTIFS_SIGNALEMENT.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{marginBottom:"12px"}}>
          <label style={lbl}>Précisions</label>
          <textarea style={{...inp,minHeight:"84px",resize:"vertical"}} value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Ce que vous avez constaté…"/>
        </div>
        <div style={{marginBottom:"14px"}}>
          <label style={lbl}>Votre email (facultatif)</label>
          <input type="email" style={inp} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Pour que nous puissions vous répondre"/>
        </div>
        <BandeauErreur texte={erreur} onRetry={envoyer}/>
        <button onClick={envoyer} disabled={!motif||loading} style={{width:"100%",background:motif?"#A93226":"#ccc",color:C.white,border:"none",borderRadius:"9px",padding:"14px",fontWeight:700,fontSize:"15px",cursor:motif?"pointer":"default",fontFamily:F}}>
          {loading?"Envoi…":"Envoyer le signalement"}
        </button>
      </>)}
    </ModalShell>
  );
}

// ─── CONTACT DU VENDEUR ───────────────────────────
// Sokilé n'a pas de téléphone : seul le vendeur en fournit un au dépôt.
function telPropre(brut) {
  return normalizePhone("", brut) || "";
}
function lienWhatsApp(p) {
  const n = telPropre(p.user_phone).replace(/^\+/, "");
  const txt = `Bonjour, je vous contacte au sujet de votre annonce sur Sokilé : ${p.title} — ${p.city}, ${p.country} (${fmtEUR(p.price_eur)}).`;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(txt)}` : null;
}
function lienAppel(p) {
  const n = telPropre(p.user_phone);
  return n ? `tel:${n}` : null;
}
function lienMailSokile(p) {
  const sujet = `Demande de contact — annonce ${p.title} (${p.city})`;
  const corps = `Bonjour,\n\nJe souhaite être mis en relation avec l'annonceur du bien suivant :\n\n${p.title}\n${p.neighborhood ? p.neighborhood + ", " : ""}${p.city}, ${p.country}\n${fmtEUR(p.price_eur)}\n\nMerci,\n`;
  return `mailto:${CONTACT_MAIL}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
}

// ─── PROPERTY CARD ────────────────────────────────
function PropertyCard({ p, onClick, compact, onSave, saved }) {
  const [hov, setHov] = useState(false);
  const photo = p.photos?.[0];
  const shareWA = (e) => {
    e && e.stopPropagation();
    const txt = `${p.title}\n${p.neighborhood ? p.neighborhood+", " : ""}${p.city}, ${p.country}\n${fmtEUR(p.price_eur)}\n\nVu sur Sokilé — https://www.sokile.com`;
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
      style={{background:C.white,borderRadius:"14px",overflow:"hidden",cursor:"pointer",border:`1px solid ${hov?C.terra:C.sand}`,boxShadow:hov?"0 8px 24px rgba(26,60,46,0.13)":"0 1px 4px rgba(26,60,46,0.05)",transform:hov?"translateY(-3px)":"none",transition:"all 0.22s ease"}}>
      <div className="sok-card-img" style={{backgroundColor:C.forest,backgroundImage:photo?`url('${photo}')`:`radial-gradient(circle at 80% 18%,rgba(201,168,76,.28),transparent 24%),linear-gradient(145deg,${C.forestMid},${C.forestDark})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative",display:"flex",alignItems:"flex-end",padding:"10px"}}>
        {!photo&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",color:"rgba(255,255,255,.78)",fontFamily:F}}>
          <span style={{display:"flex",transform:"scale(1.55)",opacity:.72}}>{Icon.home}</span>
          <span style={{fontSize:"12px",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase"}}>Photos à venir</span>
        </div>}
        {p.photos?.length>1&&<div style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,0.6)",color:C.white,fontSize:"12px",fontWeight:600,padding:"3px 9px",borderRadius:"20px",fontFamily:F,zIndex:1}}>1/{p.photos.length}</div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)"}}/>
        {p.demo&&<div style={{position:"absolute",top:7,left:7,background:"rgba(0,0,0,0.35)",color:"rgba(255,255,255,0.75)",fontSize:"11px",padding:"2px 6px",borderRadius:"3px",fontFamily:F}}>Démo</div>}
        {p.verified&&<div style={{position:"absolute",top:7,right:7,background:"rgba(23,56,44,0.92)",color:C.white,fontSize:"11px",fontWeight:700,padding:"3px 8px",borderRadius:"20px",fontFamily:F}}>Annonce modérée</div>}
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:"6px",width:"100%"}}>
          <span style={{background:transactionDe(p)==="location"?C.forest:C.terra,color:C.white,fontSize:"11px",fontWeight:700,padding:"3px 9px",borderRadius:"4px",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{transactionDe(p)==="location"?"À louer":"À vendre"}</span>
          <span style={{background:"rgba(255,255,255,0.92)",color:C.dark,fontSize:"11px",fontWeight:600,padding:"3px 9px",borderRadius:"4px",fontFamily:F}}>{libelleNature(p)}</span>
          <div style={{marginLeft:"auto",display:"flex",gap:"5px"}}>
            <span onClick={e=>{e.stopPropagation();onSave&&onSave(p);}} style={{background:"rgba(255,255,255,0.9)",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"15px"}}>{saved?"❤️":"🤍"}</span>
            <span style={{background:"rgba(255,255,255,0.9)",borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={shareWA}>{Icon.wa}</span>
          </div>
        </div>
      </div>
      <div style={{padding:"16px 16px 18px"}}>
        <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"5px"}}>{p.neighborhood}, {p.city} · <Flag name={p.country} size={15}/>{p.country}</div>
        {p.advertiser_type==="pro"&&<div style={{display:"inline-block",background:C.forest,color:C.white,fontSize:"11px",fontWeight:700,padding:"2px 7px",borderRadius:"3px",fontFamily:F,marginBottom:"4px"}}>Pro{p.agency_name?` · ${p.agency_name}`:""}</div>}
        <div style={{fontSize:"19px",fontWeight:500,color:C.dark,fontFamily:FT,marginBottom:"9px",lineHeight:1.28}}>{p.title}</div>
        <div style={{display:"flex",gap:"8px",marginBottom:"8px",flexWrap:"wrap",alignItems:"center"}}>
          {resumeBien(p).map((x,i)=>(
            <span key={i} style={{display:"flex",alignItems:"center",gap:"8px"}}>
              {i>0&&<span style={{fontSize:"12px",color:C.sand}}>|</span>}
              <span style={{fontSize:"13px",color:C.sub,fontFamily:F}}>{x}</span>
            </span>
          ))}
        </div>
        <div style={{borderTop:`1px solid ${C.sand}`,paddingTop:"11px"}}>
          <div style={{fontSize:"22px",fontWeight:700,color:C.terra,fontFamily:F,letterSpacing:"-0.01em"}}>{fmtEUR(p.price_eur)}</div>
          <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginTop:"2px"}}>{fmtXOF(p.price)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── PROPERTY MODAL ───────────────────────────────
function PropertyModal({ p, onClose, onSaveFromModal, onVerify, onBudget }) {
  const [img, setImg] = useState(0);
  const [signaler, setSignaler] = useState(false);
  useEffect(()=>{ setImg(0); }, [p?.id]);
  if (!p) return null;
  const shareWA = () => {
    const txt = `${p.title}\n${p.neighborhood ? p.neighborhood+", " : ""}${p.city}, ${p.country}\n${fmtEUR(p.price_eur)}\n\nVu sur Sokilé — https://www.sokile.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");
  };
  return (
    <>
    {signaler&&<SignalerModal p={p} onClose={()=>setSignaler(false)}/>}
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:C.white,borderRadius:"16px",maxWidth:"500px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
        <div style={{height:260,background:p.bg,backgroundImage:p.photos?.[img]?`url('${p.photos[img]}')`:undefined,backgroundSize:"cover",backgroundPosition:"center",borderRadius:"16px 16px 0 0",position:"relative",display:"flex",alignItems:"flex-end",padding:"14px"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.6) 100%)",borderRadius:"16px 16px 0 0"}}/>
          {p.photos?.length>1&&(<>
            <button onClick={e=>{e.stopPropagation();setImg(i=>(i-1+p.photos.length)%p.photos.length);}} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",color:C.white,border:"none",width:36,height:36,borderRadius:"50%",cursor:"pointer",fontSize:"17px",zIndex:2}}>‹</button>
            <button onClick={e=>{e.stopPropagation();setImg(i=>(i+1)%p.photos.length);}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",color:C.white,border:"none",width:36,height:36,borderRadius:"50%",cursor:"pointer",fontSize:"17px",zIndex:2}}>›</button>
            <div style={{position:"absolute",bottom:12,right:14,background:"rgba(0,0,0,0.6)",color:C.white,fontSize:"12px",fontWeight:600,padding:"3px 10px",borderRadius:"20px",fontFamily:F,zIndex:2}}>{img+1}/{p.photos.length}</div>
          </>)}
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,0.15)",border:"none",color:C.white,width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:"15px"}}>✕</button>
          <div style={{position:"relative",zIndex:1}}>
            <span style={{background:typeColor(p.type),color:C.white,fontSize:"12px",fontWeight:700,padding:"3px 9px",borderRadius:"3px",textTransform:"uppercase",fontFamily:F,letterSpacing:"0.06em"}}>{p.type}</span>
            {p.verified&&<span style={{marginLeft:"6px",background:"rgba(23,56,44,0.92)",color:C.white,fontSize:"12px",fontWeight:700,padding:"4px 10px",borderRadius:"20px",fontFamily:F}}>Annonce modérée</span>}
          </div>
        </div>
        {p.photos?.length>1&&(
          <div style={{display:"flex",gap:"7px",overflowX:"auto",padding:"10px 18px 0"}}>
            {p.photos.map((u,i)=>(
              <div key={i} onClick={()=>setImg(i)} style={{width:66,height:50,flexShrink:0,borderRadius:"7px",backgroundImage:`url('${u}')`,backgroundSize:"cover",backgroundPosition:"center",cursor:"pointer",border:`2px solid ${i===img?C.terra:"transparent"}`,opacity:i===img?1:0.65}}/>
            ))}
          </div>
        )}
        <div style={{padding:"18px"}}>
          {p.demo&&<div style={{background:"#FFF8E1",border:"1px solid #FFD54F",borderRadius:"7px",padding:"7px 11px",marginBottom:"12px",fontSize:"13px",color:"#5D4037",fontFamily:F}}>Annonce de démonstration — publiez la vôtre gratuitement</div>}
          <h2 style={{margin:"0 0 4px",fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.dark}}>{p.title}</h2>
          <p style={{margin:"0 0 12px",color:C.sub,fontSize:"13px",fontFamily:F}}>{p.neighborhood}, {p.city} — <Flag name={p.country} size={14}/>{p.country}</p>
          <p style={{margin:"0 0 14px",color:C.dark,fontSize:"14px",lineHeight:1.6,fontFamily:F}}>{p.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"14px"}}>
            {caracteristiques(p).map(([l,v])=>(
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
          {/* Mise en relation avec l'annonceur */}
          {(() => {
            const wa = lienWhatsApp(p), tel = lienAppel(p);
            if (p.demo) return (
              <div style={{background:C.cream,border:`1px solid ${C.sand}`,borderRadius:"10px",padding:"14px",marginBottom:"10px",textAlign:"center"}}>
                <div style={{fontSize:"14px",color:C.sub,fontFamily:F,lineHeight:1.55}}>Annonce de démonstration : il n'y a pas d'annonceur à contacter.</div>
              </div>
            );
            if (wa || tel) return (
              <div style={{background:C.cream,border:`1px solid ${C.sand}`,borderRadius:"12px",padding:"14px",marginBottom:"10px"}}>
                <div style={{fontSize:"12px",fontWeight:700,color:C.sub,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"10px"}}>Contacter l'annonceur{p.user_name?` · ${p.user_name}`:""}</div>
                <div style={{display:"grid",gridTemplateColumns:wa&&tel?"1fr 1fr":"1fr",gap:"8px"}}>
                  {wa&&<a href={wa} target="_blank" rel="noopener noreferrer" style={{background:"#25D366",color:C.white,borderRadius:"9px",padding:"13px",fontWeight:700,fontSize:"14px",fontFamily:F,textDecoration:"none",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:"7px"}}>{Icon.wa}WhatsApp</a>}
                  {tel&&<a href={tel} style={{background:C.terra,color:C.white,borderRadius:"9px",padding:"13px",fontWeight:700,fontSize:"14px",fontFamily:F,textDecoration:"none",textAlign:"center"}}>Appeler</a>}
                </div>
                <a href={lienMailSokile(p)} style={{display:"block",textAlign:"center",marginTop:"9px",fontSize:"13px",color:C.forest,fontFamily:F,fontWeight:600}}>Passer par Sokilé</a>
              </div>
            );
            return (
              <div style={{background:C.cream,border:`1px solid ${C.sand}`,borderRadius:"12px",padding:"14px",marginBottom:"10px",textAlign:"center"}}>
                <div style={{fontSize:"13.5px",color:C.sub,fontFamily:F,lineHeight:1.55,marginBottom:"10px"}}>L'annonceur n'a pas laissé de numéro. Écrivez-nous et nous transmettons votre demande.</div>
                <a href={lienMailSokile(p)} style={{display:"inline-block",background:C.forest,color:C.white,borderRadius:"9px",padding:"12px 22px",fontWeight:700,fontSize:"14px",fontFamily:F,textDecoration:"none"}}>Écrire à Sokilé</a>
              </div>
            );
          })()}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <button onClick={()=>onSaveFromModal&&onSaveFromModal(p)} style={{background:"transparent",color:C.terra,border:`1px solid ${C.terra}`,borderRadius:"7px",padding:"11px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>Sauvegarder</button>
            <button onClick={shareWA} style={{background:"transparent",color:C.forest,border:`1px solid ${C.forest}`,borderRadius:"7px",padding:"11px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F}}>Partager</button>
          </div>
          {onBudget&&!p.demo&&transactionDe(p)==="vente"&&<button onClick={()=>onBudget(p)} style={{width:"100%",marginTop:10,background:C.forest,color:C.white,border:0,borderRadius:9,padding:14,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:F}}>Calculer mon budget pour ce bien →</button>}
          {onVerify&&<button onClick={()=>onVerify(p)} style={{width:"100%",marginTop:"8px",background:C.cream,color:C.forest,border:`1px solid ${C.forest}`,borderRadius:"7px",padding:"11px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Faire vérifier ce bien</button>}
          {!p.demo&&(
            <div style={{marginTop:"14px",paddingTop:"13px",borderTop:`1px solid ${C.sand}`}}>
              <div style={{background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:"9px",padding:"11px 13px",marginBottom:"10px"}}>
                <div style={{fontSize:"13px",color:"#6D4C1B",fontFamily:F,lineHeight:1.55}}>
                  <strong>Prudence.</strong> Sokilé met en relation mais n'intervient pas dans la transaction. Ne versez jamais d'argent avant d'avoir visité le bien ou fait vérifier le titre foncier.
                </div>
              </div>
              <button onClick={()=>setSignaler(true)} style={{width:"100%",background:"transparent",color:"#A93226",border:"none",padding:"8px",fontWeight:600,fontSize:"13.5px",cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>Signaler cette annonce</button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}


// ─── PAGE D'UNE ANNONCE ───────────────────────────
function AnnoncePage({ p, onRetour, onSave, saved, onVerify, onVoir, similaires, onBudget }) {
  const [img, setImg] = useState(0);
  const [signaler, setSignaler] = useState(false);
  const [copie, setCopie] = useState(false);

  useEffect(()=>{ setImg(0); window.scrollTo(0,0); }, [p?.id]);
  useEffect(()=>{
    if (!p) return;
    document.title = `${p.title} — ${p.city}, ${p.country} | Sokilé`;
    return () => { document.title = "Sokilé — L'immobilier en Afrique"; };
  }, [p]);

  if (!p) return null;
  const photos = p.photos?.length ? p.photos : [];
  const wa = lienWhatsApp(p), tel = lienAppel(p);

  const partager = async () => {
    const url = urlAnnonce(p);
    const texte = `${p.title} — ${p.city}, ${p.country}\n${fmtEUR(p.price_eur)}`;
    if (navigator.share) { try { await navigator.share({title:p.title, text:texte, url}); return; } catch(e) {} }
    try { await navigator.clipboard.writeText(url); setCopie(true); setTimeout(()=>setCopie(false), 2500); }
    catch(e) { window.open(`https://wa.me/?text=${encodeURIComponent(texte+"\n"+url)}`,"_blank"); }
  };

  return (
    <div style={{paddingBottom:"10px"}}>
      {signaler&&<SignalerModal p={p} onClose={()=>setSignaler(false)}/>}

      {/* Fil d'ariane */}
      <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"16px 0 12px",flexWrap:"wrap"}}>
        <button onClick={onRetour} style={{background:"transparent",border:"none",color:C.terra,fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F,padding:0}}>← Retour aux annonces</button>
        <span style={{color:C.sand}}>·</span>
        <span style={{fontSize:"13.5px",color:C.sub,fontFamily:F}}><Flag name={p.country} size={15}/>{p.country} · {p.city}</span>
      </div>

      <div className="sok-annonce">
        {/* Colonne principale */}
        <div style={{minWidth:0}}>
          {/* Galerie */}
          <div className="sok-annonce-photo" style={{position:"relative",borderRadius:"14px",overflow:"hidden",backgroundColor:C.forest,backgroundImage:photos[img]?`url('${photos[img]}')`:(p.bg||undefined),backgroundSize:"cover",backgroundPosition:"center"}}>
            {!photos.length&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.5)",fontFamily:F,fontSize:"15px"}}>Pas de photo</div>}
            <div style={{position:"absolute",top:12,left:12,display:"flex",gap:"7px"}}>
              <span style={{background:typeColor(p.type),color:C.white,fontSize:"12px",fontWeight:700,padding:"5px 11px",borderRadius:"5px",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{p.type}</span>
              {p.demo&&<span style={{background:"rgba(0,0,0,0.55)",color:C.white,fontSize:"12px",padding:"5px 10px",borderRadius:"5px",fontFamily:F}}>Démo</span>}
              {p.verified&&<span style={{background:"rgba(23,56,44,0.92)",color:C.white,fontSize:"12px",fontWeight:700,padding:"5px 11px",borderRadius:"20px",fontFamily:F}}>Annonce modérée</span>}
            </div>
            {photos.length>1&&(<>
              <button onClick={()=>setImg(i=>(i-1+photos.length)%photos.length)} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",color:C.white,border:"none",width:42,height:42,borderRadius:"50%",cursor:"pointer",fontSize:"20px"}}>‹</button>
              <button onClick={()=>setImg(i=>(i+1)%photos.length)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.5)",color:C.white,border:"none",width:42,height:42,borderRadius:"50%",cursor:"pointer",fontSize:"20px"}}>›</button>
              <div style={{position:"absolute",bottom:12,right:14,background:"rgba(0,0,0,0.62)",color:C.white,fontSize:"13px",fontWeight:600,padding:"4px 12px",borderRadius:"20px",fontFamily:F}}>{img+1} / {photos.length}</div>
            </>)}
          </div>
          {photos.length>1&&(
            <div style={{display:"flex",gap:"8px",overflowX:"auto",marginTop:"10px",paddingBottom:"4px"}}>
              {photos.map((u,i)=>(
                <div key={i} onClick={()=>setImg(i)} style={{width:88,height:66,flexShrink:0,borderRadius:"9px",backgroundImage:`url('${u}')`,backgroundSize:"cover",backgroundPosition:"center",cursor:"pointer",border:`2px solid ${i===img?C.terra:"transparent"}`,opacity:i===img?1:0.62}}/>
              ))}
            </div>
          )}

          {/* Titre et prix */}
          <h1 style={{margin:"20px 0 6px",fontFamily:FT,fontSize:"clamp(24px,3.4vw,34px)",fontWeight:500,color:C.dark,lineHeight:1.22}}>{p.title}</h1>
          <p style={{margin:"0 0 14px",color:C.sub,fontSize:"15px",fontFamily:F}}>{p.neighborhood?p.neighborhood+", ":""}{p.city} · <Flag name={p.country} size={15}/>{p.country}</p>
          <div style={{display:"flex",alignItems:"baseline",gap:"12px",flexWrap:"wrap",marginBottom:"18px"}}>
            <span style={{fontSize:"32px",fontWeight:700,color:C.terra,fontFamily:F,letterSpacing:"-0.02em"}}>{fmtEUR(p.price_eur)}</span>
            <span style={{fontSize:"16px",color:C.sub,fontFamily:F}}>{fmtXOF(p.price)}</span>
          </div>

          {/* Caractéristiques */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:"9px",marginBottom:"20px"}}>
            {caracteristiques(p).map(([l,v])=>(
              <div key={l} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"10px",padding:"13px"}}>
                <div style={{fontSize:"11.5px",color:C.sub,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"3px"}}>{l}</div>
                <div style={{fontSize:"17px",fontWeight:700,color:C.dark,fontFamily:F}}>{v}</div>
              </div>
            ))}
          </div>

          {p.description&&(<>
            <h2 style={{fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.dark,margin:"0 0 9px"}}>Description</h2>
            <p style={{margin:"0 0 20px",fontSize:"16px",lineHeight:1.72,color:C.dark,fontFamily:F,whiteSpace:"pre-line"}}>{p.description}</p>
          </>)}

          {p.features?.length>0&&(<>
            <h2 style={{fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.dark,margin:"0 0 9px"}}>Équipements</h2>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"20px"}}>
              {p.features.map(f=><span key={f} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"20px",padding:"8px 15px",fontSize:"14px",color:C.dark,fontFamily:F}}>{f}</span>)}
            </div>
          </>)}

          {!p.demo&&(
            <div style={{background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:"11px",padding:"14px 16px",marginBottom:"14px"}}>
              <div style={{fontSize:"14px",color:"#6D4C1B",fontFamily:F,lineHeight:1.6}}>
                <strong>Prudence.</strong> Sokilé met en relation mais n'intervient pas dans la transaction. Ne versez jamais d'argent avant d'avoir visité le bien ou fait vérifier le titre foncier par un professionnel.
              </div>
            </div>
          )}
          {!p.demo&&<button onClick={()=>setSignaler(true)} style={{background:"transparent",color:"#A93226",border:"none",padding:"6px 0",fontWeight:600,fontSize:"13.5px",cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>Signaler cette annonce</button>}
        </div>

        {/* Colonne de contact */}
        <aside className="sok-annonce-aside">
          <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"18px",boxShadow:"0 4px 18px rgba(26,60,46,0.07)"}}>
            {p.demo ? (
              <div style={{fontSize:"14px",color:C.sub,fontFamily:F,lineHeight:1.6,textAlign:"center"}}>Annonce de démonstration : il n'y a pas d'annonceur à contacter.</div>
            ) : (<>
              <div style={{fontSize:"11.5px",fontWeight:700,color:C.sub,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:"4px"}}>Contacter l'annonceur</div>
              <div style={{fontSize:"17px",fontWeight:700,color:C.dark,fontFamily:F,marginBottom:"14px"}}>{p.agency_name||p.user_name||"Particulier"}</div>
              {(wa||tel) ? (<>
                {wa&&<a href={wa} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",background:"#25D366",color:C.white,borderRadius:"10px",padding:"14px",fontWeight:700,fontSize:"15px",fontFamily:F,textDecoration:"none",marginBottom:"8px"}}>{Icon.wa}WhatsApp</a>}
                {tel&&<a href={tel} style={{display:"block",textAlign:"center",background:C.terra,color:C.white,borderRadius:"10px",padding:"14px",fontWeight:700,fontSize:"15px",fontFamily:F,textDecoration:"none",marginBottom:"8px"}}>Appeler</a>}
                <a href={lienMailSokile(p)} style={{display:"block",textAlign:"center",fontSize:"13.5px",color:C.forest,fontFamily:F,fontWeight:600,padding:"6px"}}>Passer par Sokilé</a>
              </>) : (<>
                <p style={{margin:"0 0 12px",fontSize:"14px",color:C.sub,fontFamily:F,lineHeight:1.6}}>L'annonceur n'a pas laissé de numéro. Écrivez-nous, nous transmettons votre demande.</p>
                <a href={lienMailSokile(p)} style={{display:"block",textAlign:"center",background:C.forest,color:C.white,borderRadius:"10px",padding:"14px",fontWeight:700,fontSize:"15px",fontFamily:F,textDecoration:"none"}}>Écrire à Sokilé</a>
              </>)}
            </>)}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"14px",paddingTop:"14px",borderTop:`1px solid ${C.sand}`}}>
              <button onClick={()=>onSave&&onSave(p)} style={{background:"transparent",color:C.terra,border:`1px solid ${C.terra}`,borderRadius:"9px",padding:"11px",fontWeight:700,fontSize:"13.5px",cursor:"pointer",fontFamily:F}}>{saved?"Enregistré":"Enregistrer"}</button>
              <button onClick={partager} style={{background:"transparent",color:C.forest,border:`1px solid ${C.forest}`,borderRadius:"9px",padding:"11px",fontWeight:700,fontSize:"13.5px",cursor:"pointer",fontFamily:F}}>{copie?"Lien copié !":"Partager"}</button>
            </div>
            {onBudget&&!p.demo&&transactionDe(p)==="vente"&&<button onClick={()=>onBudget(p)} style={{width:"100%",marginTop:10,background:C.forest,color:C.white,border:0,borderRadius:9,padding:14,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:F}}>Calculer mon budget pour ce bien →</button>}
            {onVerify&&!p.demo&&<button onClick={()=>onVerify(p)} style={{width:"100%",marginTop:"8px",background:C.cream,color:C.forest,border:`1px solid ${C.forest}`,borderRadius:"9px",padding:"11px",fontWeight:700,fontSize:"13.5px",cursor:"pointer",fontFamily:F}}>Faire vérifier ce bien</button>}
          </div>
        </aside>
      </div>

      {/* Biens similaires */}
      {similaires?.length>0&&(
        <div style={{marginTop:"34px"}}>
          <h2 style={{fontFamily:FT,fontSize:"22px",fontWeight:500,color:C.dark,margin:"0 0 14px"}}>Autres biens en {p.country}</h2>
          <div className="sok-grid">
            {similaires.map(s=><PropertyCard key={s.id} p={s} onClick={onVoir} onSave={onSave} saved={false}/>)}
          </div>
        </div>
      )}
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
const SPECIALITES = ["Agence immobilière","Promoteur immobilier","Géomètre","Notaire","Architecte","BTP / Construction","Vérification terrain","Juridique","Financement","Déménagement"];

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

function ServiceFormModal({ onClose, user, existing=null, onSaved }) {
  const [f, setF] = useState({name:existing?.business_name||user?.agency||user?.name||"",spec:existing?.specialty||"",pays:existing?.countries||[],email:existing?.email||user?.email||"",...splitPhone(existing?.phone||user?.phone,PHONE_CODES),site:existing?.website||"",zones:existing?.zones||"",tarifs:existing?.pricing||"",desc:existing?.description||"",reference:existing?.verification_reference||"",consent:false});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [erreur, setErreur] = useState("");
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const togglePays = n => set("pays", f.pays.includes(n)?f.pays.filter(x=>x!==n):[...f.pays,n]);
  const ok = f.name && f.spec && f.email && f.pays.length>0 && f.consent;
  const submit = async () => {
    if (!ok || loading) return;
    const invalide=contactError(f.name,f.email,f.site);
    if(invalide){setErreur(invalide);return;}
    if(f.phone.trim()&&!normalizePhone(f.phoneCode,f.phone)){setErreur("Indiquez un numéro de téléphone valide avec son indicatif.");return;}
    if(!user?.id||!user?.token){setErreur("Reconnectez-vous avant d’envoyer votre demande.");return;}
    setErreur(""); setLoading(true);
    const payload = {owner_id:user.id,business_name:f.name.trim(),specialty:f.spec,countries:f.pays,zones:f.zones,email:f.email.trim(),phone:normalizePhone(f.phoneCode,f.phone)||null,website:websiteUrl(f.site)||null,pricing:f.tarifs||null,description:f.desc||null,verification_reference:f.reference||null,consent_at:new Date().toISOString(),status:"en_attente",active:false,moderation_note:null};
    const r = await (existing?modifier("professionals",existing.id,payload,user.token):ecrire("professionals",payload,user.token))
      .catch(e=>({ok:false,statut:0,motif:String(e)}));
    setLoading(false);
    if (!r.ok) { setErreur(messageErreur(r)); return; }
    setSent(true); onSaved?.();
  };
  return (
    <ModalShell title={existing?"Modifier ma fiche professionnelle":"Rejoindre l'annuaire"} subtitle="Votre fiche sera publiée après vérification" onClose={onClose}>
      {sent ? <SentMessage title="Demande envoyée" text="Nous vérifions votre identité professionnelle et revenons vers vous sous 48 h." onClose={onClose}/> : (<>
        <div style={{background:C.cream,border:`1px solid ${C.sand}`,borderRadius:10,padding:"11px 13px",marginBottom:13,fontSize:13.5,color:C.sub,fontFamily:F,lineHeight:1.55}}>La fiche n'est jamais publiée automatiquement. Sokilé contrôle les coordonnées et, lorsque c'est possible, l'immatriculation ou l'ordre professionnel.</div>
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
        <div style={{marginBottom:"10px"}}><label style={lbl}>Immatriculation ou ordre professionnel</label><input style={inp} value={f.reference} onChange={e=>set("reference",e.target.value)} placeholder="RCCM, IFU, numéro d'ordre…"/><div style={{fontSize:12.5,color:C.sub,fontFamily:F,marginTop:4}}>Facultatif, mais recommandé pour accélérer la vérification.</div></div>
        <div style={{marginBottom:"10px"}}><label style={lbl}>Tarifs indicatifs</label><input style={inp} value={f.tarifs} onChange={e=>set("tarifs",e.target.value)} placeholder="Ex : à partir de 150 000 FCFA"/></div>
        <div style={{marginBottom:"14px"}}><label style={lbl}>Présentation</label><textarea rows={4} style={{...inp,resize:"vertical"}} value={f.desc} onChange={e=>set("desc",e.target.value)} placeholder="Vos services, votre expérience, vos références…"/></div>
        <label style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:14,cursor:"pointer",fontFamily:F,color:C.dark,fontSize:13.5,lineHeight:1.45}}><input type="checkbox" checked={f.consent} onChange={e=>set("consent",e.target.checked)} style={{width:18,height:18,marginTop:1,accentColor:C.forest,flexShrink:0}}/><span>Je confirme être autorisé à représenter cette activité et j'accepte que ces informations professionnelles soient vérifiées puis publiées dans l'annuaire.</span></label>
        <BandeauErreur texte={erreur} onRetry={submit}/>
        <button onClick={submit} disabled={!ok||loading} style={{width:"100%",background:ok?C.forest:"#ccc",color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"16px",cursor:ok?"pointer":"default",fontFamily:F}}>{loading?"Envoi en cours…":"Envoyer ma demande"}</button>
      </>)}
    </ModalShell>
  );
}

function PubFormModal({ onClose }) {
  return <ModalShell title="Publicité et mise en lumière" subtitle="Les formules de visibilité Sokilé" onClose={onClose}><PaidOffers/></ModalShell>;
}

function Annuaire({ initialSpec="Tous", initialPays="Tous" }) {
  const [spec, setSpec] = useState(initialSpec);
  const [pays, setPays] = useState(initialPays);
  const [sel, setSel] = useState(null);
  const [verified,setVerified] = useState([]);
  useEffect(()=>{lire("public_professionals","select=*&order=id.desc").then(r=>{if(r.ok)setVerified((r.data||[]).map(p=>({id:`pro-${p.id}`,name:p.business_name,specs:[p.specialty],pays:p.countries||[],zones:p.zones,phone:p.phone,site:p.website,tarifs:p.pricing,desc:p.description||"Professionnel référencé sur Sokilé.",emoji:"✓",verified:true})));}).catch(()=>{});},[]);
  const source = verified.length ? verified : PRESTATAIRES_DEMO;
  const list = source.filter(p=>(spec==="Tous"||p.specs.includes(spec))&&(pays==="Tous"||p.pays.includes(pays)));
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
      <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"10px"}}>{verified.length?`${verified.length} prestataire(s) validé(s) par Sokilé.`:"Fiches d'exemple, en attendant les premiers prestataires validés."}</div>
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
            <span style={{background:p.verified?C.successBg:"rgba(0,0,0,0.06)",color:p.verified?C.success:C.sub,fontSize:"11px",fontWeight:700,padding:"2px 7px",borderRadius:"3px",fontFamily:F,flexShrink:0}}>{p.verified?"Validé":"Exemple"}</span>
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
          {sel.verified?<div style={{display:"grid",gap:8}}>{sel.phone&&<a href={`tel:${sel.phone}`} style={{background:C.forest,color:C.white,borderRadius:8,padding:11,textAlign:"center",fontFamily:F,fontWeight:700,textDecoration:"none"}}>Appeler {sel.phone}</a>}{sel.site&&<a href={/^https?:/.test(sel.site)?sel.site:`https://${sel.site}`} target="_blank" rel="noreferrer" style={{background:C.gold,color:C.forestDark,borderRadius:8,padding:11,textAlign:"center",fontFamily:F,fontWeight:700,textDecoration:"none"}}>Visiter le site</a>}</div>:<div style={{background:C.cream,borderRadius:"8px",padding:"12px",fontSize:"13px",color:C.sub,fontFamily:F,lineHeight:1.5}}>Fiche de démonstration non revendiquée : les coordonnées ne sont volontairement pas affichées.</div>}
        </ModalShell>
      )}
    </>
  );
}

// ─── HERO CARROUSEL ───────────────────────────────
const SLIDES = [
  {url:"https://nhyejaubfxjmmuvetayw.supabase.co/storage/v1/object/public/photos-verified/prix-construction-maison-senegal-HUB-CEPHAS.webp",label:"🏡 Villa moderne, Dakar"},
  {url:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80",label:"🏠 Immobilier Afrique"},
  {url:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80",label:"🏘️ Résidence moderne"},
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
    <div className="sok-hero sok-bleed" style={{position:"relative",overflow:"hidden"}}>
      {/* Image de fond */}
      <div style={{
        position:"absolute",inset:0,
        backgroundImage:`url('${SLIDES[current].url}')`,
        backgroundSize:"cover",backgroundPosition:"center",
        opacity:fade?1:0,
        transition:"opacity 0.5s ease",
      }}/>
      {/* Overlay */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(120deg,rgba(16,39,31,0.92) 0%,rgba(23,56,44,0.78) 55%,rgba(200,102,66,0.42) 100%)"}}/>
      {/* Ligne dorée bas */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:"3px",background:`linear-gradient(90deg,transparent,${C.gold} 30%,${C.gold} 70%,transparent)`,zIndex:2}}/>
      {/* Label pays */}
      {/* Dots */}
      <div style={{position:"absolute",bottom:16,right:"max(18px, calc(50vw - 590px))",display:"flex",gap:"6px",zIndex:2}}>
        {SLIDES.map((_,i)=>(
          <button key={i} onClick={()=>{setCurrent(i);setFade(true);}} style={{width:i===current?18:6,height:6,borderRadius:i===current?"3px":"50%",background:i===current?C.gold:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",transition:"all 0.3s",padding:0}}/>
        ))}
      </div>
      {/* Contenu */}
      <div className="sok-hero-in" style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",justifyContent:"flex-end",zIndex:1}}>
        <div style={{fontSize:"11px",fontWeight:700,color:"#E0C680",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:"10px",fontFamily:F}}>Immobilier · Afrique francophone</div>
        <h1 style={{margin:"0 0 10px",color:C.white,fontFamily:FT,fontSize:"clamp(28px,4.8vw,52px)",fontWeight:300,lineHeight:1.08,letterSpacing:"-0.03em",textShadow:"0 2px 10px rgba(0,0,0,0.38)"}}>
          Tout pour votre projet immobilier<br/><em style={{color:C.gold,fontStyle:"italic",fontWeight:300}}>en Afrique.</em>
        </h1>
        <p style={{margin:"0 0 22px",color:"rgba(255,255,255,0.78)",fontSize:"14px",fontFamily:F}}>Biens, professionnels et guides pratiques pour avancer sur place ou à distance.</p>
        <div className="sok-search" style={{background:C.light,borderRadius:"14px",boxShadow:"0 14px 40px rgba(0,0,0,0.34)",maxWidth:"760px",padding:"14px 14px 15px"}}>
          <div style={{fontSize:"13px",fontWeight:700,color:C.cacao,fontFamily:F,marginBottom:"9px",letterSpacing:"0.01em"}}>Où cherchez-vous un bien ?</div>
          <div className="sok-search-row" style={{display:"flex",gap:"10px"}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:"10px",background:C.cream,border:`1px solid ${C.sand}`,borderRadius:"10px",padding:"0 15px",minWidth:0}}>
              <span style={{color:C.terra,flexShrink:0,display:"flex"}}>{Icon.search}</span>
              <input type="text" placeholder="Dakar, Abidjan, Sénégal..." value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSearch()} style={{flex:1,border:"none",outline:"none",fontSize:"17px",fontWeight:500,color:C.dark,background:"transparent",fontFamily:F,padding:"16px 0",minWidth:0}}/>
            </div>
            <button onClick={onSearch} style={{background:C.terra,color:C.white,border:"none",borderRadius:"10px",padding:"0 30px",fontWeight:700,fontSize:"16px",cursor:"pointer",fontFamily:F,flexShrink:0,whiteSpace:"nowrap",display:"flex",alignItems:"center",justifyContent:"center",gap:"9px",boxShadow:"0 5px 16px rgba(200,102,66,0.32)",minHeight:"58px"}}>
              <span style={{display:"flex"}}>{Icon.searchSm}</span>Rechercher
            </button>
          </div>
          <div className="sok-search-tags" style={{display:"flex",gap:"8px",marginTop:"12px",flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:"12.5px",color:C.sub,fontFamily:F}}>Populaire :</span>
            {["Dakar","Abidjan","Douala","Terrain"].map(v=>(
              <button key={v} onClick={()=>{setSearch(v);onSearch();}} style={{background:"transparent",border:`1px solid ${C.sand}`,borderRadius:"20px",padding:"5px 13px",fontSize:"12.5px",fontWeight:600,color:C.forest,cursor:"pointer",fontFamily:F}}>{v}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────


// ─── ENCART PUBLICITAIRE ──────────────────────────
function AdSlot({ onClick, style, className }) {
  return (
    <div className={className} style={{borderRadius:"14px",border:`2px solid ${C.gold}`,background:`linear-gradient(145deg,${C.light},${C.cream})`,padding:"21px 18px",textAlign:"center",boxShadow:"0 10px 26px rgba(58,41,35,0.09)",...style}}>
      <div style={{fontSize:"10.5px",fontWeight:700,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:F,marginBottom:"7px"}}>Publicité · Partenaire</div>
      <div style={{fontFamily:FT,fontSize:"20px",fontWeight:500,color:C.cacao,marginBottom:"6px"}}>Présentez votre marque sur Sokilé</div>
      <div style={{fontSize:"14px",color:C.sub,fontFamily:F,marginBottom:"14px",lineHeight:1.55}}>Adressez-vous aux personnes qui recherchent activement un bien immobilier en Afrique.</div>
      <button onClick={onClick} style={{border:"none",cursor:"pointer",background:C.gold,color:C.cacao,borderRadius:"9px",padding:"11px 22px",fontSize:"14px",fontWeight:700,fontFamily:F}}>Découvrir les formats</button>
    </div>
  );
}

// ─── CARTES ET LECTURE DES GUIDES ─────────────────
function GuideCard({ guide, onOpen }) {
  return (
    <article onClick={()=>onOpen(guide)} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",overflow:"hidden",cursor:"pointer",boxShadow:"0 8px 24px rgba(28,26,23,0.06)",display:"flex",flexDirection:"column",minHeight:"220px"}}>
      <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
        <div style={{fontSize:"31px",lineHeight:1}}>{guide.icon}</div>
        <span style={{background:"rgba(201,168,76,0.14)",border:"1px solid rgba(201,168,76,0.34)",color:C.gold,borderRadius:"20px",padding:"4px 10px",fontSize:"10.5px",fontWeight:700,fontFamily:F}}>{guide.category}</span>
      </div>
      <div style={{padding:"17px",display:"flex",flexDirection:"column",flex:1}}>
        <div style={{fontSize:"11px",color:C.terra,fontWeight:700,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"7px"}}>{guide.country}</div>
        <h3 style={{fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.dark,lineHeight:1.3,margin:"0 0 8px"}}>{guide.title}</h3>
        <p style={{fontSize:"13.5px",color:C.sub,fontFamily:F,lineHeight:1.55,margin:"0 0 15px",flex:1}}>{guide.excerpt}</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px",paddingTop:"12px",borderTop:`1px solid ${C.sand}`}}>
          <span style={{fontSize:"11.5px",color:C.sub,fontFamily:F}}>{guideReadingTime(guide)} de lecture</span>
          <span style={{fontSize:"12.5px",color:C.terra,fontWeight:700,fontFamily:F}}>Lire le guide →</span>
        </div>
      </div>
    </article>
  );
}

function GuidePage({ guide, onBack, onFindPro }) {
  if (!guide) return <div style={{padding:"60px 20px",textAlign:"center",fontFamily:F}}>Guide introuvable. <button onClick={onBack}>Retour</button></div>;
  return <article>
    <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"34px 20px",borderBottom:`3px solid ${C.gold}`}}>
      <button onClick={onBack} style={{background:"none",border:0,color:"rgba(255,255,255,.75)",cursor:"pointer",fontFamily:F,padding:0,marginBottom:18}}>← Tous les guides</button>
      <div style={{fontSize:12,color:C.gold,fontWeight:700,fontFamily:F,textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>{guide.category} · {guide.country}</div>
      <h1 style={{fontFamily:FT,fontSize:"clamp(30px,6vw,48px)",fontWeight:400,color:C.white,lineHeight:1.12,maxWidth:820,margin:"0 0 14px"}}>{guide.title}</h1>
      <p style={{color:"rgba(255,255,255,.76)",fontSize:16,fontFamily:F,lineHeight:1.7,maxWidth:760,margin:"0 0 12px"}}>{guide.excerpt}</p>
      <div style={{color:"rgba(255,255,255,.55)",fontSize:13,fontFamily:F}}>{guideReadingTime(guide)} de lecture · Mis à jour le {guide.updatedAt}</div>
    </div>
    <div style={{maxWidth:800,margin:"0 auto",padding:"30px 20px 10px"}}>
      <p style={{fontFamily:F,fontSize:17,color:C.muted,lineHeight:1.85,margin:"0 0 30px",fontWeight:500}}>{guide.intro}</p>
      {guide.sections.map((section,i)=><section key={section.title} style={{marginBottom:30}}>
        <div style={{display:"flex",gap:13,alignItems:"flex-start"}}><span style={{width:31,height:31,borderRadius:"50%",background:C.gold,color:C.forestDark,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontFamily:F,flexShrink:0}}>{i+1}</span><div>
          <h2 style={{fontFamily:FT,fontSize:24,fontWeight:500,color:C.dark,margin:"0 0 9px"}}>{section.title}</h2>
          <p style={{fontFamily:F,fontSize:15.5,color:C.muted,lineHeight:1.82,margin:0}}>{section.text}</p>
          {section.bullets?.length>0&&<ul style={{fontFamily:F,color:C.muted,lineHeight:1.75,paddingLeft:20}}>{section.bullets.map(x=><li key={x}>{x}</li>)}</ul>}
        </div></div>
      </section>)}
      {guide.checklist?.length>0&&<section style={{background:C.white,border:`1px solid ${C.sand}`,borderLeft:`5px solid ${C.gold}`,borderRadius:12,padding:20,margin:"6px 0 22px"}}><h2 style={{fontFamily:FT,color:C.dark,margin:"0 0 12px"}}>Checklist à conserver</h2>{guide.checklist.map(x=><div key={x} style={{fontFamily:F,color:C.muted,margin:"8px 0"}}>✓ {x}</div>)}</section>}
      <div style={{background:C.cream,border:`1px solid ${C.sand}`,borderRadius:12,padding:16,fontSize:13,color:C.sub,fontFamily:F,lineHeight:1.65}}>Information générale : les règles et documents diffèrent selon le pays et le dossier. Faites confirmer les étapes par un professionnel compétent et indépendant.</div>
      <button onClick={onFindPro} style={{width:"100%",marginTop:16,background:C.forest,color:C.white,border:0,borderRadius:9,padding:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>Trouver un prestataire</button>
    </div>
  </article>;
}

function GuideModal({ guide, onClose, onFindPro }) {
  if (!guide) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(13,32,25,0.78)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:"18px"}}>
      <article onClick={e=>e.stopPropagation()} style={{width:"min(720px,100%)",maxHeight:"90vh",overflowY:"auto",background:C.cream,borderRadius:"16px",boxShadow:"0 24px 70px rgba(0,0,0,0.35)"}}>
        <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"24px",position:"relative"}}>
          <button onClick={onClose} aria-label="Fermer" style={{position:"absolute",top:"14px",right:"14px",width:"34px",height:"34px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.08)",color:C.white,fontSize:"20px",cursor:"pointer"}}>×</button>
          <div style={{fontSize:"11px",color:C.gold,fontWeight:700,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:"10px"}}>{guide.category} · {guide.country}</div>
          <h2 style={{fontFamily:FT,fontSize:"clamp(25px,5vw,38px)",fontWeight:400,color:C.white,lineHeight:1.15,margin:"0 42px 10px 0"}}>{guide.title}</h2>
          <p style={{color:"rgba(255,255,255,0.68)",fontSize:"14px",fontFamily:F,lineHeight:1.6,margin:0}}>{guide.excerpt}</p>
        </div>
        <div style={{padding:"24px"}}>
          {guide.sections.map((section,i)=>(
            <section key={section.title} style={{display:"grid",gridTemplateColumns:"34px minmax(0,1fr)",gap:"12px",marginBottom:"22px"}}>
              <div style={{width:"30px",height:"30px",borderRadius:"50%",background:C.gold,color:C.forestDark,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"13px",fontFamily:F}}>{i+1}</div>
              <div>
                <h3 style={{fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.dark,margin:"1px 0 6px"}}>{section.title}</h3>
                <p style={{fontFamily:F,fontSize:"14px",color:C.muted,lineHeight:1.7,margin:0}}>{section.text}</p>
              </div>
            </section>
          ))}
          <div style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"12px",padding:"15px",fontSize:"12.5px",color:C.sub,fontFamily:F,lineHeight:1.6,marginTop:"4px"}}>
            Ce guide fournit des informations générales. Les démarches et documents peuvent varier selon le pays et la situation du bien : faites confirmer votre dossier par un professionnel compétent.
          </div>
          <button onClick={()=>{onClose();onFindPro();}} style={{width:"100%",marginTop:"16px",background:C.forest,color:C.white,border:"none",borderRadius:"9px",padding:"13px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Trouver un prestataire</button>
        </div>
      </article>
    </div>
  );
}

// ─── PIED DE PAGE ─────────────────────────────────
function SiteFooter({ onNav, onPub }) {
  const link = {color:"rgba(255,255,255,0.72)",fontSize:"14px",fontFamily:F,textDecoration:"none",cursor:"pointer",background:"none",border:"none",padding:0,textAlign:"left",lineHeight:1.9,display:"block"};
  return (
    <footer style={{background:`linear-gradient(145deg,${C.cacao},#251A16)`,borderTop:`3px solid ${C.gold}`,marginTop:"32px",padding:"34px 20px calc(96px + env(safe-area-inset-bottom))"}}>
      <div style={{maxWidth:"1200px",margin:"0 auto",display:"flex",flexWrap:"wrap",gap:"30px 48px"}}>
        <div style={{flex:"1 1 220px",minWidth:0}}>
          <div style={{fontSize:"30px",fontWeight:500,color:C.white,fontFamily:FT,lineHeight:1,letterSpacing:"-0.02em"}}>So<span style={{color:C.gold,fontStyle:"italic"}}>ki</span><span style={{color:"#E8A07E"}}>lé</span></div>
          <div style={{fontSize:"14px",color:"rgba(255,255,255,0.6)",fontFamily:F,marginTop:"10px",lineHeight:1.65,maxWidth:"320px"}}>
            Le réflexe immobilier en Afrique francophone.
          </div>
        </div>
        <div style={{flex:"0 1 150px"}}>
          <div style={{fontSize:"11.5px",fontWeight:700,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:F,marginBottom:"10px"}}>Naviguer</div>
          <a href="/about.html" style={link}>Qui sommes-nous</a>
          <button onClick={()=>onNav("biens")} style={link}>Voir les annonces</button>
          <button onClick={()=>onNav("prestataires")} style={link}>Trouver un prestataire</button>
          <button onClick={()=>onNav("guides")} style={link}>Consulter les guides</button>
          <button onClick={onPub} style={link}>Publier un bien</button>
        </div>
        <div style={{flex:"0 1 165px"}}>
          <div style={{fontSize:"11.5px",fontWeight:700,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:F,marginBottom:"10px"}}>Informations</div>
          <a href="/mentions%20legales.html" style={link}>Mentions légales</a>
          <a href="/confidentialites.html" style={link}>Confidentialité</a>
          <a href="/cgu.html" style={link}>Conditions d&apos;utilisation</a>
        </div>
        <div style={{flex:"0 1 200px"}}>
          <div style={{fontSize:"11.5px",fontWeight:700,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:F,marginBottom:"10px"}}>Nous contacter</div>
          <a href={`mailto:${CONTACT_MAIL}`} style={{...link,color:"#E8A07E",fontWeight:600,wordBreak:"break-word"}}>{CONTACT_MAIL}</a>
          <a href="https://www.sokile.com" style={link}>www.sokile.com</a>
        </div>
      </div>
      <div style={{maxWidth:"1200px",margin:"26px auto 0",paddingTop:"18px",borderTop:"1px solid rgba(255,255,255,0.12)",display:"flex",flexWrap:"wrap",gap:"8px 18px",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.45)",fontFamily:F}}>© 2026 Sokilé — Tous droits réservés</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.45)",fontFamily:F}}>Sokilé met en relation et n&apos;intervient pas dans les transactions</div>
      </div>
    </footer>
  );
}

const ETATS_DOSSIER = {
  en_cours:{label:"En discussion",color:"#8A6116",bg:"#FFF4D6"},
  acceptee:{label:"Acceptée",color:C.success,bg:C.successBg},
  expiree:{label:"Expirée",color:"#934C13",bg:"#FFF0E4"},
  en_attente:{label:"En attente de validation",color:"#8A6116",bg:"#FFF4D6"},
  validee:{label:"Publiée",color:C.success,bg:C.successBg},
  publiee:{label:"Publiée",color:C.success,bg:C.successBg},
  refusee:{label:"Refusée",color:"#9B2C2C",bg:"#FDE8E8"},
  rejetee:{label:"Refusée",color:"#9B2C2C",bg:"#FDE8E8"},
  modifications_demandees:{label:"Modifications demandées",color:"#934C13",bg:"#FFF0E4"},
};

function MesAnnonces({ user, refreshKey, onEdit }) {
  const [rows,setRows]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState("");
  useEffect(()=>{
    let actif=true; setLoading(true); setError("");
    lire("properties",`select=*&owner_id=eq.${user.id}&order=created_at.desc,id.desc`,user.token).then(r=>{if(!actif)return;if(r.ok)setRows(r.data||[]);else setError(messageErreur(r));setLoading(false);}).catch(()=>{if(actif){setError("Impossible de charger vos annonces.");setLoading(false);}});
    return ()=>{actif=false};
  },[user.token,refreshKey]);
  return <section style={{background:C.white,borderRadius:10,padding:14,border:`1px solid ${C.sand}`}}>
    <div style={{fontSize:15,fontWeight:700,color:C.dark,fontFamily:F,marginBottom:10}}>Mes annonces <span style={{color:C.sub,fontWeight:400}}>({rows.length})</span></div>
    {loading&&<div style={{fontFamily:F,color:C.sub,fontSize:13}}>Chargement…</div>}
    {error&&<BandeauErreur texte={error}/>} 
    {!loading&&!error&&rows.length===0&&<div style={{fontFamily:F,color:C.sub,fontSize:13,lineHeight:1.5}}>Vous n'avez pas encore déposé d'annonce.</div>}
    <div style={{display:"grid",gap:9}}>{rows.map(p=>{const etat=ETATS_DOSSIER[isExpired(p)?"expiree":p.status]||ETATS_DOSSIER.en_attente;return <div key={p.id} style={{border:`1px solid ${C.sand}`,borderRadius:9,padding:10,display:"flex",gap:10,alignItems:"center"}}>
      <div style={{width:58,height:48,borderRadius:7,background:C.cream,overflow:"hidden",flexShrink:0}}>{p.photos?.[0]&&<img src={p.photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontFamily:F,fontSize:14,fontWeight:700,color:C.dark,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div><span style={{display:"inline-block",marginTop:4,background:etat.bg,color:etat.color,fontSize:11,fontWeight:700,borderRadius:20,padding:"3px 8px",fontFamily:F}}>{etat.label}</span>{p.expires_at&&<div style={{fontFamily:F,fontSize:12,color:C.sub,marginTop:5}}>{isExpired(p)?"Retirée de la recherche le":"Expiration le"} {dateCourte(p.expires_at)}</div>}{(p.moderation_note||p.motif_rejet)&&<div style={{fontFamily:F,fontSize:12,color:C.sub,marginTop:5,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>Réponse de Sokilé : {p.moderation_note||p.motif_rejet}</div>}</div>
      <button onClick={()=>onEdit(p)} style={{border:`1px solid ${C.terra}`,background:C.white,color:C.terra,borderRadius:7,padding:"7px 10px",fontWeight:700,cursor:"pointer",fontFamily:F}}>{isExpired(p)?"Renouveler":"Modifier"}</button>
    </div>})}</div>
    <p style={{fontFamily:F,fontSize:12,color:C.sub,lineHeight:1.5,margin:"10px 0 0"}}>Toute modification ou demande de renouvellement repasse en validation. Après validation : 6 mois pour une location, 1 an pour une vente.</p>
  </section>;
}

function MesDemandesPro({user,refreshKey,onEditService,onEditPub,showEmpty=false}) {
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true;setLoading(true);setError('');setItems([]);
    Promise.all([lire("professionals",`select=*&owner_id=eq.${user.id}&order=created_at.desc`,user.token),lire("advertising_requests",`select=*&owner_id=eq.${user.id}&order=created_at.desc`,user.token)]).then(([a,b])=>{
      if(!active)return;
      if(!a.ok||!b.ok)throw Error('Impossible de charger vos demandes professionnelles.');
      setItems([...(a.data||[]).map(x=>({...x,kind:"Annuaire",title:x.business_name})),...(b.data||[]).map(x=>({...x,kind:"Publicité",title:x.company||x.format}))]);
    }).catch(()=>{if(active)setError('Impossible de charger vos demandes professionnelles.');}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[user.id,user.token,refreshKey,retry]);
  if(loading)return showEmpty?<p role="status" style={{fontFamily:F,color:C.sub}}>Chargement de vos demandes professionnelles…</p>:null;
  if(error)return <div><BandeauErreur texte={error}/><button onClick={()=>setRetry(x=>x+1)}>Réessayer</button></div>;
  return <>{[
    {kind:'Annuaire',heading:'Ma présence dans l’annuaire',empty:'Aucune fiche pour le moment. Utilisez « Rejoindre l’annuaire » pour présenter votre activité.'},
    {kind:'Publicité',heading:'Mes demandes publicitaires',empty:'Les tarifs sont consultables via « Publicité et mise en lumière ». Les services payants ne sont pas encore ouverts.'},
  ].map(group=>{
    const rows=items.filter(x=>x.kind===group.kind);
    if(!showEmpty&&!rows.length)return null;
    return <section key={group.kind} style={{background:C.white,borderRadius:10,padding:14,border:`1px solid ${C.sand}`}}>
      <h2 style={{fontFamily:F,fontSize:15,fontWeight:700,color:C.dark,margin:'0 0 9px'}}>{group.heading}</h2>
      {!rows.length&&<p style={{fontFamily:F,fontSize:13,color:C.sub,lineHeight:1.6,margin:0}}>{group.empty}</p>}
      <div style={{display:'grid',gap:7}}>{rows.map(x=>{
        const e=ETATS_DOSSIER[x.status]||{label:x.status,color:C.sub,bg:C.cream};
        return <div key={x.id} style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:10,borderTop:`1px solid ${C.sand}`,paddingTop:8}}>
          <div><div style={{fontFamily:F,fontSize:14,color:C.dark}}>{x.title}</div>{x.moderation_note&&<div style={{fontFamily:F,fontSize:12,color:C.sub,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>Réponse de Sokilé : {x.moderation_note}</div>}</div>
          <span style={{alignSelf:'start',background:e.bg,color:e.color,borderRadius:20,padding:'3px 8px',fontFamily:F,fontSize:11,fontWeight:700}}>{e.label}</span>
          {['refusee','modifications_demandees','en_attente'].includes(x.status)&&<button onClick={()=>x.kind==='Annuaire'?onEditService(x):onEditPub(x)} style={{alignSelf:'start',border:`1px solid ${C.terra}`,borderRadius:7,background:C.white,color:C.terra,padding:'7px 10px',fontFamily:F,cursor:'pointer'}}>Compléter ma demande</button>}
        </div>;
      })}</div>
    </section>;
  })}</>;
}

export default function App() {
  const token=new URLSearchParams(window.location.search).get("annuler_alerte");
  return token!==null?<CancelAlertPage token={token} rpc={alertRpc}/>:<SokileApp/>;
}

function SokileApp() {
  const [adPreview] = useState(()=>previewOffer(window.location.search));
  const [tab, setTab] = useState(() => {
    if(window.location.pathname.startsWith("/programme"))return "biens";
    const requested = new URLSearchParams(window.location.search).get("tab");
    return ["accueil","biens","prestataires","guides","pro","compte"].includes(requested) ? requested : "accueil";
  });
  const [user, setUser] = useState(() => lireLocal(CLE_SESSION, null));
  const [selectedProp, setSelectedProp] = useState(null);
  const [route, setRoute] = useState(lireRoute);
  const [sousOnglet, setSousOnglet] = useState("guides");
  const [simulation, setSimulation] = useState(initialSimulation);
  // Aperçu : "" = vue administratrice, sinon "particulier" | "pro" | "visiteur"
  const [apercu, setApercu] = useState("");
  const [filterCountry, setFilterCountry] = useState("Tous");
  const [filterTransaction, setFilterTransaction] = useState("tous");
  const [filterNature, setFilterNature] = useState("Tous");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterSurfaceMin, setFilterSurfaceMin] = useState("");
  const [filterSurfaceMax, setFilterSurfaceMax] = useState("");
  const [filterRooms, setFilterRooms] = useState("Tous");
  const [filterEquipements, setFilterEquipements] = useState([]);
  const [filterRegion, setFilterRegion] = useState("Tous");
  const [sortBy, setSortBy] = useState("recent");
  const [search, setSearch] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showPartner, setShowPartner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLogin, setShowLogin] = useState(() => Boolean(authCallbackState(window.location.hash)));
  const [partnerType, setPartnerType] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [savedProps, setSavedProps] = useState(() => lireLocal(CLE_FAVORIS, []));
  const [animIn, setAnimIn] = useState(true);
  const [showPub, setShowPub] = useState(false);
  const [dbProps, setDbProps] = useState([]);
  const [propsLoading,setPropsLoading]=useState(true),[propsError,setPropsError]=useState(false);
  const [clock,setClock]=useState(Date.now());
  const [directProp,setDirectProp]=useState(null),[directLoading,setDirectLoading]=useState(false),[directError,setDirectError]=useState(false);
  const [alertsRefresh,setAlertsRefresh]=useState(0);
  const [programEditor,setProgramEditor]=useState(null),[programRefresh,setProgramRefresh]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer);},[]);
  const [editingProp,setEditingProp] = useState(null);
  const [myPropsRefresh,setMyPropsRefresh] = useState(0);
  const [editingService,setEditingService]=useState(null),[editingPub,setEditingPub]=useState(null),[proRefresh,setProRefresh]=useState(0);
  const [annFilter, setAnnFilter] = useState({spec:"Tous",pays:"Tous"});
  const openAnnuaire = (spec="Tous",pays="Tous") => { setAnnFilter({spec,pays}); setSelectedProp(null); switchTab("prestataires"); };
  useEffect(()=>{if(showServiceForm&&!user){setShowServiceForm(false);setShowLogin(true)}},[showServiceForm,user]);

  // Rafraîchit automatiquement le jeton Supabase conservé en local.
  useEffect(()=>{
    if (!user) return;
    if (!user.refresh_token) { setUser(null); return; }
    const requestedToken=user.refresh_token;
    let active=true;
    refreshSession(requestedToken).then(d=>{
      if(active)setUser(u=>applySessionRefresh(u,requestedToken,d));
    }).catch(()=>{if(active)setUser(u=>applySessionRefresh(u,requestedToken,null));});
    return()=>{active=false;};
  }, []);

  // La base retire les annonces expirées, l'interface suit aussi l'échéance si elle reste ouverte.
  const mapProperty = r => ({...r,id:`db-${r.id}`,price_eur:r.price_eur||0,price:r.price||0,features:r.tags||[],tags:r.tags||[],photos:Array.isArray(r.photos)?r.photos:[],bg:`linear-gradient(135deg,${C.forestMid},${C.forest})`,verified:Boolean(r.verified),agent_name:r.agency_name||r.agent_name||r.user_name||"Particulier"});
  useEffect(()=>{
    let active=true;
    readAllProperties(lire,()=>active).then(rows=>{if(active)setDbProps(rows.map(mapProperty));}).catch(()=>{if(active)setPropsError(true);}).finally(()=>{if(active)setPropsLoading(false);});
    return()=>{active=false;};
  },[]);
  useEffect(()=>{
    let active=true;setDirectProp(null);setDirectError(false);
    if(route.nom!=="annonce"){setDirectLoading(false);return;}
    const id=route.id.replace(/^db-/,"");
    if(!/^\d+$/.test(id)){setDirectLoading(false);return;}
    setDirectLoading(true);
    lire("public_properties",`select=*&id=eq.${id}&limit=1`).then(r=>{if(!active)return;if(!r.ok)throw new Error();setDirectProp(r.data?.[0]?mapProperty(r.data[0]):null);}).catch(()=>{if(active)setDirectError(true);}).finally(()=>{if(active)setDirectLoading(false);});
    return()=>{active=false;};
  },[route.nom,route.id]);
  const ALL_PROPS = dbProps.filter(p=>p.expires_at&&new Date(p.expires_at).getTime()>clock);
  const comptesPays = ALL_PROPS.reduce((acc,p)=>{acc[p.country]=(acc[p.country]||0)+1;return acc;},{});

  // Pendant un aperçu, le reste du site voit un utilisateur transformé.
  // La vraie session reste intacte : seules les vues changent.
  const vu = !apercu ? user
    : apercu === "visiteur" ? null
    : {...user, email:`apercu-${apercu}@sokile.com`, account_type:apercu, agency:apercu==="pro"?(user?.agency||"Votre agence"):""};

  const programPublisher = canManagePrograms(vu, EMAIL_REDACTION);

  // Le bouton Retour du navigateur ramène à la liste
  useEffect(()=>{
    const onPop = () => setRoute(lireRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Ouvrir une annonce : nouvelle adresse, nouvelle entrée dans l'historique
  const ouvrirAnnonce = (p) => {
    if (!p) return;
    window.history.pushState({}, "", cheminAnnonce(p));
    setRoute({ nom:"annonce", id: idPublic(p) });
    window.scrollTo(0,0);
  };
  const quitterAnnonce = () => {
    window.history.pushState({}, "", "/");
    setRoute({ nom:"accueil" });
  };
  const ouvrirGuide = (g) => { window.history.pushState({},"",cheminGuide(g)); setRoute({nom:"guide",id:g.id}); window.scrollTo(0,0); };
  const quitterGuide = () => { window.history.pushState({},"","/"); setRoute({nom:"accueil"}); setTab("guides"); window.scrollTo(0,0); };

  // On garde session et favoris d'une visite à l'autre
  useEffect(()=>{ user ? ecrireLocal(CLE_SESSION, user) : effacerLocal(CLE_SESSION); }, [user]);
  useEffect(()=>{ ecrireLocal(CLE_FAVORIS, savedProps); }, [savedProps]);

  // Les natures réellement présentes dans les annonces affichables, groupées par famille.
  const naturesDispo = FAMILLES.map(fam => [fam, Object.entries(NATURES).filter(([,n])=>n.famille===fam)]);
  const rooms = ["Tous","1+","2+","3+","4+","5+"];
  const sorts = [{id:"recent",label:"Plus récent"},{id:"price_asc",label:"Prix ↑"},{id:"price_desc",label:"Prix ↓"},{id:"surface_asc",label:"Surface ↑"},{id:"surface_desc",label:"Surface ↓"}];

  // Ce qui est actif est rappelé sous la barre, et se retire d'un clic.
  const rappels = [
    filterTransaction!=="tous" && {cle:"tr",   texte:filterTransaction==="vente"?"À vendre":"À louer", retirer:()=>setFilterTransaction("tous")},
    filterRegion!=="Tous"      && {cle:"reg",  texte:filterRegion,  retirer:()=>setFilterRegion("Tous")},
    filterCountry!=="Tous"     && {cle:"pays", texte:filterCountry, retirer:()=>setFilterCountry("Tous")},
    filterNature!=="Tous"      && {cle:"nat",  texte:NATURES[filterNature]?.label||filterNature, retirer:()=>setFilterNature("Tous")},
    (filterPriceMin||filterPriceMax) && {cle:"prix", texte:`${filterPriceMin?fmtEUR(+filterPriceMin):"0 €"} – ${filterPriceMax?fmtEUR(+filterPriceMax):"sans limite"}`, retirer:()=>{setFilterPriceMin("");setFilterPriceMax("");}},
    (filterSurfaceMin||filterSurfaceMax) && {cle:"surf", texte:`${filterSurfaceMin||0} – ${filterSurfaceMax||"…"} m²`, retirer:()=>{setFilterSurfaceMin("");setFilterSurfaceMax("");}},
    filterRooms!=="Tous"       && {cle:"pieces", texte:`${filterRooms} pièces`, retirer:()=>setFilterRooms("Tous")},
    ...filterEquipements.map(eq=>({cle:"eq-"+eq, texte:eq, retirer:()=>toggleEquipement(eq)})),
  ].filter(Boolean);

  const toggleEquipement = eq => setFilterEquipements(prev=>prev.includes(eq)?prev.filter(e=>e!==eq):[...prev,eq]);
  const resetFilters = () => { setFilterCountry("Tous"); setFilterTransaction("tous"); setFilterNature("Tous"); setFilterRegion("Tous"); setFilterPriceMin(""); setFilterPriceMax(""); setFilterSurfaceMin(""); setFilterSurfaceMax(""); setFilterRooms("Tous"); setFilterEquipements([]); setSortBy("recent"); setSearch(""); };

  const activeFiltersCount = [filterCountry!=="Tous",filterTransaction!=="tous",filterNature!=="Tous",filterRegion!=="Tous",filterPriceMin,filterPriceMax,filterSurfaceMin,filterSurfaceMax,filterRooms!=="Tous",filterEquipements.length>0].filter(Boolean).length;
  const filteredCountries = filterRegion==="Tous"?COUNTRIES_ANNONCES:COUNTRIES_ANNONCES.filter(c=>c.region===(filterRegion==="Afrique de l'Ouest"?"Ouest":"Centrale"));
  const paysActifs = filteredCountries.filter(c=>comptesPays[c.name]>0);

  let filtered = ALL_PROPS.filter(p=>{
    const mc=filterCountry==="Tous"||p.country===filterCountry;
    const mr=filterRegion==="Tous"||filteredCountries.map(c=>c.name).includes(p.country);
    const mt=filterNature==="Tous"||natureDe(p)===filterNature;
    const mtr=filterTransaction==="tous"||transactionDe(p)===filterTransaction;
    const q=sansAccent(search);
    const ms=!q||[p.title,p.city,p.country,p.neighborhood,p.description,p.agency_name,libelleNature(p),libelleTransaction(p),...(p.tags||[])].some(s=>sansAccent(s).includes(q));
    const mpMin=!filterPriceMin||p.price_eur>=parseInt(filterPriceMin);
    const mpMax=!filterPriceMax||p.price_eur<=parseInt(filterPriceMax);
    const msMin=!filterSurfaceMin||(p.surface&&p.surface>=parseInt(filterSurfaceMin));
    const msMax=!filterSurfaceMax||(p.surface&&p.surface<=parseInt(filterSurfaceMax));
    const mrm=filterRooms==="Tous"||(p.rooms&&p.rooms>=parseInt(filterRooms));
    const meq=filterEquipements.length===0||filterEquipements.every(eq=>p.features?.includes(eq));
    return mc&&mr&&mt&&mtr&&ms&&mpMin&&mpMax&&msMin&&msMax&&mrm&&meq;
  });
  // "Plus récent" : les vraies annonces d'abord, puis par date de dépôt
  const quand = (x) => x.created_at ? new Date(x.created_at).getTime() : 0;
  const estReelle = (x) => !x.demo;
  filtered=[...filtered].sort((a,b)=>{
    if (sortBy==="price_asc")    return (a.price_eur||0)-(b.price_eur||0);
    if (sortBy==="price_desc")   return (b.price_eur||0)-(a.price_eur||0);
    if (sortBy==="surface_asc")  return (a.surface||0)-(b.surface||0);
    if (sortBy==="surface_desc") return (b.surface||0)-(a.surface||0);
    if (estReelle(a)!==estReelle(b)) return estReelle(a) ? -1 : 1;
    return quand(b)-quand(a);
  });

  const switchTab = t=>{
    if (typeof window!=="undefined" && window.location.pathname!=="/") {
      window.history.pushState({}, "", "/");
      setRoute({nom:"accueil"});
    }
    setAnimIn(false); setTimeout(()=>{setTab(t);setAnimIn(true);},150);
  };
  const openBudget = p => {
    setSimulation(simulationFromListing(p));
    setSelectedProp(null); setSousOnglet("outils"); switchTab("guides");
    window.scrollTo(0,0);
  };
  const openProgram=id=>{window.history.pushState({},"",`/programme/${id}`);setRoute({nom:"programme",id});setTab("biens");window.scrollTo(0,0);};
  const openPrograms=()=>{window.history.pushState({},"","/programmes-neufs");setRoute({nom:"programmes"});setTab("biens");window.scrollTo(0,0);};
  const newProgram=()=>{if(programPublisher)setProgramEditor({});};
  const editProgram=p=>{if(programPublisher)setProgramEditor(p);};
  const handleSave = (p) => {
    if (!user) { setShowLogin(true); return; }
    setSavedProps(prev => prev.find(s=>s.id===p.id) ? prev.filter(s=>s.id!==p.id) : [...prev, p]);
  };

  // Bandeau complet : toutes les rubriques historiques restent visibles.
  const NAV = [
    {id:"accueil",label:"Accueil",icon:Icon.home},
    {id:"biens",label:"Biens",icon:Icon.search},
    {id:"prestataires",label:"Prestataires",icon:Icon.group},
    {id:"guides",label:"Conseils",icon:Icon.book},
    {id:"pro",label:"Espace pro",icon:Icon.briefcase},
    {id:"compte",label:"Compte",icon:Icon.person},
  ];
  // L'onglet d'administration n'apparaît que pour le compte de gestion,
  // et disparaît pendant un aperçu — c'est tout l'intérêt de l'aperçu.
  if (estAdmin(user) && !apercu) NAV.push({id:"admin",label:"Gestion",icon:Icon.briefcase});

  // Cinq entrées seulement sur mobile pour conserver des libellés lisibles.
  const MOBILE_NAV = NAV.filter(n=>n.id!=="pro");

  const inputBase = {border:`1px solid ${C.sand}`,borderRadius:"9px",padding:"11px 13px",fontSize:"15px",outline:"none",color:C.dark,fontFamily:F};
  const chipBase = (active) => ({background:active?C.forest:C.white,color:active?C.white:C.dark,border:`1px solid ${active?C.forest:C.sand}`,borderRadius:"22px",padding:"9px 16px",fontSize:"14px",fontWeight:active?700:500,cursor:"pointer",fontFamily:F,transition:"all 0.15s"});

  return (
    <div style={{minHeight:"100vh",background:C.cream,fontFamily:F,overflowX:"hidden",display:"flex",flexDirection:"column"}}>
      <style>{`
*{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{margin:0;line-height:1.55}
button,input,select,textarea{font-size:inherit}

.sok-newsbar{width:100%;border:0;background:#10271F;color:#fff;min-height:42px;
  padding:8px max(16px,calc(50vw - 590px));display:flex;align-items:center;gap:12px;
  cursor:pointer;font-family:'DM Sans',sans-serif;text-align:left;border-bottom:1px solid rgba(201,168,76,.32)}
.sok-newsbar-label{display:flex;align-items:center;gap:7px;color:#E0C680;font-size:12px;
  font-weight:800;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap}
.sok-newsbar-label i{width:7px;height:7px;border-radius:50%;background:#E8A07E;box-shadow:0 0 0 5px rgba(232,160,126,.12)}
.sok-newsbar-story{min-width:0;flex:1;display:flex;gap:9px;align-items:center;font-size:13.5px;
  animation:sokNewsIn .35s ease-out;white-space:nowrap;overflow:hidden}
.sok-newsbar-story b{color:#E8A07E;flex-shrink:0}.sok-newsbar-story span{overflow:hidden;text-overflow:ellipsis}
.sok-newsbar-date{font-size:12px;color:rgba(255,255,255,.55);white-space:nowrap}.sok-newsbar-arrow{color:#E0C680;font-size:18px}
@keyframes sokNewsIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

.sok-home-actions{display:grid;grid-template-columns:1fr;gap:14px;margin:0 0 26px}
.sok-home-explore{display:grid;grid-template-columns:1fr;gap:14px;margin:0 0 28px}
.sok-home-lower{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:18px}

/* le carrousel prend toute la largeur de l'écran */
.sok-bleed{width:100vw;max-width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}
.sok-hero{height:400px}
.sok-hero-in{padding:20px 20px 24px}

/* la grille d'annonces */
.sok-grid{display:grid;grid-template-columns:1fr;gap:16px}
.sok-guide-grid{display:grid;grid-template-columns:1fr;gap:16px}

/* la barre de recherche */
.sok-search-row{flex-direction:column}
@media(min-width:560px){.sok-search-row{flex-direction:row}}
@media(max-width:520px){.sok-search-tags{display:none!important}}
@media(max-width:520px){.sok-search{padding:14px 13px 15px!important}}
.sok-card-img{height:200px}


/* ─── L'ESPACE DE RECHERCHE ───────────────────────────────
   Une barre unique, des filtres qui ne s'imposent que si on les
   demande, et des rappels de ce qui est actif. Tout tient sur une
   ligne dès qu'il y a la place. */
.sok-recherche{position:sticky;top:78px;z-index:40;background:#F5F0E8;
  padding:12px 0 10px;margin:0 -2px 4px;transition:box-shadow .25s}
.sok-rech-haut{display:flex;gap:10px;align-items:stretch;flex-wrap:wrap}

/* Acheter / Louer / Tout */
.sok-segment{display:inline-flex;background:#FFFFFF;border:1px solid #E8DFD0;
  border-radius:12px;padding:3px;gap:2px;flex-shrink:0}
.sok-segment button{border:none;background:transparent;color:#1C1A17;
  border-radius:9px;padding:9px 17px;font-size:14.5px;font-weight:600;
  cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;
  transition:background .18s,color .18s}
.sok-segment button:hover{background:#F5F0E8}
.sok-segment button.on{background:#1A3C2E;color:#fff}
.sok-segment button.on:hover{background:#1A3C2E}
.sok-neuf-short{display:none}

/* le champ de recherche */
.sok-rech-champ{flex:1 1 240px;display:flex;align-items:center;gap:9px;
  background:#fff;border:1px solid #E8DFD0;border-radius:12px;padding:0 14px;
  transition:border-color .18s,box-shadow .18s}
.sok-rech-champ:focus-within{border-color:#1A3C2E;box-shadow:0 0 0 3px rgba(26,60,46,.10)}
.sok-rech-champ .loupe{font-size:19px;color:#8F8676;line-height:1}
.sok-rech-champ input{flex:1;min-width:0;border:none;outline:none;background:transparent;
  padding:13px 0;font-size:15.5px;color:#1C1A17;font-family:'DM Sans',sans-serif}
.sok-rech-champ .vider{border:none;background:#F5F0E8;color:#7A7264;border-radius:50%;
  width:22px;height:22px;font-size:15px;line-height:1;cursor:pointer;flex-shrink:0}

/* le bouton Filtres */
.sok-rech-filtres{display:inline-flex;align-items:center;gap:8px;flex-shrink:0;
  background:#fff;border:1px solid #E8DFD0;border-radius:12px;padding:0 17px;
  font-size:14.5px;font-weight:600;color:#1C1A17;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:border-color .18s,background .18s}
.sok-rech-filtres:hover{border-color:#1A3C2E}
.sok-rech-filtres.on{background:#1A3C2E;border-color:#1A3C2E;color:#fff}
.sok-rech-filtres b{background:#B85C3A;color:#fff;border-radius:11px;
  min-width:20px;height:20px;display:inline-flex;align-items:center;
  justify-content:center;font-size:12px;padding:0 5px}

/* la bande des pays */
.sok-pays{display:flex;gap:7px;overflow-x:auto;padding:11px 2px 3px;
  scrollbar-width:none;-ms-overflow-style:none}
.sok-pays::-webkit-scrollbar{display:none}
.sok-pays button{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;
  background:#fff;border:1px solid #E8DFD0;color:#1C1A17;border-radius:22px;
  padding:7px 14px;font-size:13.5px;font-weight:500;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:all .16s}
.sok-pays button:hover{border-color:#B85C3A}
.sok-pays button.on{background:#B85C3A;border-color:#B85C3A;color:#fff;font-weight:700}
.sok-pays button small{font-size:10.5px;min-width:18px;height:18px;padding:0 5px;border-radius:10px;
  display:inline-flex;align-items:center;justify-content:center;background:#F5F0E8;color:#7A7264;font-weight:700}
.sok-pays button.on small{background:rgba(255,255,255,.2);color:#fff}

/* les rappels de filtres actifs */
.sok-actifs{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:10px 0 0}
.sok-actifs .pastille{display:inline-flex;align-items:center;gap:7px;background:#fff;
  border:1px solid #E8DFD0;border-radius:20px;padding:5px 7px 5px 13px;font-size:13px;
  color:#1C1A17;font-family:'DM Sans',sans-serif;animation:sokPop .18s ease-out}
.sok-actifs .pastille button{border:none;background:#F5F0E8;color:#7A7264;
  border-radius:50%;width:19px;height:19px;font-size:13px;line-height:1;cursor:pointer}
.sok-actifs .pastille button:hover{background:#B85C3A;color:#fff}
.sok-actifs .tout{border:none;background:transparent;color:#B85C3A;font-size:13px;
  font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline}
@keyframes sokPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}

/* le panneau des filtres */
.sok-panneau{background:#fff;border:1px solid #E8DFD0;border-radius:14px;
  padding:18px;margin-top:12px;animation:sokOuvre .22s ease-out}
@keyframes sokOuvre{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.sok-panneau h4{margin:0 0 9px;font-size:12px;font-weight:700;color:#8F8676;
  text-transform:uppercase;letter-spacing:.08em;font-family:'DM Sans',sans-serif}
.sok-panneau .bloc{margin-bottom:18px}
.sok-panneau .bloc:last-child{margin-bottom:0}
.sok-fam{margin-bottom:12px}
.sok-fam > span{display:block;font-size:12.5px;color:#7A7264;margin-bottom:6px;
  font-family:'DM Sans',sans-serif}
.sok-nat{display:flex;gap:7px;flex-wrap:wrap}
.sok-nat button{display:inline-flex;align-items:center;gap:6px;background:#fff;
  border:1px solid #E8DFD0;color:#1C1A17;border-radius:10px;padding:8px 13px;
  font-size:13.5px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .16s}
.sok-nat button:hover{border-color:#1A3C2E}
.sok-nat button.on{background:#1A3C2E;border-color:#1A3C2E;color:#fff;font-weight:600}

/* la ligne résultats + tri */
.sok-compte{display:flex;justify-content:space-between;align-items:center;
  gap:12px;margin:18px 0 13px;flex-wrap:wrap}
.sok-compte .n{font-size:15px;color:#1C1A17;font-family:'DM Sans',sans-serif;margin:0}
.sok-compte .n b{font-weight:700}
.sok-tri{display:flex;align-items:center;gap:7px}
.sok-tri label{font-size:13px;color:#8F8676;font-family:'DM Sans',sans-serif}
.sok-tri select{border:1px solid #E8DFD0;background:#fff;border-radius:9px;
  padding:7px 10px;font-size:13.5px;color:#1C1A17;font-family:'DM Sans',sans-serif;
  font-weight:600;cursor:pointer;outline:none}
.sok-tri select:focus{border-color:#1A3C2E}

@media(max-width:560px){
  .sok-newsbar{gap:8px;padding:8px 13px}.sok-newsbar-date{display:none}.sok-newsbar-label{font-size:10.5px}
  .sok-recherche{top:70px}
  .sok-segment{width:100%}
  .sok-segment button{flex:1;padding:9px 6px;text-align:center}
  .sok-neuf-long{display:none}.sok-neuf-short{display:inline}
  .sok-rech-filtres{flex:1;justify-content:center;padding:11px 17px}
}

/* la colonne publicitaire, sur ordinateur seulement */
.sok-aside{display:none}

/* la page d'une annonce */
.sok-annonce{display:block}
.sok-annonce-photo{height:260px}
.sok-annonce-aside{margin-top:20px}

@media(min-width:600px){
  .sok-annonce-photo{height:380px}
  .sok-grid{grid-template-columns:1fr 1fr}
  .sok-guide-grid{grid-template-columns:1fr 1fr}
  .sok-hero{height:420px}
  .sok-hero-in{padding:24px 28px 30px}
  .sok-card-img{height:210px}
}
@media(min-width:900px){
  .sok-hero{height:520px}
  .sok-hero-in{padding:28px max(28px, calc(50vw - 590px)) 44px}
  .desktop-nav{display:flex!important}
  .sok-bottomnav{display:none!important}
  .sok-grid{grid-template-columns:1fr 1fr 1fr}
  .sok-guide-grid{grid-template-columns:1fr 1fr 1fr}
  .sok-home-actions{grid-template-columns:1.25fr .75fr}
  .sok-home-explore{grid-template-columns:1.35fr .65fr .65fr}
  .sok-home-lower{grid-template-columns:1.45fr .55fr;align-items:stretch}
  footer{padding-bottom:44px!important}
}
@media(min-width:1024px){
  .sok-annonce{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:32px;align-items:start}
  .sok-annonce-photo{height:460px}
  .sok-annonce-aside{margin-top:0;position:sticky;top:100px}
  .sok-biens{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:28px;align-items:start}
  .sok-aside{display:block;position:sticky;top:100px}
  .sok-ad-inline{display:none}
  .sok-card-img{height:230px}
  .sok-biens .sok-grid{grid-template-columns:1fr 1fr}
}
`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <header style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 18px rgba(16,39,31,0.28)",borderBottom:`2px solid ${C.gold}`}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"0 14px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"78px",gap:"8px",boxSizing:"border-box"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div>
              <div onClick={()=>switchTab("accueil")} style={{fontSize:"clamp(27px,6.6vw,38px)",fontWeight:500,color:C.white,fontFamily:FT,lineHeight:1,letterSpacing:"-0.03em",cursor:"pointer",whiteSpace:"nowrap"}}>So<span style={{color:C.gold,fontStyle:"italic"}}>ki</span><span style={{color:"#E8A07E"}}>lé</span></div>
              <div style={{fontSize:"11.5px",color:"rgba(255,255,255,0.62)",fontFamily:F,marginTop:"5px",letterSpacing:"0.02em",whiteSpace:"nowrap"}}>L'immobilier en Afrique</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
            {/* Nav desktop uniquement */}
            <nav className="desktop-nav" style={{display:"none",gap:"3px",marginRight:"10px"}}>
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>switchTab(n.id)} style={{background:tab===n.id?"rgba(255,255,255,0.13)":"transparent",border:"none",color:tab===n.id?C.white:"rgba(255,255,255,0.68)",padding:"9px 14px",borderRadius:"8px",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"7px",fontFamily:F,fontSize:"14px",fontWeight:tab===n.id?700:500,whiteSpace:"nowrap"}}>
                  <span style={{display:"flex",color:tab===n.id?C.gold:"rgba(255,255,255,0.5)"}}>{n.icon}</span>{n.label}
                </button>
              ))}
            </nav>
            <a href="/about.html" style={{background:C.gold,color:C.forestDark,border:`1px solid ${C.gold}`,fontSize:"13px",fontWeight:700,fontFamily:F,textDecoration:"none",whiteSpace:"nowrap",padding:"9px 12px",borderRadius:"8px",boxShadow:"0 3px 10px rgba(0,0,0,0.15)"}}>Qui sommes-nous</a>

            {vu?(
              <div onClick={()=>switchTab("compte")} style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,255,255,0.10)",borderRadius:"20px",padding:"4px 10px 4px 4px",cursor:"pointer"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:C.terra,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:700,color:C.white,fontFamily:F,flexShrink:0}}>
                  {vu.name?.slice(0,2).toUpperCase()}
                </div>
                <span style={{fontSize:"13px",color:C.white,fontWeight:600,fontFamily:F,maxWidth:"60px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vu.name}</span>
              </div>
            ):(
              <button onClick={()=>setShowLogin(true)} style={{background:"transparent",color:C.white,border:"1px solid rgba(255,255,255,0.45)",borderRadius:"8px",padding:"9px 13px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Connexion</button>
            )}
          </div>
        </div>
      </header>

      {route.nom==="accueil"&&tab!=="admin"&&<BandeauActualites onOpen={()=>{setSousOnglet("actu");switchTab("guides");}}/>}

      {/* Keep fixed dialogs anchored to the viewport: a transformed ancestor traps them inside main. */}
      <main style={{flex:"1 0 auto",width:"100%",boxSizing:"border-box",maxWidth:"1200px",margin:"0 auto",padding:"0 20px 8px",opacity:animIn?1:0,transition:"opacity 0.2s ease"}}>

        {route.nom==="accueil"&&(tab==="accueil"||tab==="biens")&&propsLoading&&<p role="status" style={{fontFamily:F,color:C.sub}}>Chargement des annonces…</p>}
        {route.nom==="accueil"&&(tab==="accueil"||tab==="biens")&&propsError&&<p role="alert" style={{fontFamily:F,color:C.terra}}>Les annonces ne peuvent pas être chargées pour le moment. Réessayez dans quelques instants.</p>}
        {adPreview&&<AdPreviewNotice offer={adPreview}/>}
        {/* ── UNE ANNONCE, SUR SA PROPRE PAGE ── */}
        {route.nom==="annonce"&&(()=>{
          const bien = directProp&&correspond(directProp,route.id)&&new Date(directProp.expires_at).getTime()>clock ? directProp : null;
          if (!bien) return (
            <div style={{textAlign:"center",padding:"70px 20px"}}>
              <h1 style={{fontFamily:FT,fontSize:"26px",fontWeight:500,color:C.dark,margin:"0 0 10px"}}>
                {directLoading ? "Chargement de l’annonce…" : directError ? "Impossible de charger cette annonce" : "Cette annonce n’est plus disponible"}
              </h1>
              <p style={{color:C.sub,fontSize:"15px",fontFamily:F,margin:"0 0 20px"}}>
                {directLoading ? "Un instant." : directError ? "Réessayez dans quelques instants." : "Elle a expiré ou a été retirée de la publication."}
              </p>
              <button onClick={quitterAnnonce} style={{background:C.terra,color:C.white,border:"none",borderRadius:"9px",padding:"13px 24px",fontWeight:700,fontSize:"15px",cursor:"pointer",fontFamily:F}}>Voir toutes les annonces</button>
            </div>
          );
          return (
            <AnnoncePage
              p={bien}
              onRetour={()=>{ quitterAnnonce(); switchTab("biens"); }}
              onSave={handleSave}
              saved={savedProps.some(s=>s.id===bien.id)}
              onVerify={b=>{ quitterAnnonce(); openAnnuaire("Vérification terrain", b.country); }}
              onBudget={openBudget}
              onVoir={ouvrirAnnonce}
              similaires={ALL_PROPS.filter(x=>x.country===bien.country && x.id!==bien.id).slice(0,3)}
            />
          );
        })()}

        {route.nom==="guide"&&<GuidePage guide={GUIDES.find(g=>g.id===route.id)} onBack={quitterGuide} onFindPro={()=>{quitterGuide();switchTab("prestataires");}}/>}
        {route.nom==="programmes"&&<ProgramList api={programApi} onOpen={openProgram} onNew={programPublisher?newProgram:undefined} onBack={()=>switchTab("biens")}/>}
        {route.nom==="programme"&&<ProgramPage id={route.id} api={programApi} user={vu} onBack={openPrograms}/>}

        {/* ── ACCUEIL ── */}
        {route.nom==="accueil"&&tab==="accueil"&&(
          <div>
            {/* Hero Carrousel */}
            <HeroCarousel search={search} setSearch={setSearch} onSearch={()=>switchTab("biens")}/>

            {adPreview==="reach"&&<AdPreviewSlot placement="banner"/>}

            <HomeDiscovery
              onBrowse={(transaction,nature)=>{resetFilters();setFilterTransaction(transaction);setFilterNature(nature);switchTab("biens");}}
              onPrograms={openPrograms}
              onProfessionals={()=>openAnnuaire()}
              onGuides={()=>{setSousOnglet("guides");switchTab("guides");}}
            />

            {/* Sélection */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"14px"}}>
              <h2 style={{fontFamily:FT,fontSize:"22px",fontWeight:500,color:C.cacao,margin:0}}>Annonces récentes</h2>
              <span onClick={()=>switchTab("biens")} style={{fontSize:"13px",color:C.terra,fontWeight:700,cursor:"pointer",fontFamily:F}}>Voir tout →</span>
            </div>
            <div className="sok-grid" style={{marginBottom:"28px"}}>
              {ALL_PROPS.slice(0,4).map(p=><PropertyCard key={p.id} p={p} onClick={ouvrirAnnonce} onSave={handleSave} saved={savedProps.some(s=>s.id===p.id)}/>)}
            </div>

            <ProgramHome api={programApi} onOpen={openProgram} onAll={openPrograms}/>
            <div className="sok-home-actions">
            {/* CTA */}
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,borderRadius:"14px",padding:"22px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap",boxShadow:"0 12px 28px rgba(16,39,31,.14)"}}>
              <div>
                <h3 style={{margin:"0 0 4px",color:C.white,fontFamily:FT,fontSize:"18px"}}>Publiez votre bien gratuitement</h3>
                <p style={{margin:0,color:"rgba(255,255,255,0.6)",fontSize:"13px",fontFamily:F}}>Particulier ou professionnel · Afrique de l'Ouest & Centrale</p>
              </div>
              <div style={{display:"flex",gap:"7px",flexShrink:0}}>
                <button onClick={()=>{setPartnerType("particulier");vu?setShowPartner(true):setShowLogin(true);}} style={{background:C.terra,color:C.white,border:"none",borderRadius:"7px",padding:"9px 16px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Particulier</button>
                <button onClick={()=>{setPartnerType("pro");vu?setShowPartner(true):setShowLogin(true);}} style={{background:"transparent",color:C.white,border:"1px solid rgba(255,255,255,0.25)",borderRadius:"7px",padding:"9px 16px",fontWeight:600,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Professionnel</button>
              </div>
            </div>

            {/* Accès annuaire */}
            <div onClick={()=>openAnnuaire()} style={{background:C.white,border:`1px solid ${C.sand}`,borderRadius:"14px",padding:"20px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"14px",cursor:"pointer",flexDirection:"column",boxShadow:"0 8px 20px rgba(28,26,23,.05)"}}>
              <div>
                <h3 style={{margin:"0 0 4px",color:C.dark,fontFamily:FT,fontSize:"18px"}}>Besoin d'un géomètre, d'un notaire, d'un architecte ?</h3>
                <p style={{margin:0,color:C.sub,fontSize:"13px",fontFamily:F}}>Des professionnels référencés dans le pays de votre projet</p>
              </div>
              <button style={{background:C.forest,color:C.white,border:"none",borderRadius:"7px",padding:"9px 16px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F,flexShrink:0}}>Trouver un prestataire</button>
            </div>
            </div>

            {/* Aperçu des guides */}
            <section style={{margin:"26px 0 28px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:"12px",marginBottom:"14px"}}>
                <div>
                  <div style={{fontSize:"11px",fontWeight:700,color:C.terra,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:F,marginBottom:"4px"}}>Comprendre avant d'agir</div>
                  <h2 style={{fontFamily:FT,fontSize:"22px",fontWeight:500,color:C.dark,margin:0}}>Les guides Sokilé</h2>
                </div>
                <span onClick={()=>switchTab("guides")} style={{fontSize:"13px",color:C.terra,fontWeight:700,cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Voir tous →</span>
              </div>
              <div className="sok-home-explore">
                <GuideCard guide={GUIDES[0]} onOpen={ouvrirGuide}/>
                <button onClick={()=>{setSousOnglet("outils");switchTab("guides");}} style={{border:0,borderRadius:14,padding:22,textAlign:"left",cursor:"pointer",background:`linear-gradient(145deg,${C.terra},#8F412A)`,color:C.white,fontFamily:F,boxShadow:"0 10px 24px rgba(184,92,58,.16)"}}>
                  <span style={{fontSize:28,display:"block",marginBottom:22}}>◒</span>
                  <strong style={{display:"block",fontFamily:FT,fontSize:21,fontWeight:500,marginBottom:7}}>Simulateurs</strong>
                  <span style={{display:"block",fontSize:13.5,lineHeight:1.55,opacity:.8}}>Budget d’achat, rentabilité locative et épargne.</span>
                  <span style={{display:"block",marginTop:18,fontSize:13,fontWeight:800}}>Calculer →</span>
                </button>
                <button onClick={()=>{setSousOnglet("actu");switchTab("guides");}} style={{border:`1px solid ${C.sand}`,borderRadius:14,padding:22,textAlign:"left",cursor:"pointer",background:C.white,color:C.dark,fontFamily:F,boxShadow:"0 8px 20px rgba(28,26,23,.05)"}}>
                  <span style={{fontSize:28,display:"block",marginBottom:22}}>◎</span>
                  <strong style={{display:"block",fontFamily:FT,fontSize:21,fontWeight:500,marginBottom:7}}>Actualités</strong>
                  <span style={{display:"block",fontSize:13.5,lineHeight:1.55,color:C.sub}}>Foncier, financement et évolutions du marché.</span>
                  <span style={{display:"block",marginTop:18,fontSize:13,fontWeight:800,color:C.terra}}>Voir le fil →</span>
                </button>
              </div>
            </section>

            <div className="sok-home-lower">
            {/* Pays — Option B fond vert sombre */}
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"22px",borderRadius:"14px"}}>
              <div style={{fontSize:"15px",color:"rgba(255,255,255,0.8)",fontFamily:F,marginBottom:"16px"}}>Cliquez sur un pays pour voir les annonces</div>
              {["Afrique de l'Ouest","Afrique Centrale"].map(region=>{
                const regionKey = region==="Afrique de l'Ouest"?"Ouest":"Centrale";
                const devise = regionKey==="Ouest"?"Franc CFA UEMOA":"Franc CFA CEMAC";
                const pays = COUNTRIES.filter(c=>c.region===regionKey);
                if(!pays.length) return null;
                return(
                  <div key={region} style={{marginBottom:"14px"}}>
                    <div style={{fontSize:"11px",fontWeight:700,color:"rgba(212,160,23,0.8)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"8px",paddingBottom:"6px",borderBottom:"1px solid rgba(255,255,255,0.08)",fontFamily:F}}>{region} <span style={{color:"rgba(255,255,255,0.35)",fontWeight:600}}>· {devise}</span></div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
                      {pays.map(p=>(
                        <button key={p.name} onClick={()=>{setFilterCountry(p.name);switchTab("biens");}} style={{display:"flex",alignItems:"center",gap:"5px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"8px 13px",fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.82)",cursor:"pointer",fontFamily:F}}>
                          <Flag flag={p.flag}/>{p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Encart publicitaire */}
            {!adPreview&&<div style={{borderRadius:"14px",border:`2px solid ${C.gold}`,background:`linear-gradient(145deg,${C.light},${C.cream})`,padding:"20px",textAlign:"center",boxShadow:"0 10px 26px rgba(58,41,35,0.08)",display:"flex",flexDirection:"column",justifyContent:"center"}}>
              <div style={{fontSize:"10.5px",fontWeight:700,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:F,marginBottom:"6px"}}>Publicité · Partenaire</div>
              <div style={{fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.cacao,marginBottom:"5px"}}>Présentez votre marque sur Sokilé</div>
              <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"12px"}}>Touchez une audience en recherche active d'un bien immobilier en Afrique.</div>
              <button onClick={()=>setShowPub(true)} style={{border:"none",cursor:"pointer",display:"inline-block",background:C.gold,color:C.cacao,borderRadius:"8px",padding:"9px 18px",fontSize:"13px",fontWeight:700,fontFamily:F,textDecoration:"none"}}>Découvrir les formats</button>
            </div>}
            {(adPreview==="visibility"||adPreview==="reach")&&<AdPreviewSlot placement="compact"/>}
            </div>
          </div>
        )}

        {/* ── BIENS ── */}
        {route.nom==="accueil"&&tab==="biens"&&(
          <div style={{paddingTop:"18px"}}>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:"14px",flexWrap:"wrap"}}>
              <div style={{minWidth:"220px"}}>
                <h2 style={{fontFamily:FT,fontSize:"27px",fontWeight:500,color:C.dark,margin:0,lineHeight:1.15}}>Trouver un bien</h2>
                <p style={{margin:"5px 0 0",fontSize:"14.5px",color:C.sub,fontFamily:F,lineHeight:1.5}}>Maisons, appartements, terrains et locaux professionnels, dans douze pays.</p>
              </div>
              <button onClick={()=>vu?setShowAlert(true):setShowLogin(true)} style={{background:"transparent",color:C.forest,border:`1px solid ${C.forest}`,borderRadius:"22px",padding:"9px 17px",fontWeight:600,fontSize:"13.5px",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Me prévenir par email</button>
            </div>

            {/* ── LA BARRE DE RECHERCHE ── */}
            <div className="sok-recherche">
              <div className="sok-rech-haut">
                <div className="sok-segment">
                  {[["tous","Tout"],["vente","Acheter"],["location","Louer"]].map(([k,l])=>(
                    <button key={k} className={filterTransaction===k?"on":""} onClick={()=>setFilterTransaction(k)}>{l}</button>
                  ))}
                  <button onClick={openPrograms} aria-label="Programmes neufs"><span className="sok-neuf-long">Programmes neufs</span><span className="sok-neuf-short">Neuf</span></button>
                </div>
                <div className="sok-rech-champ">
                  <span className="loupe" aria-hidden="true">⌕</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ville, quartier, pays…" aria-label="Rechercher un bien"/>
                  {search&&<button className="vider" onClick={()=>setSearch("")} aria-label="Effacer la recherche">×</button>}
                </div>
                <button className={`sok-rech-filtres${showFilters?" on":""}`} onClick={()=>setShowFilters(!showFilters)} aria-expanded={showFilters}>
                  Filtres{activeFiltersCount>0&&<b>{activeFiltersCount}</b>}
                </button>
              </div>

              <div className="sok-pays">
                <button className={filterCountry==="Tous"?"on":""} onClick={()=>setFilterCountry("Tous")}>Tous les pays</button>
                {paysActifs.map(c=>(
                  <button key={c.name} className={filterCountry===c.name?"on":""} onClick={()=>setFilterCountry(filterCountry===c.name?"Tous":c.name)}>
                    <Flag flag={c.flag} size={14}/>{c.name}<small>{comptesPays[c.name]}</small>
                  </button>
                ))}
              </div>

              {rappels.length>0&&(
                <div className="sok-actifs">
                  {rappels.map(r=>(
                    <span key={r.cle} className="pastille">{r.texte}<button onClick={r.retirer} aria-label={`Retirer le filtre ${r.texte}`}>×</button></span>
                  ))}
                  <button className="tout" onClick={resetFilters}>Tout effacer</button>
                </div>
              )}
            </div>

            {/* ── LE PANNEAU DES FILTRES ── */}
            {showFilters&&(
              <div className="sok-panneau">
                <div className="bloc">
                  <h4>Nature du bien</h4>
                  <div className="sok-nat" style={{marginBottom:"14px"}}>
                    <button className={filterNature==="Tous"?"on":""} onClick={()=>setFilterNature("Tous")}>Toutes les natures</button>
                  </div>
                  {naturesDispo.map(([fam,liste])=>(
                    <div key={fam} className="sok-fam">
                      <span>{fam}</span>
                      <div className="sok-nat">
                        {liste.map(([k,n])=>(
                          <button key={k} className={filterNature===k?"on":""} onClick={()=>setFilterNature(filterNature===k?"Tous":k)}>{n.icone} {n.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bloc">
                  <h4>Région</h4>
                  <div className="sok-nat">
                    {["Tous","Afrique de l'Ouest","Afrique Centrale"].map(r=>(
                      <button key={r} className={filterRegion===r?"on":""} onClick={()=>{setFilterRegion(r);setFilterCountry("Tous");}}>{r==="Tous"?"Les deux":r}</button>
                    ))}
                  </div>
                </div>

                <div className="bloc" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:"18px"}}>
                  <div>
                    <h4>Budget (€)</h4>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      <input type="number" inputMode="numeric" placeholder="Min" value={filterPriceMin} onChange={e=>setFilterPriceMin(e.target.value)} style={{...inputBase,flex:1}}/>
                      <span style={{color:C.sub}}>—</span>
                      <input type="number" inputMode="numeric" placeholder="Max" value={filterPriceMax} onChange={e=>setFilterPriceMax(e.target.value)} style={{...inputBase,flex:1}}/>
                    </div>
                  </div>
                  <div>
                    <h4>Surface (m²)</h4>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      <input type="number" inputMode="numeric" placeholder="Min" value={filterSurfaceMin} onChange={e=>setFilterSurfaceMin(e.target.value)} style={{...inputBase,flex:1}}/>
                      <span style={{color:C.sub}}>—</span>
                      <input type="number" inputMode="numeric" placeholder="Max" value={filterSurfaceMax} onChange={e=>setFilterSurfaceMax(e.target.value)} style={{...inputBase,flex:1}}/>
                    </div>
                  </div>
                  <div>
                    <h4>Pièces</h4>
                    <div className="sok-nat">
                      {rooms.map(r=><button key={r} className={filterRooms===r?"on":""} onClick={()=>setFilterRooms(r)}>{r}</button>)}
                    </div>
                  </div>
                </div>

                <div className="bloc">
                  <h4>Équipements</h4>
                  <div className="sok-nat">
                    {EQUIPEMENTS.map(eq=>(
                      <button key={eq} className={filterEquipements.includes(eq)?"on":""} onClick={()=>toggleEquipement(eq)}>{filterEquipements.includes(eq)?"✓ ":""}{eq}</button>
                    ))}
                  </div>
                </div>


              </div>
            )}

            {/* ── RÉSULTATS ── */}
            <div className="sok-compte">
              <p className="n"><b>{filtered.length}</b> bien{filtered.length>1?"s":""} {filterTransaction==="location"?"à louer":filterTransaction==="vente"?"à vendre":"trouvé"}{filtered.length>1&&filterTransaction==="tous"?"s":""}{filterCountry!=="Tous"?` · ${filterCountry}`:""}</p>
              <div className="sok-tri">
                <label htmlFor="sok-tri">Trier par</label>
                <select id="sok-tri" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  {sorts.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="sok-biens">
            <div>
            <div className="sok-grid">
              {filtered.map((p,i)=>(
                <div key={p.id} style={{display:"contents"}}>
                  <PropertyCard p={p} onClick={ouvrirAnnonce} onSave={handleSave} saved={savedProps.some(s=>s.id===p.id)}/>
                  {i===2&&<AdSlot className="sok-ad-inline" onClick={()=>setShowPub(true)}/>}
                </div>
              ))}
              {filtered.length===0&&(
                <div style={{textAlign:"center",padding:"48px 20px",color:C.sub,gridColumn:"1/-1"}}>
                  <div style={{fontSize:"34px",marginBottom:"8px",opacity:0.4}}>○</div>
                  <p style={{fontFamily:F,fontSize:"15px"}}>Aucun bien ne correspond à votre recherche.</p>
                  <button onClick={()=>vu?setShowAlert(true):setShowLogin(true)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"7px",padding:"9px 18px",fontWeight:700,fontSize:"14px",cursor:"pointer",marginTop:"12px",fontFamily:F}}>Créer une alerte</button>
                </div>
              )}
            </div>
            </div>
            <aside className="sok-aside">
              <AdSlot onClick={()=>setShowPub(true)}/>
              <div style={{background:C.forest,borderRadius:"12px",padding:"20px",marginTop:"16px"}}>
                <div style={{fontFamily:FT,fontSize:"18px",color:C.white,marginBottom:"7px",lineHeight:1.3}}>Un projet à distance ?</div>
                <div style={{fontSize:"14px",color:"rgba(255,255,255,0.65)",fontFamily:F,lineHeight:1.55,marginBottom:"14px"}}>Géomètre, notaire, architecte : faites vérifier un bien avant d'acheter.</div>
                <button onClick={()=>switchTab("prestataires")} style={{width:"100%",background:C.gold,color:C.forestDark,border:"none",borderRadius:"9px",padding:"12px",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Trouver un prestataire</button>
              </div>
              <AdSlot onClick={()=>setShowPub(true)} style={{marginTop:"16px"}}/>
            </aside>
            </div>
          </div>
        )}

        {/* ── GUIDES ── */}
        {route.nom==="accueil"&&tab==="guides"&&(
          <div>
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"28px 20px",borderBottom:`3px solid ${C.gold}`}}>
              <div style={{fontSize:"11px",fontWeight:700,color:C.gold,textTransform:"uppercase",letterSpacing:"0.14em",fontFamily:F,marginBottom:"8px"}}>Conseils & outils Sokilé</div>
              <h1 style={{fontFamily:FT,fontSize:"clamp(27px,5vw,40px)",fontWeight:400,color:C.white,lineHeight:1.15,margin:"0 0 9px"}}>Décider avec les bonnes informations.</h1>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.7)",fontFamily:F,lineHeight:1.65,maxWidth:"680px",margin:0}}>Guides pratiques, simulateurs, documents et actualités pour préparer votre projet immobilier en Afrique.</p>
            </div>
            {/* Sous-rubriques */}
            <div style={{display:"flex",gap:"8px",overflowX:"auto",padding:"18px 0 4px"}}>
              {[["guides","Guides"],["outils","Simulateurs"],["docs","À télécharger"],["actu","Actualités"]].map(([id,lbl])=>(
                <button key={id} onClick={()=>setSousOnglet(id)} style={{flexShrink:0,background:sousOnglet===id?C.forest:C.white,color:sousOnglet===id?C.white:C.dark,border:`1px solid ${sousOnglet===id?C.forest:C.sand}`,borderRadius:"22px",padding:"10px 18px",fontSize:"14.5px",fontWeight:sousOnglet===id?700:500,cursor:"pointer",fontFamily:F}}>{lbl}</button>
              ))}
            </div>

            <div style={{padding:"18px 0"}}>
              {sousOnglet==="guides"&&(<>
                <div className="sok-guide-grid">
                  {GUIDES.map((g,i)=>(
                    <div key={g.id} style={{display:"contents"}}>
                      <GuideCard guide={g} onOpen={ouvrirGuide}/>
                      {i===2&&<AdSlot className="sok-ad-inline" onClick={()=>setShowPub(true)}/>}
                    </div>
                  ))}
                </div>
                <AdSlot onClick={()=>setShowPub(true)} style={{marginTop:"22px"}}/>
              </>)}

              {sousOnglet==="outils"&&<Simulateurs state={simulation} setState={setSimulation} onFindPro={country=>openAnnuaire("Notaire",country)}/>}
              {sousOnglet==="docs"&&<Telechargements user={vu}/>}
              {sousOnglet==="actu"&&<Actualite user={vu}/>}
            </div>
          </div>
        )}

        {/* ── PRESTATAIRES (particuliers) ── */}
        {route.nom==="accueil"&&tab==="prestataires"&&(
          <div>
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"20px 16px"}}>
              <div style={{fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.white,marginBottom:"6px"}}>Des professionnels utiles sur place</div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,0.75)",fontFamily:F,lineHeight:1.6,maxWidth:"620px"}}>Trouvez un notaire, un géomètre, un architecte ou un professionnel du bâtiment dans le pays de votre projet, puis contactez-le directement. Les fiches indiquent clairement si elles sont référencées, revendiquées ou contrôlées.</div>
            </div>
            <div style={{padding:"16px"}}>
              {adPreview==="spotlight"&&<AdPreviewSlot placement="spotlight"/>}
              <Annuaire key={`${annFilter.spec}|${annFilter.pays}`} initialSpec={annFilter.spec} initialPays={annFilter.pays}/>
              <AdSlot onClick={()=>setShowPub(true)} style={{marginTop:"18px"}}/>
              <div style={{textAlign:"center",marginTop:"16px",fontSize:"14px",color:C.sub,fontFamily:F}}>
                Vous êtes prestataire ? <span onClick={()=>switchTab("pro")} style={{color:C.terra,fontWeight:700,cursor:"pointer"}}>Rejoignez l'annuaire</span>
              </div>
            </div>
          </div>
        )}

        {/* ── ESPACE PRO ── */}
        {route.nom==="accueil"&&tab==="pro"&&!programPublisher&&(
          <div>
            {/* Hero Pro */}
            <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestDark})`,padding:"20px 16px 16px"}}>
              <div style={{fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.white,marginBottom:"4px"}}>Espace Professionnel</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",fontFamily:F,marginBottom:"16px"}}>Rejoignez notre communauté en Afrique de l'Ouest et Centrale</div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {/* Déposer une annonce pro */}
                <button onClick={()=>{setPartnerType("pro");vu?setShowPartner(true):setShowLogin(true);}} style={{background:C.terra,color:C.white,border:"none",borderRadius:"8px",padding:"12px 14px",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:F}}>
                  <div style={{width:36,height:36,borderRadius:"8px",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"21px",flexShrink:0}}>🏠</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:700,color:C.white,fontFamily:F}}>Déposer une annonce</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",fontFamily:F}}>Agence ou promoteur immobilier</div>
                  </div>
                </button>
                {/* Proposer un service */}
                {programPublisher&&<button onClick={newProgram} style={{background:C.gold,color:C.forestDark,border:0,borderRadius:8,padding:14,textAlign:"left",cursor:"pointer",fontFamily:F,fontWeight:700}}>Présenter un programme neuf <span style={{display:"block",fontWeight:400,fontSize:13}}>Résidence, logements, plans et disponibilités · Gratuit au lancement</span></button>}
                {/* Proposer un service */}
                <button onClick={()=>vu?setShowServiceForm(true):setShowLogin(true)} style={{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"8px",padding:"12px 14px",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:F}}>
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
              {/* Encart publicitaire */}
              <div style={{borderRadius:"14px",border:`2px solid ${C.gold}`,background:`linear-gradient(145deg,${C.light},${C.cream})`,padding:"20px",textAlign:"center",marginTop:"8px",boxShadow:"0 10px 26px rgba(58,41,35,0.08)"}}>
                <div style={{fontSize:"10.5px",fontWeight:700,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:F,marginBottom:"6px"}}>Publicité · Partenaire</div>
                <div style={{fontFamily:FT,fontSize:"19px",fontWeight:500,color:C.cacao,marginBottom:"5px"}}>Présentez votre marque sur Sokilé</div>
                <div style={{fontSize:"13px",color:C.sub,fontFamily:F,marginBottom:"12px"}}>Découvrez les emplacements disponibles par pays et par type de recherche.</div>
                <button onClick={()=>setShowPub(true)} style={{border:"none",cursor:"pointer",display:"inline-block",background:C.gold,color:C.cacao,borderRadius:"8px",padding:"9px 18px",fontSize:"13px",fontWeight:700,fontFamily:F,textDecoration:"none"}}>Découvrir les formats</button>
              </div>

              {/* Bouton rejoindre annuaire */}
              <button onClick={()=>vu?setShowServiceForm(true):setShowLogin(true)} style={{width:"100%",marginTop:"12px",background:C.forest,color:C.white,border:"none",borderRadius:"8px",padding:"13px",fontWeight:700,fontSize:"15px",cursor:"pointer",fontFamily:F}}>
                Rejoindre l'annuaire prestataires
              </button>
            </div>
          </div>
        )}

        {/* ── COMPTE ── */}
        {route.nom==="accueil"&&tab==="admin"&&estAdmin(user)&&!apercu&&(
          <EspaceAdmin user={user} apercu={apercu} onApercu={v=>{setApercu(v); if(v) switchTab("accueil");}} programRefresh={programRefresh}/>
        )}

        {route.nom==="accueil"&&(tab==="compte"||(tab==="pro"&&programPublisher))&&(
          <div style={{paddingTop:"20px"}}>
            {estAdmin(user)&&!apercu&&new URLSearchParams(window.location.search).get("paiement")==="test"&&<div className="sp"><div className="sp-note">Vous êtes de retour de l’essai de paiement. Consultez le résultat confirmé dans Gestion.<div className="sp-actions"><button onClick={()=>switchTab("admin")}>Voir les essais de paiement</button></div></div></div>}
            {!vu?(
              <div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:C.cream,border:`1px solid ${C.sand}`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",color:C.sub}}>{Icon.person}</div>
                <h2 style={{fontFamily:FT,fontSize:"23px",color:C.dark,margin:"0 0 8px"}}>Votre espace personnel</h2>
                <p style={{color:C.sub,fontSize:"15px",margin:"0 0 24px",fontFamily:F}}>Connectez-vous pour accéder à vos favoris, alertes et annonces.</p>
                <button onClick={()=>setShowLogin(true)} style={{background:C.terra,color:C.white,border:"none",borderRadius:"8px",padding:"13px 32px",fontWeight:700,fontSize:"16px",cursor:"pointer",fontFamily:F,marginBottom:"10px",display:"block",width:"100%"}}>Se connecter</button>
                <button onClick={()=>setShowLogin("signup")} style={{background:"transparent",color:C.terra,border:`1px solid ${C.terra}`,borderRadius:"8px",padding:"12px 32px",fontWeight:700,fontSize:"16px",cursor:"pointer",fontFamily:F,display:"block",width:"100%"}}>Créer un compte gratuit</button>
              </div>
            ):(
              <>
                <div style={{background:C.forest,borderRadius:"12px",padding:"20px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"14px"}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:C.terra,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:700,color:C.white,fontFamily:F}}>
                    {vu.name?.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{minWidth:0,overflowWrap:"anywhere"}}>
                    <h2 style={{margin:"0 0 2px",color:C.white,fontFamily:FT,fontSize:"18px"}}>{programPublisher?(vu.agency||vu.name):vu.name}</h2>
                    <p style={{margin:"0 0 5px",color:"rgba(255,255,255,0.6)",fontSize:"13px",fontFamily:F}}>{vu.email}</p>
                    <span style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",fontSize:"12px",fontWeight:600,padding:"2px 9px",borderRadius:"3px",fontFamily:F}}>{programPublisher?"Compte professionnel":estAdmin(vu)?"Administratrice Sokilé":"Membre Sokilé"}</span>
                  </div>
                </div>
                {programPublisher?<ProfessionalActions
                  onListing={()=>{setPartnerType("pro");setShowPartner(true);}}
                  onProgram={newProgram}
                  onDirectory={()=>setShowServiceForm(true)}
                  onAdvertising={()=>setShowPub(true)}
                />:<button onClick={()=>{setPartnerType("particulier");setShowPartner(true);}} style={{width:"100%",marginBottom:16,background:C.terra,border:"none",color:C.white,borderRadius:8,padding:13,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:F}}>Publier une annonce</button>}
                <div style={{display:"grid",gap:"7px"}}>
                    <MesAnnonces user={vu} refreshKey={myPropsRefresh} onEdit={p=>setEditingProp(p)}/>
                    <MesDemandesPro user={vu} showEmpty={programPublisher} refreshKey={proRefresh} onEditService={setEditingService} onEditPub={setEditingPub}/>
                    {programPublisher&&<ProgramManager api={programApi} user={vu} onNew={newProgram} onEdit={editProgram} refreshKey={programRefresh}/>}
                    <PersonalAccountTools professional={programPublisher}>
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
                    <MesAlertes user={vu} load={lire} rpc={alertRpc} refreshKey={alertsRefresh}/>
                    </PersonalAccountTools>
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
                <button onClick={()=>{setUser(null);effacerLocal(CLE_SESSION);}} style={{width:"100%",marginTop:"8px",background:"transparent",border:`1px solid ${C.sand}`,color:C.sub,borderRadius:"8px",padding:"11px",fontWeight:600,fontSize:"14px",cursor:"pointer",fontFamily:F}}>Se déconnecter</button>
              </>
            )}
          </div>
        )}
        {route.nom==="accueil"&&tab==="compte"&&<div style={{textAlign:"center",padding:"4px 0 24px"}}><a href="/about.html" style={{color:C.terra,fontSize:"14px",fontWeight:700,fontFamily:F,textDecoration:"none"}}>Qui sommes-nous ?</a></div>}
      </main>

      <SiteFooter onNav={switchTab} onPub={()=>{setPartnerType(null);vu?setShowPartner(true):setShowLogin(true);}}/>

      {apercu&&(
        <div style={{position:"fixed",left:0,right:0,bottom:"calc(70px + env(safe-area-inset-bottom))",zIndex:200,display:"flex",justifyContent:"center",padding:"0 14px",pointerEvents:"none"}}>
          <div style={{pointerEvents:"auto",background:C.gold,color:C.forestDark,borderRadius:"30px",padding:"11px 16px",boxShadow:"0 6px 22px rgba(0,0,0,0.28)",display:"flex",alignItems:"center",gap:"13px",maxWidth:"560px",flexWrap:"wrap",justifyContent:"center"}}>
            <span style={{fontSize:"14px",fontWeight:700,fontFamily:F}}>
              Aperçu : vue {apercu==="pro"?"professionnel":apercu==="particulier"?"particulier":"visiteur"}
            </span>
            <button onClick={()=>{setApercu("");switchTab("admin");}} style={{background:C.forestDark,color:C.white,border:"none",borderRadius:"20px",padding:"8px 15px",fontSize:"13.5px",fontWeight:700,cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Revenir à ma vue</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="sok-bottomnav" style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.96)",backdropFilter:"blur(12px)",borderTop:`1px solid ${C.sand}`,display:"flex",zIndex:99,boxShadow:"0 -3px 18px rgba(26,60,46,0.10)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {MOBILE_NAV.map(n=>(
          <button key={n.id} onClick={()=>switchTab(n.id)} style={{flex:1,background:"none",border:"none",padding:"11px 4px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",transition:"all 0.15s"}}>
            <span style={{color:tab===n.id?C.terra:C.sub}}>{n.icon}</span>
            <span style={{fontSize:"11.5px",fontWeight:tab===n.id?700:500,color:tab===n.id?C.terra:C.sub,fontFamily:F,letterSpacing:"0.01em"}}>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* MODALS */}
      <PropertyModal onBudget={openBudget} p={selectedProp} onClose={()=>setSelectedProp(null)} onSaveFromModal={handleSave} onVerify={p=>openAnnuaire("Vérification terrain",p.country)}/>
      {showLogin&&<LoginModal initialMode={showLogin==="signup"?"signup":"login"} onClose={()=>setShowLogin(false)} onLogin={u=>setUser(u)}/>}
      {showAlert&&<AlertModal onClose={()=>setShowAlert(false)} filters={{country:filterCountry,region:filterRegion,transaction:filterTransaction,nature:filterNature,natureLabel:filterNature!=="Tous"?(NATURES[filterNature]?.label||filterNature):"",search,priceMin:filterPriceMin,priceMax:filterPriceMax,surfaceMin:filterSurfaceMin,surfaceMax:filterSurfaceMax,rooms:filterRooms,equipements:filterEquipements,verified:false}} user={vu} rpc={alertRpc} onCreated={()=>setAlertsRefresh(v=>v+1)}/>}
      {showPartner&&<PartnerModal onClose={()=>setShowPartner(false)} user={vu} defaultType={partnerType} onSaved={()=>setMyPropsRefresh(x=>x+1)}/>} 
      {editingProp&&<PartnerModal onClose={()=>setEditingProp(null)} user={vu} existing={editingProp} onSaved={()=>setMyPropsRefresh(x=>x+1)}/>} 
      {(showServiceForm||editingService)&&vu&&<ServiceFormModal onClose={()=>{setShowServiceForm(false);setEditingService(null);}} user={vu} existing={editingService} onSaved={()=>setProRefresh(x=>x+1)}/>}
      {(showPub||editingPub)&&<PubFormModal onClose={()=>{setShowPub(false);setEditingPub(null);}} user={vu} existing={editingPub} onSaved={()=>setProRefresh(x=>x+1)}/>}
      {programEditor&&programPublisher&&<ProgramEditor api={programApi} user={vu} existing={programEditor} onClose={()=>setProgramEditor(null)} onSaved={()=>setProgramRefresh(x=>x+1)}/>}
    </div>
  );
}
