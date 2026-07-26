/**
 * Replie la demo construite en un seul fichier HTML.
 *
 * Le resultat ne charge aucune ressource externe : la feuille de style et le
 * script sont integres tels quels. C'est ce que reclame une page publiee, dont
 * la politique de securite bloque tout appel vers un autre domaine.
 *
 * La sortie est un fragment : ni doctype, ni <html>, ni <head>, ni <body>.
 * C'est la page hote qui fournit cette enveloppe.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = 'dist-demo'
const OUT = process.argv[2] ?? 'dist-demo/candy-prompt.html'

const files = await readdir(DIST)
const cssName = files.find((f) => f.endsWith('.css'))
const jsName = files.find((f) => f.endsWith('.js'))
if (!cssName || !jsName) throw new Error(`Build introuvable dans ${DIST}/ — lancer d'abord vite build`)

const css = await readFile(join(DIST, cssName), 'utf8')
const js = await readFile(join(DIST, jsName), 'utf8')

// Une balise fermante presente dans une chaine du code couperait le script en
// deux au moment de l'analyse HTML.
const safe = (code) => code.replaceAll('</script', '<\\/script').replaceAll('</style', '<\\/style')

const html = `<title>Candy Prompt — apprendre à prompter en jouant</title>

<style>
/*
 * Fond de page.
 *
 * Le jeu occupe une colonne de 560 px maximum, pensee pour le telephone.
 * Sur un grand ecran, c'est cette regle qui tient le reste de la page dans
 * le meme bleu nuit, pour que le plateau ne flotte pas sur du blanc.
 *
 * La direction artistique du jeu assume un seul univers, celui d'une borne
 * d'arcade : on fixe donc le fond sombre dans les deux themes plutot que de
 * laisser le theme clair delaver le plateau.
 */
:root,
:root[data-theme='light'],
:root[data-theme='dark'] {
  background: #0d0a24;
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100dvh;
  background: #0d0a24;
}

${safe(css)}
</style>

<div id="root"></div>

<script type="module">
${safe(js)}
</script>
`

await writeFile(OUT, html, 'utf8')
const kb = (n) => `${Math.round(n / 1024)} Ko`
console.log(`${OUT} — ${kb(Buffer.byteLength(html))} (css ${kb(css.length)}, js ${kb(js.length)})`)
