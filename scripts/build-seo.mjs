import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const origin = 'https://www.sokile.com';
export const pages = [
  {
    slug:'cameroun', country:'Cameroun', title:'Publier vos annonces immobilières au Cameroun | Sokilé',
    heading:'Vos biens au Cameroun méritent une présentation claire.',
    description:'Agences au Cameroun : présentez vos biens sur Sokilé, renseignez vos annonces et recevez directement les demandes. Premier import accompagné sur demande.',
    intro:'Vous êtes une agence immobilière au Cameroun ? Présentez vos maisons, appartements et terrains sur Sokilé, une plateforme destinée aux recherches immobilières locales et à celles de la diaspora.',
    sections:[
      ['Publier une annonce immobilière au Cameroun','À Douala, Yaoundé, Kribi ou dans une autre ville, commencez par situer précisément le bien : ville, quartier et repères utiles. Distinguez la vente de la location et indiquez le prix en FCFA, la superficie et les caractéristiques du logement ou du terrain. Ces informations permettent au visiteur de comprendre votre offre avant de vous contacter.'],
      ['Préparer un dossier lisible, même à distance','Pour un appartement, précisez les pièces, les équipements et les conditions de location. Pour un terrain, détaillez sa superficie, son accès et les documents disponibles, sans présenter une simple déclaration comme une garantie juridique. Ajoutez des photos récentes que vous êtes autorisé à diffuser ; au moins une photo est nécessaire.'],
      ['Garder la relation avec vos prospects','Les personnes intéressées peuvent utiliser les coordonnées affichées sur votre annonce. Votre agence reste l’interlocutrice pour répondre aux questions, organiser les visites et conduire la transaction. Une annonce complète ne remplace ni une visite ni les vérifications nécessaires.'],
    ],
    tip:'Avant de publier un terrain, rassemblez la localisation, les photos, la superficie annoncée et les références des documents que vous pouvez présenter. Ne transmettez pas de pièce d’identité dans le texte public de l’annonce.',
  },
  {
    slug:'senegal', country:'Sénégal', title:'Diffuser vos annonces immobilières au Sénégal | Sokilé',
    heading:'Présentez vos biens au Sénégal, ici comme à distance.',
    description:'Agences au Sénégal : diffusez vos annonces sur Sokilé pour les recherches locales et de la diaspora. Présentation des biens et premier import accompagné sur demande.',
    intro:'À Dakar, à Thiès, sur la Petite Côte ou ailleurs au Sénégal, préparez des annonces compréhensibles pour une personne sur place comme pour un acheteur ou un locataire qui organise son projet depuis l’étranger.',
    sections:[
      ['Diffuser une annonce immobilière au Sénégal','Présentez séparément chaque bien avec sa commune, son quartier, sa superficie et son prix en FCFA. Pour une location, indiquez clairement si le logement est meublé et la période à laquelle correspond le loyer. Pour une vente, mentionnez les informations disponibles sans transformer une hypothèse en engagement.'],
      ['Répondre aux premières questions de la diaspora','Un visiteur éloigné a besoin de se repérer : environnement du bien, accès, photos de toutes les pièces utiles et disponibilité annoncée. Précisez les modalités de visite et les documents que votre agence pourra présenter. Les démarches de réservation, les paiements et les vérifications doivent ensuite être convenus directement avec les interlocuteurs compétents.'],
      ['Faciliter les échanges, sans promettre une vente','Sokilé présente les biens et permet aux personnes intéressées de contacter l’annonceur. Votre agence organise les visites et reste responsable des informations qu’elle publie. Nous ne garantissons ni un volume de demandes ni un délai de vente ou de location.'],
    ],
    tip:'Pour un bien sur la Petite Côte, indiquez la commune exacte plutôt que seulement « Saly ». Une localisation précise aide une personne à distance à préparer une visite et à comparer les offres.',
  },
  {
    slug:'cote-divoire', country:'Côte d’Ivoire', title:'Publier les annonces de votre agence en Côte d’Ivoire | Sokilé',
    heading:'Un espace pour présenter votre portefeuille en Côte d’Ivoire.',
    description:'Agences en Côte d’Ivoire : publiez vos biens sur Sokilé, préparez des annonces détaillées et facilitez les contacts. Accompagnement possible pour votre premier import.',
    intro:'Votre agence dispose de biens à Abidjan, à Bouaké, à Yamoussoukro ou dans une autre localité ? Présentez-les sur Sokilé avec des informations structurées pour les recherches locales et de la diaspora.',
    sections:[
      ['Publier les annonces de votre agence','Pour chaque bien, distinguez la vente de la location, puis renseignez la ville, la commune ou le quartier. À Abidjan, une indication précise à l’intérieur d’une commune facilite la compréhension de l’offre. Présentez le prix en FCFA, la superficie, les équipements et des photos représentatives du bien.'],
      ['Préparer plusieurs biens sans perdre les détails','Rassemblez un tableau de votre portefeuille avec une ligne par bien, vos références internes, les caractéristiques et les photos correspondantes. L’espace professionnel propose un import ; notre équipe peut également accompagner le premier import à partir des éléments que vous transmettez. Le format et les informations manquantes sont à vérifier avant publication.'],
      ['Maintenir un portefeuille utile','Mettez à jour le prix et la disponibilité lorsqu’ils changent. Retirez les offres qui ne sont plus disponibles et distinguez clairement les biens présentés. L’agence conserve la relation avec les prospects et organise les visites : Sokilé n’est pas un service d’encaissement des loyers ni un logiciel de comptabilité locative.'],
    ],
    tip:'Préparez ensemble le tableau des biens et un dossier de photos classées par référence. Ne réutilisez pas les images d’une autre annonce sans autorisation.',
  },
];
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const pagePath = p => `/professionnels/${p.slug}.html`;
export function renderPage(p) {
  const url = origin + pagePath(p);
  const links = pages.map(q=>`<a href="${pagePath(q)}"${q.slug===p.slug?' aria-current="page"':''}>${escape(q.country)}</a>`).join('');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(p.title)}</title><meta name="description" content="${escape(p.description)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:title" content="${escape(p.title)}"><meta property="og:description" content="${escape(p.description)}"><meta property="og:url" content="${url}">
<link rel="icon" href="/brand/sokile-icon.svg"><link rel="stylesheet" href="/professionnels/seo.css">
</head><body data-seo-page="professionnels-${p.slug}">
<a class="skip" href="#contenu">Aller au contenu</a>
<header><a class="brand" href="/" aria-label="Sokilé — accueil">Sokilé<span>Immobilier · Afrique de l’Ouest et centrale</span></a><a class="small" href="/?tab=pro">Espace professionnel</a></header>
<main id="contenu"><section class="hero"><div class="eyebrow">Agences immobilières · ${escape(p.country)}</div><h1>${escape(p.heading)}</h1><p class="intro">${escape(p.intro)}</p><div class="actions"><a class="button" href="/?tab=compte">Créer mon espace professionnel</a><a class="secondary" href="#premier-import">Préparer mon premier import</a></div><p class="note">Sur la page suivante, créez un compte et choisissez « Professionnel ». Déjà inscrit ? Connectez-vous.</p></section>
<div class="content">${p.sections.map(([h,t],i)=>`<section class="section"><span class="number">0${i+1}</span><div><h2>${escape(h)}</h2><p>${escape(t)}</p></div></section>`).join('')}
<aside><h2>À préparer avant de publier</h2><p>${escape(p.tip)}</p></aside>
<section id="premier-import"><div class="eyebrow">Un démarrage accompagné</div><h2>Votre premier import, avec notre équipe.</h2><p>Vous conservez la maîtrise de vos annonces. Transmettez uniquement les textes et les photos que vous êtes autorisé à utiliser ; nous pouvons vous accompagner dans leur préparation et leur premier import. Vous validez leur présentation avant leur soumission à la modération.</p><a class="button" href="mailto:contact@sokile.com?subject=${encodeURIComponent('Premier import — '+p.country)}">Demander un accompagnement</a></section>
<section class="faq"><h2>Questions pratiques</h2>
<details><summary>La publication est-elle gratuite ?</summary><p>La publication des annonces est gratuite au lancement. Les prestations publicitaires et les mises en avant payantes sont distinctes ; leurs conditions sont présentées avant toute souscription.</p></details>
<details><summary>Mes annonces sont-elles publiées immédiatement ?</summary><p>Non. Les annonces sont soumises à modération. Les informations et justificatifs demandés dans le parcours doivent être fournis. L’examen d’un dossier ne constitue pas une garantie juridique du bien ou de la transaction.</p></details>
<details><summary>Sokilé apporte-t-il des clients garantis ?</summary><p>Non. Sokilé est en phase de lancement. La plateforme vise les recherches locales et celles de la diaspora, sans garantir une audience, un nombre de contacts ou la réalisation d’une transaction.</p></details>
<details><summary>Qui répond aux personnes intéressées ?</summary><p>Votre agence répond directement aux demandes et organise les visites. Sokilé met en relation ; les négociations et les transactions restent entre les parties.</p></details></section>
<nav class="countries" aria-label="Pages professionnelles par pays">${links}</nav></div></main>
<footer><p>Sokilé — Présentez vos biens, gardez la relation.</p><nav aria-label="Informations"><a href="/about.html">Qui sommes-nous</a><a href="/verification-professionnels">Vérifications professionnelles</a><a href="/cgu.html">Conditions d’utilisation</a><a href="/confidentialites.html">Confidentialité</a><a href="mailto:contact@sokile.com">Contact</a></nav><button type="button" data-sokile-cookies>Gérer les cookies</button></footer>
<script src="/sokile-analytics.js"></script><script src="/professionnels/seo.js"></script></body></html>`;
}
export async function buildSeo(out='dist') {
  await mkdir(resolve(out,'professionnels'),{recursive:true});
  for(const p of pages) await writeFile(resolve(out,`professionnels/${p.slug}.html`),renderPage(p));
  const urls=['/','/about.html',...pages.map(pagePath)];
  await writeFile(resolve(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(path=>`  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) await buildSeo();
