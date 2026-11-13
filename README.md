# Dactylo

Application web pour apprendre à taper au clavier en jouant. Un seul fichier HTML, sans dépendance : elle fonctionne en ligne et hors ligne (enregistrez `index.html` et ouvrez-le).

## Fonctionnalités
- 15 leçons sur le clavier AZERTY complet (rangées, index, ponctuation, majuscules, accents, chiffres, symboles, AltGr)
- Clavier et mains 3D colorés par doigt, trois niveaux d'aide
- Course de voitures en 3D (Three.js), avec repli automatique en pixel art si la 3D n'est pas disponible
- 7 jeux jouables en pixel art : course de voitures, défense du château, zombies, pêche, ballons, fusée, avion
- Bilan par doigt, thème clair ou sombre

## À faire
- Pizzeria express, Alpiniste, Duel de ninjas
- Multijoueur en temps réel (écran de démonstration pour l'instant)
- QWERTY, touches Entrée / Retour arrière / Tab, sauvegarde, PWA

## Piano
Jeu de piano avec de vraies notes échantillonnées (Do3 à Mi6 en mode libre, Do4 à Mi5 dans les jeux), mode libre, mode Apprendre et mode Rythme.

## Crédits
- Sons de piano : soundfont **FluidR3_GM** (licence MIT) via le dépôt midi-js-soundfonts de Michael Deal.
- Mélodies : domaine public.

## Mises à jour automatiques

Le site (et l'appli installée) se met à jour tout seul, sans rien changer à la main quand on modifie `app.js`, `piano.js`, `style.css`, `index.html`, etc.

- `sw.js` revérifie les fichiers du site auprès du serveur à chaque ouverture et sur demande. Si l'un a changé, il met son cache à jour et prévient la page.
- `update.js` enregistre le service worker, cherche du nouveau au lancement, au retour sur l'appli, au retour du réseau et toutes les 5 minutes, puis recharge la page.
- Le rechargement n'interrompt jamais une partie de frappe, un mini-jeu ou le piano en cours : il attend le repos (3 s sans action). Après 10 minutes sans aucune action, il recharge quand même. La progression est enregistrée juste avant.
- Garde-fou : au plus 3 rechargements automatiques en 2 minutes par session.
- À la toute première installation il n'y a pas de rechargement.

À savoir :
- Les gros fichiers qui changent rarement (sons, polices, icônes, `three.min.js`) sont servis depuis le cache sans revérification. Si vous en remplacez un en gardant le même nom, changez `V` dans `sw.js`.
- Si vous ajoutez un nouveau fichier au site, ajoutez-le à `SHELL` (code) ou `STATIC` (gros fichiers) dans `sw.js` pour qu'il marche hors ligne.
- Les personnes qui ont encore l'ancienne version reçoivent la nouvelle à leur prochaine ouverture ; ensuite tout est automatique.
