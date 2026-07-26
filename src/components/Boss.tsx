import { useMemo, useState } from 'react'

import { BLOCK_BY_ID } from '../game/blocks'
import { stableOrder } from '../game/shuffle'
import type { BossLevel } from '../data/boss'
import type { BlockId } from '../game/types'
import { useGame } from '../store/gameStore'

/**
 * Les niveaux « Répare le prompt ».
 *
 * Pas de plateau : un exercice court, sans hasard, ou le joueur doit
 * reellement raisonner sur un prompt. C'est le seul endroit du jeu ou l'on
 * mesure la comprehension plutot que l'adresse.
 */
export function Boss() {
  const boss = useGame((s) => s.activeBoss)
  const finishBoss = useGame((s) => s.finishBoss)
  if (!boss) return null

  return (
    <div className="cp-screen" style={{ justifyContent: 'flex-start' }}>
      <div className="cp-card">
        <p className="cp-eyebrow">Défi — {boss.title}</p>
        <h1 style={{ marginTop: 6, fontSize: 23 }}>{boss.question}</h1>
        <p className="cp-lead" style={{ fontSize: 13 }}>
          {boss.intro}
        </p>

        {boss.kind === 'ordre' ? (
          <ExerciceOrdre key={boss.id} boss={boss} onDone={finishBoss} />
        ) : (
          <ExerciceQuiz key={boss.id} boss={boss} onDone={finishBoss} />
        )}
      </div>
    </div>
  )
}

interface QuizProps {
  boss: Extract<BossLevel, { kind: 'diagnostic' | 'reparation' | 'duel' }>
  onDone: () => void
}

function ExerciceQuiz({ boss, onDone }: QuizProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const answer = picked === null ? null : boss.options[picked]
  // Sans melange, la bonne reponse serait toujours en tete du fichier de
  // contenu, et le joueur apprendrait a cliquer sans lire.
  const order = useMemo(() => stableOrder(boss.options.length, `boss:${boss.id}`), [boss])

  return (
    <>
      <pre className="cp-subject">{boss.subject}</pre>

      <div className="cp-choice">
        {order.map((index) => {
          const option = boss.options[index]!
          const classes = ['cp-option']
          if (answer) {
            if (option.correct) classes.push('cp-option--right')
            else if (picked === index) classes.push('cp-option--wrong')
            else classes.push('cp-option--muted')
          }
          return (
            <button
              key={index}
              type="button"
              className={classes.join(' ')}
              onClick={() => setPicked(index)}
              disabled={answer !== null}
            >
              {option.text}
            </button>
          )
        })}
      </div>

      {answer ? (
        <>
          <div className={`cp-verdict ${answer.correct ? 'cp-verdict--right' : 'cp-verdict--wrong'}`}>
            <p className="cp-verdict__head">{answer.correct ? 'Bien vu' : 'Pas tout à fait'}</p>
            <p>{answer.feedback}</p>
          </div>
          <div className="cp-footer">
            <button type="button" className="cp-btn cp-btn--block" onClick={onDone}>
              Continuer
            </button>
          </div>
        </>
      ) : null}
    </>
  )
}

interface OrdreProps {
  boss: Extract<BossLevel, { kind: 'ordre' }>
  onDone: () => void
}

function ExerciceOrdre({ boss, onDone }: OrdreProps) {
  const [placed, setPlaced] = useState<BlockId[]>([])
  const [checked, setChecked] = useState(false)

  // Le vivier est melange une fois pour toutes, sans hasard : on part de
  // l'ordre inverse, ce qui garantit un exercice reellement a faire.
  const pool = boss.sequence.filter((b) => !placed.includes(b)).reverse()
  const complete = placed.length === boss.sequence.length
  const correct = complete && placed.every((b, i) => b === boss.sequence[i])

  return (
    <>
      <div className="cp-seq">
        {boss.sequence.map((_, index) => {
          const block = placed[index]
          const def = block ? BLOCK_BY_ID[block] : null
          const classes = ['cp-seq__slot']
          if (checked && block) {
            classes.push(block === boss.sequence[index] ? 'cp-seq__slot--right' : 'cp-seq__slot--wrong')
          }
          return (
            <div key={index} className={classes.join(' ')}>
              <span className="cp-seq__rank">{index + 1}</span>
              {def ? (
                <>
                  <span aria-hidden="true">{def.icon}</span>
                  <span>{def.label}</span>
                </>
              ) : (
                <span className="cp-muted">—</span>
              )}
            </div>
          )
        })}
      </div>

      {!complete ? (
        <div className="cp-pool">
          {pool.map((block) => {
            const def = BLOCK_BY_ID[block]
            return (
              <button
                key={block}
                type="button"
                className="cp-chip"
                style={{ ['--tile-color' as string]: def.color }}
                onClick={() => setPlaced((current) => [...current, block])}
              >
                <span aria-hidden="true">{def.icon}</span>
                {def.short}
              </button>
            )
          })}
        </div>
      ) : null}

      {complete && !checked ? (
        <div className="cp-footer">
          <button type="button" className="cp-btn cp-btn--block" onClick={() => setChecked(true)}>
            Vérifier
          </button>
          <button
            type="button"
            className="cp-btn cp-btn--ghost"
            onClick={() => setPlaced([])}
          >
            Recommencer
          </button>
        </div>
      ) : null}

      {checked ? (
        <>
          <div className={`cp-verdict ${correct ? 'cp-verdict--right' : 'cp-verdict--wrong'}`}>
            <p className="cp-verdict__head">{correct ? 'Séquence exacte' : "Ce n'est pas l'ordre"}</p>
            <p>{boss.explanation}</p>
          </div>
          <div className="cp-footer">
            {correct ? (
              <button type="button" className="cp-btn cp-btn--block" onClick={onDone}>
                Continuer
              </button>
            ) : (
              <button
                type="button"
                className="cp-btn cp-btn--block"
                onClick={() => {
                  setPlaced([])
                  setChecked(false)
                }}
              >
                Réessayer
              </button>
            )}
          </div>
        </>
      ) : null}
    </>
  )
}
