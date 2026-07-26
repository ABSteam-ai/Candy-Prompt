/**
 * Verification des ecrans que la partie automatisee ne traverse pas.
 *
 * Injecte une progression factice, puis passe en revue le Grimoire et les
 * quatre niveaux boss, y compris la resolution complete de la remise en ordre.
 *
 *   node --experimental-strip-types tests/ecrans.e2e.ts [url]
 */
import { chromium } from 'playwright'

const URL = process.argv[2] ?? 'http://localhost:4173/'
const SHOTS = process.env.SHOT_DIR ?? '.'
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 420, height: 900 } })
const errs: string[] = []
p.on('pageerror', e => errs.push(String(e)))
p.on('console', m => { if (m.type()==='error' && !m.text().includes('404')) errs.push(m.text()) })
await p.goto(URL, { waitUntil: 'networkidle' })

await p.evaluate(() => {
  const grimoire = [1,2,3].map(id => ({ levelId:id, title:`Niveau ${id}`, brief:'Brief de test',
    prompt:"Tu es un commercial expérimenté, habitué aux cycles de vente longs.\n\nDevis de 4 200 € envoyé il y a 14 jours à un client déjà accompagné.\n\nRédige un mail de relance qui obtienne une réponse.", clarity: 70+id*8 }))
  localStorage.setItem('candy-prompt:v1', JSON.stringify({ stars:{1:3,2:2,3:3}, best:{}, actsSeen:[1], grimoire }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.screenshot({ path: `${SHOTS}/10-carte.png`, fullPage: true })

await p.click('text=Grimoire')
await p.waitForTimeout(250)
await p.screenshot({ path: `${SHOTS}/11-grimoire.png` })
console.log('grimoire :', (await p.$$('.cp-entry')).length, 'entrées')
await p.click('text=Retour à la carte')

// Chaque niveau boss, un par un
const kinds = await p.evaluate(() => (window as any).__candyPromptData.BOSS_LEVELS.map((b:any)=>b.kind))
for (let i = 0; i < kinds.length; i++) {
  await p.evaluate((i) => {
    const boss = (window as any).__candyPromptData.BOSS_LEVELS[i]
    ;(window as any).__candyPrompt.setState({ screen:'boss', activeBoss: boss, bossQueue: [] })
  }, i)
  await p.waitForTimeout(250)
  const title = await p.textContent('.cp-eyebrow')
  await p.screenshot({ path: `${SHOTS}/12-boss-${kinds[i]}.png`, fullPage: true })
  console.log(`boss ${i+1} (${kinds[i]}) :`, title)
}

// Résoudre le boss « remise en ordre » dans le bon ordre
await p.evaluate(() => {
  const boss = (window as any).__candyPromptData.BOSS_LEVELS.find((b:any)=>b.kind==='ordre')
  ;(window as any).__candyPrompt.setState({ screen:'boss', activeBoss: boss, bossQueue: [] })
})
await p.waitForTimeout(200)
for (let i=0;i<7;i++){
  const chips = await p.$$('.cp-pool .cp-chip')
  // le vivier est présenté à l'envers : le dernier est le prochain attendu
  await chips[chips.length-1]!.click()
  await p.waitForTimeout(80)
}
await p.click('text=Vérifier')
await p.waitForTimeout(300)
const verdict = await p.textContent('.cp-verdict__head')
console.log('boss ordre, verdict après séquence correcte :', verdict)
await p.screenshot({ path: `${SHOTS}/13-boss-ordre-resolu.png`, fullPage: true })

await b.close()
if (errs.length) { console.error('ERREURS:\n'+errs.join('\n')); process.exit(1) }
console.log('aucune erreur console')
