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

// Le harnais pose le fond sur la page entiere ; le module, lui, n'impose rien.
document.body.style.margin = '0'
document.body.style.minHeight = '100dvh'
document.body.style.background = '#0d0a24'

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
