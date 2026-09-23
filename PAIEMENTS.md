# Préparation des paiements Sokilé

Le lancement reste gratuit. Le catalogue est privé, sans prix initial. Aucune règle de quota ni conversion des comptes existants n’est activée. Cette version permet de préparer les formules et de tester leur premier paiement, uniquement avec un administrateur confirmé.

## Installation

1. Appliquer `supabase-v39-paiements-test.sql` dans le projet Supabase de Sokilé.
2. Déployer la fonction `payments-test` avec `verify_jwt=false` (elle vérifie elle-même l’identité Supabase ou la signature Stripe).
3. Depuis le compte Stripe de Sokilé, utiliser un environnement de test/sandbox. Enregistrer la clé de test dans les secrets Supabase sous `STRIPE_TEST_SECRET_KEY`. Ne jamais la mettre dans Vite, dans Git ni dans une conversation.
4. Dans ce même environnement Stripe, créer une destination webhook : `https://nhyejaubfxjmmuvetayw.supabase.co/functions/v1/payments-test/webhook` pour `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
5. Enregistrer son secret de signature dans Supabase sous `STRIPE_TEST_WEBHOOK_SECRET`.
6. Dans Gestion → Paiements, vérifier la connexion, enregistrer un tarif d’essai, puis autoriser les essais privés. Les clés de production sont refusées. Ne jamais utiliser une vraie carte pour ces essais.

Les variables Supabase standard sont fournies automatiquement au serveur. Les secrets Stripe ne sont jamais retournés au navigateur. Le simple renseignement d’un secret de signature ne prouve pas que le webhook fonctionne : seule une notification reçue et vérifiée apparaît comme confirmation dans Gestion.

## Vérification avant utilisation

- Paiement réussi en test : une seule commande, montant exact, état « Test réussi » après webhook.
- Carte de test refusée : aucun état payé, possibilité de réessayer sur Stripe.
- Retour sans paiement : aucun état payé ; une session abandonnée reste ouverte jusqu’à son expiration Stripe.
- Paiement mensuel ou annuel : création d’un abonnement **de test** ; vérifier son identifiant côté Stripe et l’annuler après l’essai.
- Notification rejouée : un seul événement enregistré ; notification tardive : pas de rétrogradation d’un paiement déjà confirmé.
- Visiteur/membre ordinaire : catalogue et commandes inaccessibles, aucune création ou validation de paiement.
- Test XOF/XAF : unités CFA entières ; EUR : centimes. Vérifier les devises effectivement acceptées par le compte Stripe avant publication d’une offre.

La page de retour ne déclenche aucun droit et ne déclare aucun paiement réussi. Les commandes conservent une copie du nom, du tarif et de la périodicité même si le brouillon est modifié ensuite. Une clé d’idempotence Stripe par commande évite de recréer la session lors d’un nouvel essai réseau. Les commandes sans session âgées de plus de 23 heures ne sont pas recréées.

## Périmètre restant avant lancement commercial

Valider prix, services, quotas, fiscalité et conditions applicables, pays du compte de paiement et devises disponibles, politique des comptes gratuits existants. Ajouter le catalogue public, les droits effectivement acquis, les factures, le portail client, les annulations, les renouvellements, les impayés, les remboursements et leur rapprochement. Cette version ne gère que le premier Checkout de test ; elle n’est pas un système de facturation en production.

Le passage au réel exigera une évolution explicite du serveur : il n’existe aucun commutateur de production dans l’interface.

## Tests automatisés

`npm test` couvre les permissions et contraintes PostgreSQL, les brouillons, la copie des montants, le dédoublonnage des notifications, les limites d’essais, les frontières d’authentification, les refus du mode réel et la conversion des devises. `npm run build` vérifie l’interface.

Références : [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create), [devises](https://docs.stripe.com/currencies), [tests](https://docs.stripe.com/testing), [webhooks Supabase](https://supabase.com/docs/guides/functions/examples/stripe-webhooks).
