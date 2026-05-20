import type { DifficultyId, ItemId } from "@/store/useAppStore"

export type DifficultyConfig = {
  id: DifficultyId
  reactionMs: number
  aggression: number
  blockRate: number
  comboChance: number
  itemUseRate: number
}

export const difficultyConfigs: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: "easy",
    reactionMs: 220,
    aggression: 0.6,
    blockRate: 0.55,
    comboChance: 0.45,
    itemUseRate: 0.6,
  },
  normal: {
    id: "normal",
    reactionMs: 140,
    aggression: 0.82,
    blockRate: 0.72,
    comboChance: 0.7,
    itemUseRate: 0.85,
  },
  hard: {
    id: "hard",
    reactionMs: 90,
    aggression: 0.97,
    blockRate: 0.86,
    comboChance: 0.88,
    itemUseRate: 1.0,
  },
}

export const itemCounts: Record<ItemId, number | null> = {
  mace: null,
  axe: null,
  shield: null,
  gapple: 3,
  wind_charge: 8,
  ender_pearl: 4,
}

export const arenaConfig = {
  simWidth: 1200,
  simHeight: 680,
  groundY: 600,
  wallPadding: 32,
}

export const physicsConfig = {
  gravity: 2600,
  moveAccel: 5600,
  moveFriction: 5200,
  maxRun: 460,
  maxSprint: 610,
  jumpVel: 900,
  coyoteMs: 110,
  dashVel: 960,
  dashCooldownMs: 760,
  dashLockMs: 120,
  airControl: 0.82,
}

export const combatConfig = {
  hitStopMs: 55,
  comboWindowMs: 820,
  mace: {
    cooldownMs: 430,
    range: 74,
    baseDamage: 6,
    kb: 980,
    fallScale: 1 / 55,
    critFallMin: 120,
    maxBonusDamage: 18,
  },
  axe: {
    cooldownMs: 680,
    range: 70,
    baseDamage: 8,
    kb: 820,
    shieldDisableMs: 1100,
    shieldDamage: 32,
  },
  punch: {
    cooldownMs: 520,
    range: 54,
    baseDamage: 2,
    kb: 520,
  },
  shield: {
    maxDurability: 100,
    blockSlow: 0.55,
    blockArcDot: 0.15,
    breakDisableMs: 1600,
    hitDurabilityLoss: 18,
  },
  gapple: {
    eatMs: 980,
    healInstant: 6,
    healOverMs: 2400,
    healOverTotal: 6,
    absorption: 4,
    cooldownMs: 3200,
  },
  wind: {
    impulseY: 1220,
    cooldownMs: 780,
  },
  pearl: {
    speed: 760,
    gravity: 880,
    cooldownMs: 1450,
    selfDamage: 2,
    invulnMs: 220,
  },
}
