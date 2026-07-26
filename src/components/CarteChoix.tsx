import { useMemo } from 'react'

import { Bonbon } from './Bonbon'
import { BLOCK_BY_ID } from '../game/blocks'
import { stableOrder } from '../game/shuffle'
import { useGame } from '../store/gameStore'

export function CarteChoix() {
  const card = useGame((s) => s.activeCard)
  const answer = useGame((s) => s.cardAnswer)
  const answerCard = useGame((s) => s.answerCard)
  const dismissCard = useGame((s) => s.dismissCard)

  const order = useMemo(
    () => (card ? stableOrder(card.options.length, `${card.levelId}:${card.block}`) : []),
    [card],
  )
  if (!card) return null

  const def = BLOCK_BY_ID[card.block]
  const right = answer?.quality === 'excellent'

  return (
    <div className="cp-modal" role="dialog" aria-modal="true" aria-label={`Formuler ${def.label}`}>
      <div className="cp-modal__box">
        <p className="cp-eyebrow cp-eyebrow--bonbon">
          <span className="cp-eyebrow__bonbon" aria-hidden="true">
            <Bonbon block={card.block} />
          </span>
          {def.label} — bloc débloqué
        </p>
        <h2 style={{ marginTop: 6, fontSize: 19 }}>{card.question}</h2>
        <p className="cp-lead" style={{ fontSize: 13 }}>
          {def.role}
        </p>

        <div className="cp-choice">
          {order.map((index) => {
            const option = card.options[index]!
            const picked = answer?.index === index
            const classes = ['cp-option']
            if (answer) {
              if (option.quality === 'excellent') classes.push('cp-option--right')
              else if (picked) classes.push('cp-option--wrong')
              else classes.push('cp-option--muted')
              if (picked) classes.push('cp-option--picked')
            }
            return (
              <button
                key={index}
                type="button"
                className={classes.join(' ')}
                onClick={() => answerCard(index)}
                disabled={answer !== null}
              >
                {option.text}
              </button>
            )
          })}
        </div>

        {answer ? (
          <>
            <div className={`cp-verdict ${right ? 'cp-verdict--right' : 'cp-verdict--wrong'}`}>
              <p className="cp-verdict__head">
                {right ? 'La meilleure formulation. +500 points' : 'Formulation retenue quand même'}
              </p>
              <p>{answer.feedback}</p>
              {!right ? (
                <p className="cp-muted" style={{ marginTop: 8 }}>
                  Elle entre tout de même dans ton prompt : tu verras l'effet sur ta note de clarté.
                </p>
              ) : null}
            </div>
            <div className="cp-footer">
              <button type="button" className="cp-btn" onClick={dismissCard}>
                Continuer
              </button>
            </div>
          </>
        ) : (
          <p className="cp-muted" style={{ marginTop: 12 }}>
            Le texte que tu choisis entrera vraiment dans ton prompt final.
          </p>
        )}
      </div>
    </div>
  )
}
