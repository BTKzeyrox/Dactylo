# Plan pour continuer — Dactylo

État au dernier envoi : tout ce qui est coché dans `TODO.md` est fait et en ligne. Il reste **20 éléments**.
Ce plan les range par ordre de réalisation, dit comment chacun sera vérifié, et sépare ce que je peux terminer
seul de ce qui demande un essai sur un vrai appareil.

## 1. Ce qui est fait (rappel)
- Leçons, 7 jeux jouables en pixel art, course et mains en 3D, bilan par doigt, pseudos et mémoire, réglages (thèmes, polices, sons).
- Hors ligne : installation du cache, **test simulé sans réseau réussi (33/33 ressources)**, `piano.js` et les sons de piano précachés.
- Déploiement automatique Vercel vérifié (statut GitHub « Deployment has completed »).
- Piano v1 : 17 vraies notes, modes Libre / Apprendre / Rythme, 6 mélodies, records.

## 2. Comment je vérifie ce que je fais (et ses limites)
| Outil | Ce qu'il prouve | Limite |
|---|---|---|
| Tests automatiques (faux navigateur) | la logique : touches, scores, modes, enregistrements | pas le rendu réel de la page |
| Rendu 3D et 2D en image (WebGL sans écran) | l'apparence des mains, du clavier, du piano, des jeux | pas la mise en page complète ni les animations |
| Simulation du service worker | le fonctionnement sans réseau | pas l'installation réelle |
| Statuts GitHub | que Vercel a bien déployé | — |
| **Ce que je ne peux pas faire** | écouter un son, tester sur un téléphone, installer l'application | à valider par vous |

## 3. Ordre proposé

### Étape A — Piano v2 (voir `PIANO.md`) — priorité 1
Autres octaves, 5 mélodies de plus, enregistrement de ses morceaux, mode deux joueurs.
Les 7 notes supplémentaires sont déjà dans le dépôt (vérifiées par analyse du spectre).
Taille : moyenne. Risque : faible. Vérification : tests automatiques + images.

### Étape A2 — Piano v3 : instruments et clavier pro (voir `PIANO.md` §3.6) — priorité 1
1) Banque de 8 instruments (piano électrique, orgues, cordes, synthé, vibraphone), 2) effets (réverbération, chorus, vibrato / Leslie, attaque et relâche), 3) transposition et superposition de deux sons. Un GO par étape.
Taille : grande (étape 1 moyenne). Risque : moyen (timbres synthétisés à valider à l'oreille). Vérification : tests audio mesurés dans Chromium.
Ensuite : leçons main droite / main gauche, puis les 4 mélodies restantes.

### Étape B — Polices (4 éléments de la phase 2)
- Ajouter **Lora**, **Playfair Display**, **Pacifico**, **Caveat**, **Atkinson Hyperlegible**, **OpenDyslexic** (fichiers dans le dépôt, chargés seulement quand on les choisit, donc sans alourdir le démarrage).
- Réglages : ensembles « Élégant », « Facile à lire », « Dyslexie » et **choix séparés** titres / texte / texte à taper, enregistrés par joueur.
- Hors ligne : les polices choisies sont mises en cache à la première utilisation.
- Taille : moyenne. Risque : conflit avec les réglages existants (je passerai par un module séparé comme pour la 3D et le piano).

### Étape C — Les 3 jeux restants (phase 5)
- **Pizzeria express** : des clients arrivent avec une commande (un mot), une jauge de patience ; il faut taper la commande avant qu'ils partent.
- **Alpiniste** : chaque mot juste fait monter d'une prise, chaque erreur fait glisser ; météo qui se dégrade en altitude.
- **Duel de ninjas** : chaque mot tapé frappe l'adversaire, les fautes vous exposent ; adversaire géré par l'ordinateur (le duel entre amis viendra avec le multijoueur en ligne).
- Même style pixel, mêmes réglages de difficulté, résultats dans le bilan.
- Taille : grande (3 jeux). Vérification : tests de logique + images de chaque jeu.

### Étape D — Finitions de l'interface
- **Décors d'accueil en pixel art** (nuages, collines, étoiles, adaptés au thème clair / sombre / animé).
- **Écrans bas et étroits** : masquer le clavier quand il n'y a pas de place (phases 5 et 6, phase 1 avec beaucoup de touches), sans jamais faire défiler la page.
- **Astuce chiffres** : indiquer dans les thèmes de mots que les chiffres demandent Maj sur AZERTY.
- Taille : petite à moyenne. Risque : la mise en page se règle surtout à l'œil → j'aurai besoin de vos retours sur votre écran.

### Étape E — Réglage de la course 3D
Je ne l'ai encore jamais vue en image : je la rends sans écran, je corrige ce qui est laid (caméra, piste, voitures, dégâts) puis vous l'essayez.
Option : passer d'autres jeux en 3D (à décider après l'essai).

## 4. Ce qui demande vos essais (je ne peux pas le faire)
- **Installer l'application sur ordinateur** et la lancer hors connexion (mode avion).
- **Téléphone réel** : claviers avec saisie prédictive, jeux sur petit écran.
- **Écouter** : équilibre des sons, tempo et volume des ambiances (phase 16), qualité du piano.

## 5. Grands chantiers (« Plus tard »)
| Chantier | Ce qu'il faut | Préalables |
|---|---|---|
| Vrai multijoueur en ligne | Supabase (salons, temps réel, anti-triche côté serveur) | accès Supabase autorisé, schéma de base, règles de sécurité |
| Comptes en ligne et classement mondial | authentification + table des scores | choix e-mail / Google, modération des pseudos, cadre pour les enfants |
| QWERTY et textes en anglais | disposition + banques de mots | décision sur les langues à inclure |
| Entrée, Retour arrière, Tab | leçons dédiées (déjà utilisés dans certaines phases) | — |
| Version mobile et tactile | clavier tactile adapté | essais sur téléphone |

## 6. Règles de travail
- Chaque étape est envoyée dans le dépôt séparément (un commit par fonctionnalité) et `TODO.md` est mis à jour.
- Je ne touche pas à `app.js` quand un module séparé suffit (évite les conflits avec vos modifications).
- Avant d'envoyer : tests automatiques + vérification en image quand c'est visuel.
