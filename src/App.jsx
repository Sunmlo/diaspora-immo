import {TrustCommitment} from './trust-commitment.jsx';
import {SocialLinks} from './social-links.jsx';
import {DirectoryProof,DirectoryReview} from './directory-review.jsx';
import {directoryError,directoryReviewError,needsTitleReview} from './directory-review.mjs';
import {GiftPage,GiftBanner} from './gift.jsx';
import {SearchRequestBanner,SearchRequestPage,ProfessionalSearchRequests} from './search-requests.jsx';
import {giftApi,cleanGift} from './gift.mjs';
import {IndividualPanel} from './individual-verification.jsx';
import {individualApi} from './individual-verification.mjs';
import "./brand.css";
import {VerificationPage, VerificationPanel, VerificationWorkspace, VerificationAdmin, VerificationAdminHint, VerificationBadge} from './pro-verification.jsx';
import {verificationApi} from './pro-verification-api.mjs';
import {specialtyActivity} from './pro-regulations.mjs';
import { BulkImport } from "./bulk-import.jsx";
import { CORE_COLUMNS } from "./bulk-import.mjs";
import "./listing-details.css";
import { Fragment, useState, useRef, useEffect } from "react";
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
import { DemoListings } from "./demo-listings.jsx";
import { PaidOffers } from "./paid-offers.jsx";
import { PaymentsAdmin } from "./payments.jsx";
import { paymentGateway } from "./payments.mjs";
import { normalizeEmail, authFormError, authCallbackState, readAuthResponse, userSessionFromAuth, isAdminSession, applySessionRefresh, watchSession } from "./auth-session.mjs";
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
const giftsApi=giftApi(SUPABASE_URL,SUPABASE_KEY);

const proVerificationApi = verificationApi(SUPABASE_URL,SUPABASE_KEY);
const individualVerificationApi = individualApi(SUPABASE_URL,SUPABASE_KEY,verificationApi(SUPABASE_URL,SUPABASE_KEY,'individual-verification-documents'));

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
  const redirect=meta.gift_project?`?redirect_to=${encodeURIComponent(window.location.origin+"/cadeau")}`:"";
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup${redirect}`, {
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
function LoginModal({ onClose, onLogin, initialMode="login", giftProject=null }) {
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(callback?.error || "");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (callback) window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }, [callback]);

  const inputStyle = {width:"100%",border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"11px 14px",fontSize:"15px",outline:"none",color:C.dark,boxSizing:"border-box",fontFamily:F};

  const handleSubmit = async () => {
    if (loading) return;
    if (mode === "signup" && !termsAccepted) { setError("Veuillez accepter les conditions d’utilisation pour créer votre compte."); return; }
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
        const d = await signUp(email, password, {name, phone:normalizePhone(phoneCode,phone)||"", account_type:accountType, agency:accountType==="pro"?agency:"", terms_accepted_at:new Date().toISOString(), terms_version:"2026-10-01", ...(cleanGift(giftProject)?{gift_project:cleanGift(giftProject)}:{})});
        if (d.error) setError(d.error.message||"Erreur lors de l'inscription");
        else { window.sokileAnalytics?.event("signup_request"); const session=userSessionFromAuth(d); if(session){onLogin(session);onClose();}else setSuccess(giftProject?"Vérifiez votre email pour confirmer votre compte, puis revenez sur sokile.com/cadeau et connectez-vous pour récupérer votre cadeau.":"Compte créé ! Vérifiez votre email."); }
      } else {
        const d = await signIn(email, password);
        const session = userSessionFromAuth(d);
        if (!session) setError(d.error?.message || "Connexion non confirmée par le serveur. Veuillez réessayer.");
        else { window.sokileAnalytics?.event("login"); onLogin(session); onClose(); }
      }
    } catch(e) {
      setError("Connexion impossible pour le moment. Vérifiez votre connexion et réessayez.");
    }
    setLoading(false);
  };

  const canSubmit = !loading && (
    mode==="forgot" ? Boolean(email) :
    mode==="reset" ? password.length>=8 :
    Boolean(email&&password) && !(mode==="signup"&&accountType==="pro"&&!agency) && (mode!=="signup" || termsAccepted)
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

{mode==="signup"&&!giftProject&&(
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
          {mode==="signup"&&!giftProject&&<div style={{marginBottom:"10px"}}><label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Prénom et nom</label><input placeholder="Marie Laurence" value={name} onChange={e=>setName(e.target.value)} style={inputStyle}/></div>}
          {mode!=="reset"&&<div style={{marginBottom:"10px"}}><label htmlFor="auth-email" style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Email</label><input id="auth-email" autoComplete="email" required type="email" placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/></div>}
          {mode!=="forgot"&&<div style={{marginBottom:mode==="signup"?"10px":"8px"}}><label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}} htmlFor="auth-password">{mode==="reset"?"Nouveau mot de passe":"Mot de passe"}</label><input id="auth-password" required autoComplete={mode==="login"?"current-password":"new-password"} minLength={mode==="login"?undefined:8} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} style={inputStyle}/></div>}
          {mode==="login"&&<div style={{textAlign:"right",marginBottom:"16px"}}><button type="button" onClick={()=>{setMode("forgot");setError("");setSuccess("");}} style={{background:"none",border:"none",padding:0,color:C.terra,fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:F}}>Mot de passe oublié ?</button></div>}
          {mode==="forgot"&&<p style={{fontSize:"13px",lineHeight:1.5,color:C.sub,fontFamily:F,margin:"0 0 16px"}}>Saisissez votre adresse e-mail. Vous recevrez un lien sécurisé pour choisir un nouveau mot de passe.</p>}
          {mode==="reset"&&<p style={{fontSize:"13px",lineHeight:1.5,color:C.sub,fontFamily:F,margin:"0 0 16px"}}>Choisissez au moins 8 caractères.</p>}
          {mode==="signup"&&!giftProject&&(
            <div style={{marginBottom:"16px"}}>
              <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Téléphone (optionnel)</label>
              <div style={{display:"flex",gap:"6px"}}>
                <select value={phoneCode} onChange={e=>setPhoneCode(e.target.value)} style={{border:`1px solid ${C.sand}`,borderRadius:"8px",padding:"10px 8px",fontSize:"13px",color:C.dark,fontFamily:F,flexShrink:0,maxWidth:"155px"}}>
                  {PHONE_CODES.map((p,i)=><option key={i} value={p.code}>{noFlag(p.label)}</option>)}
                </select>
                <input type="tel" placeholder="6 12 34 56 78" value={phone} onChange={e=>setPhone(e.target.value)} style={{...inputStyle,flex:1,minWidth:0}}/>
              </div>
            </div>
          )}
          {mode==="signup"&&<>
            <label style={{display:"flex",gap:10,alignItems:"flex-start",fontFamily:F,fontSize:14,lineHeight:1.5,marginBottom:12}}>
              <input type="checkbox" required checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} style={{flexShrink:0,width:18,height:18,marginTop:2}}/>
              <span>J’accepte les <a href="/cgu.html" target="_blank" rel="noopener noreferrer" style={{color:C.terra}}>conditions d’utilisation</a>.</span>
            </label>
            <p style={{fontFamily:F,fontSize:13,lineHeight:1.5,color:C.sub,margin:"0 0 14px"}}>Vos informations servent à gérer votre compte, vos projets et vos annonces. Consultez la <a href="/confidentialites.html" target="_blank" rel="noopener noreferrer" style={{color:C.terra}}>politique de confidentialité</a> pour connaître vos droits et nous contacter.</p>
          </>}
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
  const [savedProperty,setSavedProperty]=useState(null);
  const [professionalActivity,setProfessionalActivity]=useState(existing?.professional_activity||"agence");
  const [photos, setPhotos] = useState(() => (Array.isArray(existing?.photos)?existing.photos:[]).map(url=>({url,apercu:url})));
  const [envoiPhoto, setEnvoiPhoto] = useState("");
  const [photoErr, setPhotoErr] = useState("");
  const [sent, setSent] = useState(false);
  const [authorityAccepted, setAuthorityAccepted] = useState(false);
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

  const landForm = ["terrain","agricole","ferme"].includes(form.nature);
  const sectionStyle = {border:`1px solid ${C.sand}`,borderRadius:12,padding:16,margin:"0 0 16px",minWidth:0,background:C.white};
  const legendStyle = {fontFamily:F,fontSize:16,fontWeight:700,color:C.forest,padding:"0 6px"};
  const renderFields = fields => <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>{fields.map(c=><div key={c.k} style={{gridColumn:c.t==="texte"?"1 / -1":undefined}}>
    <label htmlFor={`listing-${c.k}`} style={{display:"block",fontFamily:F,fontSize:13,fontWeight:600,marginBottom:5}}>{c.l}{c.requis?" *":""}</label>
    {c.t==="choix"?<select id={`listing-${c.k}`} value={form.details?.[c.k]??""} onChange={e=>setDetail(c.k,e.target.value)} style={champ("d_"+c.k)}><option value="">Choisir</option>{c.options.filter(o=>c.k!=="advertiser_role"||type==="pro"||o!=="Agence immobilière").map(o=><option key={o}>{o}</option>)}</select>:<input id={`listing-${c.k}`} type={c.t==="nombre"?"number":"text"} min={c.t==="nombre"?0:undefined} step={c.t==="nombre"?"any":undefined} placeholder={c.aide||""} value={form.details?.[c.k]??""} onChange={e=>setDetail(c.k,e.target.value)} style={champ("d_"+c.k)}/>}
  </div>)}</div>;

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
    champsDe(form.nature, form.transaction).filter(c=>c.t==="nombre").forEach(c=>{
      const value=form.details?.[c.k];
      if(value!==undefined && value!=="" && (!Number.isFinite(Number(value)) || Number(value)<0)) vides.push({k:"d_"+c.k,l:c.l+" (nombre positif ou nul)"});
    });
    if (!authorityAccepted) vides.push({k:"authority",l:"Confirmation de votre autorisation à publier"});
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
      details: {...Object.fromEntries(Object.entries(form.details||{}).filter(([k,v])=>[...champsDe(form.nature,form.transaction),...CHAMPS_SECTEUR].some(c=>c.k===k)&&String(v).trim()!=="")), publication_authorized:true, publication_authorized_at:new Date().toISOString(), publication_authorization_version:1},
      country:form.country, city:form.city, neighborhood:form.neighborhood,
      description:form.description, price_eur:parseInt(form.price_eur)||null,
      price:parseInt(form.price_xof)||null, surface:landForm?(form.nature==="terrain"?Number(form.details?.superficie)||null:(Number(form.details?.superficie_ha)*10000)||null):parseInt(form.surface)||null,
      rooms:parseInt(form.rooms)||null, bathrooms:parseInt(form.bathrooms)||null,
      tags:form.features||[], status:"en_attente", active:false, verified:false, advertiser_type:type,
      professional_activity:type==="pro"?professionalActivity:null, agency_name:type==="pro"?form.agency||null:null, photos:toutesPhotos, moderation_note:null, motif_rejet:null,
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
    window.sokileAnalytics?.event(existing ? "listing_update" : "listing_submit");
    setSavedProperty(r.data?.[0]||existing); setLoading(false); setSent(true); onSaved?.();
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
            <p style={{color:C.sub,fontSize:"14px",fontFamily:F}}>Votre annonce est enregistrée. Sa publication attend la validation de Sokilé.</p>{type!=="pro"&&savedProperty&&<IndividualPanel api={individualVerificationApi} user={user} property={savedProperty}/>}
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
<p style={{fontFamily:F,fontSize:14,color:C.sub,marginBottom:18}}>Complétez les rubriques ci-dessous. Les champs marqués * sont obligatoires.</p><fieldset style={sectionStyle}><legend style={legendStyle}>1. Votre projet</legend>              {/* Vendre ou louer */}
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
</fieldset>
{form.transaction&&form.nature&&<> <fieldset style={sectionStyle}><legend style={legendStyle}>2. Localisation du bien</legend>              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Pays *</label>
                <select value={form.country} onChange={e=>set("country",e.target.value)} style={{...champ("country")}}>
                  {COUNTRIES_ANNONCES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              {/* Ville + Quartier */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>{["terrain","agricole","ferme"].includes(form.nature)?"Ville / village / localité *":"Ville *"}</label>
                  <input placeholder="Ex: Abidjan" value={form.city||""} onChange={e=>set("city",e.target.value)} style={champ("city")}/>
                </div>
                <div>
                  <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Quartier</label>
                  <input placeholder="Ex: Cocody" value={form.neighborhood||""} onChange={e=>set("neighborhood",e.target.value)} style={inputStyle}/>
                </div>
              </div>
{renderFields(CHAMPS_SECTEUR)}</fieldset>
<fieldset style={sectionStyle}><legend style={legendStyle}>3. Description et caractéristiques</legend>              {/* Titre */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Titre de l'annonce *</label>
                <input placeholder={form.nature==="terrain"?"Ex : Parcelle de 500 m² à vendre":form.nature==="agricole"?"Ex : Terrain agricole de 5 hectares":form.nature==="ferme"?"Ex : Plantation de cacao de 10 hectares":"Ex : Villa 4 pièces avec piscine à Cocody"} value={form.title||""} onChange={e=>set("title",e.target.value)} style={champ("title")}/>
              </div>
{renderFields((NATURES[form.nature]?.champs||[]).filter(c=>!c.only||c.only===form.transaction))}{!landForm&&<>              {/* Surface générale */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Surface habitable ou utile (m²)</label>
                <input type="number" placeholder="Ex: 150" value={form.surface||""} onChange={e=>set("surface",e.target.value)} style={inputStyle}/>
              </div>
</>}              {/* Équipements */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"6px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Équipements</label>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {(landForm?["Clôture","Forage","Eau courante","Électricité","Gardien","Énergie solaire"]:["Piscine","Jardin","Parking","Terrasse","Gardien","Groupe électrogène","Eau courante","Climatisation","Réservoir d’eau","Forage","Énergie solaire","Internet","Balcon"]).map(eq=>{
                    const selected=(form.features||[]).includes(eq);
                    return <button key={eq} type="button" onClick={()=>set("features",selected?(form.features||[]).filter(f=>f!==eq):[...(form.features||[]),eq])} style={{background:selected?C.terra:C.cream,color:selected?C.white:C.dark,border:`1px solid ${selected?C.terra:C.sand}`,borderRadius:"5px",padding:"4px 9px",fontSize:"12px",fontWeight:selected?700:500,cursor:"pointer",fontFamily:F}}>{selected?"✓ ":""}{eq}</button>
                  })}
                </div>
              </div>
              {/* Description */}
              <div style={{marginBottom:"10px"}}>
                <label style={{fontSize:"13px",fontWeight:700,color:C.dark,display:"block",marginBottom:"4px",fontFamily:F,textTransform:"uppercase",letterSpacing:"0.05em"}}>Description du bien</label>
                <textarea placeholder={form.transaction==="location"?"Présentez les pièces, le mobilier, les équipements et les conditions de séjour. Décrivez ensuite le quartier et les accès.":"Présentez les espaces, l’état du bien, ses atouts et les éventuels travaux. Précisez le terrain et les documents disponibles."} value={form.description||""} onChange={e=>set("description",e.target.value)} rows={4} style={{...champ("description"),resize:"vertical"}}/>
              </div>
</fieldset>
<fieldset style={sectionStyle}><legend style={legendStyle}>{form.transaction==="location"?"4. Loyer et conditions de location":"4. Prix et conditions de vente"}</legend>              {/* Prix */}
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
{renderFields(form.transaction==="location"?CHAMPS_LOCATION.filter(c=>c.k!=="meuble"||!landForm):CHAMPS_VENTE)}</fieldset>
<fieldset style={sectionStyle}><legend style={legendStyle}>5. Vous et vos coordonnées</legend>{renderFields(champsDe(form.nature,form.transaction).filter(c=>c.k==="advertiser_role"))}              {type==="pro"&&(
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
</fieldset>
<fieldset style={sectionStyle}><legend style={legendStyle}>6. Photos et confirmation</legend>              <div style={{marginBottom:"14px"}}>
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
              {type==="pro"&&<><label style={{display:"block",fontFamily:F,fontSize:14,fontWeight:700}}>Votre activité pour cette annonce<select style={inputStyle} value={professionalActivity} onChange={e=>setProfessionalActivity(e.target.value)}><option value="agence">Agence / agent immobilier</option><option value="courtier">Courtier immobilier</option><option value="promoteur">Promoteur immobilier</option></select></label><VerificationPanel api={proVerificationApi} user={user} country={form.country} activity={professionalActivity} businessName={form.agency}/></>}
            <label style={{display:"flex",gap:10,alignItems:"flex-start",padding:12,marginBottom:12,borderRadius:8,border:`1px solid ${manquants.includes("authority")?"#C0392B":C.sand}`,fontFamily:F,fontSize:14,lineHeight:1.5}}>
                <input type="checkbox" checked={authorityAccepted} onChange={e=>setAuthorityAccepted(e.target.checked)} style={{marginTop:4,flexShrink:0}}/>
                <span>Je confirme être propriétaire de ce bien ou autorisé à le proposer à la vente ou à la location. *</span>
              </label>
</fieldset>
</>}               <BandeauErreur texte={erreur} onRetry={erreur&&!manquants.length?handleSubmit:null}/>
              <button onClick={handleSubmit} disabled={loading||!form.transaction||!form.nature} style={{width:"100%",background:loading?"#bbb":C.terra,color:C.white,border:"none",borderRadius:"9px",padding:"15px",fontWeight:700,fontSize:"16px",cursor:loading?"default":"pointer",fontFamily:F}}>
                {loading?(envoiPhoto||"Envoi en cours…"):(existing?"Envoyer mes modifications":type==="particulier"?"Enregistrer et ajouter mes justificatifs":"Publier mon annonce")}
              </button>
              <p style={{margin:"10px 0 0",fontSize:"12.5px",color:C.sub,fontFamily:F,textAlign:"center",lineHeight:1.5}}>
                Après enregistrement, ajoutez les justificatifs privés de votre lien avec le bien. Sokilé examine le dossier et l’annonce avant publication. Ce contrôle ne garantit pas la propriété. Les champs marqués * sont obligatoires.
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
    label:"Terrains et parcelles", famille:"Terrain", icone:"📐",
    resume:(d)=>[d.superficie&&`${d.superficie} m²`, d.statut_juridique, d.viabilise&&`viabilisé : ${d.viabilise}`],
    champs:[
      {k:"superficie",       l:"Superficie (m²)",     t:"nombre", requis:true},
      {k:"statut_juridique", l:"Document ou situation foncière", t:"texte", requis:true, aide:"Nom utilisé dans votre pays, ou non titré / à vérifier"},
      {k:"lotissement",     l:"Terrain loti", t:"choix", options:["Oui","Non","À vérifier"]},
      {k:"etat_terrain", l:"État du terrain", t:"choix", options:["Terrain nu","Avec construction","À préciser"]},
      {k:"viabilise",        l:"Eau et électricité",           t:"choix", options:["Eau et électricité","Eau seulement","Électricité seulement","Non viabilisé"]},
      {k:"cloture",          l:"Clôturé",             t:"choix", options:["Oui","Partiellement","Non"]},
      {k:"acces",            l:"Accès",               t:"choix", options:["Route bitumée","Piste carrossable","Difficile"]},
      {k:"constructible",    l:"Constructible",       t:"choix", options:OUI_NON},
      {k:"bornage",          l:"Bornage effectué",    t:"choix", options:OUI_NON},
    ],
  },
  agricole: {
    label:"Terrains agricoles", famille:"Terrain", icone:"🌾",
    resume:(d)=>[d.superficie_ha&&`${d.superficie_ha} ha`, d.eau, d.cultures],
    champs:[
      {k:"superficie_ha",    l:"Superficie (hectares)", t:"nombre", requis:true},
      {k:"statut_juridique", l:"Document ou situation foncière", t:"texte", requis:true, aide:"Nom utilisé dans votre pays, ou non titré / à vérifier"},
      {k:"eau",              l:"Accès à l'eau",         t:"choix", options:["Forage","Puits","Rivière ou marigot","Réseau","Aucun"]},
      {k:"cultures",         l:"Cultures en place",     t:"texte", aide:"Ex : manguiers, arachide, maraîchage"},
      {k:"batiments",        l:"Bâtiments",             t:"texte", aide:"Ex : hangar, logement de gardien"},
      {k:"cloture",          l:"Clôturé",               t:"choix", options:["Oui","Partiellement","Non"]},
      {k:"acces",            l:"Accès",                 t:"choix", options:["Route bitumée","Piste carrossable","Difficile"]},
    ],
  },
  ferme: {
    label:"Fermes et plantations", famille:"Terrain", icone:"🌱",
    resume:(d)=>[d.superficie_ha&&`${d.superficie_ha} ha`, d.type_exploitation, d.cultures],
    champs:[
      {k:"superficie_ha", l:"Superficie (hectares)", t:"nombre", requis:true},
      {k:"type_exploitation", l:"Type de bien agricole", t:"choix", requis:true, options:["Ferme","Plantation","Verger","Domaine agricole","Autre exploitation agricole"]},
      {k:"statut_juridique", l:"Document ou situation foncière", t:"texte", requis:true, aide:"Nom utilisé dans votre pays, ou non titré / à vérifier"},
      {k:"activite_agricole", l:"Activité", t:"choix", options:["En activité","À l’arrêt","En cours d’aménagement"]},
      {k:"cultures", l:"Cultures en place", t:"texte", aide:"Ex : cacao, café, palmier à huile, manguiers, maraîchage"},
      {k:"elevage", l:"Élevage", t:"texte", aide:"Ex : volailles, bovins, pisciculture"},
      {k:"eau", l:"Accès à l'eau", t:"choix", options:["Forage","Puits","Rivière ou marigot","Réseau","Aucun"]},
      {k:"batiments", l:"Bâtiments", t:"texte", aide:"Ex : hangar, poulailler, logement de gardien"},
      {k:"equipements_agricoles", l:"Équipements inclus", t:"texte", aide:"Ex : irrigation, pompe, matériel agricole"},
      {k:"cloture", l:"Clôturé", t:"choix", options:["Oui","Partiellement","Non"]},
      {k:"acces", l:"Accès", t:"choix", options:["Route bitumée","Piste carrossable","Difficile"]},
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
  {k:"charges_incluses", l:"Charges comprises dans le loyer", t:"choix", options:["Oui","Non","En partie"]},
  {k:"charges_loc",  l:"Charges mensuelles séparées (FCFA)", t:"nombre"},
  {k:"avance", l:"Avance de loyer (nombre de mois)", t:"nombre"},
  {k:"frais_agence", l:"Frais d’agence (FCFA)", t:"nombre"},
  {k:"conditions_location", l:"Autres conditions de location", t:"texte", aide:"Durée minimale, charges incluses, conditions…"},
  {k:"caution",      l:"Caution (nombre de mois)", t:"nombre"},
  {k:"duree_bail",   l:"Durée du bail",         t:"choix", options:["Courte durée","1 an","2 ans","3 ans et plus","Négociable"]},
  {k:"disponibilite",l:"Disponible à partir du", t:"texte", aide:"Ex : immédiatement, ou 1er décembre"},
];

const CHAMPS_VENTE = [
  {k:"negociable", l:"Prix négociable", t:"choix", options:["Oui","Non"]},
  {k:"occupation_vente", l:"Occupation du bien", t:"choix", options:["Libre","Occupé","Loué"]},
  {k:"documents_vente", l:"Documents disponibles (déclarés par le vendeur)", t:"texte", aide:"Nom exact des documents dans votre pays, sans numéro personnel"},
  {k:"frais_vente", l:"Frais à prévoir", t:"texte", aide:"Précisez les frais connus et qui les prend en charge"},
];
const CHAMPS_SECTEUR = [
  {k:"repere", l:"Repère proche", t:"texte", aide:"Un marché, une école, un axe principal… sans adresse exacte"},
  {k:"environnement", l:"Quartier et accès", t:"texte", aide:"Accès routier, commerces, transports, environnement…"},
];
const FAMILLES = ["Habitation","Terrain","Professionnel"];
const naturesDeFamille = (fam) => Object.entries(NATURES).filter(([,v])=>v.famille===fam);

// Les champs à afficher pour une nature et une transaction données
function champsDe(nature, transaction) {
  const n = NATURES[nature];
  if (!n) return [];
  const propres = [{k:"advertiser_role",l:"Vous publiez cette annonce en tant que",t:"choix",requis:true,options:["Propriétaire","Agence immobilière","Représentant du propriétaire"]}, ...n.champs.filter(c => !c.only || c.only === transaction)];
  return transaction === "location" ? [...propres, ...CHAMPS_LOCATION.filter(c=>c.k!=="meuble"||!["terrain","agricole","ferme"].includes(nature))] : [...propres, ...CHAMPS_VENTE];
}

const BULK_DETAIL_FIELDS=[...new Map([{k:"advertiser_role",l:"Vous publiez cette annonce en tant que",t:"choix",requis:true,options:["Propriétaire","Agence immobilière","Représentant du propriétaire"]},...Object.values(NATURES).flatMap(n=>n.champs),...CHAMPS_LOCATION,...CHAMPS_VENTE,...CHAMPS_SECTEUR].map(c=>[c.k,c])).values()];
const BULK_SCHEMA={countries:COUNTRIES_ANNONCES.map(c=>c.name),natures:Object.keys(NATURES),detailFields:BULK_DETAIL_FIELDS,columns:[...CORE_COLUMNS,...BULK_DETAIL_FIELDS.map(c=>c.k)],fields:(n,t)=>[...champsDe(n,t),...CHAMPS_SECTEUR],labels:{reference:"Référence agence",titre:"Titre",pays:"Pays",ville:"Ville",quartier:"Quartier",prix_fcfa:"Prix / loyer mensuel (FCFA)",surface_m2:"Surface habitable ou utile (m²)",description:"Description",equipements:"Équipements séparés par |",nature:"Nature",transaction:"Transaction"}};

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
    if (v === undefined || v === null || String(v).trim() === "") return;
    const est = c.t === "nombre" && !isNaN(Number(v));
    const unite = /\(m²\)/.test(c.l) ? " m²" : /hectares/.test(c.l) ? " ha" : /FCFA/.test(c.l) ? " FCFA" : "";
    out.push([c.l.replace(/\s*\([^)]*\)\s*$/, ""), est ? new Intl.NumberFormat("fr-FR").format(Number(v)) + unite : String(v)]);
  });
  if (out.length === 1 && p.rooms) out.push(["Pièces", String(p.rooms)]);
  return out;
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
  if(window.location.pathname.replace(/\/$/,"")==="/recherche") return {nom:"recherche"};
  if(window.location.pathname.replace(/\/$/,"")==="/cadeau") return {nom:"cadeau"};
  if(window.location.pathname.replace(/\/$/,"")==="/verification-professionnels") return {nom:"verification"};
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

  const valide = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim());

  const envoyer = async () => {
    if (!valide || !documentReady || loading) return;
    setErreur(""); setLoading(true);
    const r = await ecrire("leads", {
      name: prenom || "—", email, status: "telechargement",
      message: `TÉLÉCHARGEMENT | ${doc.titre} | consentement newsletter : ${consent ? "oui" : "non"} | choix recueilli le ${new Date().toISOString()} | formulaire 2026-09-25`,
    }).catch(e=>({ok:false,statut:0,motif:String(e)}));
    setLoading(false);
    if (!r.ok) { setErreur(messageErreur(r)); return; }
    window.sokileAnalytics?.event("document_request");
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
          Indiquez votre adresse pour accéder au document. Elle sert à traiter votre demande. L’abonnement aux publications est facultatif. <a href="/confidentialites.html" target="_blank" rel="noopener noreferrer" style={{color:C.terra}}>Politique de confidentialité</a>
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
            Je souhaite aussi recevoir les prochaines publications de Sokilé par email (facultatif). Je peux retirer mon consentement à tout moment en écrivant à {CONTACT_MAIL}. <a href="/confidentialites.html" target="_blank" rel="noopener noreferrer" style={{color:C.terra}}>Politique de confidentialité</a>
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
const programApi={load:lire,rpc:alertRpc,uploadPhotos:envoyerPhotos,uploadDocument:uploadProgramDocument,verification:proVerificationApi};

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
  {id:"verifications",label:"Vérifications pro"},
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
      {rub==="verifications"&&<VerificationAdmin api={proVerificationApi} user={user}/>}
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
    <p id={`${id}-aide`} style={{fontFamily:F,fontSize:13,color:C.sub,lineHeight:1.6,margin:"0 0 9px"}}>Pour un retour sans publication ou une demande de précisions, expliquez votre décision et les corrections possibles. Ce texte sera visible dans le compte et repris dans l'email.</p>
    <textarea id={id} aria-describedby={`${id}-aide`} value={value} disabled={busy} maxLength={MAX_RESPONSE_LENGTH} onChange={e=>{onChange(e.target.value);setApercu(false);}} style={{...inp,minHeight:130,resize:"vertical",marginBottom:5}} placeholder="Rédigez ici votre réponse après avoir examiné ce dossier…"/>
    <div style={{fontFamily:F,fontSize:12,color:C.sub,marginBottom:12}}>30 caractères minimum pour justifier la décision · {Array.from(value.trim()).length} / {MAX_RESPONSE_LENGTH}</div>
    {(error||erreurApercu)&&<p role="alert" style={{background:"#FDE8E8",color:"#9B2C2C",padding:12,borderRadius:9,fontFamily:F,fontSize:14,lineHeight:1.6}}>{error||erreurApercu}</p>}
    {!message&&<button type="button" disabled={busy} onClick={()=>setApercu(true)} style={{background:"transparent",color:"#A93226",border:"1px solid #A93226",borderRadius:9,padding:12,fontWeight:700,cursor:busy?"wait":"pointer",fontFamily:F,width:"100%"}}>Préparer le retour sans publication</button>}
    {message&&<section aria-label="Aperçu du retour sans publication" style={{background:C.cream,border:`1px solid ${C.sand}`,padding:15,borderRadius:10}}>
      <div style={{fontFamily:F,fontSize:14,fontWeight:700,color:C.dark}}>Relisez la réponse avant de confirmer</div>
      <div style={{fontFamily:F,fontSize:12,color:C.sub,margin:"8px 0",wordBreak:"break-word"}}>À : {message.to[0]}<br/>{message.subject}</div>
      <div style={{fontFamily:F,fontSize:14,lineHeight:1.7,color:C.dark,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{message.text}</div>
      <button type="button" disabled={busy} onClick={onRefuse} style={{marginTop:14,width:"100%",background:"#A93226",color:C.white,border:0,borderRadius:9,padding:13,fontWeight:700,cursor:busy?"wait":"pointer",fontFamily:F}}>{busy?"Enregistrement…":"Confirmer et transmettre la réponse"}</button>
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

  const libelles={en_attente:"À étudier",en_cours:"En discussion",acceptee:"Acceptées",refusee:"Non retenues",modifications_demandees:"À compléter"};
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
        <div style={{fontSize:13.5,color:C.terra,fontWeight:700,marginTop:4}}>{d.format}{d.objective?` · …37021 tokens truncated… style={{background:"transparent",color:C.white,border:"1px solid rgba(255,255,255,0.45)",borderRadius:"8px",padding:"9px 13px",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Connexion</button>
            )}
          </div>
        </div>
      </header>

      {route.nom==="accueil"&&tab!=="admin"&&<BandeauActualites onOpen={()=>{setSousOnglet("actu");switchTab("guides");}}/>}

      {/* Keep fixed dialogs anchored to the viewport: a transformed ancestor traps them inside main. */}
      <main style={{flex:"1 0 auto",width:"100%",boxSizing:"border-box",maxWidth:"1200px",margin:"0 auto",padding:"0 20px 8px",opacity:animIn?1:0,transition:"opacity 0.2s ease"}}>

        {route.nom==="recherche"&&<SearchRequestPage user={apercu?null:user} rpc={alertRpc} onLogin={()=>setShowLogin(true)} onSaved={()=>setAlertsRefresh(x=>x+1)}/>}
        {route.nom==="cadeau"&&<GiftPage user={apercu?null:user} api={giftsApi} onSignup={answers=>{setGiftSignup(answers);setShowLogin("signup")}} onFindPro={country=>openAnnuaire("Notaire",country)}/>}
        {route.nom==="verification"&&<VerificationPage/>}
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
            <TrustCommitment/>
            <SearchRequestBanner/>
            <GiftBanner/>

            {adPreview==="reach"&&<AdPreviewSlot placement="banner"/>}

            <HomeDiscovery
              onBrowse={(transaction,nature)=>{resetFilters();setFilterTransaction(transaction);setFilterNature(nature);switchTab("biens");}}
              onPrograms={openPrograms}
              onProfessionals={()=>openAnnuaire()}
              onGuides={()=>{setSousOnglet("guides");switchTab("guides");}}
            />

            {/* Sélection */}
            {ALL_PROPS.length>0&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"14px"}}>
              <h2 style={{fontFamily:FT,fontSize:"22px",fontWeight:500,color:C.cacao,margin:0}}>Annonces récentes</h2>
              <span onClick={()=>switchTab("biens")} style={{fontSize:"13px",color:C.terra,fontWeight:700,cursor:"pointer",fontFamily:F}}>Voir tout →</span>
            </div>
            <div className="sok-grid" style={{marginBottom:"28px"}}>
              {ALL_PROPS.slice(0,4).map(p=><PropertyCard key={p.id} p={p} onClick={ouvrirAnnonce} onSave={handleSave} saved={savedProps.some(s=>s.id===p.id)}/>)}
            </div>
            </>}

            <DemoListings onPublish={()=>{setPartnerType(vu?.account_type==="pro"?"pro":"particulier");vu?setShowPartner(true):setShowLogin(true);}}/>

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
                  <a className="sr-button" href="/recherche">Décrire ma recherche</a>
                  <p style={{fontFamily:F,fontSize:14}}>Avec votre accord, les professionnels vérifiés du pays pourront consulter vos critères.</p>
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
              <div style={{fontFamily:FT,fontSize:"21px",fontWeight:500,color:C.white,marginBottom:"6px"}}>Un annuaire où la confiance se construit avant publication</div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,0.75)",fontFamily:F,lineHeight:1.6,maxWidth:"620px"}}>Trouvez un notaire, un géomètre, un architecte ou un professionnel du bâtiment dans le pays de votre projet, puis contactez-le directement. Chaque fiche est examinée avant référencement. Ce contrôle ne certifie ni les compétences, ni la qualité des prestations.</div>
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
                {programPublisher&&<VerificationWorkspace api={proVerificationApi} user={vu}/>}
                {programPublisher?<ProfessionalActions
                  onListing={()=>{setPartnerType("pro");setShowPartner(true);}}
                  onImport={()=>setShowBulkImport(true)}
                  onProgram={newProgram}
                  onDirectory={()=>setShowServiceForm(true)}
                  onAdvertising={()=>setShowPub(true)}
                />:<button onClick={()=>{setPartnerType("particulier");setShowPartner(true);}} style={{width:"100%",marginBottom:16,background:C.terra,border:"none",color:C.white,borderRadius:8,padding:13,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:F}}>Publier une annonce</button>}
                <div style={{display:"grid",gap:"7px"}}>
                    <MesAnnonces user={vu} refreshKey={myPropsRefresh} onEdit={p=>setEditingProp(p)}/>
                    {programPublisher&&<ProfessionalSearchRequests user={vu} rpc={alertRpc} load={lire} refreshKey={myPropsRefresh} onListing={()=>{setPartnerType("pro");setShowPartner(true);}}/>}
                    <MesDemandesPro user={vu} showEmpty={programPublisher} refreshKey={proRefresh} onEditService={setEditingService} onEditPub={setEditingPub}/>
                    {programPublisher&&<ProgramManager api={programApi} user={vu} onNew={newProgram} onEdit={editProgram} refreshKey={programRefresh}/>}
                    <PersonalAccountTools professional={programPublisher}>
                    <GiftBanner account/>
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
                                <div style={{fontSize:"12px",color:C.sub,fontFamily:F}}>{p.city} · {fmtEUR(p.price_eur)}{transactionDe(p)==="location"?" / mois":""}</div>
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
      {showLogin&&<LoginModal giftProject={giftSignup} initialMode={showLogin==="signup"?"signup":"login"} onClose={()=>{setShowLogin(false);setGiftSignup(null)}} onLogin={u=>setUser(u)}/>}
      {showAlert&&<AlertModal onClose={()=>setShowAlert(false)} filters={{country:filterCountry,region:filterRegion,transaction:filterTransaction,nature:filterNature,natureLabel:filterNature!=="Tous"?(NATURES[filterNature]?.label||filterNature):"",search,priceMin:filterPriceMin,priceMax:filterPriceMax,surfaceMin:filterSurfaceMin,surfaceMax:filterSurfaceMax,rooms:filterRooms,equipements:filterEquipements,verified:false}} user={vu} rpc={alertRpc} onCreated={()=>setAlertsRefresh(v=>v+1)}/>}
      {showBulkImport&&programPublisher&&<BulkImport user={vu} schema={BULK_SCHEMA} api={{read:lire,write:ecrire,upload:envoyerPhotos,verification:proVerificationApi}} onClose={()=>setShowBulkImport(false)} onSaved={()=>setMyPropsRefresh(x=>x+1)}/>}
      {showPartner&&<PartnerModal onClose={()=>setShowPartner(false)} user={vu} defaultType={partnerType} onSaved={()=>setMyPropsRefresh(x=>x+1)}/>} 
      {editingProp&&<PartnerModal onClose={()=>setEditingProp(null)} user={vu} existing={editingProp} onSaved={()=>setMyPropsRefresh(x=>x+1)}/>} 
      {(showServiceForm||editingService)&&vu&&<ServiceFormModal onClose={()=>{setShowServiceForm(false);setEditingService(null);}} user={vu} existing={editingService} onSaved={()=>setProRefresh(x=>x+1)}/>}
      {(showPub||editingPub)&&<PubFormModal onClose={()=>{setShowPub(false);setEditingPub(null);}} user={vu} existing={editingPub} onSaved={()=>setProRefresh(x=>x+1)}/>}
      {programEditor&&programPublisher&&<ProgramEditor api={programApi} user={vu} existing={programEditor} onClose={()=>setProgramEditor(null)} onSaved={()=>setProgramRefresh(x=>x+1)}/>}
    </div>
  );
}
