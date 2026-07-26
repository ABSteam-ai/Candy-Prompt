/**
 * L'arriere-plan du jeu.
 *
 * Trois couches, et une contrainte de performance qui dicte la technique.
 *
 * Un fond de confiserie se fait spontanement avec des cercles flous, mais
 * `filter: blur()` se recalcule a chaque image : pendant une cascade ou vingt
 * bonbons disparaissent, c'est le premier poste qui fait tomber le jeu sous les
 * 60 images par seconde. On obtient le meme flou gratuitement avec des
 * degrades radiaux, qui sont peints une fois puis composites.
 *
 * Seule la couche de derive est animee, et uniquement en `transform` : le
 * navigateur la traite sur la carte graphique, sans repeindre.
 */
export function Fond() {
  return (
    <div className="cp-fond" aria-hidden="true">
      <div className="cp-fond__bokeh" />
      <div className="cp-fond__derive" />
      <div className="cp-fond__vignette" />
    </div>
  )
}
