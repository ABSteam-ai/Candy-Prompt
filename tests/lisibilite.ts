/**
 * Verification de la lisibilite des sept bonbons.
 *
 *   npm run build && npm run preview -- --port 4173 --strictPort
 *   node --experimental-strip-types tests/lisibilite.ts [url]
 *
 * Deux mesures independantes, parce que la couleur et la forme sont deux
 * canaux distincts et qu'un bonbon doit rester identifiable si l'un des deux
 * tombe.
 *
 * 1. FORME : chaque silhouette est rasterisee puis comparee aux six autres par
 *    intersection sur union. Deux formes qui se recouvrent a plus de 80 %
 *    seront confondues du coin de l'oeil.
 * 2. COULEUR : les couleurs sont passees dans une simulation de deuteranopie
 *    et de protanopie, puis comparees en CIEDE2000. En dessous de 12, deux
 *    bonbons voisins deviennent difficiles a departager.
 */
import { chromium } from 'playwright'
import { BLOCKS } from '../src/game/blocks.ts'

// --- couleur ---------------------------------------------------------------
const srgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const delin = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/** Simulation Brettel/Vienot, matrices usuelles en espace lineaire. */
const CVD: Record<string, number[][]> = {
  deuteranopie: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  protanopie: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],
}

function simule(hex: string, type: string): [number, number, number] {
  const [r, g, b] = srgb(hex).map(lin) as [number, number, number]
  const m = CVD[type]!
  return [0, 1, 2].map((i) => delin(Math.min(1, Math.max(0, m[i]![0]! * r + m[i]![1]! * g + m[i]![2]! * b)))) as [number, number, number]
}

function lab([r, g, b]: [number, number, number]): [number, number, number] {
  const [R, G, B] = [r, g, b].map(lin) as [number, number, number]
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047
  const y = 0.2126 * R + 0.7152 * G + 0.0722 * B
  const z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

/** CIEDE2000, version complete. */
function deltaE(l1: [number, number, number], l2: [number, number, number]): number {
  const [L1, a1, b1] = l1
  const [L2, a2, b2] = l2
  const kL = 1, kC = 1, kH = 1
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2)
  const Cb = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2)
  const h = (ap: number, bp: number) => {
    if (ap === 0 && bp === 0) return 0
    const d = (Math.atan2(bp, ap) * 180) / Math.PI
    return d < 0 ? d + 360 : d
  }
  const h1p = h(a1p, b1), h2p = h(a2p, b2)
  const dLp = L2 - L1, dCp = C2p - C1p
  let dhp = 0
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360)
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2
  let hbp = h1p + h2p
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbp += hbp < 360 ? 360 : -360
    hbp /= 2
  }
  const T = 1 - 0.17 * Math.cos(((hbp - 30) * Math.PI) / 180) + 0.24 * Math.cos((2 * hbp * Math.PI) / 180)
    + 0.32 * Math.cos(((3 * hbp + 6) * Math.PI) / 180) - 0.2 * Math.cos(((4 * hbp - 63) * Math.PI) / 180)
  const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2))
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2)
  const Sc = 1 + 0.045 * Cbp
  const Sh = 1 + 0.015 * Cbp * T
  const Rt = -Math.sin((2 * dTh * Math.PI) / 180) * Rc
  return Math.sqrt(
    (dLp / (kL * Sl)) ** 2 + (dCp / (kC * Sc)) ** 2 + (dHp / (kH * Sh)) ** 2
      + Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh)),
  )
}

// --- forme -----------------------------------------------------------------
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const p = await b.newPage({ viewport: { width: 400, height: 400 } })
await p.goto(process.argv[2] ?? 'http://localhost:4187/', { waitUntil: 'networkidle' })
// La carte des niveaux affiche les sept bonbons dans sa legende : c'est le
// seul ecran ou toutes les silhouettes sont presentes en meme temps.
await p.evaluate(() => { (globalThis as any).__candyPrompt.getState().openCarte() })
await p.waitForTimeout(400)

/** Masque binaire d'une silhouette, rasterisee a 34 px comme sur un telephone. */
const masques = await p.evaluate(async (blocs: string[]) => {
  const res: Record<string, number[]> = {}
  for (const bloc of blocs) {
    const chips = [...document.querySelectorAll('.cp-chip__bonbon .cp-bonbon')]
    const src = chips[blocs.indexOf(bloc)]
    if (!src) continue
    const svg = src.cloneNode(true) as SVGSVGElement
    // On neutralise la couleur : seule la silhouette compte.
    svg.querySelectorAll('*').forEach((n) => {
      const e = n as SVGElement
      if (e.getAttribute('fill') && e.getAttribute('fill') !== 'none') e.setAttribute('fill', '#000')
      if (e.getAttribute('stroke') && e.getAttribute('stroke') !== 'none') e.setAttribute('stroke', '#000')
    })
    svg.setAttribute('width', '34'); svg.setAttribute('height', '34')
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    await new Promise((r) => { img.onload = r; img.src = url })
    const cv = document.createElement('canvas'); cv.width = 34; cv.height = 34
    const ctx = cv.getContext('2d')!
    ctx.drawImage(img, 0, 0, 34, 34)
    const d = ctx.getImageData(0, 0, 34, 34).data
    const m: number[] = []
    for (let i = 3; i < d.length; i += 4) m.push(d[i]! > 96 ? 1 : 0)
    res[bloc] = m
    URL.revokeObjectURL(url)
  }
  return res
}, BLOCKS.map((x) => x.id))
await b.close()

// --- rapport ---------------------------------------------------------------
const dispo = BLOCKS.filter((x) => masques[x.id])
console.log(`Silhouettes rasterisees a 34 px : ${dispo.length}/7\n`)

const iou = (a: number[], b: number[]) => {
  let inter = 0, union = 0
  for (let i = 0; i < a.length; i++) { if (a[i] || b[i]) union++; if (a[i] && b[i]) inter++ }
  return union === 0 ? 0 : inter / union
}

interface Couple { a: string; b: string; iou: number; deut: number; prot: number }
const couples: Couple[] = []
for (let i = 0; i < dispo.length; i++) {
  for (let j = i + 1; j < dispo.length; j++) {
    const A = dispo[i]!, B = dispo[j]!
    couples.push({
      a: A.short, b: B.short,
      iou: iou(masques[A.id]!, masques[B.id]!),
      deut: deltaE(lab(simule(A.color, 'deuteranopie')), lab(simule(B.color, 'deuteranopie'))),
      prot: deltaE(lab(simule(A.color, 'protanopie')), lab(simule(B.color, 'protanopie'))),
    })
  }
}

// Un couple est a risque s'il est proche EN COULEUR ET EN FORME.
couples.sort((x, y) => (x.deut + x.prot) / 2 - (y.deut + y.prot) / 2)
console.log('couple                    recouvrement   ΔE deutan.  ΔE protan.   verdict')
console.log('─'.repeat(76))
let risques = 0
for (const c of couples.slice(0, 10)) {
  const couleurProche = Math.min(c.deut, c.prot) < 12
  const formeProche = c.iou > 0.8
  let verdict = 'ok'
  if (couleurProche && formeProche) { verdict = 'CONFUSION'; risques++ }
  else if (couleurProche) verdict = 'couleur proche, forme distincte'
  else if (formeProche) verdict = 'forme proche, couleur distincte'
  console.log(
    `${(c.a + ' / ' + c.b).padEnd(24)}  ${(c.iou * 100).toFixed(0).padStart(9)} %   ${c.deut.toFixed(1).padStart(9)}  ${c.prot.toFixed(1).padStart(10)}   ${verdict}`,
  )
}
console.log('─'.repeat(76))
console.log(
  risques === 0
    ? 'Aucun couple n est proche a la fois en couleur et en forme.'
    : `${risques} couple(s) reellement confondable(s).`,
)
if (risques > 0) process.exitCode = 1
