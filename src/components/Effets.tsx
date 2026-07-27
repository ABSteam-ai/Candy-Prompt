import { BLOCK_BY_ID } from '../game/blocks'
import type { Effect } from '../store/gameStore'
import { useGame } from '../store/gameStore'

/**
 * La couche d'effets, posee par-dessus le plateau.
 *
 * Elle ne decide de rien : elle lit les evenements emis par le jeu et les
 * dessine. Toute l'animation est faite en CSS sur `transform` et `opacity`,
 * les deux seules proprietes que le navigateur sait animer sans repeindre —
 * ce qui compte quand une cascade fait partir vingt bonbons d'un coup.
 *
 * Chaque effet est monte puis oublie par le store apres un delai : rien ici
 * n'a besoin de nettoyer quoi que ce soit.
 */

/** Nombre d'eclats projetes par bonbon detruit. */
const PARTICULES = 6

export function Effets() {
  const effects = useGame((s) => s.effects)
  if (effects.length === 0) return null

  return (
    <div className="cp-effets" aria-hidden="true">
      {effects.map((effect) => (
        <EffetUn key={effect.id} effect={effect} />
      ))}
    </div>
  )
}

function EffetUn({ effect }: { effect: Effect }) {
  const teinte = effect.block ? BLOCK_BY_ID[effect.block] : null

  // Chaque effet est place au centre de sa case, dans le repere du plateau.
  const style = {
    ['--r' as string]: effect.row,
    ['--c' as string]: effect.col,
    ['--eclat' as string]: teinte?.light ?? '#fff',
    ['--teinte' as string]: teinte?.color ?? '#fff',
  }

  switch (effect.kind) {
    case 'eclat':
      return (
        <div className="cp-effet cp-effet--eclat" style={style}>
          {Array.from({ length: PARTICULES }, (_, i) => (
            <span
              key={i}
              className="cp-particule"
              // L'angle est reparti regulierement, avec un decalage par case :
              // deux gerbes voisines ne doivent pas partir a l'identique.
              style={{
                ['--a' as string]: `${(360 / PARTICULES) * i + ((effect.row * 7 + effect.col * 13) % 40)}deg`,
                ['--d' as string]: `${62 + ((i * 17 + effect.col * 5) % 44)}%`,
                ['--t' as string]: `${i * 18}ms`,
              }}
            />
          ))}
          <span className="cp-onde" />
        </div>
      )

    case 'voile':
      return <div className="cp-effet cp-effet--voile" style={style} />

    case 'nom':
      return (
        <div className="cp-effet cp-effet--nom" style={style}>
          <span className="cp-effet__nom">{effect.value}</span>
        </div>
      )

    case 'score':
      return (
        <div className="cp-effet cp-effet--score" style={style}>
          {effect.value}
        </div>
      )

    case 'chaine':
      return (
        <div className="cp-effet cp-effet--chaine" style={style}>
          {effect.value}
        </div>
      )

    default:
      return null
  }
}
