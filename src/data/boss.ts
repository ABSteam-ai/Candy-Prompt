import type { BlockId } from '../game/types'

/**
 * Les niveaux « Répare le prompt ».
 *
 * Pas de plateau, pas de bonbons : un exercice court, tous les 5 niveaux.
 * C'est ici que l'acquis se verifie vraiment — le match-3 entretient
 * l'engagement, ces niveaux-la mesurent la comprehension.
 */
export interface BossOption {
  text: string
  correct: boolean
  /** Explication montree apres la reponse, juste ou fausse. */
  feedback: string
}

interface BossBase {
  id: number
  /** Le boss s'ouvre une fois ce niveau termine. */
  afterLevel: number
  title: string
  intro: string
}

export interface BossQuiz extends BossBase {
  kind: 'diagnostic' | 'reparation' | 'duel'
  /** Le prompt soumis au joueur. */
  subject: string
  question: string
  options: BossOption[]
}

export interface BossOrdre extends BossBase {
  kind: 'ordre'
  question: string
  /** La sequence attendue, dans l'ordre canonique. */
  sequence: BlockId[]
  explanation: string
}

export type BossLevel = BossQuiz | BossOrdre

export const BOSS_LEVELS: BossLevel[] = [
  {
    id: 1,
    afterLevel: 5,
    kind: 'diagnostic',
    title: 'Diagnostic',
    intro: "Un prompt t'est soumis. Il lui manque un bloc, et c'est ce manque qui va gâcher la réponse.",
    subject:
      "Tu es un formateur habitué à vulgariser des sujets techniques.\n\nJe dois présenter demain la nouvelle procédure de facturation à des collègues qui ne l'ont jamais utilisée. J'ai 20 minutes.",
    question: 'Quel bloc manque à ce prompt ?',
    options: [
      {
        text: 'La Demande',
        correct: true,
        feedback:
          "Exact. Il y a un rôle et un contexte très corrects, mais on ne demande jamais rien. L'IA va deviner : résumer ? faire des diapositives ? un script ? Tu recevras l'une des trois, au hasard.",
      },
      {
        text: 'Le Rôle',
        correct: false,
        feedback:
          "Non, le rôle est bien là : « formateur habitué à vulgariser ». C'est la demande qui manque — rien n'est explicitement réclamé à l'IA.",
      },
      {
        text: 'Le Contexte',
        correct: false,
        feedback:
          "Non, le contexte est même plutôt riche : le sujet, le public, la durée. C'est la demande qui manque : aucune phrase ne dit ce que l'IA doit produire.",
      },
    ],
  },
  {
    id: 2,
    afterLevel: 5,
    kind: 'ordre',
    title: 'Remise en ordre',
    intro: "Les sept blocs ont été mélangés. Remets-les dans l'ordre de la Structure Parfaite.",
    question: "Reconstitue l'ordre des sept blocs.",
    sequence: ['role', 'contexte', 'demande', 'taches', 'raisonnement', 'format', 'arret'],
    explanation:
      "L'ordre suit la logique du travail : on dit d'abord QUI répond, puis OÙ l'on se situe, puis CE QU'on veut. Vient ensuite le pilotage — COMMENT découper, COMMENT réfléchir — puis SOUS QUELLE FORME rendre, et enfin À QUELLES CONDITIONS c'est réussi.",
  },
  {
    id: 3,
    afterLevel: 10,
    kind: 'reparation',
    title: 'Réparation',
    intro: 'Ce prompt donnera une réponse décevante. Une seule correction le sauve vraiment.',
    subject:
      "Tu es un expert en communication.\n\nMon entreprise lance un nouveau produit le mois prochain.\n\nÉcris-moi quelque chose de percutant pour l'annoncer. Sois créatif et original.",
    question: 'Quelle correction améliore le plus ce prompt ?',
    options: [
      {
        text: "Remplacer « quelque chose de percutant » par le canal, le public et l'effet attendu : « un post LinkedIn de 200 mots, pour nos clients actuels, qui déclenche des demandes de démonstration ».",
        correct: true,
        feedback:
          "Oui. « Quelque chose » est le trou noir du prompt : ni format, ni destinataire, ni objectif. Le combler d'un coup répare la Demande et le Format en même temps.",
      },
      {
        text: 'Ajouter « Sois vraiment très créatif et surprenant » à la fin.',
        correct: false,
        feedback:
          "Non. Empiler les adjectifs sur un prompt vide ne le remplit pas. « Créatif » sans cadre produit du hors-sujet, pas de l'original.",
      },
      {
        text: "Remplacer « expert en communication » par « directeur marketing senior avec 15 ans d'expérience ».",
        correct: false,
        feedback:
          "Le rôle y gagne un peu, c'est vrai. Mais le vrai défaut est ailleurs : on ne sait toujours pas quoi écrire, pour qui, ni pourquoi. Un meilleur rôle ne sauve pas une demande vide.",
      },
    ],
  },
  {
    id: 4,
    afterLevel: 10,
    kind: 'duel',
    title: 'Duel',
    intro: 'Deux prompts pour la même tâche. Un seul donnera un résultat utilisable.',
    subject:
      "PROMPT A\nTu es un analyste financier senior. Analyse en profondeur et de manière exhaustive les données de vente ci-dessous, en couvrant tous les angles possibles. Sois le plus complet possible.\n\nPROMPT B\nTu es un analyste financier senior. À partir des ventes ci-dessous, identifie les 3 produits dont la marge se dégrade le plus vite sur 6 mois. Pour chacun : le chiffre, l'explication la plus probable, l'action à tester. Tableau de 3 lignes, pas de commentaire autour.",
    question: 'Lequel donnera le meilleur résultat ?',
    options: [
      {
        text: 'Le prompt B, parce qu\'il borne le résultat au lieu de demander « tout ».',
        correct: true,
        feedback:
          "Exact. « Exhaustif » et « tous les angles » sont des pièges : l'IA produit alors du volume tiède qui survole tout. B nomme un nombre, un critère, une durée et un format — chaque phrase réduit l'espace des réponses possibles.",
      },
      {
        text: "Le prompt A, parce qu'il laisse à l'IA la liberté de trouver ce qui compte.",
        correct: false,
        feedback:
          "C'est l'erreur la plus répandue. Laisser l'IA « trouver ce qui compte », c'est lui demander de deviner tes critères. Elle appliquera les plus banals, et tu obtiendras une analyse générique.",
      },
      {
        text: 'Les deux se valent, B est simplement plus court.',
        correct: false,
        feedback:
          "La longueur n'est pas le sujet. B est plus contraint : 3 produits, marge, 6 mois, 3 colonnes. C'est la contrainte qui produit la qualité, pas la concision.",
      },
    ],
  },
]

export function bossesAfter(levelId: number): BossLevel[] {
  return BOSS_LEVELS.filter((boss) => boss.afterLevel === levelId)
}
