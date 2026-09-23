# Expiration des annonces et alertes

## Comportement

- Publication : six mois calendaires pour une location, un an pour une vente, à compter de la validation serveur. Une modification de métadonnées ne prolonge pas la durée.
- Une annonce expirée est exclue de la vue publique, de la recherche et de son lien direct. L'historique reste accessible au propriétaire et à l'administration ; le renouvellement passe par une nouvelle soumission puis une validation.
- Reprise des annonces existantes depuis `validated_at`, puis `modere_le`, puis `created_at` lorsqu'aucune date de validation n'est connue.
- Alertes : un an à compter de la création, adresse vérifiée du compte, maximum 20 alertes actives par compte, critères identiques dédoublonnés. Tous les filtres de recherche sont conservés.
- Annulation depuis le compte ou par lien individuel dans chaque email, sans connexion. L'ouverture du lien ne désabonne pas : la personne confirme explicitement.
- Chaque nouveau bien correspondant déclenche au plus une livraison par alerte. Les alertes annulées/expirées, les adresses de compte modifiées et les annonces retirées/expirées sont recontrôlées avant envoi.
- Le worker réessaie les erreurs avec la même clé d'idempotence Resend ; les essais s'arrêtent avant la fin de sa fenêtre de 24 h. Les lignes en échec restent consultables par le service en base.
- Les anciennes demandes dans `leads` ne sont pas abonnées automatiquement : elles n'ont pas de propriétaire vérifié. Elles restent dans Gestion pour examen.
- Les rappels avant expiration et la rubrique Programmes neufs restent des évolutions distinctes.

## Déploiement

1. Contrôler les fonctions de modération, la vue publique et les types de colonnes existants.
2. Appliquer `supabase-v37-expiration-alerts.sql` dans une transaction. La création des alertes reste désactivée.
3. Déployer `supabase/functions/search-alerts` avec les variables existantes `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `WEBHOOK_SECRET` et `MAIL_FROM`. La vérification JWT de passerelle est désactivée uniquement pour cette fonction ; elle exige le secret de webhook.
4. Redéployer `notify-admin` pour inclure l'échéance dans l'email de validation.
5. Appliquer `supabase-v37b-alerts-schedule.sql`. Contrôler l'appel signé de la fonction : réponse HTTP 200 `paused: true` avant activation.
6. Déployer l'interface puis activer `public.sokile_features.search_alerts` et contrôler une création et une annulation ainsi que le prochain passage de l'ordonnanceur.

Le cron ne détermine pas l'expiration des annonces : le filtre serveur s'applique immédiatement à chaque lecture. L'interface réévalue les échéances toutes les 30 secondes si une page reste ouverte.

## Tests

`npm ci`, `npm test`, `npm run build`.

Les tests SQL utilisent PostgreSQL via PGlite, avec une simulation des rôles et du workflow propriétaire. Ils couvrent les durées, la reprise historique, la réexécution de migration, le masquage public, les droits entre comptes, la correspondance des filtres et l'annulation entre réservation et envoi. Les tests du worker emploient un fournisseur email simulé ; ils ne prouvent pas la réception en boîte mail.

## Exploitation

Suspendre les nouveaux abonnements et les envois sans perdre de données : `update public.sokile_features set enabled=false where name='search_alerts';`.
Contrôler les erreurs : `select id,attempts,last_error,first_attempt_at from public.search_alert_deliveries where sent_at is null and attempts>0;`.
Contrôler le cron : `select jobid,jobname,schedule,active from cron.job where jobname='sokile-search-alerts';` puis ses derniers résultats dans `cron.job_run_details` et les réponses HTTP dans `net._http_response` (ne jamais exporter les secrets).

Référence de l'ordonnanceur : https://supabase.com/docs/guides/functions/schedule-functions
