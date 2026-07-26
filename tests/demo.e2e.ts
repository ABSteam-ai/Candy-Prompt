/**
 * Verification du fichier HTML unique produit par `npm run build:demo`.
 *
 * Ce fichier est destine a etre publie comme page autonome, ou aucune
 * ressource externe ne peut etre chargee. On verifie donc qu'il se suffit a
 * lui-meme : le jeu se monte, une partie se lance, et rien ne deborde — en
 * telephone comme en grand ecran.
 *
 * Le fragment est volontairement injecte dans l'enveloppe HTML minimale que
 * la page hote ajoutera autour de lui, pour tester ce qui sera reellement
 * servi plutot qu'un document complet fabrique pour l'occasion.
 *
 *   npm run build:demo
 *   node --experimental-strip-types tests/demo.e2e.ts
 */
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'

const SHOTS = process.env.SHOT_DIR ?? '.'
const SOURCE = process.argv[2] ?? 'dist-demo/candy-prompt.html'

const fragment = await readFile(SOURCE, 'utf8')
const document = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${fragment}</body></html>`

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})

const errors: string[] = []
const viewports = [
  ['mobile', { width: 420, height: 900 }],
  ['desktop', { width: 1280, height: 900 }],
] as const

for (const [label, viewport] of viewports) {
  const page = await browser.newPage({ viewport })
  page.on('pageerror', (err) => errors.push(`${label} : ${err}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`${label} : ${msg.text()}`)
  })

  await page.setContent(document, { waitUntil: 'load' })
  await page.waitForSelector('.cp-root', { timeout: 5000 })

  const levels = (await page.$$('.cp-level')).length
  const chips = (await page.$$('.cp-chip')).length
  if (levels === 0) throw new Error(`${label} : aucun niveau affiche`)
  if (chips !== 7) throw new Error(`${label} : ${chips} blocs en legende au lieu de 7`)

  // On entre reellement dans une partie : monter le composant ne prouve rien.
  await page.click('.cp-level:not(.cp-level--locked)')
  await page.waitForTimeout(200)
  const intro = await page.$("text=J'ai compris")
  if (intro) await intro.click()
  await page.waitForTimeout(150)
  await page.click('text=Commencer')
  await page.waitForSelector('.cp-board', { timeout: 5000 })

  const tiles = (await page.$$('.cp-tile')).length
  if (tiles !== 64) throw new Error(`${label} : ${tiles} tuiles au lieu de 64`)

  const overflows = await page.evaluate(
    () => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth + 1,
  )
  if (overflows) throw new Error(`${label} : la page deborde horizontalement`)

  await page.screenshot({ path: `${SHOTS}/demo-${label}.png` })
  console.log(`· ${label} : ${levels} niveaux, plateau de ${tiles} tuiles, aucun debordement`)
  await page.close()
}

await browser.close()

if (errors.length > 0) {
  console.error('Erreurs console :\n' + errors.join('\n'))
  process.exit(1)
}
console.log('· aucune erreur console')
