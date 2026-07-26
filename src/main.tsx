import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { CandyPrompt } from './CandyPrompt'
import { useGame } from './store/gameStore'
import { LEVELS } from './data/levels'
import { BOSS_LEVELS } from './data/boss'

/**
 * Harnais de developpement.
 *
 * Il ne sert qu'a jouer au jeu isolement pendant le developpement. Dans
 * l'application hote, c'est `src/index.ts` qu'on importe.
 */
const container = document.getElementById('root')
if (!container) throw new Error('Element #root introuvable')

// Le harnais pose le fond et la hauteur sur la page entiere ; le module, lui,
// n'impose rien. Sans hauteur definie sur l'ancetre, le `min-height: 100%` de
// la racine ne s'applique pas et le jeu reste colle en haut de l'ecran.
const page = document.documentElement
page.style.height = '100%'
document.body.style.cssText =
  'margin:0;height:100%;display:grid;background:#0d0a24;'

// Accroches de test : les scripts de verification lisent l'etat du jeu et le
// contenu ici. Elles n'existent que dans le harnais, jamais dans le module
// exporte par `src/index.ts`.
Object.assign(globalThis, {
  __candyPrompt: useGame,
  __candyPromptData: { LEVELS, BOSS_LEVELS },
})

createRoot(container).render(
  <StrictMode>
    <CandyPrompt />
  </StrictMode>,
)
