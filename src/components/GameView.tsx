import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type {
  DifficultyId,
  ItemId,
  OffhandItemId,
  SettingsState,
} from "@/store/useAppStore"
import { createGameController, type GameHudSnapshot } from "@/game/controller"

export type MatchConfig = {
  difficulty: DifficultyId
  hotbar: ItemId[]
  offhand: OffhandItemId
  settings: SettingsState
}

export default function GameView({
  config,
  onExit,
}: {
  config: MatchConfig
  onExit: (outcome: "win" | "loss") => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const controllerRef = useRef<ReturnType<typeof createGameController> | null>(
    null,
  )
  const [hud, setHud] = useState<GameHudSnapshot | null>(null)

  const controllerConfig = useMemo(
    () => ({
      difficulty: config.difficulty,
      hotbar: config.hotbar,
      offhand: config.offhand,
      settings: config.settings,
    }),
    [config.difficulty, config.hotbar, config.offhand, config.settings],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    controllerRef.current?.destroy()
    canvas.focus()
    const controller = createGameController({
      canvas,
      container,
      config: controllerConfig,
      onHud: setHud,
      onGameOver: (winner) => onExit(winner === "player" ? "win" : "loss"),
    })
    controllerRef.current = controller

    return () => controller.destroy()
  }, [controllerConfig, onExit])

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    window.addEventListener("contextmenu", onContextMenu)
    return () => window.removeEventListener("contextmenu", onContextMenu)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col items-stretch px-4 py-4"
    >
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
        <canvas
          ref={canvasRef}
          className={cn(
            "block h-[72vh] w-full select-none bg-zinc-950",
            "cursor-none outline-none",
          )}
          tabIndex={0}
        />

        {hud ? (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-3 top-3 flex items-center gap-3">
              <HudBar
                label="YOU"
                hp={hud.player.hp}
                maxHp={hud.player.maxHp}
                ab={hud.player.absorption}
                tone="emerald"
              />
              <HudBar
                label="BOT"
                hp={hud.bot.hp}
                maxHp={hud.bot.maxHp}
                ab={hud.bot.absorption}
                tone="rose"
              />
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <Hotbar hud={hud} />
            </div>

            <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
              <MiniStat label="COMBO" value={hud.player.combo.toString()} />
              <MiniStat
                label="SHIELD"
                value={hud.player.shieldDurability <= 0 ? "BROKEN" : `${hud.player.shieldDurability}`}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-xs text-zinc-400">
        WASD move · Space double jump · Shift sprint · LMB attack · RMB use/block · 1–9 hotbar · Double-tap A/D dash
      </div>
    </div>
  )
}

function HudBar({
  label,
  hp,
  maxHp,
  ab,
  tone,
}: {
  label: string
  hp: number
  maxHp: number
  ab: number
  tone: "emerald" | "rose"
}) {
  const hpPct = Math.max(0, Math.min(1, hp / maxHp))
  const abPct = Math.max(0, Math.min(1, ab / maxHp))
  const hpColor = tone === "emerald" ? "bg-emerald-500" : "bg-rose-500"
  const abColor = "bg-amber-300"
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 backdrop-blur">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="text-[11px] font-semibold tracking-[0.2em] text-zinc-300">
          {label}
        </div>
        <div className="text-[11px] text-zinc-400">
          {Math.max(0, Math.round(hp))}/{maxHp}
        </div>
      </div>
      <div className="h-2 w-[210px] overflow-hidden rounded-md bg-zinc-800">
        <div
          className={cn("h-full", hpColor)}
          style={{ width: `${hpPct * 100}%` }}
        />
        {ab > 0 ? (
          <div
            className={cn("h-full", abColor)}
            style={{ width: `${abPct * 100}%`, marginTop: "-8px" }}
          />
        ) : null}
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-2 text-right backdrop-blur">
      <div className="text-[10px] font-semibold tracking-[0.25em] text-zinc-400">
        {label}
      </div>
      <div className="text-sm font-semibold text-zinc-100">{value}</div>
    </div>
  )
}

function Hotbar({ hud }: { hud: GameHudSnapshot }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2 backdrop-blur">
      <div className="flex items-stretch gap-1">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="text-[10px] font-semibold text-zinc-400">OFF</div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1 pb-0.5 text-[10px] text-zinc-300">
            <div className="truncate">{hud.player.offhand.short}</div>
            {hud.player.offhand.count !== null ? (
              <div>{hud.player.offhand.count}</div>
            ) : null}
          </div>
        </div>
        {hud.player.hotbar.map((slot, idx) => (
          <div
            key={idx}
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-lg border",
              idx === hud.player.selectedSlot
                ? "border-emerald-400 bg-emerald-400/10"
                : "border-zinc-800 bg-zinc-900/40",
            )}
          >
            <div className="text-[10px] font-semibold text-zinc-400">
              {idx + 1}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1 pb-0.5 text-[10px] text-zinc-300">
              <div className="truncate">{slot.short}</div>
              {slot.count !== null ? <div>{slot.count}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
