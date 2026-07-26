import type { BlockId } from './types'

export interface BlockDef {
  id: BlockId
  label: string
  short: string
  icon: string
  /** Couleur principale de la tuile. */
  color: string
  /** Couleur de la facette basse, pour donner du volume au bonbon. */
  shade: string
  /** Ce que le bloc apporte au prompt : le texte de la carte pedagogique. */
  role: string
  /** L'erreur classique sur ce bloc, montree a l'ouverture d'un acte. */
  piege: string
}

/**
 * Les 7 blocs dans leur ordre canonique.
 * L'ordre du tableau fait foi : c'est lui qui sert au bonus « Structure Parfaite ».
 */
export const BLOCKS: BlockDef[] = [
  {
    id: 'role',
    label: 'Le Rôle',
    short: 'Rôle',
    icon: '👑',
    color: '#f6c445',
    shade: '#d69a12',
    role: "Définit l'identité, l'expertise et le ton que l'IA doit adopter pour répondre.",
    piege: "« Sois professionnel » ne définit rien. Un rôle utile nomme un métier, une expérience et un ton.",
  },
  {
    id: 'contexte',
    label: 'Le Contexte',
    short: 'Contexte',
    icon: '🔍',
    color: '#4cc4f0',
    shade: '#1a89bb',
    role: "Fournit les informations d'arrière-plan et le cadre de la situation pour situer l'IA.",
    piege: "L'IA ne connaît ni ton entreprise, ni ton client, ni ton historique. Ce que tu ne dis pas, elle l'invente.",
  },
  {
    id: 'demande',
    label: 'La Demande',
    short: 'Demande',
    icon: '🎯',
    color: '#ff6b8a',
    shade: '#cc2f52',
    role: "Énonce l'objectif central et le but global que tu souhaites atteindre.",
    piege: "« Parle-moi de X » n'est pas une demande, c'est un sujet. Une demande a un but mesurable.",
  },
  {
    id: 'taches',
    label: 'Les Tâches',
    short: 'Tâches',
    icon: '📋',
    color: '#7ee08a',
    shade: '#3d9e50',
    role: 'Découpe le travail en étapes précises et ordonnées à accomplir point par point.',
    piege: "Sans découpage, l'IA traite tout d'un bloc et bâcle les étapes du milieu.",
  },
  {
    id: 'raisonnement',
    label: 'Le Raisonnement',
    short: 'Raison.',
    icon: '🧠',
    color: '#b58cff',
    shade: '#7a4fd1',
    role: "Guide la réflexion de l'IA sur la manière de traiter les informations et de prioriser.",
    piege: "Sans consigne de priorité, l'IA traite tous les éléments comme s'ils avaient le même poids.",
  },
  {
    id: 'format',
    label: 'Le Format',
    short: 'Format',
    icon: '📐',
    color: '#ff9f5a',
    shade: '#d1631d',
    role: 'Détermine la structure visuelle (tableaux, listes, code) et l\'organisation du résultat final.',
    piege: "Si tu ne fixes pas la forme, tu reçois un pavé de texte que tu devras remettre en forme toi-même.",
  },
  {
    id: 'arret',
    label: "Les Conditions d'arrêt",
    short: 'Arrêt',
    icon: '✋',
    color: '#f27bd0',
    shade: '#b7359a',
    role: 'Précise les critères de qualité à respecter pour que la mission soit jugée réussie.',
    piege: "Sans critère de réussite, tu ne peux pas dire si la réponse est bonne. Ni l'IA non plus.",
  },
]

export const BLOCK_BY_ID: Record<BlockId, BlockDef> = Object.fromEntries(
  BLOCKS.map((b) => [b.id, b]),
) as Record<BlockId, BlockDef>

/** Rang d'un bloc dans l'ordre canonique, utilisé par le bonus « Structure Parfaite ». */
export const BLOCK_ORDER: Record<BlockId, number> = Object.fromEntries(
  BLOCKS.map((b, i) => [b.id, i]),
) as Record<BlockId, number>
