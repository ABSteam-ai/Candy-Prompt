/**
 * Mesure de l'equilibrage des niveaux.
 *
 * Un bot volontairement median joue chaque niveau : il prend le coup qui
 * rapporte le plus de fragments encore utiles, sans anticiper les cascades.
 * Un joueur humain fera mieux, un debutant fera moins bien — le budget de
 * coups doit donc rester au-dessus du resultat du bot, avec de la marge.
 *
 *   node --experimental-strip-types tests/equilibrage.ts
 */
import {
  applyGravity,
  clearMatches,
  createBoard,
  findMatches,
  hasPossibleMove,
  isValidSwap,
  paletteFor,
  reshuffle,
  swapped,
} from '../src/game/board.ts'
import { createRng } from '../src/game/rng.ts'
import { LEVELS } from '../src/data/levels.ts'
import type { BlockId, FlouGrid, Level, Position } from '../src/game/types.ts'

interface Run {
  movesUsed: number
  won: boolean
  reshuffles: number
}

export function playLevel(level: Level, seedOffset: number, budget = level.moves): Run {
  const rng = createRng(level.seed + seedOffset)
  let { board, flou } = createBoard(level, rng)
  const collected: Partial<Record<BlockId, number>> = {}
  let reshuffles = 0

  const stillNeeded = (block: BlockId) =>
    Math.max(0, (level.goals[block] ?? 0) - (collected[block] ?? 0))
  const done = () => level.blocks.every((b) => stillNeeded(b) === 0)

  for (let move = 0; move < budget; move++) {
    if (done()) return { movesUsed: move, won: true, reshuffles }

    // On evalue tous les coups possibles et on garde le plus utile.
    let best: { from: Position; to: Position; value: number } | null = null
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < (board[0]?.length ?? 0); c++) {
        for (const to of [
          { row: r, col: c + 1 },
          { row: r + 1, col: c },
        ]) {
          const from = { row: r, col: c }
          if (to.row >= board.length || to.col >= (board[0]?.length ?? 0)) continue
          if (!isValidSwap(board, from, to)) continue

          const trial = swapped(board, from, to)
          const matches = findMatches(trial, to)
          if (matches.length === 0) continue
          const preview = clearMatches(trial, flou, matches)

          // Ce qui compte : les fragments encore manquants, et le Flou dissipe.
          let value = preview.flouCleared * 3
          for (const [block, count] of Object.entries(preview.collected)) {
            value += Math.min(count ?? 0, stillNeeded(block as BlockId))
          }
          value += preview.horsSujetCleared * 2
          if (!best || value > best.value) best = { from, to, value }
        }
      }
    }
    if (!best) {
      board = reshuffle(board, paletteFor(level), rng)
      reshuffles++
      continue
    }

    board = swapped(board, best.from, best.to)
    let matches = findMatches(board, best.to)
    while (matches.length > 0) {
      const out: ReturnType<typeof clearMatches> = clearMatches(board, flou, matches)
      for (const [block, count] of Object.entries(out.collected)) {
        collected[block as BlockId] = (collected[block as BlockId] ?? 0) + (count ?? 0)
      }
      board = applyGravity(out.board, paletteFor(level), rng)
      flou = out.flou as FlouGrid
      matches = findMatches(board)
    }
    if (!hasPossibleMove(board)) {
      board = reshuffle(board, paletteFor(level), rng)
      reshuffles++
    }
  }

  return { movesUsed: budget, won: done(), reshuffles }
}

const SAMPLES = 40
if (process.env.CALIBRAGE !== '1') {
console.log('niveau  blocs  budget   coups bot (min/med/max)   reussite   verdict')
console.log('─'.repeat(78))

let problems = 0
for (const level of LEVELS) {
  const runs = Array.from({ length: SAMPLES }, (_, i) => playLevel(level, i))
  const wins = runs.filter((r) => r.won)
  const used = wins.map((r) => r.movesUsed).sort((a, b) => a - b)
  const median = used[Math.floor(used.length / 2)] ?? level.moves
  const rate = Math.round((wins.length / SAMPLES) * 100)

  // Le bot median doit consommer entre 40 % et 90 % du budget. La borne basse
  // est volontairement permissive : le bot ne joue qu'a un coup d'avance, un
  // joueur humain fait mieux, et un jeu pedagogique ne doit pas bloquer sur
  // de l'adresse. La reussite compte davantage que la tension.
  const ratio = median / level.moves
  let verdict = 'ok'
  if (rate < 90) verdict = 'TROP DUR (échecs)'
  else if (ratio < 0.4) verdict = 'trop facile'
  else if (ratio > 0.9) verdict = 'trop juste'
  if (verdict !== 'ok') problems++

  console.log(
    `  ${String(level.id).padStart(2)}      ${level.blocks.length}      ${String(level.moves).padStart(2)}` +
      `        ${String(used[0] ?? '-').padStart(2)} / ${String(median).padStart(2)} / ${String(used[used.length - 1] ?? '-').padStart(2)}` +
      `           ${String(rate).padStart(3)} %     ${verdict}`,
  )
}

console.log('─'.repeat(78))
console.log(problems === 0 ? 'Tous les niveaux sont dans la fourchette visée.' : `${problems} niveau(x) à retoucher.`)
}
