import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  applyGravity,
  clearMatches,
  createBoard,
  findHint,
  findMatches,
  hasPossibleMove,
  isValidSwap,
  resetTileIds,
  swapped,
  triggerSpecials,
} from '../src/game/board.ts'
import { createRng } from '../src/game/rng.ts'
import type { Board, BlockId, FlouGrid, Level } from '../src/game/types.ts'
import { LEVELS } from '../src/data/levels.ts'

/**
 * Construit un plateau a partir d'une carte lisible.
 * Une lettre par bloc : R(ole) C(ontexte) D(emande) T(aches) . = hors-sujet
 */
const LETTER: Record<string, BlockId> = {
  R: 'role',
  C: 'contexte',
  D: 'demande',
  T: 'taches',
}

function boardOf(rows: string[]): Board {
  resetTileIds()
  return rows.map((row, r) =>
    [...row].map((ch, c) => {
      if (ch === '.') return { id: `x${r}${c}`, block: 'role' as BlockId, horsSujet: true }
      return { id: `${ch}${r}${c}`, block: LETTER[ch]! }
    }),
  )
}

function emptyFlou(board: Board): FlouGrid {
  return board.map((row) => row.map(() => 0))
}

test('trois tuiles alignees forment un match, sans tuile speciale', () => {
  const board = boardOf(['RRRC', 'CDCD', 'DCDC', 'CDCD'])
  const matches = findMatches(board)
  assert.equal(matches.length, 1)
  assert.equal(matches[0]!.block, 'role')
  assert.equal(matches[0]!.positions.length, 3)
  assert.equal(matches[0]!.reward, undefined)
})

test('quatre tuiles alignees donnent une tuile Precision orientee', () => {
  const horizontal = findMatches(boardOf(['RRRR', 'CDCD', 'DCDC', 'CDCD']))
  assert.equal(horizontal[0]!.reward?.kind, 'precision-row')

  const vertical = findMatches(boardOf(['RCDC', 'RDCD', 'RCDC', 'RDCD']))
  assert.equal(vertical[0]!.reward?.kind, 'precision-col')
})

test('cinq tuiles alignees donnent un Meta-Prompt', () => {
  const matches = findMatches(boardOf(['RRRRR', 'CDCDC', 'DCDCD', 'CDCDC', 'DCDCD']))
  assert.equal(matches.length, 1)
  assert.equal(matches[0]!.positions.length, 5)
  assert.equal(matches[0]!.reward?.kind, 'meta')
})

test('une forme en L fusionne en un seul match et donne une Iteration', () => {
  //  la colonne de R et la ligne de R partagent le coin en bas a gauche
  const board = boardOf(['RCDC', 'RDCD', 'RRRD', 'CDCT'])
  const matches = findMatches(board)
  assert.equal(matches.length, 1, 'les deux branches du L ne doivent pas compter double')
  assert.equal(matches[0]!.positions.length, 5, 'le coin est partage')
  assert.equal(matches[0]!.reward?.kind, 'iteration')
})

test('la tuile speciale nait sous le doigt du joueur quand il est dans le match', () => {
  const board = boardOf(['RRRR', 'CDCD', 'DCDC', 'CDCD'])
  const matches = findMatches(board, { row: 0, col: 3 })
  assert.deepEqual(matches[0]!.reward?.at, { row: 0, col: 3 })
})

test('une tuile Hors-sujet ne participe jamais a un alignement', () => {
  const board = boardOf(['R.RR', 'CDCD', 'DCDC', 'CDCD'])
  assert.equal(findMatches(board).length, 0)
})

test('un echange est refuse s il ne cree aucun alignement', () => {
  const board = boardOf(['RCDC', 'CDCD', 'DCDC', 'CDCD'])
  assert.equal(isValidSwap(board, { row: 0, col: 0 }, { row: 0, col: 1 }), false)
  assert.equal(isValidSwap(board, { row: 0, col: 0 }, { row: 2, col: 2 }), false, 'cases non voisines')
})

test('un echange est accepte s il cree un alignement', () => {
  //  R C D
  //  C R C   -> echanger (1,0) et (1,1) aligne les R en colonne 0
  //  R D C
  const board = boardOf(['RCD', 'CRC', 'RDC'])
  assert.equal(findMatches(board).length, 0, 'la grille de depart ne doit rien offrir')
  assert.equal(isValidSwap(board, { row: 1, col: 0 }, { row: 1, col: 1 }), true)
  assert.equal(findMatches(swapped(board, { row: 1, col: 0 }, { row: 1, col: 1 })).length, 1)
})

test('une tuile Hors-sujet ne peut pas etre deplacee', () => {
  const board = boardOf(['R.D', 'CRC', 'RDC'])
  assert.equal(isValidSwap(board, { row: 0, col: 1 }, { row: 1, col: 1 }), false)
})

test('l indice pointe un coup reellement jouable', () => {
  const board = boardOf(['RCD', 'CRC', 'RDC'])
  const hint = findHint(board)
  assert.notEqual(hint, null, 'un coup existe, l indice doit le trouver')
  assert.equal(isValidSwap(board, hint![0], hint![1]), true)
})

test('l indice prefere le coup qui detruit le plus de tuiles', () => {
  //  Deux coups possibles : l un aligne 3 R, l autre en aligne 4.
  //  colonne 0 : R R C R  -> echanger (2,0) avec (2,1) aligne 4 R
  //  ligne 3 : D D C D    -> echanger (3,2) avec (2,2) aligne 3 D
  const board = boardOf(['RTDT', 'RTCT', 'CRDT', 'RDCD'])
  const hint = findHint(board)
  assert.notEqual(hint, null)
  const matches = findMatches(swapped(board, hint![0], hint![1]), hint![1])
  const taille = matches.reduce((sum, m) => sum + m.positions.length, 0)
  assert.equal(taille >= 4, true, `l indice ne rapporte que ${taille} tuiles`)
})

test('l indice et le detecteur de coup sont toujours d accord', () => {
  // La vraie propriete a garantir : l'indice trouve un coup exactement quand
  // il en existe un. Si les deux divergent, soit on suggere l'impossible, soit
  // on rebrasse un plateau encore jouable.
  const level = LEVELS[9]!
  for (let seed = 0; seed < 60; seed++) {
    const rng = createRng(level.seed + seed)
    let { board } = createBoard(level, rng)
    // On abime le plateau au fil des coups pour balayer des etats varies,
    // y compris ceux ou il ne reste presque plus rien a jouer.
    for (let tour = 0; tour < 6; tour++) {
      const hint = findHint(board)
      assert.equal(
        hint !== null,
        hasPossibleMove(board),
        `graine ${seed}, tour ${tour} : l indice et le detecteur divergent`,
      )
      if (!hint) break
      assert.equal(isValidSwap(board, hint[0], hint[1]), true, 'coup suggere invalide')

      const apres = swapped(board, hint[0], hint[1])
      const out = clearMatches(apres, emptyFlou(apres), findMatches(apres, hint[1]))
      board = applyGravity(out.board, level.palette ?? level.blocks, rng)
    }
  }
})

test('la destruction recolte un fragment par tuile du bloc', () => {
  const board = boardOf(['RRRC', 'CDCD', 'DCDC', 'CDCD'])
  const out = clearMatches(board, emptyFlou(board), findMatches(board))
  assert.equal(out.collected.role, 3)
  assert.equal(out.cleared.length, 3)
  assert.equal(out.board[0]![0], null)
})

test('le Flou reste sur la case et se dissipe quand on detruit dessus', () => {
  const board = boardOf(['RRRC', 'CDCD', 'DCDC', 'CDCD'])
  const flou = emptyFlou(board)
  flou[0]![0] = 1
  flou[0]![1] = 1
  flou[3]![3] = 1

  const out = clearMatches(board, flou, findMatches(board))
  assert.equal(out.flouCleared, 2, 'deux cases voilees etaient sous le match')
  assert.equal(out.flou[0]![0], 0)
  assert.equal(out.flou[0]![1], 0)
  assert.equal(out.flou[3]![3], 1, 'le Flou loin du match ne bouge pas')
})

test('une case floue ne rapporte aucun fragment tant que le voile tient', () => {
  const board = boardOf(['RRRC', 'CDCD', 'DCDC', 'CDCD'])
  const flou = emptyFlou(board)
  flou[0]![0] = 1
  flou[0]![1] = 1

  const out = clearMatches(board, flou, findMatches(board))
  assert.equal(out.collected.role, 1, 'seule la case non voilee des trois rapporte')
  assert.equal(out.flouCleared, 2, 'les deux voiles se sont bien leves')

  // Une fois le voile leve, la meme case redevient productive.
  const again = clearMatches(board, out.flou, findMatches(board))
  assert.equal(again.collected.role, 3)
})

test('le Flou ne suit pas les tuiles qui tombent', () => {
  const board = boardOf(['RRRC', 'CDCD', 'DCDC', 'CDCD'])
  const flou = emptyFlou(board)
  flou[0]![0] = 1
  const out = clearMatches(board, flou, findMatches(board))
  const after = applyGravity(out.board, ['role', 'contexte', 'demande'], createRng(1))
  assert.equal(after[0]![0] !== null, true, 'la case a ete recomblee')
  assert.equal(out.flou[0]![0], 0, 'le voile est reste au sol, il ne remonte pas')
})

test('un Hors-sujet est emporte par une destruction voisine', () => {
  //  la ligne de R detruite touche le Hors-sujet pose juste en dessous
  const board = boardOf(['RRRC', '.DCD', 'DCDC', 'CDCD'])
  const out = clearMatches(board, emptyFlou(board), findMatches(board))
  assert.equal(out.horsSujetCleared, 1)
  assert.equal(out.board[1]![0], null)
})

test('un Hors-sujet loin du match survit', () => {
  const board = boardOf(['RRRC', 'CDCD', 'DC.C', 'CDCD'])
  const out = clearMatches(board, emptyFlou(board), findMatches(board))
  assert.equal(out.horsSujetCleared, 0)
  assert.equal(out.board[2]![2]?.horsSujet, true)
})

test('la tuile Precision nettoie toute sa ligne', () => {
  const board = boardOf(['RRRR', 'CDCD', 'DCDC', 'CDCD'])
  const matches = findMatches(board)
  const armed = clearMatches(board, emptyFlou(board), matches)
  const special = armed.board[matches[0]!.reward!.at.row]![matches[0]!.reward!.at.col]
  assert.equal(special?.special, 'precision-row')

  // On la declenche : la ligne entiere doit partir.
  const fired = clearMatches(armed.board, armed.flou, triggerSpecials(armed.board, [matches[0]!.reward!.at]))
  assert.equal(
    fired.board[0]!.every((cell) => cell === null),
    true,
  )
})

test('le Meta-Prompt efface tous les blocs de son type', () => {
  const board = boardOf(['RRRRR', 'CDCDC', 'RCDCD', 'CDCDC', 'DCDCR'])
  const matches = findMatches(board)
  const armed = clearMatches(board, emptyFlou(board), matches)
  const anchor = matches[0]!.reward!.at
  assert.equal(armed.board[anchor.row]![anchor.col]?.special, 'meta')

  const fired = clearMatches(armed.board, armed.flou, triggerSpecials(armed.board, [anchor]))
  const remaining = fired.board.flat().filter((cell) => cell?.block === 'role' && !cell.horsSujet)
  assert.equal(remaining.length, 0)
})

test('la gravite fait tomber les tuiles et recomble par le haut', () => {
  const board = boardOf(['RCD', 'CRD', 'RCD'])
  board[2]![0] = null
  board[1]![0] = null
  const survivor = board[0]![0]!.id

  const next = applyGravity(board, ['role', 'contexte', 'demande'], createRng(7))
  assert.equal(next[2]![0]?.id, survivor, 'la tuile du haut est descendue tout en bas')
  assert.equal(
    next.flat().every((cell) => cell !== null),
    true,
    'aucun trou ne subsiste',
  )
})

test('la gravite preserve l identite des tuiles, sinon l animation saute', () => {
  const board = boardOf(['RCD', 'CRD', 'RCD'])
  const before = board.flat().map((cell) => cell!.id)
  board[2]![1] = null
  const next = applyGravity(board, ['role', 'contexte', 'demande'], createRng(3))
  const after = new Set(next.flat().map((cell) => cell!.id))
  const kept = before.filter((id) => after.has(id))
  assert.equal(kept.length, before.length - 1, 'seule la tuile detruite a disparu')
})

test('une meme graine produit toujours le meme plateau', () => {
  const level = LEVELS[0]!
  const a = createBoard(level, createRng(level.seed))
  const b = createBoard(level, createRng(level.seed))
  const shape = (board: Board) => board.map((row) => row.map((c) => c?.block ?? '-').join('')).join('|')
  assert.equal(shape(a.board), shape(b.board))
})

test('tous les niveaux demarrent sans alignement offert et avec un coup jouable', () => {
  for (const level of LEVELS) {
    const { board, flou } = createBoard(level, createRng(level.seed))
    assert.equal(findMatches(board).length, 0, `niveau ${level.id} : alignement offert au demarrage`)
    assert.equal(hasPossibleMove(board), true, `niveau ${level.id} : plateau mort au demarrage`)

    const veiled = flou.flat().filter((v) => v > 0).length
    assert.equal(veiled, level.obstacles?.flou ?? 0, `niveau ${level.id} : Flou mal pose`)
  }
})

test('chaque niveau demande au moins autant de fragments qu il a de blocs', () => {
  for (const level of LEVELS) {
    for (const block of Object.keys(level.goals) as BlockId[]) {
      assert.equal(
        level.blocks.includes(block),
        true,
        `niveau ${level.id} : objectif sur « ${block} » alors que le bloc n'est pas sur le plateau`,
      )
    }
  }
})

test('le budget de coups laisse une marge raisonnable sur chaque niveau', () => {
  for (const level of LEVELS as Level[]) {
    const needed = Object.values(level.goals).reduce((sum, n) => sum + (n ?? 0), 0)
    // Un coup rapporte 3 fragments au minimum, souvent davantage avec les cascades.
    assert.equal(
      level.moves * 3 >= needed,
      true,
      `niveau ${level.id} : ${level.moves} coups ne suffisent pas a recolter ${needed} fragments`,
    )
  }
})
