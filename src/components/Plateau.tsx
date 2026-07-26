import { useRef } from 'react'

import { BLOCK_BY_ID } from '../game/blocks'
import type { Position, SpecialKind, Tile } from '../game/types'
import { useGame } from '../store/gameStore'

const SPECIAL_BADGE: Record<SpecialKind, string> = {
  'precision-row': '↔',
  'precision-col': '↕',
  iteration: '✳',
  meta: '★',
}

const SPECIAL_TITLE: Record<SpecialKind, string> = {
  'precision-row': 'Précision : nettoie la ligne',
  'precision-col': 'Précision : nettoie la colonne',
  iteration: 'Itération : explosion 3×3',
  meta: 'Méta-Prompt : efface tout un bloc',
}

/** Seuil de glissement, en pixels, au-dela duquel on considere un swipe. */
const DRAG_THRESHOLD = 16

export function Plateau() {
  const board = useGame((s) => s.board)
  const flou = useGame((s) => s.flou)
  const selected = useGame((s) => s.selected)
  const vanishing = useGame((s) => s.vanishing)
  const toasts = useGame((s) => s.toasts)
  const tapCell = useGame((s) => s.tapCell)
  const swapCells = useGame((s) => s.swapCells)
  const hint = useGame((s) => s.hint)

  const drag = useRef<{ pos: Position; x: number; y: number; done: boolean } | null>(null)

  const rows = board.length
  const cols = board[0]?.length ?? 0
  const vanishingSet = new Set(vanishing)
  // Les deux cases du coup suggere, reperees pour etre mises en avant.
  const hintSet = new Set(hint?.map((p) => `${p.row},${p.col}`) ?? [])

  const onPointerDown = (pos: Position) => (event: React.PointerEvent) => {
    drag.current = { pos, x: event.clientX, y: event.clientY, done: false }
    // On capture le pointeur : le geste continue d'etre suivi meme quand le
    // doigt sort de la tuile de depart, ce qui est le cas de tous les swipes.
    event.currentTarget.setPointerCapture?.(event.pointerId)
    // Et on empeche le navigateur de demarrer une selection ou un drag natif,
    // qui annulerait le geste en cours de route.
    event.preventDefault()
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const start = drag.current
    if (!start || start.done) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return

    // On ne retient qu'une seule direction : le geste doit rester lisible.
    const target =
      Math.abs(dx) > Math.abs(dy)
        ? { row: start.pos.row, col: start.pos.col + (dx > 0 ? 1 : -1) }
        : { row: start.pos.row + (dy > 0 ? 1 : -1), col: start.pos.col }

    start.done = true
    if (target.row < 0 || target.row >= rows || target.col < 0 || target.col >= cols) return
    swapCells(start.pos, target)
  }

  const onPointerUp = (pos: Position) => () => {
    const start = drag.current
    drag.current = null
    // Sans glissement, le geste vaut une simple selection.
    if (start && !start.done) tapCell(pos)
  }

  return (
    <div className="cp-boardwrap">
      <div
        className="cp-board"
        style={{ ['--cp-cols' as string]: cols, ['--cp-rows' as string]: rows }}
        onPointerMove={onPointerMove}
        onPointerCancel={() => {
          drag.current = null
        }}
        onPointerLeave={() => {
          drag.current = null
        }}
      >
        <div className="cp-board__inner">
          {board.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null
              return (
                <TileView
                  key={cell.id}
                  tile={cell}
                  row={r}
                  col={c}
                  selected={selected?.row === r && selected?.col === c}
                  vanishing={vanishingSet.has(`${r},${c}`)}
                  hinted={hintSet.has(`${r},${c}`)}
                  onPointerDown={onPointerDown({ row: r, col: c })}
                  onPointerUp={onPointerUp({ row: r, col: c })}
                />
              )
            }),
          )}

          {/*
            Le voile passe APRES les bonbons, donc au-dessus d'eux.
            Dessine en dessous, il etait integralement masque par la tuile
            opaque : le joueur ne voyait aucune des cases annoncees comme
            floues, et l'obstacle etait injouable. Il laisse voir le bonbon
            a travers, sinon on ne saurait plus quoi aligner.
          */}
          {flou.map((row, r) =>
            row.map((veil, c) =>
              veil > 0 ? (
                <div
                  key={`veil-${r}-${c}`}
                  className="cp-veil"
                  style={{ ['--r' as string]: r, ['--c' as string]: c }}
                  aria-hidden="true"
                >
                  <div className="cp-veil__inner" />
                </div>
              ) : null,
            ),
          )}
        </div>
      </div>

      <div className="cp-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`cp-toast cp-toast--${toast.tone}`}>
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  )
}

interface TileViewProps {
  tile: Tile
  row: number
  col: number
  selected: boolean
  vanishing: boolean
  hinted: boolean
  onPointerDown: (event: React.PointerEvent) => void
  onPointerUp: () => void
}

function TileView({ tile, row, col, selected, vanishing, hinted, onPointerDown, onPointerUp }: TileViewProps) {
  const def = BLOCK_BY_ID[tile.block]
  const classes = ['cp-tile']
  if (selected) classes.push('cp-tile--selected')
  if (vanishing) classes.push('cp-tile--vanishing')
  if (tile.horsSujet) classes.push('cp-tile--dead')
  if (tile.special) classes.push('cp-tile--special')
  if (hinted) classes.push('cp-tile--hint')

  const label = tile.horsSujet
    ? 'Hors-sujet'
    : tile.special
      ? `${def.short} — ${SPECIAL_TITLE[tile.special]}`
      : def.label

  return (
    <div
      className={classes.join(' ')}
      style={{
        ['--r' as string]: row,
        ['--c' as string]: col,
        ['--tile-color' as string]: def.color,
        ['--tile-shade' as string]: def.shade,
      }}
      // Ces attributs rendent le plateau lisible depuis un test automatise.
      data-row={row}
      data-col={col}
      data-block={tile.block}
      data-dead={tile.horsSujet ? '1' : undefined}
      data-special={tile.special}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      role="button"
      tabIndex={-1}
      aria-label={label}
    >
      <div className="cp-tile__face">
        {tile.horsSujet ? (
          <>
            <span className="cp-tile__icon">🚫</span>
            <span className="cp-tile__label">Hors-sujet</span>
          </>
        ) : (
          <>
            <span className="cp-tile__icon">{def.icon}</span>
            <span className="cp-tile__label">{def.short}</span>
            {tile.special ? <span className="cp-tile__badge">{SPECIAL_BADGE[tile.special]}</span> : null}
          </>
        )}
      </div>
    </div>
  )
}
