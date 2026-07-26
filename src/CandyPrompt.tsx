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
    /*
     * La partie est disposee en grille nommee plutot qu'en colonne.
     * En etroit, les quatre zones s'empilent ; en large, le plateau passe a
     * gauche et la colonne d'information a droite, sans que le balisage change.
     * Le basculement se fait sur la largeur du CONTENEUR, pas de la fenetre :
     * le module peut etre encastre dans un panneau etroit d'un grand ecran, et
     * doit alors adopter la mise en page etroite.
     */
    <div className="cp-play">
      <header className="cp-play__hud">
        <button
          type="button"
          className="cp-stat cp-stat--action"
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

      <div className="cp-play__board">
        <Plateau />
      </div>

      <aside className="cp-play__aside">
        <div className="cp-brieflet">
          <p className="cp-brieflet__text">{level.brief}</p>
          <div className="cp-stat">
            <span className="cp-stat__label">Score</span>
            <span className="cp-stat__value">{score.toLocaleString('fr-FR')}</span>
          </div>
        </div>

        <PanneauPrompt />
      </aside>
    </div>
  )
}
