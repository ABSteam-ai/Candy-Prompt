import './styles.css'

import { Bilan } from './components/Bilan'
import { Boss } from './components/Boss'
import { CarteChoix } from './components/CarteChoix'
import { ActeIntro, Brief, Carte, Grimoire } from './components/Ecrans'
import { PanneauPrompt } from './components/PanneauPrompt'
import { Plateau } from './components/Plateau'
import { useGame } from './store/gameStore'

/**
 * Racine du jeu.
 *
 * Composant autonome : aucun routeur, aucun contexte externe, aucun style
 * global. Il suffit de le monter n'importe ou dans l'application hote.
 */
export function CandyPrompt() {
  const screen = useGame((s) => s.screen)

  return (
    <div className="cp-root">
      {screen === 'carte' ? <Carte /> : null}
      {screen === 'grimoire' ? <Grimoire /> : null}
      {screen === 'acte' ? <ActeIntro /> : null}
      {screen === 'brief' ? <Brief /> : null}
      {screen === 'bilan' ? <Bilan /> : null}
      {screen === 'boss' ? <Boss /> : null}
      {screen === 'jeu' ? <EcranJeu /> : null}
      <CarteChoix />
    </div>
  )
}

function EcranJeu() {
  const level = useGame((s) => s.level)
  const movesLeft = useGame((s) => s.movesLeft)
  const score = useGame((s) => s.score)
  const openCarte = useGame((s) => s.openCarte)
  if (!level) return null

  return (
    <>
      <header className="cp-hud">
        <button
          type="button"
          className="cp-stat"
          onClick={openCarte}
          aria-label="Revenir à la carte des niveaux"
        >
          <span className="cp-stat__label">Niveau</span>
          <span className="cp-stat__value">{level.id}</span>
        </button>

        <h1 className="cp-hud__title">
          <span className="cp-hud__sub">Mission</span>
          {level.title}
        </h1>

        <div className={`cp-stat${movesLeft <= 3 ? ' cp-stat--alert' : ''}`}>
          <span className="cp-stat__label">Tokens</span>
          <span className="cp-stat__value">{movesLeft}</span>
        </div>
      </header>

      <Plateau />

      <div className="cp-hud" style={{ gridTemplateColumns: '1fr auto' }}>
        <p className="cp-muted" style={{ fontSize: 12 }}>
          {level.brief}
        </p>
        <div className="cp-stat">
          <span className="cp-stat__label">Score</span>
          <span className="cp-stat__value">{score.toLocaleString('fr-FR')}</span>
        </div>
      </div>

      <PanneauPrompt />
    </>
  )
}
