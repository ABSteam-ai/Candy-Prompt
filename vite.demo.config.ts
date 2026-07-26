import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Build de la demo autonome.
 *
 * Une seule entree et un seul morceau de code, pour que le script
 * `scripts/build-artifact.mjs` puisse tout replier dans un fichier HTML
 * unique, sans aucune ressource externe a charger.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-demo',
    rollupOptions: {
      input: 'demo.html',
      output: { inlineDynamicImports: true, entryFileNames: 'demo.js', assetFileNames: 'demo.[ext]' },
    },
  },
})
