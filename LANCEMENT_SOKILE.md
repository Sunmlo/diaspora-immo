# Mise en ligne sécurisée de Sokilé

## Mise à niveau v33

Exécutez maintenant `supabase-v33-workflows.sql` : il ajoute « Mes annonces », remet automatiquement chaque modification en validation, et crée les tables de l'annuaire et des demandes publicitaires.

Pour recevoir chaque nouvelle demande dans `contact@sokile.com`, suivez ensuite `NOTIFICATIONS_SOKILE.md`. L'e-mail part d'une fonction Supabase sécurisée via Resend, jamais directement du navigateur.

## Ordre des opérations

1. Dans Supabase, ouvrir **SQL Editor** puis **New query**.
2. Puisque la sécurité initiale a déjà été installée, copier uniquement `supabase-v33-workflows.sql`.
3. Cliquer sur **Run** et vérifier que les trois compteurs de contrôle s'affichent sans erreur.
4. Configurer les e-mails en suivant `NOTIFICATIONS_SOKILE.md`.
5. Envoyer ensuite les fichiers corrigés sur la branche `main` du dépôt GitHub `Sunmlo/diaspora-immo`.
6. Dans Vercel, attendre que le nouveau déploiement affiche **Ready**.
7. Tester avec un compte : dépôt, affichage dans « Mes annonces », validation, puis modification.
8. Vérifier qu'après modification l'annonce possède `status = en_attente`, `active = false` et `verified = false`.
9. Pour la valider pendant la bêta, modifier dans Supabase : `status = validee`, `active = true` et `validated_at = now()`.

## Ce qui a été corrigé

- dépôt d’annonces réservé aux comptes réellement connectés ;
- suppression de la fausse session de démonstration ;
- rafraîchissement de la session Supabase ;
- rattachement de chaque annonce à `owner_id` ;
- maximum de 10 photos et 8 Mo par photo avant compression ;
- stockage dans un dossier propre à chaque utilisateur ;
- alignement du code avec les colonnes `price` et `tags` ;
- annonce créée obligatoirement en attente de modération ;
- exclusion des emails de la vue publique ;
- affichage limité aux annonces actives et validées ;
- chargement initial limité aux 24 annonces les plus récentes ;
- correction des liens vers les pages juridiques.
- mise à jour de la page « Qui sommes-nous » autour des trois piliers Biens, Prestataires et Guides ;
- ajout des statuts de transparence des prestataires et d'un avertissement clair sur le rôle de mise en relation de Sokilé.

## Vérifications encore obligatoires avant la communication publique

- Après immatriculation, remplacer « société en cours de constitution » par la forme juridique, le capital, le siège, le SIREN/SIRET et les autres informations officielles de Sokilé.
- Tester le parcours complet sur téléphone et ordinateur.
- Ne jamais placer une clé Supabase `service_role` dans le code ou dans GitHub.

## Remarque sur les 32 annonces existantes

Elles restent conservées. Elles sont toutes actuellement marquées comme validées et vérifiées, sans photos ni propriétaire. Avant le lancement, vérifier qu’elles sont bien présentées comme contenus de démonstration ou remplacer leurs informations par des annonces réelles.
