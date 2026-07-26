import { Bonbon } from './Bonbon'
import { BLOCK_BY_ID } from '../game/blocks'
import { useGame } from '../store/gameStore'

/**
 * Le prompt en cours de construction, montre en permanence sous le plateau.
 *
 * C'est le fil rouge du niveau : le joueur voit a tout instant ce qu'il
 * fabrique, et quels blocs lui manquent encore.
 */
export function PanneauPrompt() {
  const level = useGame((s) => s.level)
  const collected = useGame((s) => s.collected)
  const chosen = useGame((s) => s.chosen)
  const flou = useGame((s) => s.flou)

  if (!level) return null
  const veilLeft = flou.flat().filter((v) => v > 0).length
  const chosenBlocks = new Set(chosen.map((c) => c.block))

  return (
    <section className="cp-panel" aria-label="Prompt en construction">
      <h2 className="cp-panel__title">
        <span>Ton prompt</span>
        <span>
          {chosen.length}/{level.blocks.length} blocs
          {veilLeft > 0 ? ` · ${veilLeft} cases floues` : ''}
        </span>
      </h2>

      <div className="cp-gauges">
        {level.blocks.map((block) => {
          const def = BLOCK_BY_ID[block]
          const target = level.goals[block] ?? 0
          const have = Math.min(collected[block] ?? 0, target)
          const done = chosenBlocks.has(block)
          const ratio = target === 0 ? 1 : have / target

          return (
            <div
              key={block}
              className={`cp-gauge${done ? ' cp-gauge--done' : ''}`}
              style={{
                ['--tile-color' as string]: def.color,
                ['--tile-shade' as string]: def.shade,
              }}
            >
              {/*
                Le bonbon lui-meme, pas un emoji : la tuile ne porte plus de
                libelle, c'est donc ici que le joueur apprend a associer une
                forme a un bloc.
              */}
              <span className="cp-gauge__bonbon" aria-hidden="true">
                <Bonbon block={block} />
              </span>
              <div
                className="cp-gauge__track"
                role="progressbar"
                aria-label={def.label}
                aria-valuenow={have}
                aria-valuemin={0}
                aria-valuemax={target}
              >
                <div className="cp-gauge__fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
                <span className="cp-gauge__name">{def.short}</span>
              </div>
              <span className="cp-gauge__count">{done ? '✓ écrit' : `${have}/${target}`}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
