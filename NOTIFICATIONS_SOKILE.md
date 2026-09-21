# Alertes de validation Sokilé

Le site enregistre les demandes dans Supabase. Pour recevoir automatiquement un e-mail sur `contact@sokile.com`, installez le circuit ci-dessous après avoir exécuté `supabase-v33-workflows.sql`.

## 1. Configurer Resend

1. Créez un compte Resend et ajoutez le sous-domaine `notifications.sokile.com`.
2. Copiez dans le DNS Vercel les enregistrements demandés par Resend. Cela ne remplace pas les MX Proton de `sokile.com`.
3. Créez une clé API Resend.

## 2. Déployer la fonction Supabase

Dans Supabase : **Edge Functions > Deploy a new function > Via Editor**, nommez-la `notify-admin`, puis copiez `supabase/functions/notify-admin/index.ts`.

Dans **Edge Functions > Secrets**, créez :

- `RESEND_API_KEY` : la clé Resend ;
- `WEBHOOK_SECRET` : une longue valeur aléatoire ;
- `MAIL_FROM` : `Sokilé <alertes@notifications.sokile.com>`.

Déployez avec la vérification JWT désactivée : l'accès est protégé par `WEBHOOK_SECRET`.

## 3. Créer les webhooks Database

Dans **Database > Webhooks**, créez un webhook par table :

| Table | Événements | URL |
|---|---|---|
| `properties` | INSERT, UPDATE | URL publique de `notify-admin` |
| `professionals` | INSERT, UPDATE | même URL |
| `advertising_requests` | INSERT, UPDATE | même URL |
| `reports` | INSERT | même URL |

Ajoutez l'en-tête HTTP `x-webhook-secret` avec exactement la valeur de `WEBHOOK_SECRET`.

## 4. Test final

Déposez une annonce avec un compte test. Contrôlez :

1. la ligne est créée avec `status = en_attente` et `active = false` ;
2. l'e-mail arrive dans `contact@sokile.com` ;
3. après validation manuelle (`status = validee`, `active = true`), l'annonce apparaît ;
4. après modification par l'utilisateur, elle revient à `en_attente`, disparaît du public et déclenche un nouvel e-mail.

Une alerte e-mail aide à ne rien manquer, mais Supabase reste la source de vérité. Contrôlez régulièrement les trois tables en attente.
