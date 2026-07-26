import type {
  Board,
  BlockId,
  Cell,
  FlouGrid,
  Level,
  Match,
  Position,
  SpecialKind,
  Tile,
} from './types'
import type { Rng } from './rng'

export const DEFAULT_ROWS = 8
export const DEFAULT_COLS = 8

let tileCounter = 0
/** Identifiant stable : c'est lui qui porte l'animation cote React. */
function nextTileId(): string {
  tileCounter += 1
  return `t${tileCounter}`
}

/** Remet le compteur a zero. Utilise uniquement par les tests. */
export function resetTileIds(): void {
  tileCounter = 0
}

export function at(board: Board, row: number, col: number): Cell {
  return board[row]?.[col] ?? null
}

export function inBounds(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < (board[0]?.length ?? 0)
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
}

/** Une tuile est-elle alignable ? Le Hors-sujet, lui, ne l'est jamais. */
export function isMatchable(cell: Cell): cell is Tile {
  return cell !== null && !cell.horsSujet
}

/** Une tuile peut-elle etre deplacee par le joueur ? */
export function isSwappable(cell: Cell): cell is Tile {
  return cell !== null && !cell.horsSujet
}

function makeTile(block: BlockId): Tile {
  return { id: nextTileId(), block }
}

// ---------------------------------------------------------------------------
// Detection des alignements
// ---------------------------------------------------------------------------

interface Run {
  positions: Position[]
  block: BlockId
  horizontal: boolean
}

function findRuns(board: Board): Run[] {
  const runs: Run[] = []
  const rows = board.length
  const cols = board[0]?.length ?? 0

  const scan = (horizontal: boolean) => {
    const outer = horizontal ? rows : cols
    const inner = horizontal ? cols : rows
    for (let a = 0; a < outer; a++) {
      let start = 0
      while (start < inner) {
        const first = horizontal ? at(board, a, start) : at(board, start, a)
        if (!isMatchable(first)) {
          start++
          continue
        }
        let end = start + 1
        while (end < inner) {
          const cell = horizontal ? at(board, a, end) : at(board, end, a)
          if (!isMatchable(cell) || cell.block !== first.block) break
          end++
        }
        const length = end - start
        if (length >= 3) {
          const positions: Position[] = []
          for (let i = start; i < end; i++) {
            positions.push(horizontal ? { row: a, col: i } : { row: i, col: a })
          }
          runs.push({ positions, block: first.block, horizontal })
        }
        start = end
      }
    }
  }

  scan(true)
  scan(false)
  return runs
}

const key = (p: Position) => `${p.row},${p.col}`

/**
 * Regroupe les alignements qui se croisent (formes en L et en T) et attribue
 * a chaque groupe la tuile speciale qu'il merite.
 *
 * `origin` est la case que le joueur vient de deplacer : quand elle fait partie
 * du groupe, la tuile speciale nait sous son doigt, ce qui est plus lisible.
 */
export function findMatches(board: Board, origin?: Position): Match[] {
  const runs = findRuns(board)
  if (runs.length === 0) return []

  // Union-find naif : deux runs qui partagent une case appartiennent au meme groupe.
  const groups: { runs: Run[]; cells: Map<string, Position> }[] = []
  for (const run of runs) {
    const touching = groups.filter((g) => run.positions.some((p) => g.cells.has(key(p))))
    if (touching.length === 0) {
      groups.push({
        runs: [run],
        cells: new Map(run.positions.map((p) => [key(p), p])),
      })
      continue
    }
    const [target, ...rest] = touching as [(typeof groups)[number], ...typeof groups]
    target.runs.push(run)
    for (const p of run.positions) target.cells.set(key(p), p)
    for (const other of rest) {
      other.runs.forEach((r) => target.runs.push(r))
      other.cells.forEach((p, k) => target.cells.set(k, p))
      groups.splice(groups.indexOf(other), 1)
    }
  }

  return groups.map((group) => {
    const positions = [...group.cells.values()]
    const block = group.runs[0]!.block
    const longest = group.runs.reduce((a, b) => (b.positions.length > a.positions.length ? b : a))
    const hasHorizontal = group.runs.some((r) => r.horizontal)
    const hasVertical = group.runs.some((r) => !r.horizontal)

    let kind: SpecialKind | undefined
    if (longest.positions.length >= 5) kind = 'meta'
    else if (hasHorizontal && hasVertical) kind = 'iteration'
    else if (longest.positions.length === 4) {
      kind = longest.horizontal ? 'precision-row' : 'precision-col'
    }

    if (!kind) return { block, positions }

    const anchor =
      (origin && positions.find((p) => p.row === origin.row && p.col === origin.col)) ??
      longest.positions[Math.floor(longest.positions.length / 2)]!
    return { block, positions, reward: { kind, at: anchor } }
  })
}

// ---------------------------------------------------------------------------
// Creation du plateau
// ---------------------------------------------------------------------------

export interface InitialBoard {
  board: Board
  flou: FlouGrid
}

/**
 * Fabrique un plateau sans alignement de depart et garantit qu'au moins un
 * coup est jouable. Sans cette garantie, un niveau peut s'ouvrir sur une
 * grille morte.
 */
export function createBoard(level: Level, rng: Rng): InitialBoard {
  const rows = level.rows ?? DEFAULT_ROWS
  const cols = level.cols ?? DEFAULT_COLS
  const palette = level.blocks

  for (let attempt = 0; attempt < 200; attempt++) {
    const board: Board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // On ecarte les blocs qui creeraient un alignement immediat.
        const forbidden = new Set<BlockId>()
        const left1 = at(board, r, c - 1)
        const left2 = at(board, r, c - 2)
        if (left1 && left2 && left1.block === left2.block) forbidden.add(left1.block)
        const up1 = at(board, r - 1, c)
        const up2 = at(board, r - 2, c)
        if (up1 && up2 && up1.block === up2.block) forbidden.add(up1.block)

        const choices = palette.filter((b) => !forbidden.has(b))
        board[r]![c] = makeTile(rng.pick(choices.length > 0 ? choices : palette))
      }
    }

    const flou = placeObstacles(board, level, rng)
    if (hasPossibleMove(board)) return { board, flou }
  }
  throw new Error(`Impossible de generer un plateau jouable pour le niveau ${level.id}`)
}

function placeObstacles(board: Board, level: Level, rng: Rng): FlouGrid {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  const flou: FlouGrid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))

  const free: Position[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) free.push({ row: r, col: c })
  }
  // Melange de Fisher-Yates, pour que la graine pilote entierement la pose.
  for (let i = free.length - 1; i > 0; i--) {
    const j = rng.int(i + 1)
    ;[free[i], free[j]] = [free[j]!, free[i]!]
  }

  let cursor = 0
  const flouCount = Math.min(level.obstacles?.flou ?? 0, free.length)
  for (let i = 0; i < flouCount; i++, cursor++) {
    const p = free[cursor]!
    flou[p.row]![p.col] = 1
  }

  let placed = 0
  const horsSujet = level.obstacles?.horsSujet ?? 0
  while (placed < horsSujet && cursor < free.length) {
    const p = free[cursor]!
    cursor++
    // On evite la derniere ligne : une tuile morte au ras du sol gene peu.
    // Et on ne pose pas de tuile morte sur une case a nettoyer, sinon le
    // Flou qu'elle recouvre devient tres penible a atteindre.
    if (p.row === rows - 1 || flou[p.row]![p.col]! > 0) continue
    board[p.row]![p.col] = { id: nextTileId(), block: 'role', horsSujet: true }
    placed++
  }
  return flou
}

// ---------------------------------------------------------------------------
// Coups
// ---------------------------------------------------------------------------

export function areAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1
}

export function swapped(board: Board, a: Position, b: Position): Board {
  const next = cloneBoard(board)
  const tileA = next[a.row]![a.col]!
  const tileB = next[b.row]![b.col]!
  next[a.row]![a.col] = tileB
  next[b.row]![b.col] = tileA
  return next
}

/** Un echange est legal s'il produit un alignement, ou s'il implique une tuile speciale. */
export function isValidSwap(board: Board, a: Position, b: Position): boolean {
  if (!areAdjacent(a, b)) return false
  const cellA = at(board, a.row, a.col)
  const cellB = at(board, b.row, b.col)
  if (!isSwappable(cellA) || !isSwappable(cellB)) return false
  if (cellA.special || cellB.special) return true
  return findMatches(swapped(board, a, b)).length > 0
}

export function hasPossibleMove(board: Board): boolean {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const here = { row: r, col: c }
      if (c + 1 < cols && isValidSwap(board, here, { row: r, col: c + 1 })) return true
      if (r + 1 < rows && isValidSwap(board, here, { row: r + 1, col: c })) return true
    }
  }
  return false
}

// ---------------------------------------------------------------------------
// Destruction
// ---------------------------------------------------------------------------

export interface ClearOutcome {
  board: Board
  flou: FlouGrid
  /** Cases videes, pour l'animation de disparition. */
  cleared: Position[]
  /** Fragments recoltes, par bloc. */
  collected: Partial<Record<BlockId, number>>
  flouCleared: number
  horsSujetCleared: number
  /** Tuiles speciales nees de ce coup. */
  createdSpecials: number
  /** Blocs touches, dans l'ordre de destruction : sert au bonus de structure. */
  blocksTouched: BlockId[]
}

function positionsForSpecial(board: Board, pos: Position, tile: Tile): Position[] {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  const out: Position[] = []
  switch (tile.special) {
    case 'precision-row':
      for (let c = 0; c < cols; c++) out.push({ row: pos.row, col: c })
      break
    case 'precision-col':
      for (let r = 0; r < rows; r++) out.push({ row: r, col: pos.col })
      break
    case 'iteration':
      for (let r = pos.row - 1; r <= pos.row + 1; r++) {
        for (let c = pos.col - 1; c <= pos.col + 1; c++) {
          if (inBounds(board, r, c)) out.push({ row: r, col: c })
        }
      }
      break
    case 'meta':
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = at(board, r, c)
          if (isMatchable(cell) && cell.block === tile.block) out.push({ row: r, col: c })
        }
      }
      break
    default:
      break
  }
  return out
}

/**
 * Applique les alignements : retire les tuiles, propage les tuiles speciales,
 * dissipe le Flou et emporte les Hors-sujet voisins.
 */
export function clearMatches(board: Board, flouGrid: FlouGrid, matches: Match[]): ClearOutcome {
  const next = cloneBoard(board)
  const flou = flouGrid.map((row) => [...row])
  const collected: Partial<Record<BlockId, number>> = {}
  const cleared: Position[] = []
  const blocksTouched: BlockId[] = []
  let flouCleared = 0
  let horsSujetCleared = 0

  // Les cases qui accueillent une tuile speciale survivent au coup.
  const spared = new Map<string, { kind: SpecialKind; block: BlockId }>()
  for (const match of matches) {
    if (match.reward) spared.set(key(match.reward.at), { kind: match.reward.kind, block: match.block })
  }

  const queue: Position[] = []
  const seen = new Set<string>()
  const push = (p: Position) => {
    if (!inBounds(next, p.row, p.col)) return
    const k = key(p)
    if (seen.has(k)) return
    seen.add(k)
    queue.push(p)
  }

  for (const match of matches) {
    blocksTouched.push(match.block)
    match.positions.forEach(push)
  }

  while (queue.length > 0) {
    const pos = queue.shift()!
    const cell = next[pos.row]![pos.col]
    if (!cell) continue

    // Une tuile speciale detruite declenche son effet, qui peut en detruire d'autres.
    if (cell.special && !spared.has(key(pos))) {
      positionsForSpecial(next, pos, cell).forEach(push)
    }

    // Le Flou se dissipe couche par couche, sous la tuile qui vient de partir.
    const veil = flou[pos.row]![pos.col]!
    if (veil > 0) {
      flou[pos.row]![pos.col] = veil - 1
      flouCleared += 1
    }

    if (cell.horsSujet) {
      // Un Hors-sujet ne part que s'il est emporte par une destruction voisine.
      horsSujetCleared += 1
      next[pos.row]![pos.col] = null
      cleared.push(pos)
      continue
    }

    collected[cell.block] = (collected[cell.block] ?? 0) + 1

    // Le souffle emporte les Hors-sujet orthogonalement adjacents.
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const neighbour = at(next, pos.row + dr, pos.col + dc)
      if (neighbour?.horsSujet) push({ row: pos.row + dr, col: pos.col + dc })
    }

    const reward = spared.get(key(pos))
    if (reward) {
      next[pos.row]![pos.col] = { id: nextTileId(), block: reward.block, special: reward.kind }
    } else {
      next[pos.row]![pos.col] = null
      cleared.push(pos)
    }
  }

  return {
    board: next,
    flou,
    cleared,
    collected,
    flouCleared,
    horsSujetCleared,
    createdSpecials: spared.size,
    blocksTouched,
  }
}

/**
 * Declenche une tuile speciale echangee « a vide », c'est-a-dire sans qu'elle
 * forme d'alignement. Le joueur peut ainsi la deplacer pour viser.
 */
export function triggerSpecials(board: Board, positions: Position[]): Match[] {
  return positions
    .map((pos) => {
      const cell = at(board, pos.row, pos.col)
      if (!cell?.special) return null
      return { block: cell.block, positions: [pos] } satisfies Match
    })
    .filter((m): m is Match => m !== null)
}

// ---------------------------------------------------------------------------
// Gravite
// ---------------------------------------------------------------------------

/**
 * Fait tomber les tuiles et complete le haut du plateau.
 * Les tuiles gardent leur identifiant : c'est la chute qui est animee, pas un
 * remplacement.
 */
export function applyGravity(board: Board, palette: BlockId[], rng: Rng): Board {
  const next = cloneBoard(board)
  const rows = next.length
  const cols = next[0]?.length ?? 0

  for (let c = 0; c < cols; c++) {
    let write = rows - 1
    for (let r = rows - 1; r >= 0; r--) {
      const cell = next[r]![c]
      if (cell) {
        next[r]![c] = null
        next[write]![c] = cell
        write--
      }
    }
    for (let r = write; r >= 0; r--) {
      next[r]![c] = makeTile(rng.pick(palette))
    }
  }
  return next
}

/** Rebrasse le plateau quand plus aucun coup n'est possible. */
export function reshuffle(board: Board, palette: BlockId[], rng: Rng): Board {
  for (let attempt = 0; attempt < 200; attempt++) {
    const next = cloneBoard(board)
    const movable: Tile[] = []
    const slots: Position[] = []
    for (let r = 0; r < next.length; r++) {
      for (let c = 0; c < (next[0]?.length ?? 0); c++) {
        const cell = next[r]![c]
        if (cell && !cell.horsSujet) {
          movable.push(cell)
          slots.push({ row: r, col: c })
        }
      }
    }
    for (let i = movable.length - 1; i > 0; i--) {
      const j = rng.int(i + 1)
      ;[movable[i], movable[j]] = [movable[j]!, movable[i]!]
    }
    slots.forEach((p, i) => {
      next[p.row]![p.col] = movable[i]!
    })
    if (findMatches(next).length === 0 && hasPossibleMove(next)) return next
  }
  // Repli : on repart d'une grille neuve plutot que de laisser le joueur bloque.
  return applyGravity(
    board.map((row) => row.map((cell) => (cell?.horsSujet ? cell : null))),
    palette,
    rng,
  )
}
