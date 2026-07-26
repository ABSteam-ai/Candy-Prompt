/**
 * Banc d'apercu visuel.
 *
 * Capture chaque ecran du jeu a chaque taille d'ecran, en une seule passe.
 * C'est l'outil de travail du design : sans lui, verifier « mobile et desktop »
 * se fait a l'aveugle, un ecran a la fois.
 *
 * Signale aussi, pour chaque capture, les deux defauts de mise en page qui ne
 * se voient pas sur une image isolee : le debordement horizontal, et le
 * plateau qui sort de la zone visible sans defilement.
 *
 *   npm run build && npm run preview -- --port 4173 --strictPort
 *   node --experimental-strip-types tests/apercu.ts [url]
 *
 * Les captures vont dans SHOT_DIR (par defaut « apercu/ »).
 */
import { chromium, type Browser, type Page } from 'playwright'
import { mkdir } from 'node:fs/promises'

const URL = process.argv[2] ?? 'http://localhost:4173/'
const SHOTS = process.env.SHOT_DIR ?? 'apercu'

/** Les tailles qui comptent : un telephone etroit, un grand telephone, une tablette, un ecran de bureau. */
const ECRANS = [
  { nom: 'mobile-etroit', width: 360, height: 740 },
  { nom: 'mobile', width: 390, height: 844 },
  { nom: 'tablette', width: 834, height: 1112 },
  { nom: 'desktop', width: 1440, height: 900 },
  { nom: 'desktop-court', width: 1280, height: 680 },
] as const

type Etat = { nom: string; prepare: (page: Page) => Promise<void> }

/** Progression factice, pour atteindre les ecrans qui demandent d'avoir joue. */
const PROGRESSION = {
  stars: { 1: 3, 2: 2, 3: 3, 4: 1, 5: 2 },
  best: {},
  actsSeen: [1],
  grimoire: [1, 2, 3].map((id) => ({
    levelId: id,
    title: ['La relance qui ne braque pas', 'Une heure de réunion en dix lignes', "L'annonce qui trouve preneur"][id - 1],
    brief: 'Brief du niveau, tel que le joueur le voit avant de commencer.',
    prompt:
      "Tu es un commercial expérimenté, habitué aux cycles de vente longs. Ton ton est direct et chaleureux, jamais insistant.\n\nDevis de 4 200 € envoyé il y a 14 jours à un client déjà accompagné l'an dernier.\n\nRédige un mail de relance qui obtienne une réponse, même négative.",
    clarity: 70 + id * 8,
  })),
}

const store = (page: Page) =>
  page.evaluate(() => (globalThis as unknown as { __candyPrompt: any }).__candyPrompt)

async function setState(page: Page, patch: Record<string, unknown>) {
  await page.evaluate((p) => (globalThis as unknown as { __candyPrompt: any }).__candyPrompt.setState(p), patch)
  await page.waitForTimeout(220)
}

async function call(page: Page, method: string, ...args: unknown[]) {
  await page.evaluate(
    ([m, a]) => (globalThis as unknown as { __candyPrompt: any }).__candyPrompt.getState()[m as string](...(a as unknown[])),
    [method, args] as const,
  )
  await page.waitForTimeout(220)
}

const ETATS: Etat[] = [
  { nom: '1-carte', prepare: async () => {} },
  { nom: '2-acte', prepare: (page) => call(page, 'startLevel', 7) },
  {
    nom: '3-brief',
    prepare: async (page) => {
      await call(page, 'startLevel', 1)
      await setState(page, { screen: 'brief' })
    },
  },
  {
    nom: '4-jeu',
    prepare: async (page) => {
      await call(page, 'startLevel', 4)
      await setState(page, { screen: 'jeu' })
    },
  },
  {
    nom: '5-jeu-avance',
    prepare: async (page) => {
      await call(page, 'startLevel', 10)
      await setState(page, {
        screen: 'jeu',
        movesLeft: 9,
        score: 24_680,
        collected: { role: 10, contexte: 7, demande: 10, taches: 4, format: 2 },
        chosen: [
          { block: 'role', text: 'Tu es un rédacteur de notes de synthèse.', quality: 'excellent', feedback: '' },
          { block: 'demande', text: 'Produis un dossier lisible en 15 minutes.', quality: 'moyen', feedback: '' },
        ],
      })
    },
  },
  {
    nom: '6-choix',
    prepare: async (page) => {
      await call(page, 'startLevel', 1)
      await setState(page, { screen: 'jeu', collected: { role: 9 } })
      await call(page, 'tapCell', { row: 0, col: 0 })
      await page.evaluate(() => {
        const s = (globalThis as unknown as { __candyPrompt: any }).__candyPrompt
        const card = (globalThis as unknown as { __candyPromptData: any }).__candyPromptData
        void card
        s.setState({ selected: null })
      })
      // La carte de choix s'ouvre par le circuit normal : on force l'objectif atteint.
      await setState(page, { screen: 'jeu' })
      await page.evaluate(() => {
        const store = (globalThis as unknown as { __candyPrompt: any }).__candyPrompt
        const state = store.getState()
        const level = state.level
        const goal = level.goals[level.blocks[0]]
        store.setState({ collected: { [level.blocks[0]]: goal } })
      })
      await call(page, 'tapCell', { row: 7, col: 7 })
      await page.waitForTimeout(300)
    },
  },
  {
    nom: '7-bilan',
    prepare: async (page) => {
      await call(page, 'startLevel', 1)
      await setState(page, {
        screen: 'bilan',
        outcome: 'gagne',
        score: 18_450,
        chosen: [
          {
            block: 'role',
            text: 'Tu es un commercial expérimenté, habitué aux cycles de vente longs. Ton ton est direct et chaleureux, jamais insistant.',
            quality: 'excellent',
            feedback: '',
          },
          {
            block: 'contexte',
            text: "Devis de 4 200 € envoyé il y a 14 jours à un client déjà accompagné l'an dernier. Aucune réponse depuis.",
            quality: 'excellent',
            feedback: '',
          },
          {
            block: 'demande',
            text: 'Écris un mail de relance.',
            quality: 'moyen',
            feedback: '',
          },
        ],
      })
    },
  },
  {
    nom: '8-boss',
    prepare: async (page) => {
      await page.evaluate(() => {
        const boss = (globalThis as unknown as { __candyPromptData: any }).__candyPromptData.BOSS_LEVELS[2]
        ;(globalThis as unknown as { __candyPrompt: any }).__candyPrompt.setState({
          screen: 'boss',
          activeBoss: boss,
          bossQueue: [],
        })
      })
      await page.waitForTimeout(220)
    },
  },
  { nom: '9-grimoire', prepare: (page) => call(page, 'openGrimoire') },
]

interface Probleme {
  ecran: string
  etat: string
  souci: string
}

async function capture(browser: Browser, ecran: (typeof ECRANS)[number], problemes: Probleme[]) {
  for (const etat of ETATS) {
    const page = await browser.newPage({
      viewport: { width: ecran.width, height: ecran.height },
      deviceScaleFactor: 2,
    })
    const erreurs: string[] = []
    page.on('pageerror', (e) => erreurs.push(String(e)))
    page.on('console', (m) => {
      if (m.type() === 'error' && !m.text().includes('404')) erreurs.push(m.text())
    })

    await page.addInitScript((progression) => {
      globalThis.localStorage.setItem('candy-prompt:v1', JSON.stringify(progression))
    }, PROGRESSION)
    await page.goto(URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('.cp-root')
    await store(page)

    try {
      await etat.prepare(page)
    } catch (err) {
      problemes.push({ ecran: ecran.nom, etat: etat.nom, souci: `preparation impossible : ${err}` })
      await page.close()
      continue
    }

    // Debordement horizontal : le defaut de mise en page le plus courant.
    const debord = await page.evaluate(() => {
      const doc = globalThis.document.documentElement
      return {
        horizontal: doc.scrollWidth > globalThis.innerWidth + 1,
        hauteurPage: doc.scrollHeight,
        hauteurVue: globalThis.innerHeight,
      }
    })
    if (debord.horizontal) {
      problemes.push({ ecran: ecran.nom, etat: etat.nom, souci: 'debordement horizontal' })
    }

    // Le plateau doit tenir dans la zone visible sans avoir a defiler.
    const plateau = await page.$('.cp-board')
    if (plateau) {
      const box = await plateau.boundingBox()
      if (box && box.y + box.height > debord.hauteurVue + 1) {
        problemes.push({
          ecran: ecran.nom,
          etat: etat.nom,
          souci: `le plateau depasse la zone visible de ${Math.round(box.y + box.height - debord.hauteurVue)} px`,
        })
      }
      if (box && box.width < 220) {
        problemes.push({
          ecran: ecran.nom,
          etat: etat.nom,
          souci: `plateau minuscule : ${Math.round(box.width)} px de large`,
        })
      }
    }

    if (erreurs.length > 0) {
      problemes.push({ ecran: ecran.nom, etat: etat.nom, souci: `erreur console : ${erreurs[0]}` })
    }

    await page.screenshot({ path: `${SHOTS}/${ecran.nom}--${etat.nom}.png` })
    await page.close()
  }
  console.log(`· ${ecran.nom} (${ecran.width}×${ecran.height}) : ${ETATS.length} écrans capturés`)
}

await mkdir(SHOTS, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})

const problemes: Probleme[] = []
for (const ecran of ECRANS) await capture(browser, ecran, problemes)
await browser.close()

console.log(`\n${ECRANS.length * ETATS.length} captures dans ${SHOTS}/`)
if (problemes.length === 0) {
  console.log('Aucun problème de mise en page détecté.')
} else {
  console.log(`\n${problemes.length} problème(s) :`)
  for (const p of problemes) console.log(`  ${p.ecran} / ${p.etat} — ${p.souci}`)
  process.exitCode = 1
}
