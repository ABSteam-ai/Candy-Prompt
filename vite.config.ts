import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Le harnais standalone sert a developper et a tester le jeu isolement.
// Pour l'integration dans l'app La Quete de l'IA, c'est `src/index.ts`
// qui est le point d'entree : il exporte le composant <CandyPrompt />.
export default defineConfig({
  plugins: [react()],
  base: './',
})
