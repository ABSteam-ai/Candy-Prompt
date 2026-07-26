import { useState } from 'react'

import { Bonbon } from './Bonbon'
import { BLOCKS, BLOCK_BY_ID } from '../game/blocks'
import { ACT_INTROS, LEVELS } from '../data/levels'
import { useGame, unlockedUpTo } from '../store/gameStore'

/** La carte des niveaux : point d'entree du jeu. */
export function Carte() {
  const progress = useGame((s) => s.progress)
  const startLevel = useGame((s) => s.startLevel)
  const openGrimoire = useGame((s) => s.openGrimoire)

  const unlocked = unlockedUpTo(progress)
  const acts = [...new Set(LEVELS.map((l) => l.act))]
  const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0)

  return (
    <div className="cp-screen cp-screen--large" style={{ justifyContent: 'flex-start' }}>
      <div className="cp-card">
        <p className="cp-eyebrow">La Quête de l'IA</p>
        <h1 style={{ marginTop: 6, fontSize: 27 }}>Candy Prompt</h1>
        <p className="cp-lead">
          Aligne les blocs, construis le prompt. Sept blocs font tenir une demande debout — tu vas les
          apprendre en jouant.
        </p>
        {/*
          La legende des sept bonbons. C'est la cle de lecture du plateau :
          puisque les tuiles ne portent plus de libelle, c'est ici que
          s'apprend l'association entre une forme et un bloc.
        */}
        <div className="cp-blocks-legend">
          {BLOCKS.map((block) => (
            <span
              key={block.id}
              className="cp-chip"
              style={{ ['--tile-color' as string]: block.color }}
            >
              <span className="cp-chip__bonbon" aria-hidden="true">
                <Bonbon block={block.id} />
              </span>
              {block.short}
            </span>
          ))}
        </div>
      </div>

      {acts.map((act) => (
        <div key={act}>
          <p className="cp-actbar">{ACT_INTROS.find((a) => a.act === act)?.title ?? `Acte ${act}`}</p>
          <div className="cp-levels">
            {LEVELS.filter((l) => l.act === act).map((level) => {
              const stars = progress.stars[level.id] ?? 0
              const locked = level.id > unlocked
              return (
                <button
                  key={level.id}
                  type="button"
                  className={`cp-level${locked ? ' cp-level--locked' : ''}`}
                  onClick={() => !locked && startLevel(level.id)}
                  disabled={locked}
                >
                  <span className="cp-level__num">
                    {locked ? '🔒 ' : ''}Niveau {level.id}
                  </span>
                  <span className="cp-level__title">{level.title}</span>
                  <span className="cp-level__stars">
                    {stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="cp-footer">
        <button type="button" className="cp-btn cp-btn--ghost cp-btn--block" onClick={openGrimoire}>
          Grimoire — {progress.grimoire.length} prompt{progress.grimoire.length > 1 ? 's' : ''}
        </button>
      </div>
      <p className="cp-muted cp-center">{totalStars} étoiles sur {LEVELS.length * 3}</p>
    </div>
  )
}

/** Carte d'ouverture d'un acte : les nouveaux blocs, en 30 secondes. */
export function ActeIntro() {
  const level = useGame((s) => s.level)
  const confirmBrief = useGame((s) => s.confirmBrief)
  if (!level) return null

  const intro = ACT_INTROS.find((a) => a.act === level.act)
  if (!intro) return null

  return (
    <div className="cp-screen">
      <div className="cp-card">
        <p className="cp-eyebrow">Nouveau chapitre</p>
        <h1 style={{ marginTop: 6, fontSize: 24 }}>{intro.title}</h1>
        <p className="cp-lead">{intro.subtitle}</p>

        {intro.reveals.map((blockId) => {
          const def = BLOCK_BY_ID[blockId]
          return (
            <div key={blockId} className="cp-brief" style={{ borderLeftColor: def.color }}>
              <p className="cp-brief__titre">
                <span className="cp-brief__bonbon" aria-hidden="true">
                  <Bonbon block={blockId} />
                </span>
                {def.label}
              </p>
              <p style={{ marginTop: 4 }}>{def.role}</p>
              <p className="cp-muted" style={{ marginTop: 8 }}>
                <strong style={{ color: def.color }}>Le piège :</strong> {def.piege}
              </p>
            </div>
          )
        })}

        <div className="cp-footer">
          <button type="button" className="cp-btn cp-btn--block" onClick={confirmBrief}>
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  )
}

/** Le brief : la mission confiee au joueur avant d'attaquer le plateau. */
export function Brief() {
  const level = useGame((s) => s.level)
  const confirmBrief = useGame((s) => s.confirmBrief)
  const openCarte = useGame((s) => s.openCarte)
  if (!level) return null

  const veils = level.obstacles?.flou ?? 0
  const deads = level.obstacles?.horsSujet ?? 0

  return (
    <div className="cp-screen">
      <div className="cp-card">
        <p className="cp-eyebrow">Niveau {level.id}</p>
        <h1 style={{ marginTop: 6, fontSize: 24 }}>{level.title}</h1>

        <div className="cp-brief">{level.brief}</div>

        <p className="cp-lead" style={{ fontSize: 13 }}>
          Récolte les fragments de chaque bloc pour écrire ton prompt. Tu disposes de{' '}
          <strong>{level.moves} tokens</strong> — chaque coup en consomme un.
        </p>

        {veils > 0 || deads > 0 ? (
          <div className="cp-blocks-legend">
            {veils > 0 ? (
              <span className="cp-chip" style={{ ['--tile-color' as string]: '#9fb4ff' }}>
                🌫 {veils} cases de Flou — elles ne rapportent rien
              </span>
            ) : null}
            {deads > 0 ? (
              <span className="cp-chip" style={{ ['--tile-color' as string]: '#7a7a92' }}>
                🚫 {deads} Hors-sujet à dégager
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="cp-footer">
          <button type="button" className="cp-btn cp-btn--block" onClick={confirmBrief}>
            Commencer
          </button>
          <button type="button" className="cp-btn cp-btn--ghost" onClick={openCarte}>
            Retour
          </button>
        </div>
      </div>
    </div>
  )
}

/** Le Grimoire : la collection de prompts construits, copiables. */
export function Grimoire() {
  const progress = useGame((s) => s.progress)
  const openCarte = useGame((s) => s.openCarte)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const entries = [...progress.grimoire].sort((a, b) => a.levelId - b.levelId)

  return (
    <div className="cp-screen cp-screen--large" style={{ justifyContent: 'flex-start' }}>
      <div className="cp-card">
        <p className="cp-eyebrow">Ta collection</p>
        <h1 style={{ marginTop: 6, fontSize: 24 }}>Le Grimoire</h1>
        <p className="cp-lead">
          Chaque prompt que tu as construit est archivé ici, prêt à être copié et réutilisé.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="cp-card cp-center">
          <p className="cp-muted">
            Ton grimoire est vide. Termine un niveau pour y archiver ton premier prompt.
          </p>
        </div>
      ) : (
        entries.map((entry) => (
          <div key={entry.levelId} className="cp-card cp-entry">
            <div className="cp-entry__head">
              <div>
                <p className="cp-eyebrow">Niveau {entry.levelId}</p>
                <h2 style={{ fontSize: 17, marginTop: 3 }}>{entry.title}</h2>
              </div>
              <span className="cp-clarity__value" style={{ fontSize: 22 }}>
                {entry.clarity}
              </span>
            </div>
            <p className="cp-muted" style={{ marginTop: 6, fontSize: 13 }}>
              {entry.brief}
            </p>
            <pre className="cp-pre">{entry.prompt}</pre>
            <div className="cp-footer">
              <button
                type="button"
                className="cp-btn cp-btn--ghost cp-btn--block"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(entry.prompt)
                    .then(() => {
                      setCopiedId(entry.levelId)
                      setTimeout(() => setCopiedId(null), 1800)
                    })
                    .catch(() => setCopiedId(null))
                }}
              >
                {copiedId === entry.levelId ? 'Copié ✓' : 'Copier'}
              </button>
            </div>
          </div>
        ))
      )}

      <div className="cp-footer">
        <button type="button" className="cp-btn cp-btn--block" onClick={openCarte}>
          Retour à la carte
        </button>
      </div>
    </div>
  )
}
