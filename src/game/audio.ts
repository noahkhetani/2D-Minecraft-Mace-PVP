import { clamp } from "@/game/math"

export type AudioSettings = {
  sfxVolume: number
  musicVolume: number
}

type SfxId =
  | "hit"
  | "block"
  | "break"
  | "wind"
  | "pearl_throw"
  | "pearl_tp"
  | "eat"
  | "dash"

export function createAudioEngine(settings: AudioSettings) {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let sfx: GainNode | null = null
  let music: GainNode | null = null
  let musicTimer: number | null = null
  let started = false

  const ensure = () => {
    if (ctx) return
    ctx = new AudioContext()
    master = ctx.createGain()
    sfx = ctx.createGain()
    music = ctx.createGain()
    master.gain.value = 1
    sfx.gain.value = clamp(settings.sfxVolume, 0, 1)
    music.gain.value = clamp(settings.musicVolume, 0, 1)
    sfx.connect(master)
    music.connect(master)
    master.connect(ctx.destination)
  }

  const setVolumes = (next: AudioSettings) => {
    settings = next
    if (sfx) sfx.gain.value = clamp(settings.sfxVolume, 0, 1)
    if (music) music.gain.value = clamp(settings.musicVolume, 0, 1)
  }

  const tone = (freq: number, durMs: number, gain: number, type: OscillatorType) => {
    if (!ctx || !sfx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.value = 0
    o.connect(g)
    g.connect(sfx)
    const t0 = ctx.currentTime
    const dur = durMs / 1000
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.start()
    o.stop(t0 + dur + 0.02)
  }

  const noise = (durMs: number, gain: number) => {
    if (!ctx || !sfx) return
    const bufferSize = Math.max(1, Math.floor((ctx.sampleRate * durMs) / 1000))
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.85
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const g = ctx.createGain()
    g.gain.value = gain
    src.connect(g)
    g.connect(sfx)
    src.start()
  }

  const playSfx = (id: SfxId, intensity = 1) => {
    ensure()
    if (!ctx) return
    if (!started) startMusic()
    const k = clamp(intensity, 0.2, 1.6)
    if (id === "hit") {
      tone(160 + 80 * k, 80, 0.18 * k, "square")
      noise(35, 0.08 * k)
    } else if (id === "block") {
      tone(240, 60, 0.14 * k, "triangle")
      tone(120, 80, 0.09 * k, "sine")
    } else if (id === "break") {
      noise(110, 0.16 * k)
      tone(90, 140, 0.16 * k, "sawtooth")
    } else if (id === "wind") {
      tone(520, 120, 0.12 * k, "triangle")
      tone(780, 100, 0.1 * k, "sine")
    } else if (id === "pearl_throw") {
      tone(740, 70, 0.11 * k, "square")
      tone(980, 60, 0.07 * k, "triangle")
    } else if (id === "pearl_tp") {
      tone(480, 110, 0.16 * k, "sine")
      tone(320, 160, 0.11 * k, "triangle")
      noise(70, 0.06 * k)
    } else if (id === "eat") {
      tone(220, 130, 0.1 * k, "square")
      tone(180, 150, 0.08 * k, "triangle")
    } else if (id === "dash") {
      noise(45, 0.08 * k)
      tone(340, 80, 0.12 * k, "sawtooth")
    }
  }

  const startMusic = () => {
    ensure()
    if (!ctx || !music || started) return
    started = true
    let step = 0
    const seq = [
      196, 0, 220, 0, 262, 0, 247, 0, 196, 0, 175, 0, 196, 0, 220, 0,
      262, 0, 294, 0, 262, 0, 247, 0, 220, 0, 196, 0, 175, 0, 196, 0,
    ]

    const tick = () => {
      if (!ctx || !music) return
      const freq = seq[step % seq.length]
      if (freq > 0) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = "square"
        o.frequency.value = freq
        g.gain.value = 0
        o.connect(g)
        g.connect(music)
        const t0 = ctx.currentTime
        g.gain.setValueAtTime(0, t0)
        g.gain.linearRampToValueAtTime(0.06, t0 + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14)
        o.start()
        o.stop(t0 + 0.16)
      }
      step += 1
      musicTimer = window.setTimeout(tick, 170)
    }

    tick()
  }

  const destroy = () => {
    if (musicTimer) window.clearTimeout(musicTimer)
    musicTimer = null
    if (ctx) void ctx.close()
    ctx = null
    master = null
    sfx = null
    music = null
  }

  return {
    ensure,
    setVolumes,
    playSfx,
    startMusic,
    destroy,
  }
}

