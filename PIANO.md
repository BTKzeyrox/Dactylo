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
- 1 et 4 : à faire. Les 4 mélodies restantes (3.2) attendent après.

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
- Accords et pédale de sustain (barre d'espace).
- Métronome, niveaux de difficulté, partition affichée.
- Plus d'octaves complètes (88 touches) et plus de mélodies (import d'un fichier MIDI).
- Mode défi du jour, classement entre joueurs de l'appareil.
- Duo en ligne avec le futur multijoueur.

## 6. Crédits et licences
- Sons : FluidR3_GM (licence MIT) via le dépôt midi-js-soundfonts de Michael Deal.
- Mélodies : domaine public. Ne pas ajouter de morceaux sous droits d'auteur.
