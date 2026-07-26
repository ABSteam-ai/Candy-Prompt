import { useState } from 'react'

import { BLOCK_BY_ID } from '../game/blocks'
import { assemblePrompt, clarityScore, starsFor, useGame } from '../store/gameStore'
import type { ChoiceQuality } from '../game/types'

const QUALITY_LABEL: Record<ChoiceQuality, string> = {
  excellent: 'précis',
  moyen: 'vague',
  faible: 'creux',
}

/**
 * Ecran de fin de niveau.
 *
 * C'est le second temps fort pedagogique : le joueur decouvre le prompt qu'il
 * vient de construire, bloc par bloc, avec la qualite de chaque formulation.
 */
export function Bilan() {
  const level = useGame((s) => s.level)
  const chosen = useGame((s) => s.chosen)
  const score = useGame((s) => s.score)
  const outcome = useGame((s) => s.outcome)
  const retry = useGame((s) => s.retry)
  const nextLevel = useGame((s) => s.nextLevel)
  const openCarte = useGame((s) => s.openCarte)
  const [copied, setCopied] = useState(false)

  if (!level) return null

  if (outcome === 'perdu') {
    const missing = level.blocks.length - chosen.length
    return (
      <div className="cp-screen">
        <div className="cp-card">
          <p className="cp-eyebrow">Budget de tokens épuisé</p>
          <h1 style={{ marginTop: 6, fontSize: 24 }}>Le prompt est resté incomplet</h1>
          <p className="cp-lead">
            Il manquait {missing} bloc{missing > 1 ? 's' : ''} pour que ta demande tienne debout.
            Un prompt amputé d'un bloc, c'est une réponse à côté.
          </p>
          <div className="cp-footer">
            <button type="button" className="cp-btn" onClick={retry}>
              Réessayer
            </button>
            <button type="button" className="cp-btn cp-btn--ghost" onClick={openCarte}>
              La carte
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stars = starsFor(chosen)
  const clarity = clarityScore(chosen)
  const prompt = assemblePrompt(level, chosen)

  const copy = () => {
    void navigator.clipboard
      ?.writeText(prompt)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      })
      .catch(() => setCopied(false))
  }

  return (
    <div className="cp-screen">
      <div className="cp-card">
        <p className="cp-eyebrow">Niveau {level.id} terminé</p>
        <h1 style={{ marginTop: 6, fontSize: 24 }}>{level.title}</h1>

        <div className="cp-score">
          <div>
            <div className="cp-stars" aria-label={`${stars} étoiles sur 3`}>
              {'★'.repeat(stars)}
              <span style={{ opacity: 0.25 }}>{'★'.repeat(3 - stars)}</span>
            </div>
            <p className="cp-muted">{score.toLocaleString('fr-FR')} points</p>
          </div>
          <div className="cp-clarity">
            <span className="cp-clarity__value">{clarity}</span>
            <span className="cp-clarity__label">Clarté / 100</span>
          </div>
        </div>

        <p className="cp-lead" style={{ fontSize: 13 }}>
          {clarity >= 90
            ? "Chaque bloc est précis. C'est un prompt que tu peux réutiliser tel quel."
            : clarity >= 60
              ? 'Le prompt tient debout, mais certains blocs restent vagues. Rejoue le niveau pour viser 100.'
              : "Tous les blocs sont là, mais la plupart sont creux. Un prompt complet et flou reste un prompt flou."}
        </p>
      </div>

      <div className="cp-card">
        <h2 className="cp-panel__title" style={{ marginBottom: 0 }}>
          <span>Le prompt que tu as construit</span>
        </h2>
        <div className="cp-prompt">
          {level.blocks.map((block) => {
            const entry = chosen.find((c) => c.block === block)
            if (!entry) return null
            const def = BLOCK_BY_ID[block]
            return (
              <div
                key={block}
                className="cp-prompt__block"
                style={{ ['--tile-color' as string]: def.color }}
              >
                <p className="cp-prompt__label">
                  <span aria-hidden="true">{def.icon}</span>
                  {def.label}
                  <span className="cp-prompt__quality">{QUALITY_LABEL[entry.quality]}</span>
                </p>
                <p className="cp-prompt__text">{entry.text}</p>
              </div>
            )
          })}
        </div>

        <div className="cp-footer">
          <button type="button" className="cp-btn cp-btn--ghost" onClick={copy}>
            {copied ? 'Copié ✓' : 'Copier le prompt'}
          </button>
        </div>
        <p className="cp-muted cp-center" style={{ marginTop: 10 }}>
          Il est archivé dans ton Grimoire.
        </p>
      </div>

      <div className="cp-footer">
        <button type="button" className="cp-btn cp-btn--block" onClick={nextLevel}>
          Continuer
        </button>
        <button type="button" className="cp-btn cp-btn--ghost" onClick={retry}>
          Rejouer
        </button>
      </div>
    </div>
  )
}
