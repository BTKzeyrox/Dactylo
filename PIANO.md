# Plan du piano — Dactylo

## 1. État actuel (v1, en ligne)
- **17 vraies notes de piano** (Do4 à Mi5, dièses compris) : soundfont FluidR3_GM (licence MIT) via midi-js-soundfonts.
  Hauteur vérifiée par analyse du spectre (écart ≤ 4 cents), volume égalisé, mono 112 kbps, silence initial retiré.
- **Clavier** : touches blanches sur Q S D F G H J K L M (Do à Mi), dièses sur Z E T Y U O P. Positions **physiques** (`e.code`), étiquettes selon la disposition réelle quand le navigateur la donne.
- **3 modes** : Libre, Apprendre (la mélodie attend la bonne touche), Rythme (notes qui tombent ; Parfait / Bien / Ok / Raté, série, étoiles).
- **6 mélodies du domaine public** : Ode à la joie, Au clair de la lune, Ah ! vous dirai-je maman, Frère Jacques, Jingle Bells, Für Élise (début).
- Records par joueur, volume, souris et tactile, accès par le menu et le catalogue des jeux, hors ligne (sons préchargés et précachés).
- 27 vérifications automatiques réussies.

## 2. Déjà dans le dépôt pour la v2
7 notes supplémentaires, vérifiées et égalisées : **C3, Eb3, Gb3, A3, A5, C6, Eb6** (`sounds/piano/`). Elles ne sont pas encore utilisées par le jeu.
Total des 24 échantillons : environ 1,1 Mo.

## 3. v2 — fonctionnalités prévues

### 3.1 Autres octaves (FAIT)
- Étendue **Do3 → Mi6** avec 3 positions : octaves 3–4, 4–5 (par défaut), 5–6.
- Commandes : flèches ↑ ↓ ou boutons − / + ; disponible en mode Libre ; les mélodies restent dans l'octave par défaut.
- Les notes qui n'ont pas d'échantillon sont **transposées depuis la note la plus proche** (au plus 2 demi-tons, soit 12 % de vitesse) : technique standard des échantillonneurs.
- Les étiquettes des touches affichent le numéro d'octave (Do3, Do4…).
- Les 7 nouveaux fichiers vont dans le cache préinstallé (`sw.js`).

### 3.2 Plus de mélodies (domaine public)
Ajouter : **Joyeux anniversaire**, **Douce nuit**, **Mary avait un petit agneau**, **London Bridge**, **Row, row, row your boat** → 11 mélodies au total.
Règle : uniquement des airs dont je suis sûr de la mélodie ; tout doit tenir dans Do4–Mi5. Vérification automatique : toutes les notes existent sur le clavier.

### 3.3 Enregistrer ses propres morceaux
- En mode Libre : **● Enregistrer / ■ Arrêter**, **▶ Réécouter**, liste des enregistrements, **Supprimer**.
- Stockage par joueur dans `localStorage` (clé `dactylo.piano.rec.v1`), indépendant de la sauvegarde de l'application.
- Format : liste de notes `{m: numéro MIDI, t: début en secondes, d: durée}`.
- **« Jouer ce morceau »** : convertit l'enregistrement en mélodie (tempo 100, durées arrondies au demi-temps, silences conservés) pour le rejouer en Apprendre ou en Rythme. Limite : seules les notes de l'octave 4–5 sont jouables dans les jeux.
- Indicateur « REC » avec chrono à l'écran.

### 3.4 Mode deux joueurs (au tour par tour)
- Une même mélodie, **une phrase sur deux** pour chaque joueur (4 notes par phrase) : notes entourées de rose (joueur 1) ou de bleu (joueur 2), bandeau « Joueur 1 / Joueur 2 » avec le joueur actif en surbrillance.
- Chacun a son score, sa série et ses fautes ; résultat : scores des deux joueurs et vainqueur (ou égalité).
- Même clavier, on se le passe : le jeu ne cherche pas à distinguer les joueurs par touche.
- Vitesse Lent / Normal / Rapide comme en Rythme.

### 3.5 Demandes du 12/11 (ordre : 1 réglages + durée des notes, 2 métronome, 3 accordage, 4 clavier pro)
- **2. Métronome : FAIT** (40–220 BPM, 2/3/4/6 temps, accent, volume, voyants).
- **3. Accordage : FAIT** (La4 de 430 à 450 Hz, bouton « Jouer le La », remise à 440).
- **Leçons d'accords : FAIT** (mode « Leçons », 6 leçons).
- **Correctifs piano : FAIT** : relâchement progressif (une note sonne au moins 0,3 s puis s'éteint en douceur), glissando souris/tactile en mode Libre (plusieurs doigts possibles), plus de plantage sans Web Audio (message clair, leçons sans chrono), `piano.js` réécrit lisiblement (même API `window.Piano`).
- **Écho : FAIT** : ligne à retard avec répétitions de plus en plus sourdes ; bouton « Écho », réglages « Délai » (100–800 ms) et « Répétitions » (0–80 %), mémorisés. Désactivé par défaut ; le tic-tac du métronome n'est pas touché.
- **Nouveau design « piano de scène » : FAIT** : panneau graphite avec écran LCD ambre (mode, morceau, tempo, octaves, accord, écho), boutons de piano à voyant (modes, vitesse, pédale, écho, tic-tac), boutons rotatifs ronds (volume, délai et répétitions de l'écho, accord, tempo, volume du tic-tac ; glisser, molette, flèches, double-clic = valeur d'origine), objet métronome à balancier synchronisé sur l'horloge audio (le poids monte quand le tempo ralentit ; clic dessus = démarrer/arrêter), clavier avec feutre rouge, touches ivoire/ébène et joues noires. Les boutons de mode utilisent `data-mode` et non `data-m` : `app.js` remplit tout élément `[data-m]` avec l'icône du chat.
- **Menu latéral masquable + piano sur une seule page sans défilement : FAIT** (clavier redimensionné, panneau compact).
- **Tic-tac en vrais sons : FAIT** (Bois / Clic / Cloche) et **écho corrigé : FAIT** (ping-pong, limiteur de sortie).
- **Import de morceaux MIDI : FAIT** (Apprendre et Rythme, 20 morceaux gardés sur l'appareil).
- **Mixage anti-saturation : FAIT** : chaîne de sortie clavier → volume → bus de compression doux (seuil −22 dB, ratio 4, attaque 15 ms) → écho (pris après le bus) → limiteur fin (seuil −3 dB) → écrêtage doux (jamais au-dessus de 0 dB). Le gain automatique que le navigateur ajoute aux compresseurs est compensé. Le niveau de l'écho est compensé par les répétitions (à 70 %, il doublait la puissance du son). Sous pédale, rejouer une touche libère l'ancienne note (comme une vraie corde) et le nombre de notes tenues est plafonné à 24. Mesuré hors ligne (volume 100 %, écho 70 %, pédale) : jeu dense 1,3 à 2,8 dB moins chargé, crête 0,75–0,86 au lieu de 0,87–0,92, distorsion d'un grave pur divisée par 3, notes isolées au même niveau. Pire cas (couche cordes 100 %, réverbération église 100 %, chorus 100 %, écho 70 %, pédale) : avant, la sortie dépassait 0 dB (crête 1,18, 0,07 % des échantillons écrêtés) ; maintenant crête 0,91 et aucun dépassement.
- À faire ensuite : le plan « instruments et clavier pro » (§3.6), puis leçons main droite / main gauche, puis les 4 mélodies restantes (3.2).

### 3.6 Instruments et clavier pro — plan en 3 étapes (demande du 13/11)
Règle de travail : **un GO par étape**, un changement testé à la fois, commit direct sur `main`.
Les autres instruments n'ont pas d'échantillons : ils sont **synthétisés avec Web Audio** (oscillateurs, enveloppes, modulation), donc hors ligne et sans fichiers en plus. Je ne peux pas écouter : les hauteurs, l'attaque et l'extinction se contrôlent par mesure ; le **timbre se juge à l'oreille**, par l'utilisateur.

**Étape 1 — Banque d'instruments** *(FAIT)*
- Sélecteur « Instrument » dans le panneau, 8 sons : **Piano** (échantillons actuels, par défaut), **Piano électrique** (type Rhodes), **Orgue jazz** (type Hammond, 9 tirettes, clic d'attaque), **Orgue d'église** (tuyaux, plein), **Orgue rock** (mordant, vibrato), **Cordes** (ensemble, attaque lente), **Synthé** (lead, filtre qui s'ouvre), **Vibraphone** (lames qui résonnent).
- Fonctionne avec : touches, pédale, écho, octaves, accord, leçons, mélodies importées. Un orgue tient la note tant que la touche est enfoncée. Polyphonie : 8 notes sans saturation. Le tic-tac n'est pas touché.
- Choix mémorisé (clé `dactylo.piano.inst.v1`).
- Tests (Chromium + analyseur audio) : hauteur mesurée de chaque note de chaque instrument ; arrêt net au relâchement ; pas de saturation à 8 notes ; mise en page toujours sur une seule page ; mémorisation ; secours si Web Audio manque. Cache `sw.js` en v45.

**Étape 2 — Effets de clavier pro** *(FAIT)*
- **Réverbération** (salle / église) avec dosage ; **chorus** ; **vibrato / Leslie** (haut-parleur rotatif) pour les orgues ; **Attaque** et **Relâche** réglables.
- Boutons rotatifs dans le style « piano de scène », réglages mémorisés, remise à zéro par double clic. Tout passe par le limiteur de sortie existant ; le tic-tac reste hors effets.
- Tests : mesure de la queue de réverbération, du niveau de crête (jamais au-dessus de 0 dB), de la profondeur du vibrato ; mise en page une page.

**Étape 3 — Jeu avancé** *(FAIT)*
- **Transposition** de −6 à +6 demi-tons : les touches ne bougent pas, le son change ; elle s'ajoute aux octaves et à l'accord, dans tous les modes ; affichage LCD « Transp. +2 », mémorisée, double clic pour remettre à 0.
- **Superposition de deux sons** (par exemple piano + cordes) avec dosage entre les deux.
- Tests : hauteur mesurée pour chaque transposition et chaque octave ; superposition sans saturation ; mise en page une page.

Idées pour plus tard (hors des 3 étapes) : sons de basse, split clavier (deux sons, main gauche / main droite), arpégiateur, enregistrement multipiste.

## 4. Vérifications prévues
1. Chaque touche joue le bon échantillon ; les notes transposées utilisent la bonne vitesse de lecture.
2. Changement d'octave : étiquettes et hauteurs justes ; retour à l'octave 4 en mode jeu.
3. Enregistrement : durées et ordre corrects, relecture fidèle, sauvegarde par joueur, suppression, conversion en mélodie.
4. Deux joueurs : alternance des phrases, scores séparés, vainqueur correct, égalité.
5. Hors ligne : les 24 fichiers sont dans le cache préinstallé (test de simulation sans réseau).
6. Images du jeu pour les modes Libre, Rythme, Deux joueurs et les résultats.
**Limite :** je ne peux pas écouter ; la qualité du timbre et des notes transposées est à juger à l'oreille.

## 5. Plus tard (idées)
- **Clavier MIDI** branché en USB (API Web MIDI) pour jouer avec un vrai piano.
- Accords : voir les leçons (FAIT). **Pédale de sustain (barre d'espace) : FAIT** : tant qu'elle est enfoncée, les notes relâchées continuent de sonner ; bouton « Pédale » pour le tactile, voyant « PÉD. » sur le clavier.
- Métronome, niveaux de difficulté, partition affichée.
- Plus d'octaves complètes (88 touches) et plus de mélodies (import d'un fichier MIDI).
- Mode défi du jour, classement entre joueurs de l'appareil.
- Duo en ligne avec le futur multijoueur.

## 6. Crédits et licences
- Sons : FluidR3_GM (licence MIT) via le dépôt midi-js-soundfonts de Michael Deal.
- Mélodies : domaine public. Ne pas ajouter de morceaux sous droits d'auteur.
