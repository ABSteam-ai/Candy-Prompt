import { test } from 'node:test'
import assert from 'node:assert/strict'

import { LEVELS } from '../src/data/levels.ts'
import { CHOICE_CARDS, cardFor } from '../src/data/choices.ts'
import { BOSS_LEVELS } from '../src/data/boss.ts'
import { BLOCK_BY_ID } from '../src/game/blocks.ts'
import type { BlockId } from '../src/game/types.ts'

test('chaque bloc de chaque niveau a sa carte de choix', () => {
  for (const level of LEVELS) {
    for (const block of level.blocks) {
      assert.notEqual(
        cardFor(level.id, block),
        undefined,
        `niveau ${level.id} : il manque la carte « ${BLOCK_BY_ID[block].label} »`,
      )
    }
  }
})

test('aucune carte ne pointe vers un niveau ou un bloc inexistant', () => {
  const levelsById = new Map(LEVELS.map((l) => [l.id, l]))
  for (const card of CHOICE_CARDS) {
    const level = levelsById.get(card.levelId)
    assert.notEqual(level, undefined, `carte orpheline pour le niveau ${card.levelId}`)
    assert.equal(
      level!.blocks.includes(card.block),
      true,
      `niveau ${card.levelId} : carte « ${card.block} » alors que le bloc n'est pas sur le plateau`,
    )
  }
})

test('chaque carte propose trois options dont une seule excellente', () => {
  for (const card of CHOICE_CARDS) {
    const where = `niveau ${card.levelId} / ${card.block}`
    assert.equal(card.options.length, 3, `${where} : il faut exactement 3 options`)

    const counts = { excellent: 0, moyen: 0, faible: 0 }
    for (const option of card.options) counts[option.quality] += 1
    assert.deepEqual(counts, { excellent: 1, moyen: 1, faible: 1 }, `${where} : une option de chaque niveau`)
  }
})

test('chaque option porte un texte et une explication non vides', () => {
  for (const card of CHOICE_CARDS) {
    for (const option of card.options) {
      const where = `niveau ${card.levelId} / ${card.block}`
      assert.equal(option.text.trim().length > 0, true, `${where} : option sans texte`)
      assert.equal(
        option.feedback.trim().length > 0,
        true,
        `${where} : option sans explication — c'est pourtant elle qui enseigne`,
      )
    }
  }
})

test('la bonne option est toujours la plus precise des trois', () => {
  // Garde-fou de redaction : si l'option excellente est la plus courte, c'est
  // presque toujours qu'elle manque de contexte, ou que les distracteurs bavardent.
  for (const card of CHOICE_CARDS) {
    const best = card.options.find((o) => o.quality === 'excellent')!
    const worst = card.options.find((o) => o.quality === 'faible')!
    assert.equal(
      best.text.length > worst.text.length,
      true,
      `niveau ${card.levelId} / ${card.block} : la bonne option est plus courte que la mauvaise`,
    )
  }
})

test('les options ne sont pas melangees dans le fichier source', () => {
  // On veut que l'ordre de redaction soit stable (excellent, moyen, faible)
  // pour relire le contenu facilement. Le melange se fait a l'affichage.
  for (const card of CHOICE_CARDS) {
    assert.deepEqual(
      card.options.map((o) => o.quality),
      ['excellent', 'moyen', 'faible'],
      `niveau ${card.levelId} / ${card.block} : ordre de redaction inhabituel`,
    )
  }
})

test('chaque niveau boss est rattache a un niveau existant et a une bonne reponse', () => {
  for (const boss of BOSS_LEVELS) {
    assert.equal(
      LEVELS.some((l) => l.id === boss.afterLevel),
      true,
      `boss ${boss.id} : il suit un niveau qui n'existe pas`,
    )
    if (boss.kind === 'ordre') {
      const expected = boss.sequence
      const unique = new Set<BlockId>(expected)
      assert.equal(unique.size, expected.length, `boss ${boss.id} : un bloc apparait deux fois`)
    } else {
      const correct = boss.options.filter((o) => o.correct)
      assert.equal(correct.length, 1, `boss ${boss.id} : il faut exactement une bonne reponse`)
    }
  }
})

test('les 7 blocs ont tous une couleur distincte', () => {
  const colours = new Set(Object.values(BLOCK_BY_ID).map((b) => b.color))
  assert.equal(colours.size, 7, 'deux blocs partagent une couleur : ils seront confondus sur le plateau')
})
