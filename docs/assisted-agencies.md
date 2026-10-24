# Publication accompagnée des agences

Une `assisted_agencies` représente une agence avant l’ouverture de son compte. Les annonces la référencent par `assisted_agency_id`, indépendamment de `owner_id`. Le consentement à publier doit être consigné par Sokilé avant d’activer `publication_enabled`.

- Le service d’import associe les annonces à cette fiche et fournit une `details.import_reference` stable et unique par agence. Il conserve les informations inconnues à `null`, les sources et les photos d’origine. `details.rent_period = "a_confirmer"` évite d’inventer un loyer mensuel ; `details.price_from = true` indique un tarif de départ.
- Seule l’administration peut autoriser cet accompagnement. La fiche et les annonces doivent partager le nom de l’agence, le pays et le titulaire (éventuellement absent). Les contrôles habituels restent en place pour les autres professionnels, les particuliers et les programmes.
- La page `/agence/<slug>` affiche les annonces publiques et propose l’inscription professionnelle. Le candidat confirme son e-mail lors de l’inscription et communique cette adresse à Sokilé par le canal déjà utilisé avec l’agence.
- Dans **Administration → Agences accompagnées**, l’administrateur saisit l’e-mail confirmé avec l’agence et consigne la preuve de cet échange. Le RPC vérifie une session administrateur et un compte avec un e-mail confirmé, puis rattache atomiquement la fiche et ses annonces. Un nom d’agence ou une inscription seuls ne donnent aucun accès.
- Le rattachement conserve les identifiants, les liens, la publication et les échéances. Il ne crée pas de badge : `professional_verified` dépend uniquement d’un dossier professionnel valide. Une modification par le propriétaire repasse par la modération habituelle.
- Une fiche déjà attribuée ne peut pas être transférée à un autre compte via cet outil. Les annonces avec une vidéo doivent d’abord faire l’objet d’un transfert des médias ; le RPC bloque ce cas.

Les vues publiques utilisent volontairement les droits de leur propriétaire et une barrière de sécurité pour exposer uniquement la projection publique filtrée. Les tables, e-mails de compte et preuves internes restent hors de l’accès anonyme. Cette architecture est la même que les autres vues publiques du projet et explique l’avis Supabase `security_definer_view`.

Validation : `npm test` couvre les tentatives d’appropriation, les e-mails non confirmés, le consentement obligatoire, les doublons d’import, le transfert atomique, les règles de visibilité, la révocation de publication et le calcul du badge. `npm run build` vérifie l’intégration de la page publique et de l’outil d’administration.
