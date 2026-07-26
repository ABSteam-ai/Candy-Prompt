import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { CandyPrompt } from './CandyPrompt'

/**
 * Point d'entree de la demo autonome.
 *
 * Identique au harnais de developpement, mais sans les accroches de test :
 * cette version est destinee a etre partagee, pas a etre pilotee par un
 * script. Elle sert a produire le fichier HTML unique de `npm run build:demo`.
 */
const container = document.getElementById('root')
if (!container) throw new Error('Element #root introuvable')

createRoot(container).render(
  <StrictMode>
    <CandyPrompt />
  </StrictMode>,
)
