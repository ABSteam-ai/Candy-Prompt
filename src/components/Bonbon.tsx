import { memo } from 'react'

import { BLOCKS, BLOCK_BY_ID } from '../game/blocks'
import type { BlockId, SpecialKind } from '../game/types'

/**
 * Le rendu d'un bonbon.
 *
 * Deux principes tenus ici.
 *
 * 1. Chaque bloc a sa propre SILHOUETTE, pas seulement sa couleur. C'est ce
 *    qui rend un plateau lisible d'un coup d'oeil, et c'est ce qui permet de
 *    jouer sans distinguer les couleurs. Les sept formes doivent rester
 *    reconnaissables en noir, sans aucune couleur : etoile, anneau, losange,
 *    gelule, trilobe, carre chanfreine, papillote. Le recouvrement de chaque
 *    couple est mesure par `tests/lisibilite.ts`, couleur simulee en
 *    deuteranopie et en protanopie comprise.
 * 2. Le volume vient de trois couches superposees, pas d'un degrade : une base
 *    en degrade, un reflet speculaire en haut a gauche, et une ombre interne en
 *    bas. Un simple degrade a deux arrets lit comme un carre colore, jamais
 *    comme un objet.
 *
 * Les degrades sont declares une seule fois par `<BonbonDefs />` et partages
 * par les 64 bonbons du plateau : les redefinir dans chaque tuile gonflerait
 * le DOM pour rien.
 */

export type Silhouette = 'etoile' | 'anneau' | 'losange' | 'gelule' | 'trilobe' | 'chanfrein' | 'papillote'

/** Prefixe des identifiants SVG, pour ne pas collisionner avec la page hote. */
const ID = 'cpb'

const grad = (block: BlockId) => `${ID}-grad-${block}`
const clip = (silhouette: Silhouette) => `${ID}-clip-${silhouette}`
const shine = `${ID}-shine`

/** Les silhouettes reellement utilisees, sans doublon. */
const SILHOUETTES = [...new Set(BLOCKS.map((b) => b.silhouette))]

/**
 * Les degrades et le filtre de reflet, montes une seule fois.
 * A placer n'importe ou dans l'arbre : le SVG est invisible et hors flux.
 */
export const BonbonDefs = memo(function BonbonDefs() {
  return (
    <svg className="cp-defs" aria-hidden="true" focusable="false">
      <defs>
        {BLOCKS.map((b) => (
          <radialGradient key={b.id} id={grad(b.id)} cx="34%" cy="26%" r="82%">
            <stop offset="0%" stopColor={b.light} />
            <stop offset="46%" stopColor={b.color} />
            <stop offset="100%" stopColor={b.shade} />
          </radialGradient>
        ))}
        {/*
          Le reflet doit couvrir tout le quart haut-gauche du bonbon pour lire
          comme une surface vernie. Un petit point blanc lit comme une tache.
        */}
        <radialGradient id={shine} cx="50%" cy="45%" r="52%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.92" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>

        {/*
          Un masque par silhouette. Sans lui, le reflet deborde de la forme et
          flotte a cote du bonbon — tres visible sur les silhouettes etroites
          comme la gelule. Le masque ignore les contours, il est donc un peu
          plus petit que la forme rendue : le reflet reste bien a l'interieur.
        */}
        {SILHOUETTES.map((silhouette) => (
          <clipPath key={silhouette} id={clip(silhouette)}>
            <Forme silhouette={silhouette} fill="#000" stroke="none" />
          </clipPath>
        ))}
      </defs>
    </svg>
  )
})

/**
 * Anneau : un bonbon troue. Le trou central n'est pas decoratif — c'est le
 * seul moyen mesure de separer cette silhouette du trilobe, avec qui un
 * disque plein partageait 85 % de son empreinte tout en etant a un ΔE de 6
 * en protanopie. Une topologie differente resiste la ou la couleur echoue.
 */
const ANNEAU = 'M9,50 a41,41 0 1,0 82,0 a41,41 0 1,0 -82,0 Z M31,50 a19,19 0 1,0 38,0 a19,19 0 1,0 -38,0 Z'

/**
 * Carre chanfreine : le coin haut-gauche est coupe net. C'est la seule
 * silhouette asymetrique du jeu, ce qui la rend reconnaissable meme reduite,
 * et ce qui la separe du losange et de l'anneau.
 */
const CHANFREIN = 'M34,13 H74 a13,13 0 0 1 13,13 V74 a13,13 0 0 1 -13,13 H26 a13,13 0 0 1 -13,-13 V34 Z'

/** Étoile a cinq branches, arrondie par un contour epais. */
const ETOILE = '50,12 59.4,37.1 86.1,38.3 65.2,54.9 72.3,80.7 50,66 27.7,80.7 34.8,54.9 13.9,38.3 40.6,37.1'
/** Losange haut, arrondi par un contour epais. */
const LOSANGE = '50,11 87,50 50,89 13,50'

interface FormeProps {
  silhouette: Silhouette
  fill: string
  /** Couleur du liseré, qui donne l'epaisseur et la rondeur du bonbon. */
  stroke: string
}

/** La silhouette seule, sans reflet ni ombre. */
function Forme({ silhouette, fill, stroke }: FormeProps) {
  // Le contour de meme couleur que la base epaissit et arrondit la forme :
  // c'est ce qui evite les pointes seches d'une etoile ou d'un losange.
  const rond = { fill, stroke, strokeWidth: 11, strokeLinejoin: 'round' as const }

  switch (silhouette) {
    case 'anneau':
      return <path d={ANNEAU} fill={fill} fillRule="evenodd" />
    case 'etoile':
      return <polygon points={ETOILE} {...rond} />
    case 'losange':
      return <polygon points={LOSANGE} {...rond} />
    case 'chanfrein':
      return <path d={CHANFREIN} fill={fill} />
    case 'gelule':
      return (
        <>
          <rect x="27" y="9" width="46" height="82" rx="16" fill={fill} />
          {/* Les encoches font lire la gelule comme un baton segmente. */}
          <rect x="27" y="35" width="46" height="4" fill="rgba(0,0,0,0.22)" />
          <rect x="27" y="61" width="46" height="4" fill="rgba(0,0,0,0.22)" />
        </>
      )
    case 'trilobe':
      // Trois disques qui se recouvrent : leur union donne un trefle, une
      // silhouette qu'aucune autre forme du jeu ne peut imiter.
      return (
        <g fill={fill}>
          <circle cx="50" cy="31" r="25" />
          <circle cx="66" cy="60" r="25" />
          <circle cx="34" cy="60" r="25" />
        </g>
      )
    case 'papillote':
      return (
        <g fill={fill}>
          <path d="M26,50 L8,29 L13,50 L8,71 Z" />
          <path d="M74,50 L92,29 L87,50 L92,71 Z" />
          <circle cx="50" cy="50" r="29" />
        </g>
      )
    default:
      return null
  }
}

/**
 * L'habillage des bonbons speciaux.
 *
 * Des rayures, pas un symbole ecrit. C'est la grammaire du genre : un bonbon
 * raye horizontalement nettoie une ligne, raye verticalement une colonne, et
 * l'orientation des rayures dit l'effet sans qu'on ait a lire. Un glyphe
 * « ↔ » demande une traduction mentale ; une rayure, non.
 *
 * Tout est decoupe sur la silhouette du bonbon par le meme masque que les
 * reflets, pour que l'habillage epouse la forme au lieu de la recouvrir.
 */
function Habillage({ special }: { special: SpecialKind }) {
  switch (special) {
    case 'precision-row':
      return (
        <g className="cp-bonbon__rayures">
          {[30, 50, 70].map((y) => (
            <rect key={y} x="0" y={y - 6} width="100" height="12" />
          ))}
        </g>
      )
    case 'precision-col':
      return (
        <g className="cp-bonbon__rayures">
          {[30, 50, 70].map((x) => (
            <rect key={x} x={x - 6} y="0" width="12" height="100" />
          ))}
        </g>
      )
    case 'iteration':
      // Le bonbon « emballe » : un double liseré clair, comme un papier serre.
      return (
        <g className="cp-bonbon__emballage">
          <rect x="17" y="17" width="66" height="66" rx="16" />
          <rect x="28" y="28" width="44" height="44" rx="11" />
        </g>
      )
    case 'meta':
      // Le Meta-Prompt efface tout un bloc : on lui donne un coeur sombre
      // constelle, qui ne ressemble a aucun autre bonbon du plateau.
      return (
        <g className="cp-bonbon__meta">
          <circle cx="50" cy="50" r="27" />
          <g className="cp-bonbon__etincelles">
            <circle cx="50" cy="34" r="4" />
            <circle cx="63" cy="57" r="3.4" />
            <circle cx="37" cy="57" r="3.4" />
          </g>
        </g>
      )
    default:
      return null
  }
}

interface BonbonProps {
  block: BlockId
  special?: SpecialKind
  /** Tuile Hors-sujet : bonbon eteint, en pierre. */
  dead?: boolean
}

export const Bonbon = memo(function Bonbon({ block, special, dead }: BonbonProps) {
  const def = BLOCK_BY_ID[block]

  if (dead) {
    return (
      <svg className="cp-bonbon cp-bonbon--dead" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <rect x="11" y="11" width="78" height="78" rx="14" fill="#4b4a60" />
        <rect x="11" y="11" width="78" height="78" rx="14" fill={`url(#${shine})`} opacity="0.1" />
        {/* Cassures : la tuile morte doit lire comme un caillou, pas comme un bonbon gris. */}
        <path d="M22,34 L44,26 L38,44 L58,38 L50,58 L72,50" stroke="#33323f" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="11" y="11" width="78" height="78" rx="14" fill="none" stroke="#6a6884" strokeWidth="4" />
      </svg>
    )
  }

  return (
    <svg
      className={`cp-bonbon${special ? ' cp-bonbon--special' : ''}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {/* 1. la masse, en degre radial : la lumiere vient du haut a gauche */}
      <g className="cp-bonbon__masse">
        <Forme silhouette={def.silhouette} fill={`url(#${grad(block)})`} stroke={`url(#${grad(block)})`} />
      </g>

      {/* 2. l'ombre interne du bas, qui creuse la matiere */}
      <g className="cp-bonbon__creux" opacity="0.32">
        <Forme silhouette={def.silhouette} fill="none" stroke={def.shade} />
      </g>

      {/* 3. l'habillage du bonbon special, decoupe lui aussi sur la silhouette */}
      {special ? (
        <g clipPath={`url(#${clip(def.silhouette)})`}>
          <Habillage special={special} />
        </g>
      ) : null}

      {/* 4 et 5. les reflets, decoupes sur la silhouette pour ne pas deborder */}
      <g clipPath={`url(#${clip(def.silhouette)})`}>
        {/* le grand reflet doux, qui donne le verni */}
        <ellipse cx="38" cy="31" rx="26" ry="18" transform="rotate(-27 38 31)" fill={`url(#${shine})`} />
        {/* l'eclat net, qui donne la durete de la surface */}
        <ellipse cx="35" cy="26" rx="8.5" ry="5" transform="rotate(-27 35 26)" fill="#fff" opacity="0.8" />
        {/* le rebond de lumiere du bas, qui arrondit la masse */}
        <ellipse cx="56" cy="86" rx="20" ry="7" fill="#fff" opacity="0.14" />
      </g>
    </svg>
  )
})
