/** Les 7 blocs de la Structure Parfaite, dans leur ordre canonique. */
export type BlockId =
  | 'role'
  | 'contexte'
  | 'demande'
  | 'taches'
  | 'raisonnement'
  | 'format'
  | 'arret'

/**
 * Tuiles speciales, obtenues en alignant plus de 3 tuiles.
 * - `precision` : nettoie la ligne ou la colonne (4 alignees)
 * - `iteration` : explosion 3x3 (forme en L ou en T)
 * - `meta` : supprime toutes les tuiles d'un meme bloc (5 alignees)
 */
export type SpecialKind = 'precision-row' | 'precision-col' | 'iteration' | 'meta'

export interface Tile {
  /** Identite stable d'une tuile : c'est elle qui porte l'animation cote React. */
  id: string
  block: BlockId
  special?: SpecialKind
  /**
   * Le « Hors-sujet » : une tuile morte. Elle ne se matche pas, ne se deplace
   * pas au doigt, et ne part qu'en detruisant des tuiles juste a cote d'elle.
   */
  horsSujet?: boolean
}

/** Une case vide vaut `null` (etat transitoire entre la destruction et la gravite). */
export type Cell = Tile | null

export type Board = Cell[][]

/**
 * Le « Flou » : un voile pose sur la CASE, pas sur la tuile. Il reste au sol
 * quand les bonbons tombent, et se dissipe d'une couche a chaque destruction
 * sur cette case. Nettoyer tout le Flou est un objectif de niveau.
 */
export type FlouGrid = number[][]

export interface Position {
  row: number
  col: number
}

/** Un groupe de tuiles detruites par un meme match, avec la forme detectee. */
export interface Match {
  block: BlockId
  positions: Position[]
  /** Tuile speciale a creer, et ou la creer. */
  reward?: { kind: SpecialKind; at: Position }
}

export interface LevelObstacles {
  /** Nombre de tuiles recouvertes de Flou au demarrage. */
  flou?: number
  /** Nombre de tuiles Hors-sujet posees au demarrage. */
  horsSujet?: number
}

export interface Level {
  id: number
  act: 1 | 2 | 3
  title: string
  /** La mission confiee au joueur, en une phrase. */
  brief: string
  /** Les blocs presents sur le plateau. C'est lui qui pilote la difficulte. */
  blocks: BlockId[]
  /** Budget de coups, presente au joueur comme un budget de tokens. */
  moves: number
  /** Fragments a recolter par bloc pour completer le prompt. */
  goals: Partial<Record<BlockId, number>>
  /** Graine du generateur : un meme niveau est toujours identique. */
  seed: number
  obstacles?: LevelObstacles
  rows?: number
  cols?: number
}

export type ChoiceQuality = 'excellent' | 'moyen' | 'faible'

export interface Choice {
  text: string
  quality: ChoiceQuality
  /** Le pourquoi, montre apres le choix. C'est la que l'apprentissage se joue. */
  feedback: string
}

/** Les 3 formulations proposees quand un bloc vient d'etre complete. */
export interface ChoiceCard {
  levelId: number
  block: BlockId
  question: string
  options: Choice[]
}
