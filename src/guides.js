const textOf = (value) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(textOf).join(" ");
  return "";
};

export const guideReadingTime = (guide) => {
  const words = textOf({ intro: guide.intro, sections: guide.sections, checklist: guide.checklist })
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(2, Math.ceil(words / 190))} min`;
};

export const GUIDES = [
  {
    id: "verifier-terrain",
    category: "Acheter",
    country: "Afrique francophone",
    icon: "📄",
    title: "Acheter un terrain : les vérifications avant de signer",
    excerpt: "Une méthode complète pour contrôler le vendeur, la parcelle, les documents et les paiements avant tout engagement.",
    updatedAt: "21 septembre 2026",
    intro: "L'achat d'un terrain ne doit jamais reposer uniquement sur une visite, une photo de document ou la recommandation d'un proche. Les appellations administratives, les procédures et les autorités compétentes varient selon le pays et parfois selon la commune. L'objectif de ce guide est donc de vous donner une méthode de travail : identifier les personnes, vérifier séparément le terrain et les droits invoqués, conserver des preuves, puis faire formaliser la transaction par les professionnels compétents.",
    sections: [
      {
        title: "Identifier le vendeur et son pouvoir de vendre",
        text: "Demandez l'identité complète du vendeur et comparez-la avec les documents présentés. S'il agit au nom d'une famille, d'une société, d'une succession ou d'un propriétaire absent, exigez le document qui l'autorise à signer. Une simple affirmation orale, même formulée devant plusieurs témoins, ne remplace pas une procuration ou une décision valable. Pour une succession, identifiez les héritiers et vérifiez qui peut engager l'ensemble. Pour une société, contrôlez l'existence de la structure et le pouvoir de son représentant. Ne remettez pas vos originaux et conservez une copie datée de chaque pièce examinée.",
        bullets: ["Pièce d'identité du vendeur", "Justificatif de propriété ou de droits", "Procuration ou pouvoir de représentation", "Coordonnées permettant une vérification indépendante"],
      },
      {
        title: "Localiser précisément la parcelle",
        text: "Une parcelle doit être identifiée autrement que par une description approximative du quartier. Demandez le plan, les références cadastrales ou administratives disponibles, les coordonnées et les limites annoncées. Faites-vous accompagner par un géomètre ou un professionnel habilité selon le pays. Comparez la superficie du document avec la réalité du terrain et vérifiez l'accès : une parcelle peut exister tout en étant enclavée ou concernée par un passage, une réserve, un projet de voirie ou une occupation. Rencontrez les voisins sans leur confier la décision : leurs informations sont utiles pour détecter un conflit, mais elles doivent être recoupées.",
        bullets: ["Limites et superficie", "Accès légal et praticable", "Occupation actuelle", "Servitudes, voirie ou projet public connu"],
      },
      {
        title: "Contrôler les documents auprès des bonnes autorités",
        text: "Ne vérifiez pas un document uniquement auprès de la personne qui vous l'a remis. Faites confirmer son authenticité, sa portée et son actualité auprès du service compétent et d'un professionnel indépendant. Un document authentique peut être ancien, incomplet, déjà utilisé dans une autre vente ou ne pas suffire à transférer la propriété. Demandez aussi si des taxes, redevances, hypothèques, oppositions ou litiges sont attachés au bien. Les titres et procédures diffèrent d'un pays à l'autre : Sokilé ne présente donc jamais une liste universelle comme suffisante.",
      },
      {
        title: "Vérifier la situation physique et l'usage possible",
        text: "Visitez le terrain à plusieurs moments si possible. Observez les accès en saison des pluies, les raccordements, le relief, les eaux, le voisinage et les constructions proches. Si vous prévoyez de construire, renseignez-vous sur les règles d'urbanisme, les retraits, la hauteur, la destination de la zone et les autorisations nécessaires. Un terrain juridiquement transmissible peut ne pas convenir à votre projet ou nécessiter des travaux importants. Demandez des estimations séparées pour le bornage, la viabilisation, les études et les raccordements.",
      },
      {
        title: "Organiser les paiements et la signature",
        text: "Évitez les paiements en espèces sans reçu et les versements importants avant la fin des contrôles. Chaque somme doit correspondre à une étape clairement écrite : réservation, acompte, solde, frais professionnels ou taxes. Le document doit préciser les conditions de restitution lorsque la vente ne peut pas aboutir. Utilisez un moyen traçable et vérifiez l'identité du titulaire du compte. Faites relire le projet d'acte avant la signature et ne signez jamais une page incomplète ou différente de celle qui vous a été présentée.",
      },
    ],
    checklist: ["Identité et pouvoir du vendeur vérifiés", "Parcelle localisée par un professionnel", "Documents confirmés auprès d'une source indépendante", "Situation d'urbanisme et accès contrôlés", "Prix, frais et calendrier écrits", "Paiements traçables et reçus conservés"],
  },
  {
    id: "choisir-geometre",
    category: "Prestataires",
    country: "Tous pays",
    icon: "📐",
    title: "Comment choisir un géomètre pour votre projet ?",
    excerpt: "Compétences, mission, livrables et prix : les questions à poser avant une délimitation, un bornage ou une construction.",
    updatedAt: "21 septembre 2026",
    intro: "Le mot géomètre peut recouvrir des niveaux de qualification et des missions différentes selon le pays. Avant de comparer les prix, commencez donc par définir ce que vous attendez : retrouver une parcelle, contrôler une superficie, matérialiser des limites, produire un plan ou intervenir dans une procédure officielle. Un devis peu cher n'est pas avantageux si le document livré n'est pas utilisable pour votre démarche.",
    sections: [
      {title:"Vérifier son identité professionnelle",text:"Demandez le nom complet du professionnel ou de la société, son adresse, sa zone d'intervention et, lorsqu'il existe, son numéro d'inscription à l'ordre ou au registre compétent. Vérifiez cette information auprès de l'organisme concerné. Demandez des exemples de missions comparables sans exiger les documents confidentiels d'autres clients. Un professionnel sérieux doit pouvoir expliquer les limites de sa mission et vous dire lorsqu'un acte nécessite l'intervention d'une autre autorité."},
      {title:"Décrire la mission par écrit",text:"Indiquez la localisation, la superficie annoncée, les références disponibles et le but de l'intervention. Précisez s'il faut rechercher les limites, poser des bornes, établir un plan, effectuer un relevé topographique ou assister à une procédure contradictoire. Le devis doit mentionner les déplacements, le nombre de visites, les démarches incluses, les délais et les livrables. Ajoutez la personne qui sera présente sur place si vous êtes à distance."},
      {title:"Comprendre les livrables",text:"Demandez sous quel format le plan sera remis, quelles mentions il comportera et s'il sera signé ou accompagné d'un procès-verbal. Vérifiez que le livrable correspond à l'usage prévu : préparation d'un chantier, dossier administratif, clarification entre voisins ou transaction. Une image envoyée par messagerie ne remplace pas nécessairement un document exploitable. Prévoyez la remise des fichiers numériques et des originaux lorsqu'ils existent."},
      {title:"Comparer des propositions équivalentes",text:"Envoyez le même descriptif à plusieurs professionnels afin de comparer des prestations identiques. Un écart peut venir du déplacement, du matériel, des recherches administratives, du nombre de points à relever ou de la complexité du terrain. Demandez ce qui déclenchera un supplément. Méfiez-vous à la fois d'un prix anormalement bas et d'un devis global qui ne détaille aucun résultat attendu."},
      {title:"Suivre la mission à distance",text:"Convenez avant l'intervention des preuves à recevoir : rendez-vous daté, photos géolocalisées lorsque cela est possible, courte vidéo du terrain, copie du plan et compte rendu. Ne demandez pas au géomètre de trancher seul une question de propriété. Son relevé décrit le terrain et ses limites techniques ; les droits doivent être vérifiés avec les autorités et professionnels juridiques compétents."},
    ],
    checklist:["Qualification vérifiée", "Mission et prix écrits", "Délais précisés", "Livrables identifiés", "Suppléments encadrés", "Preuves et compte rendu prévus"],
  },
  {
    id: "acheter-distance",
    category: "Diaspora",
    country: "International",
    icon: "🌍",
    title: "Acheter depuis l'étranger sans avancer à l'aveugle",
    excerpt: "Un protocole concret pour organiser les visites, les vérifications, les décisions et les paiements lorsque vous êtes loin.",
    updatedAt: "21 septembre 2026",
    intro: "La distance ne rend pas un achat impossible, mais elle augmente le risque de dépendre d'une seule personne et de prendre une décision à partir d'informations choisies par le vendeur. La bonne réponse n'est pas de multiplier les messages : c'est d'organiser le projet comme un dossier, avec des rôles séparés, des preuves datées, des étapes de validation et une règle simple — aucune urgence commerciale ne doit supprimer une vérification essentielle.",
    sections: [
      {title:"Séparer les rôles",text:"Évitez de confier la recherche du bien, la vérification des documents, la visite technique et la réception de l'argent à une seule personne. Le vendeur ou l'agent peut organiser la visite, mais les vérifications importantes doivent être réalisées par des intervenants indépendants. Désignez une personne de confiance pour constater la situation physique, un professionnel compétent pour examiner les documents et, lorsque nécessaire, un notaire ou juriste pour formaliser la transaction. Chacun doit vous rendre compte directement. Cette séparation réduit les conflits d'intérêts et rend les incohérences plus visibles."},
      {title:"Créer un dossier partagé et une chronologie",text:"Centralisez les pièces dans un espace protégé plutôt que dans une succession de messages. Nommez les fichiers avec leur date et leur origine. Tenez une chronologie simple : premier contact, documents reçus, personnes consultées, vérifications effectuées, questions ouvertes et paiements. Conservez également les versions précédentes d'un document. Une modification de superficie, de prix, de nom ou de référence doit être expliquée. Ne partagez pas vos pièces d'identité avec plus de personnes que nécessaire et masquez les informations inutiles lorsque c'est possible."},
      {title:"Exiger une visite exploitable",text:"Une vidéo doit permettre de comprendre le bien, pas seulement de le rendre attractif. Demandez un parcours continu depuis la rue, les accès, chaque pièce ou limite, les compteurs, les défauts visibles et le voisinage immédiat. Demandez à la personne de prononcer la date et de montrer un élément convenu à l'avance afin d'éviter une ancienne vidéo. Pour un terrain, complétez par une localisation, un plan et l'intervention d'un professionnel. Une visite vidéo ne remplace pas une expertise, mais elle évite de décider sur des images promotionnelles."},
      {title:"Vérifier par des canaux indépendants",text:"Contactez vous-même les professionnels et services utilisés pour les contrôles. N'utilisez pas uniquement le numéro transmis par le vendeur : recherchez les coordonnées officielles lorsque cela est possible. Demandez au professionnel de vous adresser son rapport depuis sa propre adresse et réglez directement sa facture. Recoupez les noms, références, dates, superficies et localisations. Une information répétée par plusieurs personnes qui dépendent toutes du même intermédiaire n'est pas encore une vérification indépendante."},
      {title:"Décider par étapes",text:"Définissez avant toute négociation vos conditions minimales : documents indispensables, résultat des contrôles, budget total, délai et personne autorisée à signer. Utilisez une liste de points bloquants. Si une pièce manque, notez-la comme manquante au lieu de la considérer comme promise. Un acompte ne doit intervenir qu'après un écrit qui précise son objet, son bénéficiaire et les conditions de restitution. Le solde doit dépendre de la signature et des formalités prévues pour le pays concerné."},
      {title:"Encadrer une procuration",text:"Une procuration donne un pouvoir réel : elle doit donc être limitée à des actes précis, une durée, un bien et, si possible, des montants. Évitez les formulations générales permettant de vendre, emprunter ou recevoir des fonds sans limite. Faites confirmer la forme requise dans le pays du bien et dans le pays où vous signez. Demandez un compte rendu de chaque acte accompli. Lorsque la procuration n'est plus nécessaire, renseignez-vous sur les modalités de révocation et de notification."},
      {title:"Préparer le coût complet",text:"Le prix annoncé n'est qu'une partie du projet. Ajoutez les vérifications, déplacements, honoraires, taxes, formalités, change, frais bancaires, travaux immédiats et marge d'imprévu. Comparez les montants en monnaie locale et conservez le taux utilisé pour vos décisions. Avant un transfert important, vérifiez auprès de votre banque les justificatifs demandés et le nom exact du bénéficiaire. Un changement de compte au dernier moment doit suspendre le paiement jusqu'à confirmation indépendante."},
      {title:"Savoir interrompre le projet",text:"Une pression constante, un refus de fournir des originaux, des coordonnées impossibles à vérifier, des versions contradictoires ou une demande de paiement vers un tiers sont des raisons de faire une pause. Interrompre un dossier ne signifie pas accuser quelqu'un de fraude : cela signifie que le niveau de preuve n'est pas suffisant. Fixez un délai raisonnable pour obtenir les éléments manquants et gardez une trace écrite de votre décision. La peur de perdre une opportunité ne doit jamais vous faire accepter un risque que vous n'auriez pas accepté sur place."},
    ],
    checklist:["Intervenants indépendants identifiés", "Dossier partagé et chronologie créés", "Visite récente et exploitable obtenue", "Documents vérifiés hors du canal du vendeur", "Conditions de paiement écrites", "Procuration limitée si nécessaire", "Budget total calculé", "Points bloquants traités avant signature"],
  },
  {
    id:"xof-xaf",category:"Comprendre",country:"Zone franc CFA",icon:"💱",
    title:"XOF et XAF : comprendre les deux francs CFA",
    excerpt:"Deux monnaies distinctes, une parité similaire avec l'euro et des circuits bancaires qu'il ne faut pas confondre.",
    updatedAt:"21 septembre 2026",
    intro:"XOF et XAF sont souvent appelés tous les deux « franc CFA », mais ils appartiennent à deux zones monétaires distinctes. Cette distinction compte lorsque vous comparez une annonce, préparez un virement ou signez un document. Le même nombre de francs ne suffit pas à identifier la monnaie : le pays et le code monétaire doivent apparaître.",
    sections:[
      {title:"Deux zones différentes",text:"Le XOF est utilisé dans l'Union économique et monétaire ouest-africaine, tandis que le XAF est utilisé dans la Communauté économique et monétaire de l'Afrique centrale. Les billets, les banques centrales et les circuits de paiement ne sont pas interchangeables. Dans une annonce, exigez donc le code XOF ou XAF et le pays, surtout lorsqu'un prix est transmis par capture d'écran ou message."},
      {title:"Comprendre la conversion en euros",text:"Les deux monnaies ont une parité fixe avec l'euro, mais un transfert réel peut inclure des frais bancaires, des commissions, des délais et des écarts liés au service utilisé. Sur Sokilé, la monnaie locale reste la référence de l'annonce ; l'équivalent en euros est un repère arrondi. Le contrat doit indiquer la monnaie dans laquelle le prix est exigible et la manière de traiter les frais."},
      {title:"Comparer correctement les prix",text:"Comparez des biens semblables dans la même ville, le même quartier et la même monnaie. Un prix au mètre carré peut aider, mais il ne reflète pas à lui seul le statut juridique, l'accès, l'état, les raccordements ou la qualité de construction. Notez la date du prix et évitez de convertir plusieurs fois entre devises : les arrondis finissent par créer des écarts importants."},
      {title:"Préparer un transfert",text:"Demandez l'identité exacte du bénéficiaire, l'établissement, le pays, la devise du compte et le motif attendu. Vérifiez auprès de votre banque les justificatifs nécessaires. Testez éventuellement un petit montant lorsque le professionnel le recommande, sans considérer ce test comme une validation juridique du bénéficiaire. Refusez tout changement de coordonnées non confirmé par un autre canal."},
    ],
    checklist:["Code XOF ou XAF indiqué", "Pays et bénéficiaire confirmés", "Monnaie du contrat précisée", "Frais bancaires estimés", "Coordonnées vérifiées par un second canal"],
  },
  {
    id:"budget-construction",category:"Construire",country:"Tous pays",icon:"🏗️",
    title:"Préparer le budget d'une construction",
    excerpt:"Du terrain à la réception : les postes à chiffrer, la marge d'imprévu et les preuves à exiger pendant le chantier.",
    updatedAt:"21 septembre 2026",
    intro:"Un budget de construction crédible ne se résume pas au prix des murs et de la toiture. Il doit intégrer les études, les démarches, l'installation du chantier, les raccordements, le suivi et une réserve. La meilleure protection consiste à comparer des devis fondés sur le même projet et à relier chaque paiement à un résultat vérifiable.",
    sections:[
      {title:"Valider le terrain et le programme",text:"Avant de chiffrer, confirmez la superficie, l'accès, la topographie, la nature du sol, les règles d'urbanisme et les réseaux disponibles. Décrivez le nombre de pièces, les surfaces, le niveau de finition et les équipements. Une phrase comme « villa moderne quatre chambres » ne permet pas à deux entreprises de calculer la même chose. Faites produire des plans et un descriptif adaptés à la phase du projet."},
      {title:"Séparer les familles de coûts",text:"Créez des lignes distinctes pour les études et plans, autorisations, terrassement, gros œuvre, toiture, menuiseries, électricité, plomberie, revêtements, peinture, équipements, extérieurs, raccordements et sécurité. Ajoutez les transports, l'hébergement éventuel des équipes, le gardiennage, les assurances et le contrôle. Cette séparation permet de repérer un oubli et de comparer les offres."},
      {title:"Comparer le même périmètre",text:"Transmettez les mêmes plans, quantités et attentes à chaque entreprise. Demandez les marques ou niveaux de qualité prévus, les quantités, la main-d'œuvre, les délais et les exclusions. Un devis moins cher peut simplement omettre les portes, les sanitaires, le raccordement ou les finitions. Faites corriger les ambiguïtés avant de choisir et joignez le devis final au contrat."},
      {title:"Planifier les paiements",text:"Découpez le chantier en étapes observables et évitez de financer trop largement une phase future. Pour chaque appel de fonds, exigez un état d'avancement, des photos datées, les justificatifs convenus et, lorsque le budget le permet, le contrôle d'un professionnel indépendant. Prévoyez une retenue ou une dernière tranche liée à la réception et à la correction des défauts."},
      {title:"Conserver une réserve",text:"Une réserve de 10 à 15 % peut absorber certaines variations, mais elle ne doit pas servir à masquer un devis incomplet. Toute modification du projet doit faire l'objet d'un chiffrage écrit avant exécution. Tenez un tableau du budget initial, des engagements, des paiements et du reste à payer. À distance, séparez la personne qui demande les fonds de celle qui vérifie l'avancement."},
      {title:"Organiser la réception",text:"Avant le dernier paiement, inspectez les ouvrages, testez les équipements et dressez une liste écrite des défauts ou travaux inachevés. Photographiez les points concernés et fixez un délai de correction. Récupérez les plans à jour, garanties, factures, références des équipements et documents administratifs. Une remise des clés sans dossier final rend les réparations futures plus difficiles."},
    ],
    checklist:["Programme et niveau de finition définis", "Études et autorisations budgétées", "Devis comparables", "Paiements liés à des étapes", "Suivi indépendant prévu", "Réserve et tableau budgétaire", "Réception écrite avant solde"],
  },
  {
    id:"eviter-fausses-annonces",category:"Sécurité",country:"Tous pays",icon:"🛡️",
    title:"Reconnaître une annonce immobilière à risque",
    excerpt:"Les signaux d'alerte, les contrôles simples et la conduite à tenir avant de transmettre des documents ou de l'argent.",
    updatedAt:"21 septembre 2026",
    intro:"Une annonce trompeuse n'est pas toujours grossière. Elle peut utiliser de vraies photos, un vrai quartier et même des documents existants sans que la personne qui publie soit autorisée à vendre ou louer. L'objectif n'est pas de devenir enquêteur, mais de ralentir la décision, vérifier l'interlocuteur et refuser tout paiement tant que les informations essentielles ne sont pas cohérentes.",
    sections:[
      {title:"Repérer les signaux de pression",text:"Un prix très inférieur au marché, une urgence permanente, plusieurs prétendus acheteurs et une remise conditionnée à un paiement immédiat doivent vous faire ralentir. Une opportunité réelle peut avoir une échéance, mais le vendeur doit accepter des vérifications raisonnables. Refusez les frais de dossier, de visite ou de réservation versés sans document clair et identité vérifiée."},
      {title:"Contrôler les images et la localisation",text:"Demandez des photos supplémentaires ciblées et une vidéo récente. Recherchez si les mêmes images apparaissent ailleurs avec une autre ville ou un autre contact. Comparez l'environnement visible avec la localisation annoncée. Pour un terrain, une photo de végétation ne prouve ni la parcelle ni les droits. Exigez un plan, une visite et des références vérifiables."},
      {title:"Vérifier l'interlocuteur",text:"Demandez son nom complet, son rôle, son agence éventuelle et son lien avec le propriétaire. Recherchez les coordonnées officielles de l'agence au lieu d'utiliser uniquement celles de l'annonce. Un badge ou une fiche Sokilé indique le niveau de contrôle effectué, mais ne remplace pas vos vérifications sur le bien et la transaction. Ne transmettez pas inutilement vos pièces d'identité ou données bancaires."},
      {title:"Lire les incohérences",text:"Comparez les noms, dates, superficies, numéros, prix et signatures entre les documents et les messages. Demandez une explication écrite à chaque différence. Un document flou, recadré ou incomplet doit être remplacé par une copie lisible, puis contrôlé auprès de la source compétente. Ne vous laissez pas rassurer uniquement par le nombre de documents : leur authenticité et leur portée comptent davantage."},
      {title:"Réagir sans prendre de risque",text:"Suspendez les échanges financiers, sauvegardez l'annonce et les conversations, puis signalez le contenu à Sokilé. Si vous avez déjà payé, contactez rapidement votre banque ou le service de transfert et renseignez-vous auprès des autorités compétentes. N'affrontez pas physiquement une personne suspecte et ne publiez pas ses données personnelles sur les réseaux sociaux. Conservez les preuves originales."},
    ],
    checklist:["Prix comparé au marché", "Photos et vidéo récentes", "Identité et rôle confirmés", "Documents lisibles et cohérents", "Aucun paiement sous pression", "Signalement effectué en cas de doute"],
  },
].map((guide) => ({ ...guide, reading: guideReadingTime(guide) }));
