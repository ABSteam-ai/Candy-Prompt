/**
 * Partie automatisee de bout en bout.
 *
 * Le script joue reellement au niveau 1 : il lit le plateau dans le DOM,
 * calcule un coup valable avec le meme moteur que le jeu, effectue le
 * glissement, repond aux cartes de choix, et verifie qu'on atteint bien
 * l'ecran de bilan avec un prompt assemble.
 *
 *   node --experimental-strip-types tests/partie.e2e.ts [url]
 */
import { chromium, type Page } from 'playwright'

import { clearMatches, findMatches, isValidSwap, swapped } from '../src/game/board.ts'
import type { Board, BlockId, FlouGrid, Position } from '../src/game/types.ts'

const URL = process.argv[2] ?? 'http://localhost:4173/'
const SHOTS = process.env.SHOT_DIR ?? '.'

interface DomTile {
  row: number
  col: number
  block: BlockId
  dead: boolean
}

async function readBoard(page: Page): Promise<Board> {
  const tiles = (await page.$$eval('.cp-tile', (nodes) =>
    nodes.map((node) => {
      const el = node as HTMLElement
      return {
        row: Number(el.dataset.row),
        col: Number(el.dataset.col),
        block: el.dataset.block as string,
        dead: el.dataset.dead === '1',
      }
    }),
  )) as DomTile[]

  const rows = Math.max(...tiles.map((t) => t.row)) + 1
  const cols = Math.max(...tiles.map((t) => t.col)) + 1
  const board: Board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
  for (const tile of tiles) {
    board[tile.row]![tile.col] = {
      id: `${tile.row}-${tile.col}`,
      block: tile.block,
      ...(tile.dead ? { horsSujet: true } : {}),
    }
  }
  return board
}

/**
 * Choisit le coup qui rapporte le plus de fragments encore manquants.
 *
 * Prendre le premier coup venu ne suffit pas : c'est une strategie si faible
 * qu'elle epuise le budget avant la fin, et le test ne verifierait alors
 * jamais l'ecran de victoire.
 */
function findMove(
  board: Board,
  flou: FlouGrid,
  needed: Partial<Record<BlockId, number>>,
): [Position, Position] | null {
  const rows = board.length
  const cols = board[0]?.length ?? 0
  let best: { move: [Position, Position]; value: number } | null = null

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const from = { row: r, col: c }
      for (const to of [
        { row: r, col: c + 1 },
        { row: r + 1, col: c },
      ]) {
        if (to.row >= rows || to.col >= cols) continue
        if (!isValidSwap(board, from, to)) continue
        const matches = findMatches(swapped(board, from, to), to)
        if (matches.length === 0) continue

        const preview = clearMatches(swapped(board, from, to), flou, matches)
        let value = preview.flouCleared
        for (const [block, count] of Object.entries(preview.collected)) {
          value += Math.min(count ?? 0, needed[block as BlockId] ?? 0)
        }
        if (!best || value > best.value) best = { move: [from, to], value }
      }
    }
  }
  return best?.move ?? null
}

async function centreOf(page: Page, pos: Position): Promise<{ x: number; y: number }> {
  const handle = await page.$(`.cp-tile[data-row="${pos.row}"][data-col="${pos.col}"]`)
  if (!handle) throw new Error(`Tuile (${pos.row},${pos.col}) introuvable`)
  const box = await handle.boundingBox()
  if (!box) throw new Error(`Tuile (${pos.row},${pos.col}) sans position`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

let cardShotTaken = false

async function handleChoiceCard(page: Page): Promise<boolean> {
  const modal = await page.$('.cp-modal')
  if (!modal) return false
  if (!cardShotTaken) {
    cardShotTaken = true
    await page.screenshot({ path: `${SHOTS}/05-choix.png` })
  }
  // On repond au hasard, pour verifier que les deux chemins fonctionnent.
  const options = await page.$$('.cp-modal .cp-option')
  const pick = options[Math.floor(Math.random() * options.length)]
  if (!pick) throw new Error('Carte de choix sans option')
  await pick.click()
  await page.waitForSelector('.cp-verdict', { timeout: 3000 })
  await page.click('.cp-modal .cp-btn')
  await page.waitForSelector('.cp-modal', { state: 'detached', timeout: 3000 }).catch(() => {
    // Une autre carte peut prendre la suite immediatement : ce n'est pas une erreur.
  })
  return true
}

async function main() {
  // Chromium est deja installe dans l'environnement : on le pointe directement
  // plutot que de laisser Playwright en telecharger un.
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  })
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } })
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(String(err)))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto(URL, { waitUntil: 'networkidle' })
  console.log('· carte des niveaux affichée')
  await page.screenshot({ path: `${SHOTS}/01-carte.png` })

  await page.click('.cp-level:not(.cp-level--locked)')
  await page.waitForSelector('.cp-card')

  // Carte d'ouverture d'acte, puis brief.
  if (await page.$('text=J\'ai compris')) {
    await page.screenshot({ path: `${SHOTS}/02-acte.png` })
    await page.click('text=J\'ai compris')
  }
  await page.waitForSelector('text=Commencer')
  await page.screenshot({ path: `${SHOTS}/03-brief.png` })
  await page.click('text=Commencer')
  await page.waitForSelector('.cp-board')
  console.log('· plateau affiché')

  let moves = 0
  for (let step = 0; step < 120; step++) {
    if (await page.$('.cp-screen .cp-stars')) break
    if (await page.$('text=Budget de tokens épuisé')) break

    if (await handleChoiceCard(page)) continue

    const board = await readBoard(page)
    if (board.length === 0) {
      await page.waitForTimeout(200)
      continue
    }
    const { flou, needed } = await page.evaluate(() => {
      const s = (window as unknown as { __candyPrompt: { getState: () => Record<string, any> } })
        .__candyPrompt.getState()
      const needed: Record<string, number> = {}
      for (const [block, target] of Object.entries(s.level.goals as Record<string, number>)) {
        needed[block] = Math.max(0, target - (s.collected[block] ?? 0))
      }
      return { flou: s.flou as number[][], needed }
    })
    const move = findMove(board, flou, needed as Partial<Record<BlockId, number>>)
    if (!move) {
      await page.waitForTimeout(400)
      continue
    }

    if (moves === 4) await page.screenshot({ path: `${SHOTS}/04-plateau.png` })

    const [from, to] = move
    const a = await centreOf(page, from)
    const b = await centreOf(page, to)
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    await page.mouse.move(b.x, b.y, { steps: 6 })
    await page.mouse.up()
    moves += 1
    await page.waitForTimeout(700)
  }

  // On repond aux cartes restantes avant le bilan.
  for (let i = 0; i < 8; i++) {
    if (!(await handleChoiceCard(page))) break
  }
  await page.waitForTimeout(600)

  const won = (await page.$('.cp-stars')) !== null
  const lost = (await page.$('text=Budget de tokens épuisé')) !== null
  await page.screenshot({ path: `${SHOTS}/06-bilan.png`, fullPage: true })

  if (won) {
    const clarity = await page.textContent('.cp-clarity__value')
    const promptBlocks = await page.$$eval('.cp-prompt__block', (n) => n.length)
    console.log(`· niveau terminé en ${moves} coups — clarté ${clarity}/100, ${promptBlocks} blocs assemblés`)
    if (promptBlocks !== 3) throw new Error(`prompt incomplet : ${promptBlocks} blocs au lieu de 3`)
  } else if (lost) {
    console.log(`· niveau perdu après ${moves} coups (écran de défaite atteint)`)
  } else {
    throw new Error(`la partie n'a atteint aucun écran de fin après ${moves} coups`)
  }

  await browser.close()

  if (errors.length > 0) {
    console.error('Erreurs console :\n' + errors.join('\n'))
    process.exit(1)
  }
  console.log('· aucune erreur console')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
