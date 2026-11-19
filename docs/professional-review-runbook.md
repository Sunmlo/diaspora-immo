# Parcours de validation accompagnée des professionnels

## Portée
Ce changement ajoute un formulaire **sans compte** pour les agences déjà enregistrées dans `assisted_agencies`. Il ne remplace ni la vérification légale des professionnels, ni la modération, ni les flux existants de publication.

## Activation en environnement de test
1. Faire relire puis appliquer `docs/professional-review-schema.sql` dans une base **de test**. Le schéma est volontairement fourni séparément : aucune migration ou opération de production n'est déclenchée par cette PR.
2. Configurer côté serveur Vercel les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`. La clé service role ne doit **jamais** être mise dans le navigateur ou committée.
3. Depuis l'administration « Agences accompagnées », choisir une agence et un email professionnel confirmé puis générer une invitation. **Aucun email n'est envoyé automatiquement.**
4. Ouvrir le lien à usage privé depuis un navigateur déconnecté, vérifier les champs préremplis, modifier, enregistrer le brouillon, recharger, puis confirmer.
5. Revenir dans l'interface administrateur : statut « submitted » et corrections visibles, sans modification automatique des annonces ni de la page publique.

## Principes de sécurité
- Jeton aléatoire 256 bits, conservé uniquement sous forme SHA-256 dans Supabase.
- Token dans le fragment `#` de l'URL, non transmis aux serveurs web sur la requête de page.
- Expiration sous 7 jours et révocation depuis l'administration.
- Accès aux données via le serveur uniquement; table privée avec RLS et aucun droit `anon`/`authenticated`.
- L'API d'administration vérifie côté serveur l'authentification et l'email administrateur confirmé, et ne se fie pas au profil navigateur.
- Champs modifiables explicitement listés; les champs d'identité de propriétaire et de statut sont exclus.
- Un dépôt confirmé nécessite l'attestation de pouvoir de représentation et reste en attente de revue manuelle.

## Points à vérifier avant production
- `npm test`, `npm run build`, tests E2E mobile et bureau.
- Qu'une agence non liée à `assisted_agencies` (par exemple un professionnel déjà enregistré seulement dans `professionals`) devra avoir un parcours supplémentaire adapté.
- L'identité et l'email réellement confirmés pour Kobes, ainsi que toute invitation existante.
- Le processus de justificatifs professionnels et les règles de conservation des données.
- Prévoir une confirmation d'identité renforcée (ex. code email) si l'invitation peut circuler au-delà de l'interlocuteur confirmé.
- Vérifier les politiques et alertes Supabase, la configuration Vercel, les cas de concurrence et les journaux sans exposer les tokens.
- Vérifier qu'une copie d'un lien, une révocation ou une expiration bloque toute nouvelle modification et que le jeton n'est pas divulgué à des tiers.

**Interdit avant validation :** exécuter le SQL en production, fusionner, déployer, ou envoyer un lien à Kobes.
