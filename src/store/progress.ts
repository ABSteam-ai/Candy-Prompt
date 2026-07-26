/**
 * Sauvegarde locale de la progression.
 *
 * Volontairement en localStorage : pas de compte, pas de backend, pas de
 * donnee personnelle qui sorte du navigateur. Le module tolere un stockage
 * indisponible (navigation privee, iframe restreinte) sans casser le jeu.
 */
export interface GrimoireEntry {
  levelId: number
  title: string
  brief: string
  /** Le prompt assemble a partir des formulations choisies. */
  prompt: string
  clarity: number
}

export interface Progress {
  /** Etoiles obtenues par niveau. */
  stars: Record<number, number>
  /** Meilleur score par niveau. */
  best: Record<number, number>
  /** Actes dont la carte d'introduction a deja ete vue. */
  actsSeen: number[]
  grimoire: GrimoireEntry[]
}

const STORAGE_KEY = 'candy-prompt:v1'

export const EMPTY_PROGRESS: Progress = { stars: {}, best: {}, actsSeen: [], grimoire: [] }

export function loadProgress(): Progress {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw) as Partial<Progress>
    return {
      stars: parsed.stars ?? {},
      best: parsed.best ?? {},
      actsSeen: parsed.actsSeen ?? [],
      grimoire: parsed.grimoire ?? [],
    }
  } catch {
    // Sauvegarde illisible ou stockage refuse : on repart d'une progression vide
    // plutot que d'empecher le joueur de jouer.
    return EMPTY_PROGRESS
  }
}

export function saveProgress(progress: Progress): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Stockage plein ou indisponible : la partie en cours continue normalement.
  }
}

export function resetProgress(): void {
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY)
  } catch {
    // Rien a faire : il n'y avait deja rien de persiste.
  }
}
