/**
 * Mesure de fluidite pendant une cascade, processeur bride.
 *
 * Le juice ajoute des dizaines d'elements animes par coup. On verifie ici que
 * le jeu tient le rythme sur une machine lente, pas seulement sur celle du
 * developpeur. Le facteur de ralentissement se regle par RALENTI.
 *
 *   RALENTI=4 node --experimental-strip-types tests/perf.ts [url]
 */
import { chromium } from 'playwright'
import { findHint } from '../src/game/board.ts'
import type { Board } from '../src/game/types.ts'

const URL = process.argv[2] ?? 'http://localhost:4173/'
const RALENTI = Number(process.env.RALENTI ?? 4)
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const cdp = await p.context().newCDPSession(p)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: RALENTI })

await p.goto(URL, { waitUntil: 'networkidle' })
await p.evaluate(() => { const s = (globalThis as any).__candyPrompt; s.getState().startLevel(10); s.setState({ screen: 'jeu' }) })
await p.waitForTimeout(600)

const lire = async (): Promise<Board> => {
  const t = await p.$$eval('.cp-tile', ns => ns.map(n => ({ r:+(n as HTMLElement).dataset.row!, c:+(n as HTMLElement).dataset.col!, block:(n as HTMLElement).dataset.block!, dead:(n as HTMLElement).dataset.dead==='1' })))
  const bd: Board = Array.from({length:8},()=>Array.from({length:8},()=>null))
  for (const x of t) bd[x.r]![x.c] = { id:`${x.r}-${x.c}`, block:x.block as any, ...(x.dead?{horsSujet:true}:{}) }
  return bd
}
const centre = async (q:any) => { const bx = await (await p.$(`.cp-tile[data-row="${q.row}"][data-col="${q.col}"]`))!.boundingBox(); return { x:bx!.x+bx!.width/2, y:bx!.y+bx!.height/2 } }

// On enregistre les intervalles entre images pendant plusieurs coups.
await p.evaluate(() => {
  ;(globalThis as any).__frames = []
  let last = performance.now()
  const boucle = (t: number) => { (globalThis as any).__frames.push(t - last); last = t; requestAnimationFrame(boucle) }
  requestAnimationFrame(boucle)
})

for (let i = 0; i < 6; i++) {
  const mv = findHint(await lire())
  if (!mv) break
  const A = await centre(mv[0]), B = await centre(mv[1])
  await p.mouse.move(A.x, A.y); await p.mouse.down()
  await p.mouse.move(B.x, B.y, { steps: 5 }); await p.mouse.up()
  await p.waitForTimeout(900)
}

const stats = await p.evaluate(() => {
  const f = ((globalThis as any).__frames as number[]).slice(5).sort((a, b) => a - b)
  const q = (x: number) => f[Math.floor(f.length * x)]
  return { images: f.length, median: q(0.5), p90: q(0.9), p99: q(0.99), pire: f[f.length - 1] }
})
const fps = (ms: number) => Math.round(1000 / ms)
console.log(`processeur bride ×${RALENTI} — ${stats.images} images mesurees`)
console.log(`  intervalle median ${stats.median!.toFixed(1)} ms (${fps(stats.median!)} i/s)`)
console.log(`  p90 ${stats.p90!.toFixed(1)} ms (${fps(stats.p90!)} i/s)`)
console.log(`  p99 ${stats.p99!.toFixed(1)} ms (${fps(stats.p99!)} i/s)`)
console.log(`  pire image ${stats.pire!.toFixed(1)} ms`)
await b.close()
