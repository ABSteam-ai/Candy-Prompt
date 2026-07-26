import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { CandyPrompt } from './CandyPrompt'
import { useGame } from './store/gameStore'

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

// Accroche de test : le script de partie automatisee lit l'etat du jeu ici.
// Elle n'existe que dans le harnais, jamais dans le module exporte.
;(globalThis as unknown as { __candyPrompt?: unknown }).__candyPrompt = useGame

createRoot(container).render(
  <StrictMode>
    <CandyPrompt />
  </StrictMode>,
)
