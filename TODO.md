# To-do liste du projet Dactylo

> Plans détaillés pour la suite : [`PLAN.md`](PLAN.md) (projet) et [`PIANO.md`](PIANO.md) (piano).

## Phase 0 : Décisions à confirmer
- [x] Pixel art ou 3D pour la course : décidé — pixel art pour les jeux, 3D pour la course de voitures et les mains
- [x] Icônes : décidé — pixel art dessinées dans le code (identiques sur tous les appareils, utilisables hors ligne)
- [x] Mascotte : décidé — un petit chat pixel qui réagit à la frappe
- [x] Ensemble de polices par défaut : décidé — « Douceur » (Pixelify Sans, Poppins, Press Start 2P)

## Phase 1 : Nouveau design
- [x] Palette Crème : blanc légèrement jaune, accents miel et pêche
- [x] Palette Nuit de lune : gris bleu, accent jaune lune, étoiles discrètes
- [x] Bouton de thème en petit soleil ou petite lune pixel
- [x] Thème suivant l'ordinateur par défaut
- [x] Boutons « bonbon » arrondis avec petit rebond
- [x] Ombres douces et coins très arrondis
- [ ] Décors pixel art d'accueil (nuages, collines, étoiles)
- [x] Mascotte animée qui réagit à la frappe

## Phase 2 : Polices
- [x] Intégrer les polices dans le dépôt, pour le hors ligne (environ 200 Ko)
- [x] Pixel : Pixelify Sans, Press Start 2P, Silkscreen, VT323
- [x] Douces : Poppins, Fredoka, Nunito, Quicksand
- [ ] Élégantes : Lora, Playfair Display, Times New Roman si installée
- [ ] Logo : Pacifico ou Caveat
- [x] Texte à taper : JetBrains Mono ou Courier Prime
- [ ] Accessibilité : Atkinson Hyperlegible et OpenDyslexic
- [x] Ensembles : Douceur, Arcade rétro, Bonbon, Élégant
- [x] Réglages > Police avec aperçu en direct
- [ ] Choix séparés pour titres, texte et texte à taper
- [x] Curseur de taille du texte
- [x] Police enregistrée par profil

## Phase 3 : Icônes et mains
- [x] Jeu d'icônes pixel art en tons pastel (maison, mains, manette, drapeau, graphique, soleil, lune, voiture, fusée, château, poisson, ballon, avion, crâne, pizza, montagne, ninja, étoile, trophée, cœur)
- [x] Remplacer toutes les icônes actuelles
- [x] Deux mains pixel art : doigts arrondis, pouces, ongles, ombres
- [x] Une couleur pastel par doigt
- [x] Doigt à utiliser qui s'illumine, bouge et fait une étincelle
- [x] Mains posées sur les repères F et J au début de chaque leçon : les index reposent sur F et J (touches marquées d'un repère) dans la scène 3D
- [x] Clavier recoloré avec les nouveaux pastels

## Phase 4 : Profils et mémoire
- [x] Écran d'entrée : saisir un pseudo, sans mot de passe ni e-mail
- [x] Un profil par pseudo (progression, bilan par doigt, records, réglages)
- [x] Changement de joueur en un clic
- [x] Classement local des profils
- [x] Sauvegarde sur l'appareil : profils, progression, scores, thème, son, polices
- [x] Bouton « Réinitialiser » avec confirmation : profil actuel ou toutes les données
- [x] Exporter et importer la sauvegarde

## Phase 5 : Jeux en pixel art
- [x] Course : sprites animés, route à défilement, déformation et fumée en pixel art
- [x] Défense du château
- [x] Zombies
- [x] Pêche au trésor
- [x] Ballons
- [x] Fusée spatiale
- [x] Pilote d'avion
- [x] Effets : particules, secousses d'écran, flammes de turbo
- [x] Sons 8 bits avec bouton pour couper le son
- [ ] Jeux restants : Pizzeria express, Alpiniste, Duel de ninjas

## Phase 6 : Installation et hors ligne
- [x] Manifeste de l'application
- [x] Service worker avec mise en cache de toutes les ressources
- [x] Icônes d'installation
- [x] Proposition « Installer l'application » dans Chrome et Edge
- [x] Test complet sans connexion : simulé (installation du cache puis réseau coupé : 33/33 ressources servies, repli sur l'accueil) ; piano.js et les 17 sons de piano ajoutés au cache préinstallé. À refaire une fois dans un vrai navigateur (mode avion)
- [x] Mises à jour automatiques au retour de la connexion

## Phase 7 : Mise en ligne
- [x] Séparer le projet en fichiers propres (page, styles, scripts, polices, icônes)
- [x] Envoyer sur GitHub
- [x] Vérifier le déploiement automatique sur Vercel : vérifié via les statuts GitHub (« Deployment has completed » pour le dernier commit)
- [ ] Tester l'installation sur ordinateur

## Phase 8 : 3D
- [x] Three.js embarqué (fonctionne hors ligne, repli automatique sur la version pixel art)
- [x] Mains 3D low-poly avec doigt actif qui se lève et appuie
- [x] Course de voitures en 3D : piste, 4 voitures, caméra qui suit
- [x] Dégâts 3D : carrosserie déformée, fumée, étincelles, turbo avec flammes
- [x] Mains 3D améliorées : style jouet avec contour, doigts effilés et articulés, ongles, pouce, poignet et manchette (vérifiées en image)
- [x] Mains 3D plus humaines (paume effilée vers le poignet, avant-bras, doigts plus longs, pouce implanté plus bas), peau marron clair, clavier complet (Tab, Verr. Maj, Entrée, Retour, Ctrl, Alt, Win, Menu), affichage de toutes les nouvelles touches (anneaux) dans la phase « Nouvelles touches », même sur écran de moins de 900 px de haut
- [x] Mains et clavier 3D adoucis : peau couleur humaine, mains et touches translucides, grand clavier aux lettres lisibles, anneau lumineux sur la touche visée (visible à travers la main), les deux pouces restent sur la barre d'espace
- [x] Mains posées sur un clavier AZERTY 3D : repos sur Q S D F et J K L M, pouces sur la barre d'espace, doigts de longueur constante (aucune déformation), la main avance pour les touches éloignées, Maj et AltGr pris en charge (vérifié en images)
- [ ] Régler la course 3D après essai (angle de caméra, couleurs, voitures)
- [ ] Passer les autres jeux en 3D si souhaité

## Phase 9 : Méthode de leçon (type Typing Master)
- [x] Liste des leçons dans un panneau latéral, texte à taper en haut
- [x] 6 phases par leçon, au choix et dans l'ordre libre (Nouvelles touches, Drills, Mots, Phrases, Paragraphe, Exercice texte)
- [x] 3 niveaux : 1 débutant 92 % (80 CPM), 2 intermédiaire 95 % (150 CPM), 3 avancé 98 % (225 CPM)
- [x] Chrono de 5 min par phase, fin anticipée entre 3 et 4 min si le niveau est atteint
- [x] Rapport de fin de phase : précision, CPM/MPM, caractères critiques, touches lentes, verdict, rattrapage
- [x] Exercice texte avec Backspace limité à la dernière lettre tapée
- [x] Test global de 10 min à 1 h : histoire, peu de chiffres et de signes, courbe de vitesse
- [x] QWERTY et English prévus dans le code mais bloqués (« bientôt »)
- [x] Plus de vocabulaire, tirage sans répétition, voyelles dès la leçon 3, leçons 1 et 2 sans phases de mots
- [x] **Mots** : chaque mot est tapé 3 fois de suite, puis le mot suivant
- [x] **Phrases** : une seule phrase à l'écran, on la tape, puis Entrée pour passer à une autre phrase (Entrée seulement si la phrase est entièrement tapée)
- [x] **Paragraphe** : le modèle s'affiche en haut, un champ de saisie en dessous ; on lit le modèle puis on tape dans le champ
- [x] **Exercice texte** : même principe (modèle et champ de saisie) avec plus de texte que le paragraphe ; Backspace limité à la dernière lettre
- [x] **Barre de progression** et **compte à rebours** placés à droite de l'écran
- [x] **Pause automatique** après 4 s sans frappe, reprise dès que l'utilisateur tape
- [x] Boutons **Suivant** et **Annuler** en bas, à côté de la progression et du compte à rebours
- [x] Choix appliqués (à ajuster si besoin) :
  - **Quantité de contenu** : quota = objectif de vitesse du niveau × 3,5 min, soit 280 / 525 / 790 caractères pour Mots, Phrases et Paragraphe ; Drills × 0,8 ; Exercice texte × 1,4 ; Rattrapage × 0,6. La phase se termine quand le quota est tapé (ou au bout de 5 min). L'ancienne fin anticipée entre 3 et 4 min est remplacée par ce quota.
  - **Suivant** = terminer la phase avec rapport (sans frappe : passe directement à la phase suivante) ; à l'intro « Nouvelles touches », Suivant = commencer.
  - **Annuler** = abandonner la phase et recommencer avec un texte neuf.
  - **Barre, compte à rebours et pause** : aussi pour Drills et Rattrapage ; pas pour « Nouvelles touches » (aucune frappe).
  - **Paragraphe** : modèle + champ de saisie, une erreur reste dans le champ et compte, pas de retour arrière. **Exercice texte** : même principe, Backspace limité à la dernière lettre.
  - **Phrases** : vraies phrases quand c'est possible ; chrono et pause continuent entre deux phrases.

## Phase 10 : Refonte des phases d'une leçon (affichage progressif, frappe sans blocage)
- [x] Leçons 1 et 2 fusionnées (« Milieu · les deux mains »), mots jamais coupés en fin de ligne
- [x] **Règle générale, toutes les phases : on ne bloque jamais.** Une lettre fausse est acceptée, affichée en rouge, comptée comme erreur, et le curseur avance (la vitesse ne doit pas tomber)
- [x] **Resynchronisation par mot** : l'espace passe au mot suivant du modèle ; mot plus court = lettres manquantes comptées en erreur ; mot plus long = lettres en trop comptées en erreur, sans décaler la suite
  - Exemple : modèle « elles aiment les chocolats », tapé « elled aiment les chocolat » → 2 erreurs seulement (d pour s, s manquant), les autres mots sont justes
- [x] Retour arrière : dernière lettre seulement, dans toutes les phases
- [x] **Phase 1 · Nouvelles touches** : grosses tuiles colorées avec le doigt et la position des mains
  - Exemple : [Q] [S] [D] [F] [J] [K] [L] [M] ; Q = auriculaire gauche, F = index gauche, J = index droit ; index sur F et J (repères), pouces sur espace
  - Un clic sur une tuile montre le bon doigt sur les mains 3D et allume la touche
- [x] **Phase 2 · Drills** : afficher seulement le groupe en cours et les 3 suivants, le reste masqué ; la fenêtre avance d'un cran à chaque groupe tapé
  - Exemple : fjfj dkdk sqsq lmlm
- [x] **Phase 3 · Mots** : un mot tapé 3 fois de suite, puis le mot suivant, un seul groupe affiché à la fois
  - Exemple : salle salle salle, puis mois mois mois
- [x] **Phase 4 · Phrases** : une phrase à la fois, bouton Entrée visible dès le début et à la fin (grisé pendant la frappe, actif quand la phrase est finie, cliquable à la souris), puis phrase suivante
  - Exemple : Il mange du pain frais. [⏎ Entrée]
- [x] **Phase 5 · Paragraphe** : 2 à 3 paragraphes courts affichés à la fois avec le champ de saisie dessous ; quand ils sont tapés, 2 à 3 autres arrivent
  - Exemple : Le chat dort sur le canapé. Il rêve de lait. (puis 2 autres lignes)
- [x] **Phase 6 · Exercice texte** : modèle en petits caractères pour afficher 5 à 7 phrases d'un coup, champ de saisie dessous
  - Exemple : Il était une fois un vieux marin. Il vivait près de la mer. Chaque matin, il marchait sur la plage… (5 à 7 phrases)
- [x] Interprétations retenues (à corriger si besoin) : phase 3 = même mot ×3 puis suivant ; phase 4 = bouton Entrée visible pendant toute la phrase, actif à la fin

- [x] Test global : même règle de frappe sans blocage et resynchronisation par mot
- [ ] Écrans bas et étroits : le clavier se masque quand il n'y a pas de place (phases 5 et 6, ou phase 1 avec beaucoup de touches)

## Phase 11 : Thèmes de mots pour les jeux
- [x] Pastilles « Thème des mots » sur la page Jeux, choix multiple, enregistré par profil
- [x] Thèmes : Mots courants, Touches étudiées (jusqu'à la leçon choisie), Chiffres, Fruits, Noms, Pays, Professions
- [x] Appliqué aux jeux de mots et au texte de la course de voitures (minuscules, sans accents)
- [ ] À savoir : les chiffres demandent la touche Maj sur AZERTY

## Phase 12 : Drills et exercice texte
- [x] Drills : les groupes finis restent à l'écran (grisés), seuls les 3 suivants sont visibles, par blocs de 10 groupes
- [x] Option « Bloquer sur les fautes » pour l'Exercice texte seulement (Réglages), désactivée par défaut : la lettre fausse est comptée mais le curseur reste, espace trop tôt et retour arrière ignorés

## Phase 13 : Un design par phase
- [x] Exercice texte : au moins 5 phrases affichées (7 sur grand écran), phrases générées plus longues quand la leçon n'a pas de phrases réelles
- [x] Drills : touches de clavier (finies en vert, en cours en relief)
- [x] Mots : trois tickets avec le même mot
- [x] Phrases : bulle bleue avec bouton ⏎ Entrée à droite
- [x] Paragraphe : feuille lignée avec marge et bloc-notes vert pour la saisie
- [x] Exercice texte : page de livre (serif) et feuille de machine à écrire pour la saisie
- [x] Couleur propre à chaque phase, reprise sur les pastilles en haut

## Phase 14 : Blocage sur les fautes
- [x] Phases 2 à 5 (Drills, Mots, Phrases, Paragraphe) et rattrapage : bloqué sur les fautes, la lettre fausse est comptée et il faut retaper la bonne touche ; espace trop tôt, lettre en trop et retour arrière ignorés
- [x] Exercice texte : libre par défaut (lettre fausse acceptée en rouge, resynchronisation par mot) ; option « Bloquer sur les fautes » dans Réglages
- [x] Test global : reste libre (sans blocage)

## Phase 15 : Mobile
- [x] Saisie sur téléphone : champ invisible qui ouvre le clavier du téléphone et réinjecte les lettres, le retour arrière et Entrée (leçons, test global, jeux) ; bouton « ⌨ Clavier » pour l'ouvrir ; les claviers physiques marchent toujours
- [x] Mise en page mobile sans défilement latéral (Accueil, Leçons, Test global, Jeux, Bilan, Réglages) ; barre du bas qui tient en largeur
- [x] Leçons sur téléphone : barre du haut sur deux lignes, bandeau compact (chrono, progression, Suivant / Annuler), mains et clavier dessinés masqués
- [x] Clavier du téléphone ouvert : barre du bas, barre des phases et champ miroir masqués pour garder le texte visible
- [ ] À vérifier sur un vrai téléphone : claviers avec saisie prédictive, jeux sur petit écran

## Phase 16 : Thèmes animés et musique
- [x] Thème **Soleil** (ex-Crème) amélioré : soleil avec halo qui pulse et rayons qui tournent, nuages qui dérivent, particules de lumière
- [x] Thème **Lune** enrichi : lune avec halo, étoiles qui scintillent, étoiles filantes toutes les 8 à 15 s, nuages sombres
- [x] Nouveau thème **Océan** : ciel et nuages, trois couches de vagues, plage avec coquillages, palmier qui se balance, mouettes qui battent des ailes
- [x] Réglage **Animations** : Activées, Réduites, Coupées (et respect du réglage « réduire les animations » du système)
- [x] Décor atténué pendant la frappe ; moins d'éléments sur téléphone
- [x] **Musique cozy et chill** générée par le navigateur (Web Audio, sans fichier) : lo-fi (piano électrique, basse, batterie douce, crépitement), ambiance par thème (oiseaux et harpe, carillons et grillons, vagues et mouettes)
- [x] Réglages : musique activée/coupée (coupée par défaut), volume, ambiance ; bouton 🎵 dans la barre latérale et en haut à droite sur mobile ; volume divisé par deux pendant la frappe ; pause quand l'onglet est caché
- [ ] À écouter et ajuster à l'oreille : équilibre des sons, tempo, volumes des ambiances

## Phase 17 : Piano
- [x] Vraies notes de piano : 17 échantillons (Do4 à Mi5, dièses compris), hauteur vérifiée par analyse du spectre, volume égalisé, mis en cache pour le hors ligne
- [x] Clavier-piano : touches blanches sur Q S D F G H J K L M, dièses sur Z E T Y U O P (positions physiques, étiquettes selon la disposition du clavier)
- [x] Mode Libre, mode Apprendre (la mélodie attend la bonne touche) et mode Rythme (notes qui tombent, Parfait / Bien / Ok / Raté)
- [x] 6 mélodies du domaine public : Ode à la joie, Au clair de la lune, Ah ! vous dirai-je maman, Frère Jacques, Jingle Bells, Für Élise (début)
- [x] Score, série, précision, étoiles, records par joueur ; souris et tactile ; carte dans le catalogue des jeux et entrée dans le menu
- [ ] Autres octaves (graves et aigus), plus de mélodies, enregistrement de ses propres morceaux
- [ ] Mode deux joueurs

## Plus tard
- [ ] Vrai multijoueur en ligne avec Supabase
- [ ] Comptes en ligne et classement mondial
- [ ] Disposition QWERTY et textes en anglais (bloqués dans Réglages pour l'instant)
- [ ] Touches Entrée, Retour arrière et Tab
- [ ] Version mobile et tactile
