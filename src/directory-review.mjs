export const DIRECTORY_TITLES = ['Agence immobilière','Courtier immobilier','Promoteur immobilier','Géomètre','Notaire','Architecte','Vérification terrain','Juridique','Financement'];
// Review categories, not a claim that every service in each category is legally regulated.
export const needsTitleReview = specialty => DIRECTORY_TITLES.includes(specialty);
export function directoryError(f) {
 if(!f.name?.trim()||!f.spec||!f.pays?.length||!f.email?.trim()||!f.desc?.trim())return 'Complétez le nom, l’activité, les pays, l’email et une courte présentation.';
 if(!f.documents?.registration?.path)return 'Ajoutez une photo ou un PDF de votre justificatif professionnel.';
 if(needsTitleReview(f.spec)&&!f.reference?.trim())return 'Précisez votre titre ou mission et la référence professionnelle correspondante (par pays si nécessaire).';
 if(!f.consent)return 'Confirmez votre pouvoir de représentation et la publication de votre fiche.';
 return '';
}
export function directoryReviewError(review,countries) {
 if(!review?.identity||!review?.content)return 'Confirmez la concordance du justificatif et l’examen de la fiche.';
 if(!['not_applicable','checked'].includes(review?.title))return 'Précisez le contrôle du titre ou de l’autorisation revendiqués.';
 if((review.notes||'').trim().length<30)return 'Notez ce que vous avez contrôlé (30 caractères minimum).';
 if(!review.until||Number.isNaN(Date.parse(review.until))||Date.parse(review.until+'T23:59:59Z')<=Date.now())return 'Choisissez une échéance future pour ce contrôle.';
 if(!countries?.length)return 'Aucun pays d’intervention indiqué.';
 return '';
}
