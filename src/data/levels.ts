import type { BlockId, Level } from '../game/types'

/**
 * Palettes de plateau.
 *
 * A ne pas confondre avec les blocs du prompt : ce sont les bonbons qui
 * apparaissent a l'ecran. En dessous de cinq types, chaque etape de cascade
 * rase la moitie de la grille et un seul coup suffit a vider un niveau — la
 * progression pedagogique ne peut donc pas piloter directement la palette.
 * Elle pilote les objectifs ; la palette, elle, s'elargit a son propre rythme.
 */
const PALETTE_ACTE_I: BlockId[] = ['role', 'contexte', 'demande', 'taches', 'format']
const PALETTE_ACTE_II: BlockId[] = [...PALETTE_ACTE_I, 'raisonnement']

/**
 * Les niveaux de la campagne.
 *
 * Pour ajouter un niveau, il suffit d'ajouter un objet a ce tableau : aucun
 * autre fichier de code n'est a modifier. Il faut en revanche lui fournir ses
 * cartes de choix dans `choices.ts`, sinon le bloc sera complete sans question.
 *
 * Regles d'equilibrage appliquees ici :
 * - `blocks` decrit le prompt a construire, `palette` les bonbons du plateau.
 * - `moves` est cale sur le 90e centile du besoin mesure par le bot de
 *   `tests/equilibrage.ts`. Dans un jeu pedagogique, bloquer le joueur sur de
 *   l'adresse est pire que d'etre un peu genereux : on vise ~90 % de reussite.
 * - `seed` fige le plateau de depart : un niveau est toujours identique.
 */
export const LEVELS: Level[] = [
  // ---------------------------------------------------------------- Acte I --
  {
    id: 1,
    act: 1,
    title: 'La relance qui ne braque pas',
    brief: "Un client n'a pas répondu à ton devis depuis deux semaines. Tu dois le relancer sans le braquer.",
    blocks: ['role', 'contexte', 'demande'],
    palette: PALETTE_ACTE_I,
    moves: 18,
    goals: { role: 9, contexte: 9, demande: 9 },
    seed: 1011,
  },
  {
    id: 2,
    act: 1,
    title: 'Une heure de réunion en dix lignes',
    brief: "Tu sors d'une réunion d'une heure. Il faut en tirer un compte-rendu que tes collègues liront vraiment.",
    blocks: ['role', 'contexte', 'demande'],
    palette: PALETTE_ACTE_I,
    moves: 20,
    goals: { role: 10, contexte: 12, demande: 10 },
    seed: 2022,
    obstacles: { flou: 4 },
  },
  {
    id: 3,
    act: 1,
    title: "L'annonce qui trouve preneur",
    brief: "Tu revends un objet d'occasion. L'annonce doit inspirer confiance et éviter les questions inutiles.",
    blocks: ['role', 'contexte', 'demande'],
    palette: PALETTE_ACTE_I,
    moves: 18,
    goals: { role: 11, contexte: 12, demande: 11 },
    seed: 3033,
    obstacles: { flou: 6 },
  },
  {
    id: 4,
    act: 1,
    title: "L'avis négatif à désamorcer",
    brief: 'Un client mécontent a laissé un avis public en une étoile. Ta réponse sera lue par tous les suivants.',
    blocks: ['role', 'contexte', 'demande'],
    palette: PALETTE_ACTE_I,
    moves: 20,
    goals: { role: 12, contexte: 12, demande: 12 },
    seed: 4044,
    obstacles: { flou: 6, horsSujet: 2 },
  },
  {
    id: 5,
    act: 1,
    title: 'Le sujet que tu dois maîtriser demain',
    brief: "Tu dois comprendre un sujet nouveau avant demain matin. Tu veux une fiche, pas un cours magistral.",
    blocks: ['role', 'contexte', 'demande'],
    palette: PALETTE_ACTE_I,
    moves: 20,
    goals: { role: 12, contexte: 14, demande: 12 },
    seed: 5055,
    obstacles: { flou: 8, horsSujet: 3 },
  },
  {
    id: 6,
    act: 1,
    title: 'Le week-end à organiser',
    brief: 'Tu organises un week-end à trois, avec un budget serré et des envies qui ne se recoupent pas.',
    blocks: ['role', 'contexte', 'demande'],
    palette: PALETTE_ACTE_I,
    moves: 24,
    goals: { role: 13, contexte: 15, demande: 13 },
    seed: 6066,
    obstacles: { flou: 10, horsSujet: 3 },
  },

  // --------------------------------------------------------------- Acte II --
  {
    id: 7,
    act: 2,
    title: 'Trois offres, une décision',
    brief: 'Tu hésites entre trois offres. Tu veux trancher aujourd\'hui, pas relire trois PDF de vingt pages.',
    blocks: ['role', 'contexte', 'demande', 'taches', 'format'],
    palette: PALETTE_ACTE_II,
    moves: 24,
    goals: { role: 8, contexte: 9, demande: 8, taches: 9, format: 8 },
    seed: 7077,
  },
  {
    id: 8,
    act: 2,
    title: "Le plan d'article qui tient debout",
    brief: 'Tu dois écrire un article de fond. Avant la première phrase, il te faut une structure solide.',
    blocks: ['role', 'contexte', 'demande', 'taches', 'format'],
    palette: PALETTE_ACTE_II,
    moves: 25,
    goals: { role: 9, contexte: 10, demande: 9, taches: 10, format: 9 },
    seed: 8088,
    obstacles: { flou: 6 },
  },
  {
    id: 9,
    act: 2,
    title: 'La semaine qui tient dans un tableau',
    brief: 'Tu veux un planning de semaine réaliste, qui survive au premier imprévu du mardi.',
    blocks: ['role', 'contexte', 'demande', 'taches', 'format'],
    palette: PALETTE_ACTE_II,
    moves: 27,
    goals: { role: 10, contexte: 10, demande: 10, taches: 11, format: 10 },
    seed: 9099,
    obstacles: { flou: 8, horsSujet: 2 },
  },
  {
    id: 10,
    act: 2,
    title: 'Le dossier à rendre lundi',
    brief: "Tu dois rendre un dossier de synthèse lundi. Tu as les informations, pas encore la mise en forme.",
    blocks: ['role', 'contexte', 'demande', 'taches', 'format'],
    palette: PALETTE_ACTE_II,
    moves: 28,
    goals: { role: 10, contexte: 12, demande: 10, taches: 12, format: 10 },
    seed: 10110,
    obstacles: { flou: 10, horsSujet: 3 },
  },
]

export const LEVEL_BY_ID: Record<number, Level> = Object.fromEntries(
  LEVELS.map((level) => [level.id, level]),
)

/** Les cartes pedagogiques qui ouvrent chaque acte. */
export interface ActIntro {
  act: 1 | 2 | 3
  title: string
  subtitle: string
  /** Les blocs presentes a l'ouverture de l'acte. */
  reveals: Level['blocks']
}

export const ACT_INTROS: ActIntro[] = [
  {
    act: 1,
    title: 'Acte I — Le Socle',
    subtitle:
      "Trois blocs suffisent à faire tenir un prompt debout. Sans eux, aucun des quatre autres ne sert à rien.",
    reveals: ['role', 'contexte', 'demande'],
  },
  {
    act: 2,
    title: 'Acte II — La Méthode',
    subtitle:
      "Le socle tient. On passe au pilotage : découper le travail, et imposer la forme du résultat.",
    reveals: ['taches', 'format'],
  },
  {
    act: 3,
    title: 'Acte III — La Maîtrise',
    subtitle:
      'Les sept blocs. Ton prompt cesse d\'être une demande : il devient un cahier des charges.',
    reveals: ['raisonnement', 'arret'],
  },
]
