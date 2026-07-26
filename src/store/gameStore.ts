import { create } from 'zustand'

import {
  applyGravity,
  areAdjacent,
  clearMatches,
  createBoard,
  findHint,
  findMatches,
  hasPossibleMove,
  isSwappable,
  paletteFor,
  reshuffle,
  swapped,
  triggerSpecials,
  at,
} from '../game/board'
import { createRng, type Rng } from '../game/rng'
import { BLOCK_ORDER } from '../game/blocks'
import type {
  Board,
  BlockId,
  ChoiceCard,
  ChoiceQuality,
  FlouGrid,
  Level,
  Position,
} from '../game/types'
import { LEVELS, LEVEL_BY_ID } from '../data/levels'
import { cardFor } from '../data/choices'
import { bossesAfter, type BossLevel } from '../data/boss'
import { loadProgress, saveProgress, type Progress, type GrimoireEntry } from './progress'

const CLEAR_DELAY = 200
const FALL_DELAY = 260
const SWAP_DELAY = 170

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Points par tuile, avant multiplicateur de cascade. */
const POINTS_PER_TILE = 60
const CHOICE_POINTS: Record<ChoiceQuality, number> = { excellent: 500, moyen: 150, faible: 0 }
/** Note de clarte attribuee a chaque qualite de formulation. */
const CLARITY_SCORE: Record<ChoiceQuality, number> = { excellent: 100, moyen: 55, faible: 15 }

export type Screen = 'carte' | 'acte' | 'brief' | 'jeu' | 'bilan' | 'boss' | 'grimoire'

export interface ChosenOption {
  block: BlockId
  text: string
  quality: ChoiceQuality
  feedback: string
}

/** Un message court affiche au-dessus du plateau. */
export interface Toast {
  id: number
  text: string
  tone: 'bonus' | 'info'
}

/**
 * Un evenement visuel ephemere, ancre sur une case du plateau.
 *
 * Le store ne sait pas comment ces effets sont dessines — gerbe de particules,
 * nombre qui monte, halo — il se contente de dire ce qui vient de se passer et
 * ou. La couche d'affichage decide du rendu. Cette separation permet de
 * retoucher l'habillage visuel sans jamais toucher a la logique de jeu.
 */
export interface Effect {
  id: number
  kind: 'eclat' | 'score' | 'chaine' | 'voile'
  row: number
  col: number
  block?: BlockId
  /** Valeur affichee pour les effets qui portent un texte. */
  value?: string
}

/** Duree de vie d'un effet, au-dela de laquelle le store l'oublie. */
const EFFECT_TTL = 1100

/**
 * Delai d'inactivite avant de suggerer un coup.
 *
 * Assez long pour ne pas jouer a la place du joueur qui reflechit, assez court
 * pour rattraper celui qui ne voit plus rien.
 */
const HINT_DELAY = 6000

interface GameState {
  screen: Screen
  progress: Progress

  level: Level | null
  board: Board
  flou: FlouGrid
  movesLeft: number
  score: number
  collected: Partial<Record<BlockId, number>>
  chosen: ChosenOption[]

  selected: Position | null
  busy: boolean
  /** Cases qui viennent de disparaitre, pour l'animation. */
  vanishing: string[]
  toasts: Toast[]
  /** Effets visuels en cours, ancres sur le plateau. */
  effects: Effect[]
  /** Coup suggere apres un temps d'hesitation, s'il y en a un. */
  hint: [Position, Position] | null

  pendingCards: ChoiceCard[]
  activeCard: ChoiceCard | null
  /** Reponse donnee a la carte affichee, avant de passer a la suite. */
  cardAnswer: { index: number; quality: ChoiceQuality; feedback: string } | null

  activeBoss: BossLevel | null
  bossQueue: BossLevel[]
  outcome: 'gagne' | 'perdu' | null

  openCarte: () => void
  openGrimoire: () => void
  startLevel: (levelId: number) => void
  confirmBrief: () => void
  tapCell: (pos: Position) => void
  swapCells: (from: Position, to: Position) => void
  answerCard: (index: number) => void
  dismissCard: () => void
  finishBoss: () => void
  retry: () => void
  nextLevel: () => void
}

let rng: Rng = createRng(1)
let toastId = 0
let effectId = 0
let hintTimer: ReturnType<typeof setTimeout> | null = null

function goalsReached(state: {
  level: Level | null
  collected: Partial<Record<BlockId, number>>
}): boolean {
  const { level, collected } = state
  if (!level) return false
  // Le Flou n'entre pas dans la condition de victoire : il taxe la recolte,
  // il ne la verrouille pas.
  return Object.entries(level.goals).every(
    ([block, target]) => (collected[block as BlockId] ?? 0) >= (target ?? 0),
  )
}

/** Note de clarte du prompt : elle ne dépend que des formulations choisies. */
export function clarityScore(chosen: ChosenOption[]): number {
  if (chosen.length === 0) return 0
  const total = chosen.reduce((sum, c) => sum + CLARITY_SCORE[c.quality], 0)
  return Math.round(total / chosen.length)
}

export function starsFor(chosen: ChosenOption[]): number {
  const clarity = clarityScore(chosen)
  if (clarity >= 90) return 3
  if (clarity >= 60) return 2
  return 1
}

/** Assemble le prompt final, blocs dans l'ordre canonique. */
export function assemblePrompt(level: Level, chosen: ChosenOption[]): string {
  const byBlock = new Map(chosen.map((c) => [c.block, c]))
  return level.blocks
    .slice()
    .sort((a, b) => BLOCK_ORDER[a] - BLOCK_ORDER[b])
    .map((block) => byBlock.get(block))
    .filter((c): c is ChosenOption => c !== undefined)
    .map((c) => c.text)
    .join('\n\n')
}

export const useGame = create<GameState>((set, get) => {
  const pushToast = (text: string, tone: Toast['tone'] = 'info') => {
    toastId += 1
    const toast: Toast = { id: toastId, text, tone }
    set((s) => ({ toasts: [...s.toasts, toast] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== toast.id) })), 1400)
  }

  /**
   * Emet une salve d'effets visuels et programme leur oubli.
   *
   * On les retire apres coup plutot que de laisser la couche d'affichage s'en
   * charger : ainsi un effet ne peut pas rester coince a l'ecran si le
   * composant qui le dessinait a ete demonte entre-temps.
   */
  const emit = (nouveaux: Omit<Effect, 'id'>[]) => {
    if (nouveaux.length === 0) return
    const salve = nouveaux.map((effect) => {
      effectId += 1
      return { ...effect, id: effectId }
    })
    set((s) => ({ effects: [...s.effects, ...salve] }))
    const ids = new Set(salve.map((e) => e.id))
    setTimeout(() => set((s) => ({ effects: s.effects.filter((e) => !ids.has(e.id)) })), EFFECT_TTL)
  }

  /**
   * Programme la suggestion d'un coup si le joueur ne joue plus.
   *
   * Le minuteur est remis a zero a chaque interaction : on ne veut pas
   * souffler la reponse a quelqu'un qui est en train de reflechir.
   */
  const scheduleHint = () => {
    if (hintTimer) clearTimeout(hintTimer)
    hintTimer = setTimeout(() => {
      const state = get()
      if (state.screen !== 'jeu' || state.busy || state.activeCard) return
      set({ hint: findHint(state.board) })
    }, HINT_DELAY)
  }

  const cancelHint = () => {
    if (hintTimer) clearTimeout(hintTimer)
    hintTimer = null
    if (get().hint) set({ hint: null })
  }

  /**
   * Deroule les cascades jusqu'a stabilisation du plateau, en marquant les
   * pauses necessaires a l'animation.
   */
  const runCascade = async (startBoard: Board, startFlou: FlouGrid, origin?: Position) => {
    const level = get().level
    if (!level) return

    let board = startBoard
    let flou = startFlou
    let matches = findMatches(board, origin)
    if (matches.length === 0 && origin) matches = triggerSpecials(board, [origin])
    let chain = 0
    let previousBlock: BlockId | null = null

    while (matches.length > 0) {
      chain += 1
      const out = clearMatches(board, flou, matches)

      const tiles = out.cleared.length
      const multiplier = chain
      let gained = tiles * POINTS_PER_TILE * multiplier

      // Bonus « Structure Parfaite » : deux blocs consecutifs dans l'ordre
      // canonique, enchaines dans la meme cascade.
      const touched = out.blocksTouched[0]
      if (touched && previousBlock && BLOCK_ORDER[touched] === BLOCK_ORDER[previousBlock] + 1) {
        gained *= 2
        pushToast('Structure Parfaite ×2', 'bonus')
      } else if (chain >= 3) {
        pushToast(`Cascade ×${chain}`, 'bonus')
      }
      previousBlock = touched ?? previousBlock

      if (out.horsSujetCleared > 0) pushToast(`Hors-sujet dégagé`, 'info')

      // Les effets partent avant la disparition : une gerbe qui arrive apres
      // que le bonbon a disparu ne se rattache visuellement a rien.
      const veilesLevees = out.cleared.filter((p) => (flou[p.row]?.[p.col] ?? 0) > 0)
      const centre = out.cleared[Math.floor(out.cleared.length / 2)]
      emit([
        ...out.cleared.map((p) => ({
          kind: 'eclat' as const,
          row: p.row,
          col: p.col,
          block: at(board, p.row, p.col)?.block,
        })),
        ...veilesLevees.map((p) => ({ kind: 'voile' as const, row: p.row, col: p.col })),
        ...(centre
          ? [{ kind: 'score' as const, row: centre.row, col: centre.col, value: `+${gained}`, block: touched }]
          : []),
        ...(centre && chain >= 2
          ? [{ kind: 'chaine' as const, row: centre.row, col: centre.col, value: `×${chain}` }]
          : []),
      ])

      // On marque d'abord les tuiles condamnees en les laissant sur le
      // plateau : elles doivent avoir le temps de se retracter a l'ecran.
      // Les retirer dans le meme temps que la classe d'animation les ferait
      // disparaitre d'un coup, sans transition.
      set({ vanishing: out.cleared.map((p) => `${p.row},${p.col}`) })
      await sleep(CLEAR_DELAY)

      // Puis on les retire vraiment, et la recolte est creditee.
      set((s) => {
        const collected = { ...s.collected }
        for (const [block, count] of Object.entries(out.collected)) {
          collected[block as BlockId] = (collected[block as BlockId] ?? 0) + (count ?? 0)
        }
        return {
          board: out.board,
          flou: out.flou,
          collected,
          score: s.score + gained,
          vanishing: [],
        }
      })

      board = applyGravity(out.board, paletteFor(level), rng)
      flou = out.flou
      set({ board })
      await sleep(FALL_DELAY)

      matches = findMatches(board)
    }

    if (!hasPossibleMove(board)) {
      pushToast('Plus aucun coup : on rebrasse', 'info')
      board = reshuffle(board, paletteFor(level), rng)
      set({ board })
      await sleep(FALL_DELAY)
    }

    queueCards()
    scheduleHint()
  }

  /** Ouvre une carte de choix pour chaque bloc dont l'objectif vient d'etre atteint. */
  const queueCards = () => {
    const { level, collected, chosen, pendingCards } = get()
    if (!level) return
    const already = new Set([...chosen.map((c) => c.block), ...pendingCards.map((c) => c.block)])
    const ready = level.blocks.filter((block) => {
      if (already.has(block)) return false
      const target = level.goals[block]
      return target !== undefined && (collected[block] ?? 0) >= target
    })

    const cards = ready.map((block) => cardFor(level.id, block)).filter((c): c is ChoiceCard => !!c)
    if (cards.length === 0) return
    set((s) => ({
      pendingCards: [...s.pendingCards, ...cards.slice(1)],
      activeCard: s.activeCard ?? cards[0] ?? null,
    }))
  }

  /** Fin de niveau : victoire si tout est recolte, defaite si les coups manquent. */
  const settle = () => {
    const state = get()
    if (!state.level || state.activeCard || state.pendingCards.length > 0) return

    const won = goalsReached(state) && state.chosen.length === state.level.blocks.length
    if (won) {
      finishLevel('gagne')
      return
    }
    if (state.movesLeft <= 0) finishLevel('perdu')
  }

  const finishLevel = (outcome: 'gagne' | 'perdu') => {
    const state = get()
    const level = state.level
    if (!level) return

    if (outcome === 'gagne') {
      const stars = starsFor(state.chosen)
      const entry: GrimoireEntry = {
        levelId: level.id,
        title: level.title,
        brief: level.brief,
        prompt: assemblePrompt(level, state.chosen),
        clarity: clarityScore(state.chosen),
      }
      const progress: Progress = {
        ...state.progress,
        stars: { ...state.progress.stars, [level.id]: Math.max(state.progress.stars[level.id] ?? 0, stars) },
        best: { ...state.progress.best, [level.id]: Math.max(state.progress.best[level.id] ?? 0, state.score) },
        grimoire: [...state.progress.grimoire.filter((g) => g.levelId !== level.id), entry],
      }
      saveProgress(progress)
      set({ progress, outcome, screen: 'bilan', bossQueue: bossesAfter(level.id) })
      return
    }
    set({ outcome, screen: 'bilan' })
  }

  return {
    screen: 'carte',
    progress: loadProgress(),
    level: null,
    board: [],
    flou: [],
    movesLeft: 0,
    score: 0,
    collected: {},
    chosen: [],
    selected: null,
    busy: false,
    vanishing: [],
    toasts: [],
    effects: [],
    hint: null,
    pendingCards: [],
    activeCard: null,
    cardAnswer: null,
    activeBoss: null,
    bossQueue: [],
    outcome: null,

    openCarte: () => {
      cancelHint()
      set({ screen: 'carte', level: null, outcome: null })
    },
    openGrimoire: () => set({ screen: 'grimoire' }),

    startLevel: (levelId) => {
      const level = LEVEL_BY_ID[levelId]
      if (!level) return
      rng = createRng(level.seed)
      const { board, flou } = createBoard(level, rng)
      const seenAct = get().progress.actsSeen.includes(level.act)
      set({
        level,
        board,
        flou,
        movesLeft: level.moves,
        score: 0,
        collected: {},
        chosen: [],
        selected: null,
        busy: false,
        vanishing: [],
        effects: [],
        hint: null,
        pendingCards: [],
        activeCard: null,
        cardAnswer: null,
        activeBoss: null,
        bossQueue: [],
        outcome: null,
        screen: seenAct ? 'brief' : 'acte',
      })
    },

    confirmBrief: () => {
      const state = get()
      if (state.screen === 'acte' && state.level) {
        const act = state.level.act
        const progress: Progress = {
          ...state.progress,
          actsSeen: [...new Set([...state.progress.actsSeen, act])],
        }
        saveProgress(progress)
        set({ progress, screen: 'brief' })
        return
      }
      set({ screen: 'jeu' })
      scheduleHint()
    },

    tapCell: (pos) => {
      const state = get()
      if (state.busy || state.activeCard || state.screen !== 'jeu') return
      cancelHint()
      scheduleHint()
      const cell = at(state.board, pos.row, pos.col)
      if (!isSwappable(cell)) {
        pushToast('Le Hors-sujet ne bouge pas', 'info')
        return
      }

      const selected = state.selected
      if (!selected) {
        set({ selected: pos })
        return
      }
      if (selected.row === pos.row && selected.col === pos.col) {
        set({ selected: null })
        return
      }
      if (!areAdjacent(selected, pos)) {
        // Trop loin : on considere que le joueur change simplement d'avis.
        set({ selected: pos })
        return
      }
      get().swapCells(selected, pos)
    },

    swapCells: (from, to) => {
      const state = get()
      if (state.busy || state.activeCard || state.screen !== 'jeu') return
      if (!areAdjacent(from, to)) return
      cancelHint()

      const before = state.board
      if (!isSwappable(at(before, from.row, from.col)) || !isSwappable(at(before, to.row, to.col))) {
        set({ selected: null })
        pushToast('Le Hors-sujet ne bouge pas', 'info')
        return
      }

      void (async () => {
        set({ busy: true, selected: null })
        const next = swapped(before, from, to)
        set({ board: next })
        await sleep(SWAP_DELAY)

        const matches = findMatches(next, to)
        const specials = triggerSpecials(next, [from, to])
        if (matches.length === 0 && specials.length === 0) {
          // Echange sterile : les tuiles reviennent a leur place et le coup
          // n'est pas decompte.
          set({ board: before })
          await sleep(SWAP_DELAY)
          set({ busy: false })
          return
        }

        set((s) => ({ movesLeft: s.movesLeft - 1 }))
        await runCascade(next, get().flou, to)
        set({ busy: false })
        settle()
      })()
    },

    answerCard: (index) => {
      const state = get()
      const card = state.activeCard
      if (!card || state.cardAnswer) return
      const option = card.options[index]
      if (!option) return

      set((s) => ({
        cardAnswer: { index, quality: option.quality, feedback: option.feedback },
        score: s.score + CHOICE_POINTS[option.quality],
        chosen: [
          ...s.chosen,
          { block: card.block, text: option.text, quality: option.quality, feedback: option.feedback },
        ],
      }))
    },

    dismissCard: () => {
      const state = get()
      if (!state.cardAnswer) return
      const [next, ...rest] = state.pendingCards
      set({ activeCard: next ?? null, pendingCards: rest, cardAnswer: null })
      if (!next) settle()
    },

    finishBoss: () => {
      const state = get()
      const [next, ...rest] = state.bossQueue
      if (next) {
        set({ activeBoss: next, bossQueue: rest, screen: 'boss' })
        return
      }
      set({ activeBoss: null, screen: 'carte', level: null, outcome: null })
    },

    retry: () => {
      const level = get().level
      if (level) get().startLevel(level.id)
    },

    nextLevel: () => {
      const state = get()
      if (state.bossQueue.length > 0) {
        const [next, ...rest] = state.bossQueue
        set({ activeBoss: next!, bossQueue: rest, screen: 'boss' })
        return
      }
      const current = state.level
      const index = LEVELS.findIndex((l) => l.id === current?.id)
      const following = LEVELS[index + 1]
      if (following) {
        get().startLevel(following.id)
        return
      }
      set({ screen: 'carte', level: null, outcome: null })
    },
  }
})

/** Le niveau le plus avance auquel le joueur a acces. */
export function unlockedUpTo(progress: Progress): number {
  let unlocked = LEVELS[0]?.id ?? 1
  for (const level of LEVELS) {
    if ((progress.stars[level.id] ?? 0) > 0) {
      const index = LEVELS.findIndex((l) => l.id === level.id)
      unlocked = LEVELS[index + 1]?.id ?? level.id
    }
  }
  return unlocked
}
