/**
 * Melange stable d'une liste d'options.
 *
 * Les fichiers de contenu rangent toujours les options dans le meme ordre
 * (la bonne reponse en premier) pour rester relisibles. Il faut donc les
 * melanger a l'affichage, sinon le joueur apprend a cliquer sur la premiere
 * ligne sans lire.
 *
 * Le melange doit rester deterministe : sans cela, les options changeraient
 * de place a chaque rendu de React, sous le doigt du joueur.
 */
export function stableOrder(length: number, key: string): number[] {
  let hash = 2166136261
  for (const ch of key) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  const order = Array.from({ length }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 1103515245) + 12345) >>> 0
    const j = hash % (i + 1)
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}
