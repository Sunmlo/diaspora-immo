export const countries = [
  "Bénin",
  "Burkina Faso",
  "Cameroun",
  "Centrafrique",
  "Congo",
  "Côte d’Ivoire",
  "Gabon",
  "Mali",
  "Niger",
  "Sénégal",
  "Tchad",
  "Togo"
];
export const projects = [
  {
    "id": "buy_house",
    "mode": "buy",
    "kind": "house",
    "title": "Acheter une maison",
    "sub": "Une maison et son extérieur",
    "icon": "house",
    "tag": "Achat · Maison"
  },
  {
    "id": "buy_flat",
    "mode": "buy",
    "kind": "flat",
    "title": "Acheter un appartement",
    "sub": "Un intérieur, un immeuble, un quartier",
    "icon": "building-2",
    "tag": "Achat · Appartement"
  },
  {
    "id": "land",
    "mode": "land",
    "kind": "land",
    "title": "Acheter un terrain pour construire",
    "sub": "Une parcelle pour mon futur projet",
    "icon": "sprout",
    "tag": "Terrain pour construire"
  },
  {
    "id": "rent_flat",
    "mode": "rent",
    "kind": "flat",
    "title": "Louer un appartement",
    "sub": "Mon prochain logement en immeuble",
    "icon": "building-2",
    "tag": "Location · Appartement"
  },
  {
    "id": "rent_house",
    "mode": "rent",
    "kind": "house",
    "title": "Louer une maison",
    "sub": "Une maison pour mon quotidien",
    "icon": "house",
    "tag": "Location · Maison"
  }
];
export const moods = [
  {
    "id": "natural",
    "name": "Nature & douceur",
    "desc": "Végétation · matières naturelles",
    "title": "Un refuge au naturel",
    "colors": [
      "#a9b18f",
      "#b89b72",
      "#e9dfc7"
    ],
    "materials": [
      "Vert végétal",
      "Bois naturel",
      "Lin clair"
    ],
    "text": "Des matières naturelles, des tons doux et de la végétation pour imaginer un lieu accueillant."
  },
  {
    "id": "modern",
    "name": "Lignes contemporaines",
    "desc": "Volumes nets · tons minéraux",
    "title": "L’espace, tout simplement",
    "colors": [
      "#c0b3a0",
      "#6e7770",
      "#dacbb3"
    ],
    "materials": [
      "Pierre douce",
      "Gris profond",
      "Chêne clair"
    ],
    "text": "Des lignes sobres, des volumes lisibles et des matières contrastées pour imaginer un intérieur ouvert."
  },
  {
    "id": "warm",
    "name": "Chaleur & caractère",
    "desc": "Terre cuite · bois · textures",
    "title": "Un refuge chaleureux",
    "colors": [
      "#b36b43",
      "#ac8a59",
      "#6e7650"
    ],
    "materials": [
      "Terre cuite",
      "Bois naturel",
      "Vert végétal"
    ],
    "text": "De la terre cuite, du bois et des fibres naturelles : une ambiance chaleureuse à explorer pour votre chez-vous."
  },
  {
    "id": "light",
    "name": "Clair & apaisant",
    "desc": "Lumière · tons sable · douceur",
    "title": "La lumière comme fil conducteur",
    "colors": [
      "#eee5d2",
      "#c4b593",
      "#a4b6b8"
    ],
    "materials": [
      "Écru",
      "Sable",
      "Bleu brume"
    ],
    "text": "Des tons clairs, des textiles légers et une lumière douce pour imaginer un quotidien paisible."
  }
];
export const needs = {
  "buy": [
    {
      "id": "distance",
      "label": "Acheter depuis l’étranger",
      "sub": "Organiser mon projet à distance",
      "guides": [
        "acheter-distance",
        "eviter-fausses-annonces"
      ],
      "why": "Pour organiser les vérifications à distance et repérer les signaux d’alerte."
    },
    {
      "id": "security",
      "label": "Éviter les mauvaises surprises",
      "sub": "Mieux vérifier les annonces et les interlocuteurs",
      "guides": [
        "eviter-fausses-annonces"
      ],
      "why": "Pour examiner une annonce et savoir quelles vérifications engager."
    },
    {
      "id": "currency",
      "label": "Comprendre les prix en francs CFA",
      "sub": "Distinguer XOF, XAF et frais de transfert",
      "guides": [
        "xof-xaf",
        "eviter-fausses-annonces"
      ],
      "why": "Pour comprendre la monnaie affichée et garder les bons réflexes avant un paiement."
    }
  ],
  "land": [
    {
      "id": "terrain",
      "label": "Vérifier le terrain avant d’acheter",
      "sub": "Parcelle, documents et intervenants",
      "guides": [
        "verifier-terrain",
        "choisir-geometre"
      ],
      "why": "Pour préparer les contrôles sur la parcelle et choisir un géomètre."
    },
    {
      "id": "build",
      "label": "Préparer mon budget de construction",
      "sub": "Repérer les dépenses et comparer les devis",
      "guides": [
        "budget-construction",
        "verifier-terrain"
      ],
      "why": "Pour structurer le budget et vérifier que le terrain convient au projet."
    },
    {
      "id": "distance",
      "label": "Acheter depuis l’étranger",
      "sub": "Organiser les contrôles sans être sur place",
      "guides": [
        "acheter-distance",
        "verifier-terrain"
      ],
      "why": "Pour organiser les intervenants à distance et vérifier la parcelle."
    }
  ],
  "rent": [
    {
      "id": "security",
      "label": "Repérer les annonces à risque",
      "sub": "Éviter les pièges avant de réserver",
      "guides": [
        "eviter-fausses-annonces"
      ],
      "why": "Pour contrôler une annonce et éviter les paiements sous pression."
    },
    {
      "id": "visit",
      "label": "Préparer mes premières vérifications",
      "sub": "Photos, visite et identité de l’interlocuteur",
      "guides": [
        "eviter-fausses-annonces"
      ],
      "why": "Ce guide détaille les contrôles sur les photos, la localisation et l’interlocuteur."
    },
    {
      "id": "currency",
      "label": "Comprendre les prix en francs CFA",
      "sub": "Mieux lire un loyer en XOF ou en XAF",
      "guides": [
        "xof-xaf",
        "eviter-fausses-annonces"
      ],
      "why": "Pour identifier la monnaie du loyer et vérifier une annonce avant de vous engager."
    }
  ]
};
export const pages = {
  "acheter-distance": 3,
  "eviter-fausses-annonces": 2,
  "verifier-terrain": 3,
  "choisir-geometre": 2,
  "budget-construction": 2,
  "xof-xaf": 2
};