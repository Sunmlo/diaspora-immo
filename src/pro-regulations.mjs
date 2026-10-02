// Reviewed 2026-10-01. Unconfirmed regimes never imply absence of regulation.
export const REGULATION_VERSION = '2026-10-01';
export const COUNTRIES = ["Bénin","Burkina Faso","Côte d'Ivoire","Mali","Niger","Sénégal","Togo","Cameroun","Centrafrique","Congo","Gabon","Tchad"];
export const ACTIVITIES = {agence:'Agence / agent immobilier',courtier:'Courtier immobilier',promoteur:'Promoteur immobilier',geometre:'Géomètre',notaire:'Notaire',architecte:'Architecte',btp:'BTP / Construction',terrain:'Vérification terrain',juridique:'Juridique',financement:'Financement',demenagement:'Déménagement'};
export const specialtyActivity = s => ({'Agence immobilière':'agence','Courtier immobilier':'courtier','Promoteur immobilier':'promoteur','Géomètre':'geometre','Notaire':'notaire','Architecte':'architecte','BTP / Construction':'btp','Vérification terrain':'terrain','Juridique':'juridique','Financement':'financement','Déménagement':'demenagement'})[s] || '';
const sources = {
 cm:{label:'MINHDU — agents et promoteurs',url:'https://www.minhdu.gov.cm/agents-et-promoteurs-immobiliers/'},
 ciAgent:{label:'Ministère — agrément des agents',url:'https://www.construction.gouv.ci/partenaire/agent-immobilier'},
 ciPro:{label:'Ministère — agrément des promoteurs',url:'https://www.construction.gouv.ci/partenaire/promoteur-immobilier'},
 bjAgent:{label:'CDIJ — loi 2022-30, articles 18 et 19',url:'https://cdij.bj/p/la-loi-en-clair-publication-n-6-septembre-2026'},
 bjPro:{label:'SGG — décret 99-313, articles 4 et 7',url:'https://sgg.gouv.bj/doc/decret-1999-313/read'},
 bf:{label:'Gouvernement — agréments du secteur de la construction',url:'https://gouvernement.gov.bf/actualites/construction-le-gouvernement-simplifie-les-procedures/'},
 ml:{label:'DNDC — décret 2021-0037 sur la promotion immobilière',url:'https://www.dndc.gouv.ml/wp-content/uploads/2025/01/Decret-sur-la-promotion-immobiliere.pdf'},
 sn:{label:'DRI — loi 1982-07 du 30 juin 1982',url:'https://www.dri.gouv.sn/loi-n%C2%B0-198207-du-30-juin-1982'},
 cg:{label:'Ministère des Finances — loi 37-2011',url:'https://www.finances.gouv.cg/fr/loi-37-2011-du-29-d%C3%A9cembre-2011-r%C3%A9glementant-les-professions-dagent-et-de-courtier-immobiliers'},
 ga:{label:'Journal officiel — loi 006/2017',url:'https://journal-officiel.ga/738-decret/'},
 gaText:{label:'Loi 006/2017 — texte du Journal officiel (reproduction)',url:'https://fr.scribd.com/document/529888991/agent-immobilier'},
 tg:{label:'Ministère — projet de réglementation de la profession',url:'https://urbanisme.gouv.tg/la-7e-edition-du-festimmo-lancee-vendredi-a-lome/'},
 ne:{label:'ORFAO / UEMOA — réforme foncière du 22 avril 2026',url:'https://orfao.uemoa.int/index.php/fr/niger-actualites-sur-le-foncier/ordonnance-ndeg2026-24-du-22-avril-2026-portant-regime-du-foncier'},
 td:{label:'Loi 006/PR/2010 — articles 32 et 34 (reproduction)',url:'https://juriscom.org/Documentation/Tchad/Urbanisme/Loi_10-006_2010-01-12_PR_fixant_principes_fondamentaux_applicables_matiere_urbanisme.pdf'},
 cf:{label:'GABAC — évaluation 2023, constats de 2022',url:'https://gabac.org/wp-content/uploads/2023/11/REM-FR-OK.pdf'}
};
const doc=(code,label,legal=false)=>({code,label,legal});
const registration=doc('registration',"Immatriculation professionnelle (RCCM, registre d’ordre ou acte de nomination)");
const supplement={...doc('supplement','Complément professionnel (agrément, inscription ou pièce demandée par Sokilé)'),required:false};
const representation=doc('representation',"Pouvoir du représentant (extrait le nommant ou mandat de la structure)");
const card=doc('card','Carte professionnelle en cours de validité',true);
const register=doc('register','Justificatif d’inscription au registre professionnel',true);
const approval=doc('approval','Agrément ou autorisation d’exercice',true);
const insurance=doc('insurance','Attestation d’assurance responsabilité civile professionnelle',true);
const guarantee=doc('guarantee','Attestation de garantie financière',true);
const known = {
 'Gabon:agence':{authority:'Ministère chargé de l’Habitat ; administration du Commerce ; corporation professionnelle',docs:[doc('authorization','Autorisation d’exercer du ministère chargé de l’Habitat',true),doc('approval','Agrément du commerce',true),register,card,insurance,guarantee],sources:[sources.ga,sources.gaText],summary:'Agent : autorisation d’exercer, agrément commercial, inscription au registre, carte, assurance et garantie financière (loi 006/2017, articles 8, 9 et 19). L’autorisation est sans durée limitée ; le contrôle Sokilé est renouvelé séparément.'},
 'Gabon:courtier':{authority:'Ministère chargé de l’Habitat ; administration du Commerce ; corporation professionnelle',docs:[doc('authorization','Autorisation d’exercer du ministère chargé de l’Habitat',true),doc('approval','Agrément préalable et fiche circuit (réunis dans un PDF si nécessaire)',true),register,card,insurance],sources:[sources.ga,sources.gaText],summary:'Courtier : autorisation, agrément préalable, inscription au registre, carte et assurance ; fiche circuit pour la carte (loi 006/2017, articles 26, 27 et 36). La garantie financière prévue pour l’agent n’est pas ajoutée au dossier du courtier.'},
 'Congo:agence':{authority:'Ministère chargé de l’Urbanisme et de l’Habitat',docs:[card,doc('trader_card','Carte de commerçant',true),insurance],sources:[sources.cg],summary:'Carte professionnelle, carte de commerçant et assurance couvrant les risques professionnels (loi 37-2011, article 5).'},
 'Cameroun:agence':{authority:'MINHDU',docs:[card,register,insurance,guarantee],sources:[sources.cm],summary:'Carte professionnelle, inscription au registre, assurance et garantie financière. Contrôle du numéro et du titulaire auprès du MINHDU.'},
 'Cameroun:promoteur':{authority:'MINHDU',docs:[approval],sources:[sources.cm],summary:'Agrément préalable de promoteur immobilier. Contrôle de la décision et de la liste du MINHDU.'},
 "Côte d'Ivoire:agence":{authority:'Ministère chargé du Logement — DGLVC / CAPPI',docs:[approval],sources:[sources.ciAgent],summary:'Agrément d’agent immobilier. Vérification du titulaire et de la validité auprès du ministère.'},
 "Côte d'Ivoire:promoteur":{authority:'Ministère chargé du Logement — DGLVC / CAPPI',docs:[approval],sources:[sources.ciPro],summary:'Agrément de promoteur immobilier ou de vendeur d’immeubles à construire adapté à l’activité.'},
 'Bénin:agence':{authority:'Ministère chargé de l’Habitat',docs:[card,register,insurance],sources:[sources.bjAgent],summary:'Carte professionnelle, inscription au registre des agents et assurance. Vérification auprès du ministère chargé de l’Habitat.'},
 'Bénin:promoteur':{authority:'Ministère chargé de l’Urbanisme et de l’Habitat',docs:[approval,insurance],sources:[sources.bjPro],summary:'Attestation d’agrément et assurance professionnelle. L’approbation de chaque programme constitue une démarche distincte.'},
 'Burkina Faso:promoteur':{authority:'Ministère chargé de l’Urbanisme et de l’Habitat',docs:[approval],sources:[sources.bf],summary:'Agrément de promotion immobilière. Validité et catégorie à vérifier dans le cadre réglementaire actualisé.'},
 'Mali:promoteur':{authority:'Ministère chargé de l’Habitat',docs:[approval,card],sources:[sources.ml],summary:'Agrément de promoteur immobilier et carte professionnelle, à rapprocher des registres de l’autorité compétente.'},
 'Sénégal:agence':{authority:'Ministère chargé du Commerce — service compétent',docs:[approval,card,insurance],sources:[sources.sn,{label:'Loi 1982-07 — texte et archives',url:'https://www.archives.sn/docs/lois/loi-n-1982-07-du-30-juin-1982-relative-aux-activites-de-promotion-de-transaction-et-de-gestion-immo-6139'}],summary:'Autorisation préalable et carte professionnelle couvrant la transaction ou la gestion ; assurance professionnelle.'},
 'Sénégal:promoteur':{authority:'Ministère chargé du Commerce — service compétent',docs:[approval,card,insurance],sources:[sources.sn,{label:'Loi 1982-07 — texte et archives',url:'https://www.archives.sn/docs/lois/loi-n-1982-07-du-30-juin-1982-relative-aux-activites-de-promotion-de-transaction-et-de-gestion-immo-6139'}],summary:'Autorisation préalable et carte professionnelle couvrant la promotion ; assurance professionnelle.'}
};
const reviews={
 'Togo:agence':{statusLabel:'Cadre en évolution',authority:'Ministère chargé de l’Urbanisme et de l’Habitat',sources:[sources.tg],summary:'Un projet de réglementation est identifié ; l’obligation d’une carte ou d’un agrément spécifique n’est pas établie par les sources consultées. Déposez les pièces de base : Sokilé examine le régime applicable avant toute publication.'},
 'Niger:promoteur':{statusLabel:'Réforme 2026 — examen préalable',authority:'Administration chargée du Foncier et de l’Urbanisme',sources:[sources.ne],summary:'L’UEMOA signale une réforme de 2026 excluant les personnes privées de certaines opérations d’aménagement et de promotion. Sokilé doit établir le périmètre, les exceptions et les dispositions transitoires pour votre activité avant de la valider. Un ancien agrément ne suffit pas à conclure.'},
 'Tchad:promoteur':{statusLabel:'Agrément prévu — procédure à établir',authority:'Ministère chargé de l’Urbanisme et de l’Habitat',sources:[sources.td],summary:'La loi prévoit des promoteurs agréés et renvoie les modalités à un décret. Sokilé doit vérifier la procédure actuelle et le justificatif correspondant avant validation. Vous pouvez commencer votre dossier avec les pièces de base.'},
 'Centrafrique:agence':{statusLabel:'Examen du régime par Sokilé',authority:'Administration chargée de l’Urbanisme et de l’Habitat',sources:[sources.cf],summary:'Le rapport GABAC de 2023 décrit des lacunes d’agrément et de supervision observées en 2022. Il ne prouve pas une dispense d’autorisation. Sokilé vérifie le régime actuel avant publication.'},
 'Centrafrique:promoteur':{statusLabel:'Examen du régime par Sokilé',authority:'Administration chargée de l’Urbanisme et de l’Habitat',sources:[sources.cf],summary:'Les constats institutionnels disponibles ne suffisent pas à établir la procédure actuelle d’habilitation des promoteurs. Sokilé doit déterminer les autorisations applicables avant validation.'},
 'Gabon:promoteur':{statusLabel:'Périmètre de l’activité à examiner',authority:'Ministère chargé de l’Habitat',sources:[sources.ga,sources.gaText],summary:'La loi 006/2017 couvre certaines activités de promotion et prévoit des exclusions. Sokilé vérifie votre rôle exact et les autorisations correspondantes avant de valider le dossier.'}
};
export function ruleFor(country,activity){
 if(!COUNTRIES.includes(country)||!ACTIVITIES[activity])return null;
 const rule=known[`${country}:${activity}`];
 if(rule)return {country,activity,status:'confirmed',version:REGULATION_VERSION,...rule,docs:[registration,representation,...rule.docs,supplement]};
 const professional=['notaire','geometre','architecte','juridique','financement'].includes(activity);
 return {country,activity,status:'review',version:REGULATION_VERSION,authority:professional?'Ordre, chambre professionnelle ou autorité de tutelle compétente':'Administration compétente pour l’activité et le pays',sources:[],statusLabel:'Examen du régime par Sokilé',
 summary:professional?'Sokilé doit vérifier le titre exact, l’inscription professionnelle et les autorisations applicables à votre mission avant validation. Déposez les pièces de base pour commencer le dossier.':'Déposez les pièces de base. Sokilé vérifie le régime applicable et vous indique les justificatifs complémentaires nécessaires avant validation. L’absence de liste définitive ne signifie pas une dispense d’autorisation.',
 ...reviews[`${country}:${activity}`],docs:[registration,representation,supplement]};
}
export const RULES=COUNTRIES.flatMap(country=>Object.keys(ACTIVITIES).map(activity=>ruleFor(country,activity)));
export function verificationValid(d,now=Date.now()) {return d?.status==='verified' && Date.parse(d.valid_until)>now;}
export function dossierError(d,rule,now=new Date()) {
 if(!rule)return 'Choisissez le pays et votre activité.';
 if(!d.business_name?.trim()||!d.representative_name?.trim()||!d.registration_number?.trim())return 'Renseignez la structure, le représentant et la référence d’immatriculation.';
 if(!d.consent)return 'Confirmez l’exactitude des informations et votre pouvoir de représentation.';
 for(const need of rule.docs){const item=d.documents?.[need.code];if(need.required===false&&!item?.path)continue;if(!item?.path||!item.reference?.trim()||!item.issuer?.trim())return `Complétez : ${need.label} (fichier, référence et organisme émetteur).`;if(!item.no_expiry&&!item.expires_on)return `Précisez la validité : ${need.label}.`;if(item.expires_on&&item.expires_on<now.toISOString().slice(0,10))return `Le document « ${need.label} » est expiré.`;}
 return '';
}
export const STATE_LABELS={en_attente:'En cours de vérification',complement:'Pièces à compléter',verified:'Documents examinés',suspended:'Vérification suspendue'};
