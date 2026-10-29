# Préparation Android de Sokilé

Préparation du 29 octobre 2026. Budget autorisé : 25 USD supplémentaires au maximum. Aucune dépense engagée et aucun abonnement ajouté.

## Solution retenue

Application Android Trusted Web Activity, générée avec Bubblewrap 1.25.0, qui ouvre `https://www.sokile.com/`. Elle utilise le site, les comptes et l'hébergement existants. Identifiant proposé : `com.sokile.app`. Android 7 ou supérieur ; cible API 36.

Le manifeste web, les icônes et une page sans connexion sont préparés. Le service worker ne conserve aucune réponse de compte, annonce ou API : seule la page neutre hors connexion est mise en cache. Les alertes existantes restent des emails ; aucune notification push n'est annoncée.

## Budget

- Compte Google Play : tarif officiel 25 USD, une fois. Vérifier le total réel au paiement, y compris frais de conversion ou taxes, avant de respecter le plafond autorisé.
- Générateur, outils Android et adaptations du code : aucun nouveau service payant utilisé.
- Compilation de contrôle : dépôt public, runner GitHub standard gratuit ; aucun cache ou artefact stocké par le workflow.
- L'hébergement actuel continue. La consommation liée aux visites peut évoluer : le plafond n'est pas une garantie sur les factures futures des services existants.
- Pas de paiement ni d'activation de nouvelle offre sans résolution de tout dépassement.

## État et limites

Cette branche prépare l'application ; elle ne la publie pas. Aucune clé privée, compte développeur ou attestation d'identité n'est créé. Le site en production n'est pas modifié tant que cette branche n'est pas intégrée.

La compilation Gradle locale est bloquée par l'accès réseau aux dépendances Android. Le workflow de contrôle compile sur un runner standard et ne publie rien. Son résultat doit être vérifié séparément. Un contrôle de compilation ne remplace pas un essai sur téléphone Android.

## Génération et compilation

```sh
npm ci --prefix tools/android
npm run generate --prefix tools/android
cd android
./gradlew :app:assembleDebug :app:bundleRelease
```

Le dossier `android/` est généré à partir du manifeste, des icônes et du générateur versionnés ; il est exclu de Git. Le bundle release est non signé tant que la signature n'a pas été configurée. L'APK debug sert aux essais et ne doit jamais être soumis à Google Play. Conserver les clés de signature hors de Git dans un stockage privé durable.

## Avant une demande de publication

1. Identifier le compte développeur et la personne ou société réellement responsable. Le choix personnel/organisation doit correspondre à la situation réelle ; ne pas publier des informations personnelles par défaut. Un compte organisation demande notamment un D-U-N-S.
2. Créer/vérifier le compte Google Play et contrôler le total à payer (25 USD annoncé). Pour un nouveau compte personnel, organiser au moins 12 testeurs inscrits en continu pendant 14 jours et demander ensuite l'accès production. Google peut exiger d'autres vérifications.
3. Finaliser les informations de l'éditeur et la politique de confidentialité, ainsi que le parcours de demande de suppression de compte dans l'app et sur le web. Le site indique actuellement une demande par email ; ce point reste à vérifier pour le formulaire Google Play.
4. Préparer la fiche, les captures et les déclarations de sécurité des données à partir des traitements réels, y compris le site chargé par la TWA. Ne pas déclarer « aucune donnée collectée ».
5. Configurer la clé d'upload privée et Play App Signing. Obtenir le SHA-256 du certificat de signature de l'application fourni par Play (différent de la clé d'upload dans le cas habituel).
6. Générer le fichier d'association uniquement avec le vrai certificat : `node scripts/android-assetlinks.mjs 'SHA256_REEL'`. Le publier sur `https://www.sokile.com/.well-known/assetlinks.json` et vérifier une réponse JSON 200 sans redirection. Aucune empreinte fictive n'est incluse dans cette branche.
7. Déployer les ressources web, puis vérifier sur Android la connexion, les liens de confirmation, le retour, les favoris, les images/vidéos, les contacts WhatsApp/téléphone et le mode hors connexion. Sans association de domaine valide, un onglet avec barre de navigateur est attendu.
8. Signer et tester le bundle, soumettre à Google Play. L'acceptation et la date de publication ne sont pas garanties.

Sources :
- https://support.google.com/googleplay/android-developer/answer/6112435
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
