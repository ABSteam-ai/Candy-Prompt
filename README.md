# Candy Prompt

Jeu de match-3 éducatif pour apprendre la **Structure Parfaite** du prompt
enseignée dans *La Quête de l'IA* (AI Business Synergy).

Le joueur aligne des bonbons, chacun portant un des 7 blocs du prompt. Chaque
bloc complété déclenche un choix de formulation, et le niveau se termine sur le
prompt qu'il vient réellement de construire — copiable et réutilisable.

Le concept complet et les partis pris de conception sont dans [`CONCEPT.md`](./CONCEPT.md).

---

## Démarrer

```bash
npm install
npm run dev        # harnais de développement, http://localhost:5173
npm run build      # typecheck + build de production
npm test           # 32 tests du moteur et du contenu
```

## Intégrer le jeu dans une application

Le jeu est un **composant React autonome**. Il n'impose ni routeur, ni contexte,
ni style global — sa feuille de style est entièrement préfixée `cp-` et toutes
ses variables CSS sont portées par `.cp-root`.

```tsx
import { CandyPrompt } from 'candy-prompt'

export function PageJeu() {
  return <CandyPrompt />
}
```

`src/index.ts` est le point d'entrée du module. `src/main.tsx` et `index.html`
ne servent qu'au harnais de développement et ne partent pas avec le composant.

La progression est sauvegardée dans le `localStorage` du navigateur : pas de
compte, pas de backend, aucune donnée personnelle qui sorte du poste.

## Modifier le contenu pédagogique

Trois fichiers, aucun code à toucher :

| Fichier | Contenu |
|---|---|
| `src/data/levels.ts` | Les niveaux : brief, blocs du prompt, objectifs, budget de coups, obstacles |
| `src/data/choices.ts` | Les cartes de choix : 3 formulations par bloc, avec l'explication de chacune |
| `src/data/boss.ts` | Les niveaux « Répare le prompt » |

Les tests refusent un niveau dont il manquerait une carte de choix, une carte
sans explication, ou un boss sans bonne réponse — le contenu ne peut pas partir
en production à moitié écrit.

### Ajouter un niveau

1. Ajouter un objet dans `LEVELS`.
2. Ajouter une carte dans `CHOICE_CARDS` pour **chacun** de ses `blocks`.
3. Lancer `npm test` puis le calibrage ci-dessous pour fixer `moves`.

## Équilibrage

Le budget de coups d'un niveau n'est pas choisi à vue : il est mesuré.

```bash
node --experimental-strip-types tests/equilibrage.ts
```

Un bot joue 40 fois chaque niveau et rapporte le nombre de coups consommés.
Les budgets sont calés sur le 90e centile de son besoin, ce qui donne 90 à 100 %
de réussite. Dans un jeu pédagogique, bloquer le joueur sur de l'adresse est
pire que d'être un peu généreux.

Deux règles de conception sont issues de ces mesures :

- **Le plateau ne descend jamais sous cinq types de bonbons.** En dessous,
  chaque étape de cascade rase la moitié de la grille et un seul coup suffit à
  vider un niveau. C'est pourquoi `Level.palette` (les bonbons à l'écran) est
  distinct de `Level.blocks` (les blocs du prompt) : la progression pédagogique
  pilote les objectifs, pas le nombre de couleurs.
- **Le Flou ne conditionne pas la victoire.** Une case voilée ne rapporte
  aucun fragment tant qu'elle n'est pas dissipée, mais elle ne verrouille rien.
  Un objectif « tout dissiper » devenait mécaniquement inatteignable sur les
  dernières cases : même avec 60 coups, le bot échouait une fois sur deux.

## Vérifications de bout en bout

Elles pilotent un vrai navigateur et jouent une vraie partie.

```bash
npm run build && npm run preview       # dans un terminal
node --experimental-strip-types tests/partie.e2e.ts    # joue le niveau 1 en entier
node --experimental-strip-types tests/ecrans.e2e.ts    # Grimoire et les 4 niveaux boss
```

`partie.e2e.ts` lit le plateau dans le DOM, calcule ses coups avec le moteur du
jeu, effectue les glissements à la souris, répond aux cartes, et vérifie qu'on
atteint l'écran de bilan avec un prompt complet. C'est ce test qui a révélé que
le navigateur volait le geste de glissement du joueur — un bug invisible en
lecture de code.

## Organisation

```
src/
  game/          moteur de match-3, en TypeScript pur, sans React
    board.ts       alignements, tuiles spéciales, gravité, obstacles
    blocks.ts      les 7 blocs : couleur, icône, rôle pédagogique, piège classique
    rng.ts         générateur déterministe — un niveau est toujours identique
  data/          tout le contenu pédagogique
  store/         orchestration des cascades et de la progression (zustand)
  components/    interface
  index.ts       point d'entrée du module
tests/           moteur, contenu, équilibrage, parties automatisées
```

Le moteur ne dépend pas de React : il se teste seul, ce qui a permis d'isoler
en quelques secondes les problèmes qui venaient de la grille plutôt que de
l'affichage.

## État

**v1 livrée** — moteur complet, 10 niveaux, 38 cartes de choix, 4 niveaux boss,
Grimoire, sauvegarde locale.

Reste à faire : l'acte III et les 14 niveaux suivants, l'export du Grimoire,
le défi quotidien, les sons.
