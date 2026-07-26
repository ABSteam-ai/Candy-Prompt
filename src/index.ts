/**
 * Point d'entree du module.
 *
 * Pour integrer le jeu dans l'application La Quete de l'IA :
 *
 *   import { CandyPrompt } from 'candy-prompt'
 *   <CandyPrompt />
 *
 * Le composant est autonome : il embarque ses styles, ne pose aucun routeur,
 * et sauvegarde la progression dans le localStorage du navigateur.
 */
export { CandyPrompt } from './CandyPrompt'
export { useGame, assemblePrompt, clarityScore, starsFor } from './store/gameStore'
export { loadProgress, saveProgress, resetProgress } from './store/progress'
export type { Progress, GrimoireEntry } from './store/progress'
export { LEVELS } from './data/levels'
export { BLOCKS } from './game/blocks'
export type { BlockId, Level } from './game/types'
