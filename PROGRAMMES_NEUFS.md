# Programmes neufs

## Parcours

- `/programmes-neufs` : recherche par pays, ville ou nom, avancement, pièces et budget FCFA. Le budget et le nombre de pièces correspondent au même logement disponible. Pagination serveur, 12 programmes par page.
- `/programme/:uuid` : visuels qualifiés (photo, perspective, chantier), livraison prévisionnelle, promoteur, description, équipements, brochure, logements, plans et demandes de contact.
- Accueil : sélection de trois programmes réels uniquement lorsqu’une offre publiée existe.
- Espace pro et Compte : dépôt et suivi du programme ; jusqu’à 10 visuels et 100 logements, documents PDF publics de 10 Mo maximum.
- Gestion : onglet Programmes neufs, examen, publication un an, refus ou précisions avec réponse personnalisée de 30 à 4 000 caractères, retrait et demandes reçues.

## Cycle de vie et droits

- Les tables privées ne sont lisibles que par leur propriétaire et l’administration. Aucune écriture directe n’est accordée aux clients : les RPC contrôlent l’identité et les changements autorisés.
- Une présentation nouvelle ou modifiée devient `en_attente`, même si la requête est envoyée par un administrateur. La publication exige une action de modération distincte.
- La mise à jour des disponibilités ne change ni la décision ni l’échéance. Un programme expiré, archivé ou entièrement vendu disparaît du catalogue et de son URL publique.
- La suppression d’un logement dans un dossier le désactive ; son identifiant reste lié aux demandes historiques.
- Les demandes de contact vérifient la publication du programme, la disponibilité du logement et le consentement. Une adresse peut déposer au maximum dix demandes par jour, avec dix minutes entre deux demandes pour le même programme. Ce contrôle est une première protection contre les doublons, pas un remplacement d’une protection antibot de passerelle en cas d’abus.
- Les emails de décision réutilisent le circuit existant. Une demande de contact notifie le promoteur et la gestion ; la confirmation utilisateur indique l’enregistrement, pas une réception email garantie.
- Un rappel demande au promoteur de reconfirmer les disponibilités après 90 jours. Un seul rappel accepté par cycle d’actualisation ; jusqu’à trois tentatives dans les 23 heures, même clé d’idempotence. Les échecs restent dans `program_reminder_jobs`.

## Déploiement

1. Appliquer `supabase-v38-programmes-neufs.sql`.
2. Redéployer `notify-admin` avec son secret et sa configuration email existants.
3. Appliquer `supabase-v38b-program-integrations.sql` : notifications, bucket PDF public limité aux dépôts dans le dossier du compte, rappel toutes les quinze minutes.
4. Déployer l’interface et les réécritures Vercel.
5. Tester le dépôt, l’examen, le contact et les disponibilités avec un dossier explicitement identifié comme test ; l’archiver après vérification. Ne pas conserver de programme fictif publié.

Contrôles : `npm test`, `npm run build`. Les tests PostgreSQL utilisent PGlite. Les tests du worker emploient un fournisseur simulé ; seule une vérification réelle peut confirmer un envoi accepté.

## Passage futur au payant

La qualité du déposant (`promoteur` / `agence`) et la propriété des programmes sont séparées de la modération. Les écritures passent par des RPC, où de futurs droits commerciaux peuvent être vérifiés côté serveur.

Aucun tarif, abonnement ou prélèvement n’est activé par cette version. Définir les offres (publicité ponctuelle, visibilité, nombre d’annonces ou de programmes), les quotas, les conditions de renouvellement et le traitement des comptes existants avant d’ajouter un prestataire de paiement. Les droits d’abonnement devront provenir d’événements serveur validés, jamais d’un simple retour de page de paiement.

Les alertes de recherche existantes concernent les annonces classiques ; elles ne sont pas étendues silencieusement aux programmes neufs.
