# Candy Prompt — Concept de jeu

> Jeu de match-3 éducatif pour apprendre la **Structure Parfaite** du prompt
> enseignée dans *La Quête de l'IA* (AI Business Synergy).

---

## 1. Le problème de conception à résoudre

Dans un match-3 classique, aligner 3 symboles identiques n'a aucun sens sémantique.
Si on remplace les bonbons par les 7 blocs du prompt, aligner trois fois « Rôle »
n'enseigne rien — et suggère même qu'il faut répéter un bloc, ce qui est faux.

**Conséquence de conception :** la pédagogie ne peut pas vivre dans le geste de match.
Elle doit vivre dans **ce que le match débloque**.

Le match-3 sert de moteur d'engagement (dopamine, cascades, progression).
L'apprentissage est placé aux trois moments où l'attention du joueur est maximale :

| Moment | Attention | Contenu pédagogique injecté |
|---|---|---|
| Déblocage d'un bloc | Haute (récompense) | Choix de formulation : 3 options, une seule bonne |
| Fin de niveau | Très haute (score) | Le prompt complet construit + note de qualité |
| Ouverture d'un acte | Moyenne | Carte de 30 s expliquant le nouveau bloc |

---

## 2. Les 7 tuiles

Les 7 blocs de la Structure Parfaite deviennent les 7 types de tuiles du plateau.

| Bloc | Icône | Ce qu'il apporte au prompt |
|---|---|---|
| **Rôle** | 👑 | L'identité, l'expertise et le ton que l'IA doit adopter |
| **Contexte** | 🔍 | Les informations d'arrière-plan, le cadre de la situation |
| **Demande** | 🎯 | L'objectif central, le but global à atteindre |
| **Tâches** | 📋 | Le découpage en étapes précises et ordonnées |
| **Raisonnement** | 🧠 | La façon de traiter l'information et de prioriser |
| **Format** | 📐 | La structure visuelle du résultat (tableau, liste, code) |
| **Conditions d'arrêt** | ✋ | Les critères de qualité qui valident la mission |

Chaque tuile a une couleur, une icône et un libellé lisibles **sans lecture** —
le joueur doit pouvoir jouer vite, en reconnaissant les formes.

---

## 3. Boucle de jeu

```
BRIEF DU NIVEAU ─→ PLATEAU (match-3) ─→ FRAGMENTS ─→ BLOC REMPLI
                        ↑                                 │
                        └──────────── CHOIX ←─────────────┘
                                        │
                                  FIN DE NIVEAU
                                        │
                            PROMPT COMPLET + NOTE + GRIMOIRE
```

1. **Le brief** — chaque niveau ouvre sur une mission réelle :
   *« Ton client veut un post LinkedIn qui vend sa formation. »*
2. **Le plateau** — grille 8×8. Aligner 3+ tuiles d'un même bloc récolte des
   *fragments* de ce bloc.
3. **La jauge** — un panneau latéral montre le prompt en construction, bloc par bloc.
   Chaque bloc a une jauge à remplir (ex. Rôle : 6 fragments, Contexte : 10).
4. **Le choix** — dès qu'un bloc est rempli, une carte s'affiche : **3 formulations
   proposées, une seule vraiment bonne.** Le joueur choisit. Bonne réponse = bonus
   de score + la bonne formulation entre dans le prompt. Mauvaise réponse = la
   formulation faible entre quand même, mais coûte des points, et une micro-explication
   apparaît (« trop vague : "sois pro" ne définit ni expertise ni ton »).
5. **La fin de niveau** — le prompt entier s'affiche, propre et copiable, avec une
   note sur 100 et le détail par bloc.
6. **Le Grimoire** — chaque prompt terminé est archivé dans une bibliothèque
   consultable et copiable. Le joueur ressort du jeu avec des prompts réellement utilisables.

C'est le point qui différencie ce jeu d'un simple habillage : **il produit un livrable.**

---

## 4. La progression = la courbe pédagogique

Astuce de conception majeure : dans un match-3, la difficulté est pilotée par le
**nombre de types de tuiles** sur le plateau. Or c'est exactement le rythme
auquel on veut introduire les blocs. Les deux courbes se superposent naturellement.

| Acte | Niveaux | Blocs actifs | Message pédagogique |
|---|---|---|---|
| **I — Le Socle** | 1 → 6 | Rôle, Contexte, Demande | Le trio minimum vital. Sans ces 3, aucun prompt ne tient. |
| **II — La Méthode** | 7 → 14 | + Tâches, + Format | On découpe le travail, on impose la forme du résultat. |
| **III — La Maîtrise** | 15 → 24 | + Raisonnement, + Conditions d'arrêt | Les 7 blocs. Le prompt devient un cahier des charges. |

Chaque acte s'ouvre sur une carte de 30 secondes qui présente le ou les nouveaux blocs.
Court. Pas un cours.

---

## 5. Mécaniques de jeu

### Tuiles spéciales
| Combinaison | Tuile obtenue | Effet | Nom thématique |
|---|---|---|---|
| 4 alignées | Précision | Nettoie une ligne ou colonne | *« Un prompt précis balaie le bruit »* |
| 5 alignées | Méta-Prompt | Supprime toutes les tuiles d'un type | |
| Forme en L / T | Itération | Explosion 3×3 | |

### Le budget de coups = budget de tokens
Le nombre de coups d'un niveau est présenté comme un **budget de tokens**.
Métaphore juste : on n'a pas une place infinie, il faut être efficace.

### Obstacles thématiques (les anti-patterns du prompt)
Ce sont les vrais défauts de prompting, transformés en obstacles :

| Obstacle | Comportement | Ce qu'il enseigne |
|---|---|---|
| **Flou** | Tuile givrée, se casse en matchant à côté | Un prompt vague bloque le résultat |
| **Blabla** | Se propage aux cases voisines si non traité | La verbosité envahit et noie le message |
| **Contradiction** | Deux tuiles liées, à détruire dans le même coup | Deux consignes opposées s'annulent |
| **Hors-sujet** | Tuile morte, immobile, à contourner | Le contexte inutile encombre |

### Bonus de structure
Si le joueur enchaîne dans une même cascade deux blocs qui se suivent dans l'ordre
canonique (Rôle → Contexte → Demande → Tâches → Raisonnement → Format → Arrêt),
il déclenche un multiplicateur **« Structure Parfaite »**.
C'est le seul endroit où l'ordre des blocs est récompensé mécaniquement — et c'est
volontairement un bonus, pas une obligation, pour ne pas casser le rythme.

---

## 6. Niveaux Boss — « Répare le prompt »

Tous les 5 niveaux, pas de plateau. Un exercice pur, court (60 s) :

- **Diagnostic** — un prompt est affiché, quel bloc manque ?
- **Remise en ordre** — les 7 blocs sont mélangés, remettre la séquence.
- **Réparation** — un prompt médiocre est donné, choisir la reformulation qui le sauve.
- **Duel** — deux prompts côte à côte, lequel donnera le meilleur résultat et pourquoi ?

Ces niveaux valident réellement l'acquis. Ce sont eux qui transforment le jeu
en outil de formation défendable.

---

## 7. Score et récompense

- **3 étoiles** par niveau : objectif atteint / prompt complet / bonnes formulations choisies.
- **Note de clarté /100** en fin de niveau, détaillée bloc par bloc.
- **Grimoire** : la collection de prompts construits, copiables, exportables.
- **Rangs** : Apprenti → Artisan → Architecte → Maître du Prompt.

---

## 8. Choix techniques proposés

| Sujet | Proposition | Pourquoi |
|---|---|---|
| Stack | React 18 + TypeScript + Vite | Rapide, standard, déployable partout |
| Style | Tailwind CSS | Itération visuelle rapide |
| État | Zustand | Léger, suffisant, pas de Redux |
| Animations | Framer Motion + transitions CSS | Cascades fluides sans moteur de jeu |
| Moteur match-3 | Écrit à la main (~500 lignes) | Aucun besoin de Phaser/PixiJS ici |
| Sauvegarde | localStorage | Pas de backend, pas de compte, pas de RGPD |
| Cible | Mobile-first, portrait, PWA | Le jeu se joue au téléphone |
| Contenu | Fichiers JSON séparés (`levels.json`, `choices.json`) | **Ajouter des niveaux sans toucher au code** |

Le dernier point est important : le contenu pédagogique doit rester éditable
sans développeur.

---

## 9. Périmètre proposé pour la v1

**Inclus**
- Moteur match-3 complet : swap, détection, gravité, cascades, tuiles spéciales
- 10 niveaux jouables (acte I complet + début acte II)
- Le panneau de construction du prompt + les cartes de choix
- L'écran de fin de niveau avec le prompt complet copiable
- 2 niveaux boss
- Sauvegarde de la progression

**Repoussé en v2**
- Actes II et III complets (24 niveaux)
- Grimoire complet avec export
- Défi quotidien
- Sons et polish d'animation
- Classement / partage social

---

## 10. Points ouverts

1. **Destination** — application web autonome à héberger, ou intégration dans
   l'application *La Quête de l'IA* existante ?
2. **Identité visuelle** — charte AI Business Synergy, ou univers graphique
   propre au jeu (plus ludique, plus coloré) ?
3. **Ton du contenu** — briefs génériques (tout public) ou briefs métier calés
   sur les profils LQIA (cadres, consultants, formateurs, community managers) ?
