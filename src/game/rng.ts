/**
 * Generateur pseudo-aleatoire deterministe (mulberry32).
 *
 * Chaque niveau porte une graine : le plateau de depart est donc toujours le
 * meme d'une partie a l'autre. Cela rend les niveaux equilibrables a la main,
 * reproductibles en cas de bug, et testables.
 */
export interface Rng {
  next(): number
  int(maxExclusive: number): number
  pick<T>(items: readonly T[]): T
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (maxExclusive: number) => Math.floor(next() * maxExclusive)
  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      const item = items[int(items.length)]
      if (item === undefined) throw new Error('pick() sur une liste vide')
      return item
    },
  }
}
