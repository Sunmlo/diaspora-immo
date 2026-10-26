# Import depuis un lien

Dans le compte professionnel, « Importer mes annonces » propose désormais « Depuis un lien » et « Excel / CSV ».

Le lien est lu côté serveur après vérification d'une session confirmée. Une annonce structurée est préremplie directement ; une page de catalogue présente jusqu'à 50 liens du même site à sélectionner. La récupération reste une extraction HTML/JSON-LD déterministe, sans modèle génératif : aucune information absente n'est inventée. Les photos sont présentées dans l'aperçu puis copiées dans le stockage Sokilé lors de la validation. Les références stables, les doublons, les champs indispensables et l'autorisation de publication sont contrôlés par le parcours d'import existant.

Les annonces sont créées avec `status=en_attente`, `active=false`, et rattachées au compte connecté. Après création, le navigateur appelle `listing-import-review`, qui charge les photos du propriétaire depuis la base, appelle les modèles Sightengine déjà configurés et enregistre le résultat dans `moderation_note`. Aucun résultat IA ne publie une annonce : l'examen humain du bien, du texte et du dossier professionnel reste nécessaire. Une panne du prestataire ou une interruption du navigateur laisse l'annonce en attente ; un contrôle IA absent doit être relancé avant de prendre une décision. Le contrôle IA porte sur le contenu des images, pas sur l'authenticité immobilière ou la propriété.

## Exploitation

- API Vercel : `POST /api/import-link` (`discover`, `detail`, `photo`), JWT et clé publique dans les en-têtes. Aucun secret fournisseur dans le navigateur.
- Fonction Supabase : `listing-import-review`, JWT obligatoire et vérification utilisateur supplémentaire. Réutilise `SIGHTENGINE_API_USER` et `SIGHTENGINE_API_SECRET`; clé serveur injectée par Supabase.
- SSRF : HTTPS uniquement, DNS validé et épinglé à une adresse publique, nouvelle validation à chaque redirection, taille/type/signature des photos contrôlés, délais bornés. Les en-têtes d'authentification ne sont jamais transmis au site source.
- Pas de modification de schéma, pas de publication automatique, pas d'écrasement des annonces existantes.

## Limites de cette première version

- Pas de navigation JavaScript, connexion, réseaux sociaux protégés ou contournement antibot.
- Une page de catalogue à la fois, sans parcours automatique des pages suivantes. Extraction variable selon le balisage du site ; les champs non trouvés restent à compléter.
- Maximum 20 photos par bien, 4 Mo par photo distante, 2 Mo de HTML. Les fichiers photo ajoutés manuellement gardent la limite existante de 8 Mo.
- Les aperçus sont en mémoire : fermer l'écran les efface. Un nouvel import remplace l'aperçu précédent.
- Le contrôle IA est déclenché après la réponse de création : si le navigateur est fermé trop tôt, la vérification humaine doit identifier et reprendre le contrôle absent. Il n'y a pas de worker de reprise automatique.
- Limitation de fréquence en mémoire par instance Vercel ; pas de quota distribué.

## Vérifications

187 tests du projet réussis avant les derniers ajustements mineurs ; 12 tests ciblés repassés après ajustement. Compilation Vite réussie. Les tests couvrent extraction structurée, catalogue, devises étrangères, références, propriété, SSRF et réponse IA incomplète. Accès DNS aux sites d'agences et téléchargement du navigateur indisponibles dans l'environnement de travail : aucune recette authentifiée de bout en bout sur un site d'agence réel n'est revendiquée.
