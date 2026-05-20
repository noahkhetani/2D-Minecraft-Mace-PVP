import type { DifficultyId, ItemId, SettingsState } from "@/store/useAppStore"
import { createAudioEngine } from "@/game/audio"
import {
  arenaConfig,
  combatConfig,
  difficultyConfigs,
  itemCounts,
  physicsConfig,
} from "@/game/config"
import { itemShort } from "@/game/items"
import {
  clamp,
  norm,
  randRange,
  rectsOverlap,
  sign,
} from "@/game/math"

type MatchConfig = {
  difficulty: DifficultyId
  hotbar: ItemId[]
  settings: SettingsState
}

type FighterId = "player" | "bot"

type Fighter = {
  id: FighterId
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  facing: -1 | 1
  hp: number
  maxHp: number
  absorption: number
  invulnMs: number
  hurtMs: number
  onGround: boolean
  coyoteMs: number
  jumpsLeft: number
  dashCdMs: number
  dashLockMs: number
  dashTapDir: -1 | 1 | 0
  dashTapMs: number
  peakAirY: number
  attackCdMs: number
  combo: number
  lastHitMs: number
  blocking: boolean
  shieldDurability: number
  shieldDisableMs: number
  eatMs: number
  healOverMs: number
  healOverRemaining: number
  selectedSlot: number
  hotbar: ItemId[]
  counts: Record<ItemId, number | null>
  cooldowns: Record<"gapple" | "wind_charge" | "ender_pearl", number>
}

type Pearl = {
  id: number
  owner: FighterId
  x: number
  y: number
  vx: number
  vy: number
  lifeMs: number
}

type DamageNumber = {
  x: number
  y: number
  vx: number
  vy: number
  value: number
  lifeMs: number
  tone: "emerald" | "rose" | "amber"
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  lifeMs: number
  tone: "emerald" | "rose" | "zinc" | "amber"
  size: number
}

export type GameHudSnapshot = {
  player: {
    hp: number
    maxHp: number
    absorption: number
    shieldDurability: number
    combo: number
    selectedSlot: number
    hotbar: { short: string; count: number | null }[]
  }
  bot: {
    hp: number
    maxHp: number
    absorption: number
  }
}

type InputState = {
  keys: Record<string, boolean>
  keysPressed: Record<string, boolean>
  mouseX: number
  mouseY: number
  lmb: boolean
  lmbPressed: boolean
  rmb: boolean
  rmbPressed: boolean
}

type BotIntent = {
  mode: "neutral" | "aerial"
  modeMs: number
  wantBlock: boolean
  wantAttack: boolean
  wantUse: boolean
  wantJump: boolean
  wantSprint: boolean
  move: -1 | 0 | 1
  aimX: number
  aimY: number
  select: ItemId | null
  nextThinkMs: number
}

export function createGameController({
  canvas,
  container,
  config,
  onHud,
  onGameOver,
}: {
  canvas: HTMLCanvasElement
  container: HTMLElement
  config: MatchConfig
  onHud: (hud: GameHudSnapshot) => void
  onGameOver: (winner: FighterId) => void
}) {
  const input: InputState = {
    keys: {},
    keysPressed: {},
    mouseX: 0,
    mouseY: 0,
    lmb: false,
    lmbPressed: false,
    rmb: false,
    rmbPressed: false,
  }

  const audio = createAudioEngine({
    sfxVolume: config.settings.sfxVolume,
    musicVolume: config.settings.musicVolume,
  })

  const diff = difficultyConfigs[config.difficulty]
  const lowRes = document.createElement("canvas")
  const lowCtx = lowRes.getContext("2d")
  const ctx = canvas.getContext("2d")
  if (!lowCtx || !ctx) throw new Error("Canvas 2D context unavailable")

  const now = () => performance.now()
  let alive = true
  let rafId = 0
  let acc = 0
  let last = now()
  let simTime = 0
  let hitStopMs = 0
  let shake = 0
  let shakeV = 0

  const player = createFighter("player", 340, arenaConfig.groundY - 70, config.hotbar)
  const bot = createFighter("bot", 860, arenaConfig.groundY - 70, config.hotbar)
  bot.facing = -1

  const pearls: Pearl[] = []
  const damageNumbers: DamageNumber[] = []
  const particles: Particle[] = []
  let nextPearlId = 1

  const botIntent: BotIntent = {
    mode: "neutral",
    modeMs: 0,
    wantBlock: false,
    wantAttack: false,
    wantUse: false,
    wantJump: false,
    wantSprint: false,
    move: 0,
    aimX: bot.x,
    aimY: bot.y,
    select: null,
    nextThinkMs: 0,
  }

  const simStepMs = 1000 / 60
  const maxFrameMs = 48

  const resize = () => {
    const rect = container.getBoundingClientRect()
    const w = Math.max(640, Math.floor(rect.width))
    const h = Math.max(420, Math.floor(rect.height * 0.72))
    canvas.width = Math.floor(w * devicePixelRatio)
    canvas.height = Math.floor(h * devicePixelRatio)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const targetW = 520
    const ratio = canvas.height / canvas.width
    lowRes.width = targetW
    lowRes.height = Math.floor(targetW * ratio)
    lowCtx.imageSmoothingEnabled = false
    ctx.imageSmoothingEnabled = false
  }

  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  const onKeyDown = (e: KeyboardEvent) => {
    input.keys[e.code] = true
    input.keysPressed[e.code] = true
    if (e.code.startsWith("Digit")) e.preventDefault()
  }
  const onKeyUp = (e: KeyboardEvent) => {
    input.keys[e.code] = false
  }
  const onMouseMove = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect()
    input.mouseX = (e.clientX - r.left) / r.width
    input.mouseY = (e.clientY - r.top) / r.height
  }
  const onMouseDown = (e: MouseEvent) => {
    audio.ensure()
    audio.startMusic()
    if (e.button === 0) {
      input.lmb = true
      input.lmbPressed = true
    }
    if (e.button === 2) {
      input.rmb = true
      input.rmbPressed = true
    }
  }
  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) input.lmb = false
    if (e.button === 2) input.rmb = false
  }

  window.addEventListener("keydown", onKeyDown)
  window.addEventListener("keyup", onKeyUp)
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("mousedown", onMouseDown)
  window.addEventListener("mouseup", onMouseUp)

  const tick = () => {
    if (!alive) return
    rafId = requestAnimationFrame(tick)

    const t = now()
    const dtMs = clamp(t - last, 0, maxFrameMs)
    last = t
    acc += dtMs

    updateAudioVolumes()

    while (acc >= simStepMs) {
      acc -= simStepMs
      sim(simStepMs)
    }

    render()
    input.lmbPressed = false
    input.rmbPressed = false
    input.keysPressed = {}
  }

  const updateAudioVolumes = () => {
    audio.setVolumes({
      sfxVolume: config.settings.sfxVolume,
      musicVolume: config.settings.musicVolume,
    })
  }

  const sim = (dtMsInner: number) => {
    const dt = dtMsInner / 1000
    simTime += dtMsInner

    if (hitStopMs > 0) {
      hitStopMs = Math.max(0, hitStopMs - dtMsInner)
      return
    }

    updatePlayerInputs(player, dtMsInner)
    thinkBot(dtMsInner)
    updateBotInputs(bot, dtMsInner)

    stepFighter(player, dtMsInner, dt)
    stepFighter(bot, dtMsInner, dt)
    stepPearls(dtMsInner, dt)
    stepParticles(dtMsInner, dt)

    pushHud()

    if (player.hp <= 0) {
      onGameOver("bot")
      destroy()
      return
    }
    if (bot.hp <= 0) {
      onGameOver("player")
      destroy()
      return
    }
  }

  const pushHud = () => {
    const hud: GameHudSnapshot = {
      player: {
        hp: player.hp,
        maxHp: player.maxHp,
        absorption: player.absorption,
        shieldDurability: player.shieldDurability,
        combo: player.combo,
        selectedSlot: player.selectedSlot,
        hotbar: player.hotbar.map((id) => ({
          short: itemShort[id],
          count: player.counts[id],
        })),
      },
      bot: { hp: bot.hp, maxHp: bot.maxHp, absorption: bot.absorption },
    }
    onHud(hud)
  }

  const screenToWorld = (sx: number, sy: number) => {
    const view = calcView()
    return {
      x: view.x + sx * view.w,
      y: view.y + sy * view.h,
    }
  }

  function updatePlayerInputs(f: Fighter, dtMsInner: number) {
    const left = !!input.keys["KeyA"]
    const right = !!input.keys["KeyD"]
    const sprint = !!input.keys["ShiftLeft"] || !!input.keys["ShiftRight"]

    const wantJump = !!input.keysPressed["Space"]
    const wantAttack = input.lmbPressed
    const wantUsePressed = input.rmbPressed
    const wantUseHold = input.rmb

    if (input.keysPressed["Digit1"]) f.selectedSlot = 0
    if (input.keysPressed["Digit2"]) f.selectedSlot = 1
    if (input.keysPressed["Digit3"]) f.selectedSlot = 2
    if (input.keysPressed["Digit4"]) f.selectedSlot = 3
    if (input.keysPressed["Digit5"]) f.selectedSlot = 4
    if (input.keysPressed["Digit6"]) f.selectedSlot = 5
    if (input.keysPressed["Digit7"]) f.selectedSlot = 6
    if (input.keysPressed["Digit8"]) f.selectedSlot = 7
    if (input.keysPressed["Digit9"]) f.selectedSlot = 8

    const move = (left ? -1 : 0) + (right ? 1 : 0)
    applyMoveIntent(f, move as -1 | 0 | 1, sprint, dtMsInner)

    if (wantJump) tryJump(f)

    f.blocking = false
    const held = f.hotbar[f.selectedSlot] ?? "mace"
    if (held === "shield" && wantUseHold && f.shieldDisableMs <= 0) {
      f.blocking = true
    } else if (wantUsePressed) {
      activateItem(f, held)
    }

    if (wantAttack) attackWithHeld(f, held, "player")
  }

  function thinkBot(dtMsInner: number) {
    botIntent.nextThinkMs -= dtMsInner
    botIntent.modeMs = Math.max(0, botIntent.modeMs - dtMsInner)

    botIntent.wantAttack = false
    botIntent.wantUse = false
    botIntent.wantJump = false
    botIntent.wantBlock = false
    botIntent.wantSprint = false
    botIntent.move = 0
    botIntent.aimX = player.x
    botIntent.aimY = player.y
    botIntent.select = null

    const dx = player.x - bot.x
    const dist = Math.abs(dx)
    const dir: -1 | 1 = dx < 0 ? -1 : 1

    const playerThreat =
      dist < 120 && (player.attackCdMs < 120 || player.vy > 250)

    if (playerThreat && Math.random() < diff.blockRate) {
      botIntent.wantBlock = true
      botIntent.select = "shield"
    }

    if (botIntent.mode === "aerial" && botIntent.modeMs <= 0) {
      botIntent.mode = "neutral"
    }

    if (botIntent.nextThinkMs > 0) return
    botIntent.nextThinkMs = diff.reactionMs

    if (bot.hp < 14 && bot.counts.gapple && bot.cooldowns.gapple <= 0) {
      if (Math.random() < diff.itemUseRate * 0.95) {
        botIntent.select = "gapple"
        botIntent.wantUse = true
        botIntent.wantSprint = true
        botIntent.move = dist > 260 ? dir : 0
        return
      }
    }

    if (
      player.blocking &&
      dist < combatConfig.axe.range + 10 &&
      bot.attackCdMs <= 0
    ) {
      botIntent.select = "axe"
      botIntent.wantAttack = true
      botIntent.wantSprint = true
      botIntent.move = dist > 90 ? dir : 0
      return
    }

    if (
      dist > 420 &&
      bot.counts.ender_pearl &&
      bot.cooldowns.ender_pearl <= 0 &&
      Math.random() < diff.itemUseRate * 0.8
    ) {
      botIntent.select = "ender_pearl"
      botIntent.wantUse = true
      botIntent.wantSprint = true
      botIntent.move = 0
      return
    }

    if (
      bot.onGround &&
      dist < 240 &&
      bot.counts.wind_charge &&
      bot.cooldowns.wind_charge <= 0 &&
      Math.random() < diff.comboChance
    ) {
      botIntent.select = "wind_charge"
      botIntent.wantUse = true
      botIntent.mode = "aerial"
      botIntent.modeMs = 1200
      botIntent.wantSprint = true
      return
    }

    botIntent.select = "mace"
    botIntent.wantSprint = true
    botIntent.move = dist > 130 ? dir : 0

    if (botIntent.mode === "aerial") {
      botIntent.move = dist > 40 ? dir : 0
      botIntent.wantJump = false
      if (bot.vy > 250 && dist < 88) {
        botIntent.wantAttack = true
      }
    } else {
      if (dist < combatConfig.mace.range + 14 && bot.attackCdMs <= 0) {
        botIntent.wantAttack = true
      }
      if (dist < 110 && bot.onGround && Math.random() < diff.comboChance * 0.25) {
        botIntent.wantJump = true
      }
    }
  }

  function updateBotInputs(f: Fighter, dtMsInner: number) {
    if (botIntent.select) {
      const slotIndex = f.hotbar.findIndex((id) => id === botIntent.select)
      if (slotIndex >= 0) f.selectedSlot = slotIndex
    }

    applyMoveIntent(f, botIntent.move, botIntent.wantSprint, dtMsInner)

    if (botIntent.wantJump) tryJump(f)

    f.blocking = false
    const held = f.hotbar[f.selectedSlot] ?? "mace"
    if (held === "shield" && botIntent.wantBlock && f.shieldDisableMs <= 0) {
      f.blocking = true
    } else if (botIntent.wantUse) {
      activateItem(f, held, botIntent.aimX, botIntent.aimY)
    }

    if (botIntent.wantAttack) attackWithHeld(f, held, "bot")
  }

  function applyMoveIntent(
    f: Fighter,
    move: -1 | 0 | 1,
    sprint: boolean,
    dtMsInner: number,
  ) {
    const max = sprint ? physicsConfig.maxSprint : physicsConfig.maxRun
    const accel = physicsConfig.moveAccel * (f.onGround ? 1 : physicsConfig.airControl)
    if (f.dashLockMs > 0) move = 0

    if (move !== 0) {
      f.facing = move
      f.vx += move * accel * (dtMsInner / 1000)
      f.vx = clamp(f.vx, -max, max)
      if (detectDashTap(f, move, dtMsInner)) {
        f.vx = move * physicsConfig.dashVel
        f.dashCdMs = physicsConfig.dashCooldownMs
        f.dashLockMs = physicsConfig.dashLockMs
        audio.playSfx("dash", 1)
        shake += 0.25
      }
    } else {
      const fric = physicsConfig.moveFriction * (f.onGround ? 1 : 0.35)
      const v = f.vx
      const dv = fric * (dtMsInner / 1000)
      if (Math.abs(v) <= dv) f.vx = 0
      else f.vx = v - sign(v) * dv
    }

    if (f.blocking) f.vx *= combatConfig.shield.blockSlow
  }

  function detectDashTap(f: Fighter, move: -1 | 0 | 1, dtMsInner: number) {
    if (f.dashCdMs > 0) return false
    f.dashTapMs -= dtMsInner
    if (f.dashTapMs < 0) {
      f.dashTapMs = 0
      f.dashTapDir = 0
    }
    const tapped =
      move !== 0 &&
      input.keysPressed[(move === -1 ? "KeyA" : "KeyD")] &&
      f.dashTapDir === move &&
      f.dashTapMs > 0

    if (input.keysPressed[(move === -1 ? "KeyA" : "KeyD")]) {
      f.dashTapDir = move
      f.dashTapMs = 210
    }
    return tapped
  }

  function tryJump(f: Fighter) {
    if (f.eatMs > 0) return
    const can =
      f.onGround ||
      f.coyoteMs > 0 ||
      (f.jumpsLeft > 0 && f.vy > -200)
    if (!can) return
    if (!f.onGround && f.coyoteMs <= 0) f.jumpsLeft = Math.max(0, f.jumpsLeft - 1)
    if (f.onGround || f.coyoteMs > 0) f.jumpsLeft = 1
    f.vy = -physicsConfig.jumpVel
    f.onGround = false
    f.coyoteMs = 0
  }

  function stepFighter(f: Fighter, dtMsInner: number, dt: number) {
    f.attackCdMs = Math.max(0, f.attackCdMs - dtMsInner)
    f.dashCdMs = Math.max(0, f.dashCdMs - dtMsInner)
    f.dashLockMs = Math.max(0, f.dashLockMs - dtMsInner)
    f.invulnMs = Math.max(0, f.invulnMs - dtMsInner)
    f.hurtMs = Math.max(0, f.hurtMs - dtMsInner)
    f.shieldDisableMs = Math.max(0, f.shieldDisableMs - dtMsInner)

    f.cooldowns.gapple = Math.max(0, f.cooldowns.gapple - dtMsInner)
    f.cooldowns.wind_charge = Math.max(0, f.cooldowns.wind_charge - dtMsInner)
    f.cooldowns.ender_pearl = Math.max(0, f.cooldowns.ender_pearl - dtMsInner)

    if (f.eatMs > 0) {
      f.eatMs = Math.max(0, f.eatMs - dtMsInner)
      f.vx *= 0.82
      if (f.eatMs <= 0) {
        audio.playSfx("eat", 1)
        heal(f, combatConfig.gapple.healInstant)
        f.absorption = Math.max(f.absorption, combatConfig.gapple.absorption)
        f.healOverMs = combatConfig.gapple.healOverMs
        f.healOverRemaining = combatConfig.gapple.healOverTotal
      }
    }

    if (f.healOverMs > 0 && f.healOverRemaining > 0) {
      const chunk = (dtMsInner / combatConfig.gapple.healOverMs) * combatConfig.gapple.healOverTotal
      f.healOverRemaining = Math.max(0, f.healOverRemaining - chunk)
      heal(f, chunk)
      f.healOverMs = Math.max(0, f.healOverMs - dtMsInner)
    }

    if (f.shieldDurability <= 0 && f.shieldDisableMs <= 0) {
      f.shieldDurability = combatConfig.shield.maxDurability
    }

    const wasGround = f.onGround
    f.vy += physicsConfig.gravity * dt
    f.x += f.vx * dt
    f.y += f.vy * dt

    const leftWall = arenaConfig.wallPadding
    const rightWall = arenaConfig.simWidth - arenaConfig.wallPadding - f.w
    f.x = clamp(f.x, leftWall, rightWall)

    if (f.y + f.h >= arenaConfig.groundY) {
      f.y = arenaConfig.groundY - f.h
      f.vy = 0
      f.onGround = true
      f.coyoteMs = physicsConfig.coyoteMs
      f.jumpsLeft = 1
      f.peakAirY = f.y
    } else {
      f.onGround = false
      f.coyoteMs = Math.max(0, f.coyoteMs - dtMsInner)
      f.peakAirY = Math.min(f.peakAirY, f.y)
    }

    if (f.onGround && !wasGround) {
      f.combo = 0
    }
  }

  function stepPearls(dtMsInner: number, dt: number) {
    for (let i = pearls.length - 1; i >= 0; i--) {
      const p = pearls[i]
      p.lifeMs -= dtMsInner
      p.vy += combatConfig.pearl.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt

      const out =
        p.lifeMs <= 0 ||
        p.x < 0 ||
        p.x > arenaConfig.simWidth ||
        p.y < 0 ||
        p.y > arenaConfig.groundY - 10

      const hitGround = p.y >= arenaConfig.groundY - 18
      const hitWall = p.x < arenaConfig.wallPadding || p.x > arenaConfig.simWidth - arenaConfig.wallPadding
      if (out || hitGround || hitWall) {
        const owner = p.owner === "player" ? player : bot
        teleportWithPearl(owner, p.x, clamp(p.y, 40, arenaConfig.groundY - owner.h))
        pearls.splice(i, 1)
      }
    }
  }

  function stepParticles(dtMsInner: number, dt: number) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.lifeMs -= dtMsInner
      p.vy += physicsConfig.gravity * 0.42 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (p.lifeMs <= 0) particles.splice(i, 1)
    }
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
      const n = damageNumbers[i]
      n.lifeMs -= dtMsInner
      n.vy += physicsConfig.gravity * 0.12 * dt
      n.x += n.vx * dt
      n.y += n.vy * dt
      if (n.lifeMs <= 0) damageNumbers.splice(i, 1)
    }
  }

  function activateItem(f: Fighter, held: ItemId, aimX?: number, aimY?: number) {
    if (held === "wind_charge") {
      if (!f.counts.wind_charge || f.cooldowns.wind_charge > 0) return
      f.counts.wind_charge = Math.max(0, (f.counts.wind_charge ?? 0) - 1)
      f.cooldowns.wind_charge = combatConfig.wind.cooldownMs
      f.vy = Math.min(f.vy, -combatConfig.wind.impulseY)
      audio.playSfx("wind", 1)
      addBurst(f.x + f.w / 2, f.y + f.h, 10, "zinc", 580)
      shake += 0.35
      return
    }
    if (held === "ender_pearl") {
      if (!f.counts.ender_pearl || f.cooldowns.ender_pearl > 0) return
      const ax = aimX ?? screenToWorld(input.mouseX, input.mouseY).x
      const ay = aimY ?? screenToWorld(input.mouseX, input.mouseY).y
      const fromX = f.x + f.w / 2 + f.facing * 10
      const fromY = f.y + f.h * 0.28
      const dir = norm(ax - fromX, ay - fromY)
      const spd = combatConfig.pearl.speed
      pearls.push({
        id: nextPearlId++,
        owner: f.id,
        x: fromX,
        y: fromY,
        vx: dir.x * spd,
        vy: dir.y * spd,
        lifeMs: 1300,
      })
      f.counts.ender_pearl = Math.max(0, (f.counts.ender_pearl ?? 0) - 1)
      f.cooldowns.ender_pearl = combatConfig.pearl.cooldownMs
      audio.playSfx("pearl_throw", 1)
      return
    }
    if (held === "gapple") {
      if (!f.counts.gapple || f.cooldowns.gapple > 0 || f.eatMs > 0) return
      f.counts.gapple = Math.max(0, (f.counts.gapple ?? 0) - 1)
      f.cooldowns.gapple = combatConfig.gapple.cooldownMs
      f.eatMs = combatConfig.gapple.eatMs
      return
    }
  }

  function teleportWithPearl(f: Fighter, x: number, y: number) {
    f.x = clamp(x - f.w / 2, arenaConfig.wallPadding, arenaConfig.simWidth - arenaConfig.wallPadding - f.w)
    f.y = clamp(y - f.h / 2, 20, arenaConfig.groundY - f.h)
    f.vx *= 0.3
    f.vy = Math.min(f.vy, 120)
    f.invulnMs = Math.max(f.invulnMs, combatConfig.pearl.invulnMs)
    audio.playSfx("pearl_tp", 1)
    addBurst(f.x + f.w / 2, f.y + f.h / 2, 12, "amber", 620)
    if (combatConfig.pearl.selfDamage > 0) {
      takeDamage(f, combatConfig.pearl.selfDamage, "amber", 0.25)
    }
    shake += 0.45
  }

  function attackWithHeld(f: Fighter, held: ItemId, attackerId: FighterId) {
    if (f.attackCdMs > 0 || f.eatMs > 0) return
    const target = attackerId === "player" ? bot : player

    if (held === "mace") f.attackCdMs = combatConfig.mace.cooldownMs
    else if (held === "axe") f.attackCdMs = combatConfig.axe.cooldownMs
    else f.attackCdMs = combatConfig.punch.cooldownMs

    const range =
      held === "mace"
        ? combatConfig.mace.range
        : held === "axe"
          ? combatConfig.axe.range
          : combatConfig.punch.range
    const hitW = range
    const hitH = 56
    const hx = f.facing === 1 ? f.x + f.w : f.x - hitW
    const hy = f.y + 10

    const hit = rectsOverlap(hx, hy, hitW, hitH, target.x, target.y, target.w, target.h)
    if (!hit) return

    const fromFront = (f.x - target.x) * target.facing > 0
    if (fromFront && target.blocking && target.shieldDurability > 0 && target.shieldDisableMs <= 0) {
      const loss =
        held === "axe"
          ? combatConfig.axe.shieldDamage
          : held === "mace"
            ? combatConfig.shield.hitDurabilityLoss + 12
            : combatConfig.shield.hitDurabilityLoss

      target.shieldDurability -= loss
      audio.playSfx("block", held === "mace" ? 1.25 : 1)
      addBurst(target.x + target.w / 2, target.y + 30, 10, "zinc", 520)
      shake += held === "mace" ? 0.45 : 0.25

      if (held === "axe") {
        target.shieldDisableMs = Math.max(target.shieldDisableMs, combatConfig.axe.shieldDisableMs)
      }

      if (target.shieldDurability <= 0) {
        target.shieldDisableMs = Math.max(target.shieldDisableMs, combatConfig.shield.breakDisableMs)
        target.shieldDurability = 0
        audio.playSfx("break", 1.1)
        shake += 0.6
      }
      return
    }

    if (target.invulnMs > 0) return

    const fallHeight = Math.max(0, f.y - f.peakAirY)
    const descending = f.vy > 250

    const base =
      held === "mace"
        ? combatConfig.mace.baseDamage
        : held === "axe"
          ? combatConfig.axe.baseDamage
          : combatConfig.punch.baseDamage

    const kb =
      held === "mace"
        ? combatConfig.mace.kb
        : held === "axe"
          ? combatConfig.axe.kb
          : combatConfig.punch.kb

    let bonus = 0
    let crit = false
    if (held === "mace" && descending) {
      bonus = clamp(fallHeight * combatConfig.mace.fallScale, 0, combatConfig.mace.maxBonusDamage)
      crit = fallHeight >= combatConfig.mace.critFallMin
    }

    const dtSince = simTime - f.lastHitMs
    if (dtSince <= combatConfig.comboWindowMs) f.combo += 1
    else f.combo = 1
    f.lastHitMs = simTime

    const comboMul = 1 + clamp((f.combo - 1) * 0.06, 0, 0.28)
    const critMul = crit ? 1.35 : 1
    const dmg = (base + bonus) * comboMul * critMul

    const dir = f.x < target.x ? 1 : -1
    const kbMul = crit ? 1.2 : 1
    target.vx += dir * kb * kbMul
    target.vy -= kb * 0.25 * kbMul
    target.hurtMs = combatConfig.hitStopMs
    target.invulnMs = 170

    takeDamage(target, dmg, target.id === "player" ? "rose" : "emerald", crit ? 1.25 : 1)
    audio.playSfx("hit", held === "mace" ? 1.25 + bonus / 14 : 1)
    addBurst(target.x + target.w / 2, target.y + target.h * 0.5, 14, target.id === "player" ? "rose" : "emerald", 680)

    if (held === "axe") {
      target.shieldDisableMs = Math.max(target.shieldDisableMs, combatConfig.axe.shieldDisableMs)
    }

    const shock = held === "mace" ? 0.45 + bonus / 20 : 0.22
    if (config.settings.screenShakeEnabled) {
      shake += shock
      shakeV += shock * 0.7
    }
    hitStopMs = combatConfig.hitStopMs
  }

  function takeDamage(f: Fighter, dmg: number, tone: DamageNumber["tone"], intensity: number) {
    let remaining = dmg
    if (f.absorption > 0) {
      const used = Math.min(f.absorption, remaining)
      f.absorption -= used
      remaining -= used
    }
    f.hp = Math.max(0, f.hp - remaining)
    if (config.settings.showDamageNumbers) {
      damageNumbers.push({
        x: f.x + f.w / 2 + randRange(-12, 12),
        y: f.y + 22 + randRange(-10, 10),
        vx: randRange(-70, 70) * (0.6 + intensity * 0.4),
        vy: -260 - 120 * intensity,
        value: Math.round(dmg * 10) / 10,
        lifeMs: 720,
        tone,
      })
    }
  }

  function heal(f: Fighter, amount: number) {
    f.hp = Math.min(f.maxHp, f.hp + amount)
  }

  function addBurst(x: number, y: number, count: number, tone: Particle["tone"], power: number) {
    if (!config.settings.particlesEnabled) return
    for (let i = 0; i < count; i++) {
      const a = randRange(0, Math.PI * 2)
      const sp = randRange(power * 0.25, power)
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - randRange(40, 220),
        lifeMs: randRange(260, 520),
        tone,
        size: randRange(1.5, 3.5),
      })
    }
  }

  function createFighter(id: FighterId, x: number, y: number, hotbar: ItemId[]): Fighter {
    const counts: Record<ItemId, number | null> = {
      mace: null,
      axe: null,
      shield: null,
      gapple: itemCounts.gapple,
      wind_charge: itemCounts.wind_charge,
      ender_pearl: itemCounts.ender_pearl,
    }
    return {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      w: 44,
      h: 70,
      facing: 1,
      hp: 28,
      maxHp: 28,
      absorption: 0,
      invulnMs: 0,
      hurtMs: 0,
      onGround: true,
      coyoteMs: 0,
      jumpsLeft: 1,
      dashCdMs: 0,
      dashLockMs: 0,
      dashTapDir: 0,
      dashTapMs: 0,
      peakAirY: y,
      attackCdMs: 0,
      combo: 0,
      lastHitMs: -9999,
      blocking: false,
      shieldDurability: combatConfig.shield.maxDurability,
      shieldDisableMs: 0,
      eatMs: 0,
      healOverMs: 0,
      healOverRemaining: 0,
      selectedSlot: 0,
      hotbar: hotbar.slice(0, 9),
      counts,
      cooldowns: { gapple: 0, wind_charge: 0, ender_pearl: 0 },
    }
  }

  const calcView = () => {
    const viewW = 820
    const viewH = 470
    const midX = (player.x + bot.x) / 2
    const targetX = clamp(midX - viewW / 2, 0, arenaConfig.simWidth - viewW)
    const targetY = clamp(arenaConfig.groundY - viewH - 30, 0, arenaConfig.groundY - viewH)
    return { x: targetX, y: targetY, w: viewW, h: viewH }
  }

  const render = () => {
    const view = calcView()
    const cw = lowRes.width
    const ch = lowRes.height
    const sx = cw / view.w
    const sy = ch / view.h
    const s = Math.min(sx, sy)

    lowCtx.setTransform(1, 0, 0, 1, 0, 0)
    lowCtx.clearRect(0, 0, cw, ch)

    drawBackground(lowCtx, cw, ch)

    lowCtx.setTransform(s, 0, 0, s, -view.x * s, -view.y * s)
    drawArena(lowCtx)
    drawPearls(lowCtx)
    drawFighter(lowCtx, bot)
    drawFighter(lowCtx, player)
    drawParticles(lowCtx)
    drawDamageNumbers(lowCtx)

    const shakePx = config.settings.screenShakeEnabled ? updateShake() : { x: 0, y: 0 }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      lowRes,
      0,
      0,
      lowRes.width,
      lowRes.height,
      shakePx.x,
      shakePx.y,
      canvas.width - shakePx.x * 2,
      canvas.height - shakePx.y * 2,
    )
  }

  const updateShake = () => {
    shake = clamp(shake, 0, 2.2)
    shakeV *= 0.86
    shake *= 0.9
    shake += shakeV * 0.06
    const px = Math.floor(shake * 8 * devicePixelRatio)
    const rx = Math.floor(randRange(-px, px))
    const ry = Math.floor(randRange(-px, px))
    return { x: rx, y: ry }
  }

  const drawBackground = (c: CanvasRenderingContext2D, w: number, h: number) => {
    const g = c.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, "#030712")
    g.addColorStop(0.6, "#050812")
    g.addColorStop(1, "#02040c")
    c.fillStyle = g
    c.fillRect(0, 0, w, h)
    c.globalAlpha = 0.12
    for (let i = 0; i < 220; i++) {
      c.fillStyle = i % 2 === 0 ? "#10b981" : "#fb7185"
      c.fillRect(
        Math.floor(Math.random() * w),
        Math.floor(Math.random() * h),
        1,
        1,
      )
    }
    c.globalAlpha = 1
  }

  const drawArena = (c: CanvasRenderingContext2D) => {
    c.fillStyle = "#0a0a12"
    c.fillRect(0, arenaConfig.groundY, arenaConfig.simWidth, arenaConfig.simHeight - arenaConfig.groundY)

    c.strokeStyle = "#1f2937"
    c.lineWidth = 2
    c.beginPath()
    c.moveTo(0, arenaConfig.groundY + 1)
    c.lineTo(arenaConfig.simWidth, arenaConfig.groundY + 1)
    c.stroke()

    const tile = 48
    for (let x = 0; x < arenaConfig.simWidth; x += tile) {
      c.fillStyle = x % (tile * 2) === 0 ? "#0b1220" : "#0a0f1c"
      c.fillRect(x, arenaConfig.groundY + 2, tile, 34)
    }

    c.fillStyle = "#111827"
    c.fillRect(arenaConfig.wallPadding - 12, 0, 12, arenaConfig.groundY + 44)
    c.fillRect(arenaConfig.simWidth - arenaConfig.wallPadding, 0, 12, arenaConfig.groundY + 44)
  }

  const drawFighter = (c: CanvasRenderingContext2D, f: Fighter) => {
    const tone = f.id === "player" ? "#10b981" : "#fb7185"
    const dark = f.id === "player" ? "#064e3b" : "#7f1d1d"
    const hurt = f.hurtMs > 0

    c.fillStyle = hurt ? "#f59e0b" : dark
    c.fillRect(f.x, f.y + 18, f.w, f.h - 18)
    c.fillStyle = hurt ? "#fde68a" : tone
    c.fillRect(f.x + 6, f.y, f.w - 12, 22)

    const eyeX = f.facing === 1 ? f.x + f.w - 14 : f.x + 10
    c.fillStyle = "#0b1020"
    c.fillRect(eyeX, f.y + 10, 4, 4)

    const held = f.hotbar[f.selectedSlot] ?? "mace"
    const weaponX = f.facing === 1 ? f.x + f.w : f.x - 12
    const weaponY = f.y + 30

    if (held === "mace") {
      c.fillStyle = "#e5e7eb"
      c.fillRect(weaponX, weaponY, 10, 18)
      c.fillStyle = "#9ca3af"
      c.fillRect(weaponX - f.facing * 3, weaponY - 5, 16, 8)
    } else if (held === "axe") {
      c.fillStyle = "#d1d5db"
      c.fillRect(weaponX + f.facing * 4, weaponY - 6, 12, 12)
      c.fillStyle = "#9ca3af"
      c.fillRect(weaponX, weaponY, 8, 22)
    } else if (held === "shield") {
      c.fillStyle = "#6b7280"
      c.fillRect(weaponX, weaponY - 4, 10, 26)
    }

    if (f.blocking && f.shieldDisableMs <= 0) {
      const sx = f.facing === 1 ? f.x + f.w - 6 : f.x - 18
      const sy = f.y + 22
      const sw = 18
      const sh = 32
      c.fillStyle = "#4b5563"
      c.fillRect(sx, sy, sw, sh)
      const pct = clamp(f.shieldDurability / combatConfig.shield.maxDurability, 0, 1)
      const cracks = pct < 0.34 ? 3 : pct < 0.67 ? 2 : 1
      c.strokeStyle = "#111827"
      c.lineWidth = 2
      for (let i = 0; i < cracks; i++) {
        c.beginPath()
        c.moveTo(sx + 3, sy + 6 + i * 8)
        c.lineTo(sx + sw - 3, sy + 16 + i * 8)
        c.stroke()
      }
    }

    if (f.shieldDisableMs > 0) {
      c.fillStyle = "#fbbf24"
      c.fillRect(f.x + f.w / 2 - 8, f.y - 12, 16, 4)
    }
  }

  const drawPearls = (c: CanvasRenderingContext2D) => {
    for (const p of pearls) {
      c.fillStyle = "#a78bfa"
      c.fillRect(p.x - 3, p.y - 3, 6, 6)
      c.fillStyle = "#e9d5ff"
      c.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
  }

  const drawParticles = (c: CanvasRenderingContext2D) => {
    for (const p of particles) {
      c.fillStyle =
        p.tone === "emerald"
          ? "#10b981"
          : p.tone === "rose"
            ? "#fb7185"
            : p.tone === "amber"
              ? "#fbbf24"
              : "#94a3b8"
      c.fillRect(p.x, p.y, p.size, p.size)
    }
  }

  const drawDamageNumbers = (c: CanvasRenderingContext2D) => {
    if (!config.settings.showDamageNumbers) return
    c.save()
    c.font = "16px 'Pixelify Sans', ui-monospace"
    c.textAlign = "center"
    c.textBaseline = "middle"
    for (const n of damageNumbers) {
      c.fillStyle =
        n.tone === "emerald"
          ? "#34d399"
          : n.tone === "rose"
            ? "#fda4af"
            : "#fcd34d"
      c.fillText(`${n.value}`, n.x, n.y)
    }
    c.restore()
  }

  tick()

  const destroy = () => {
    if (!alive) return
    alive = false
    cancelAnimationFrame(rafId)
    ro.disconnect()
    window.removeEventListener("keydown", onKeyDown)
    window.removeEventListener("keyup", onKeyUp)
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("mousedown", onMouseDown)
    window.removeEventListener("mouseup", onMouseUp)
    audio.destroy()
  }

  return {
    destroy,
  }
}
