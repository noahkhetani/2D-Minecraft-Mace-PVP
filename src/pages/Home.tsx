import type { ComponentType } from "react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Apple,
  Axe,
  Crosshair,
  Dices,
  Expand,
  Gamepad2,
  Hammer,
  HelpCircle,
  Settings2,
  Shield,
  Sparkles,
  Swords,
  Wind,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  defaultHotbar,
  defaultOffhand,
  selectActions,
  selectDifficulty,
  selectHotbar,
  selectOffhand,
  selectSettings,
  selectStats,
  type DifficultyId,
  type ItemId,
  type OffhandItemId,
  type SettingsState,
  useAppStore,
} from "@/store/useAppStore"

type TabId = "play" | "loadout" | "settings" | "help"

const itemMeta: Record<
  ItemId,
  { name: string; short: string; icon: ComponentType<{ className?: string }> }
> = {
  mace: { name: "Mace", short: "Mace", icon: Hammer },
  axe: { name: "Axe", short: "Axe", icon: Axe },
  shield: { name: "Shield", short: "Shield", icon: Shield },
  gapple: { name: "Golden Apple", short: "GApp", icon: Apple },
  wind_charge: { name: "Wind Charge", short: "Wind", icon: Wind },
  ender_pearl: { name: "Ender Pearl", short: "Pearl", icon: Sparkles },
}

const difficultyMeta: Record<
  DifficultyId,
  { label: string; desc: string; chips: string[] }
> = {
  easy: {
    label: "Easy",
    desc: "Gives you breathing room. Bot blocks less and drops combos.",
    chips: ["Slower reactions", "Less item use", "Safer spacing"],
  },
  normal: {
    label: "Normal",
    desc: "Minecraft-like pressure. Bot uses shield mind-games and mobility.",
    chips: ["Reactive blocks", "Axe shield breaks", "Mobility setups"],
  },
  hard: {
    label: "Hard",
    desc: "Chaotic duel specialist. Bot chains wind-launch mace drops and pearls.",
    chips: ["Fast reactions", "Combo punish", "Aggressive aerial drops"],
  },
}

export default function Home() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>("play")
  const settings = useAppStore(selectSettings)
  const difficulty = useAppStore(selectDifficulty)
  const hotbar = useAppStore(selectHotbar)
  const offhand = useAppStore(selectOffhand)
  const stats = useAppStore(selectStats)
  const actions = useAppStore(selectActions)

  const difficultyCard = difficultyMeta[difficulty]

  const hotbarDisplay = useMemo(
    () => hotbar.map((id) => itemMeta[id].short).join(" · "),
    [hotbar],
  )
  const offhandDisplay = itemMeta[offhand].short

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 py-6">
        <Header />

        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-2">
                  <Gamepad2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-[0.35em] text-zinc-400">
                    READY
                  </div>
                  <div className="text-lg font-semibold">Start a match</div>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen().catch(
                      () => {},
                    )
                  } else {
                    await document.exitFullscreen().catch(() => {})
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                  "border-zinc-800 bg-zinc-950/40 text-zinc-200 hover:bg-zinc-950/70",
                )}
              >
                <Expand className="h-4 w-4" />
                Fullscreen
              </button>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
              <StatLine
                icon={<Dices className="h-4 w-4 text-zinc-200" />}
                label="Difficulty"
                value={difficultyCard.label}
                sub={difficultyCard.chips.join(" • ")}
              />
              <StatLine
                icon={<Swords className="h-4 w-4 text-zinc-200" />}
                label="Loadout"
                value="Custom"
                sub={`OFF ${offhandDisplay} · ${hotbarDisplay}`}
              />
              <StatLine
                icon={<Crosshair className="h-4 w-4 text-zinc-200" />}
                label="Stats"
                value={`${stats.wins}W / ${stats.losses}L`}
                sub={`Streak ${stats.currentStreak} · Best ${stats.bestStreak}`}
              />
            </div>

            <button
              type="button"
              onClick={() => navigate("/match")}
              className={cn(
                "mt-4 w-full rounded-2xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-4 text-left",
                "shadow-[0_16px_60px_rgba(16,185,129,0.12)] hover:bg-emerald-400/15",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold tracking-[0.35em] text-emerald-200">
                    PLAY
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    Enter the arena
                  </div>
                  <div className="mt-1 text-sm text-emerald-100/80">
                    Chaotic 1v1 duel. Death returns here instantly.
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3">
                  <Swords className="h-6 w-6 text-emerald-200" />
                </div>
              </div>
            </button>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-400">
              Double-tap A/D to dash · LMB aims at cursor · RMB uses off-hand (hold to block with shield) · Mace damage scales with fall height
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={tab === "play"}
                onClick={() => setTab("play")}
                icon={<Swords className="h-4 w-4" />}
              >
                Play
              </TabButton>
              <TabButton
                active={tab === "loadout"}
                onClick={() => setTab("loadout")}
                icon={<Swords className="h-4 w-4" />}
              >
                Loadout
              </TabButton>
              <TabButton
                active={tab === "settings"}
                onClick={() => setTab("settings")}
                icon={<Settings2 className="h-4 w-4" />}
              >
                Settings
              </TabButton>
              <TabButton
                active={tab === "help"}
                onClick={() => setTab("help")}
                icon={<HelpCircle className="h-4 w-4" />}
              >
                Help
              </TabButton>
            </div>

            <div className="mt-4">
              {tab === "play" ? (
                <PlayPanel
                  difficulty={difficulty}
                  onSetDifficulty={actions.setDifficulty}
                />
              ) : null}
              {tab === "loadout" ? (
                <LoadoutPanel
                  hotbar={hotbar}
                  offhand={offhand}
                  onChange={actions.setHotbar}
                  onSetOffhand={actions.setOffhand}
                  onReset={actions.resetHotbar}
                />
              ) : null}
              {tab === "settings" ? (
                <SettingsPanel
                  settings={settings}
                  onChange={actions.setSettings}
                  onResetStats={actions.resetStats}
                />
              ) : null}
              {tab === "help" ? <HelpPanel /> : null}
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          WindStrike Arena · Browser-only · No accounts · Saves locally
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/25 p-5">
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.35),transparent_52%),radial-gradient(circle_at_86%_18%,rgba(244,63,94,0.35),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_60%)]" />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-3">
            <Hammer className="h-6 w-6 text-emerald-200" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.4em] text-zinc-400">
              OBSIDIAN ARENA CONSOLE
            </div>
            <div className="mt-1 text-3xl font-semibold">WindStrike Arena</div>
          </div>
        </div>
        <div className="max-w-[78ch] text-sm text-zinc-300">
          A fast, chaotic 2D duel inspired by Minecraft mace PvP. Launch, drop, block,
          break shields, pearl-reposition, and chain hits into clean finishes.
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
        active
          ? "border-emerald-400/45 bg-emerald-400/10 text-emerald-100"
          : "border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-950/55",
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function StatLine({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold tracking-[0.28em] text-zinc-400">
            {label}
          </div>
          <div className="text-sm font-semibold text-zinc-100">{value}</div>
        </div>
        <div className="mt-1 truncate text-xs text-zinc-400">{sub}</div>
      </div>
    </div>
  )
}

function PlayPanel({
  difficulty,
  onSetDifficulty,
}: {
  difficulty: DifficultyId
  onSetDifficulty: (d: DifficultyId) => void
}) {
  return (
    <div className="grid gap-4">
      <div className="text-sm text-zinc-300">
        Difficulty changes the bot’s reaction speed, shielding behavior, and combo
        willingness.
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(difficultyMeta) as DifficultyId[]).map((id) => {
          const meta = difficultyMeta[id]
          const active = id === difficulty
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSetDifficulty(id)}
              className={cn(
                "rounded-2xl border p-4 text-left",
                active
                  ? "border-emerald-400/45 bg-emerald-400/10"
                  : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-950/50",
              )}
            >
              <div className="text-xs font-semibold tracking-[0.3em] text-zinc-400">
                {id.toUpperCase()}
              </div>
              <div className="mt-1 text-lg font-semibold">{meta.label}</div>
              <div className="mt-2 text-sm text-zinc-300">{meta.desc}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {meta.chips.map((chip) => (
                  <div
                    key={chip}
                    className="rounded-full border border-zinc-700 bg-zinc-900/40 px-2 py-1 text-[11px] text-zinc-300"
                  >
                    {chip}
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LoadoutPanel({
  hotbar,
  offhand,
  onChange,
  onSetOffhand,
  onReset,
}: {
  hotbar: ItemId[]
  offhand: OffhandItemId
  onChange: (hotbar: ItemId[]) => void
  onSetOffhand: (offhand: OffhandItemId) => void
  onReset: () => void
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Off-hand</div>
            <div className="mt-1 text-xs text-zinc-400">
              Right click uses off-hand. Shield blocks while held.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSetOffhand(defaultOffhand)}
            className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-950/55"
          >
            Reset off-hand
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          {(["shield", "wind_charge", "gapple"] as OffhandItemId[]).map((id) => {
            const meta = itemMeta[id]
            const Icon = meta.icon
            const active = offhand === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSetOffhand(id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border p-3 text-left",
                  active
                    ? "border-emerald-400/45 bg-emerald-400/10"
                    : "border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40",
                )}
              >
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.25em] text-zinc-400">
                    OFF-HAND
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-100">
                    {meta.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {id === "shield"
                      ? "Hold RMB to block."
                      : id === "wind_charge"
                        ? "RMB on ground to launch."
                        : "Hold RMB to eat."}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-2">
                  <Icon className="h-4 w-4 text-zinc-200" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Hotbar editor</div>
          <div className="mt-1 text-xs text-zinc-400">
            Drag slots to reorder. The match spawns with the items in this order.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onReset()
            setDragIndex(null)
          }}
          className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-950/55"
        >
          Reset to default
        </button>
      </div>

      <div className="grid gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3">
        <div className="grid grid-cols-3 gap-2 md:grid-cols-9">
          {hotbar.map((id, idx) => {
            const meta = itemMeta[id]
            const Icon = meta.icon
            return (
              <div
                key={`${id}-${idx}`}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === idx) return
                  const next = [...hotbar]
                  const temp = next[dragIndex]
                  next[dragIndex] = next[idx]
                  next[idx] = temp
                  onChange(next)
                  setDragIndex(idx)
                }}
                className={cn(
                  "relative rounded-xl border bg-zinc-900/30 p-3",
                  "border-zinc-800 hover:bg-zinc-900/45",
                  dragIndex === idx
                    ? "outline outline-2 outline-emerald-400/60"
                    : "",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold tracking-[0.25em] text-zinc-400">
                    {idx + 1}
                  </div>
                  <Icon className="h-4 w-4 text-zinc-300" />
                </div>
                <div className="mt-2 text-sm font-semibold text-zinc-100">
                  {meta.name}
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  {meta.short}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3">
        <div className="text-xs font-semibold tracking-[0.25em] text-zinc-400">
          DEFAULT (REFERENCE)
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
          {defaultHotbar.map((id, idx) => (
            <div
              key={`${id}-${idx}`}
              className="rounded-full border border-zinc-700 bg-zinc-900/30 px-2 py-1"
            >
              {idx + 1}:{itemMeta[id].short}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsPanel({
  settings,
  onChange,
  onResetStats,
}: {
  settings: SettingsState
  onChange: (partial: Partial<SettingsState>) => void
  onResetStats: () => void
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Audio</div>
            <div className="mt-1 text-xs text-zinc-400">
              Chiptune-style music and crunchy PvP sound hits.
            </div>
          </div>
        </div>
        <SliderRow
          label="SFX volume"
          value={settings.sfxVolume}
          onChange={(v) => onChange({ sfxVolume: v })}
        />
        <SliderRow
          label="Music volume"
          value={settings.musicVolume}
          onChange={(v) => onChange({ musicVolume: v })}
        />
      </div>

      <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div>
          <div className="text-sm font-semibold">Feedback</div>
          <div className="mt-1 text-xs text-zinc-400">
            Turn off effects if you want pure clarity.
          </div>
        </div>
        <ToggleRow
          label="Screen shake"
          value={settings.screenShakeEnabled}
          onChange={(v) => onChange({ screenShakeEnabled: v })}
        />
        <ToggleRow
          label="Damage numbers"
          value={settings.showDamageNumbers}
          onChange={(v) => onChange({ showDamageNumbers: v })}
        />
        <ToggleRow
          label="Particles"
          value={settings.particlesEnabled}
          onChange={(v) => onChange({ particlesEnabled: v })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div>
          <div className="text-sm font-semibold">Local stats</div>
          <div className="mt-1 text-xs text-zinc-400">
            Reset wins/losses and streak records on this device.
          </div>
        </div>
        <button
          type="button"
          onClick={onResetStats}
          className="rounded-xl border border-rose-400/35 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-400/15"
        >
          Reset stats
        </button>
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <div className="text-zinc-200">{label}</div>
        <div className="text-zinc-400">{Math.round(value * 100)}%</div>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-emerald-400"
      />
    </div>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/25 px-3 py-3 text-left hover:bg-zinc-900/40"
    >
      <div className="text-sm font-semibold text-zinc-100">{label}</div>
      <div
        className={cn(
          "h-6 w-11 rounded-full border p-0.5 transition",
          value
            ? "border-emerald-400/60 bg-emerald-400/15"
            : "border-zinc-700 bg-zinc-950/30",
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full transition",
            value ? "translate-x-5 bg-emerald-300" : "bg-zinc-300",
          )}
        />
      </div>
    </button>
  )
}

function HelpPanel() {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="text-sm font-semibold">Controls</div>
        <div className="mt-3 grid gap-2 text-sm text-zinc-200 md:grid-cols-2">
          <KeyLine k="WASD" v="Move (A/D are most important in the arena)" />
          <KeyLine k="Space" v="Jump / double jump" />
          <KeyLine k="Shift" v="Sprint" />
          <KeyLine k="LMB" v="Attack (mace/axe) · Punch if holding items" />
          <KeyLine k="RMB" v="Shield block or use item" />
          <KeyLine k="1–9" v="Select hotbar slot" />
          <KeyLine k="Double-tap A/D" v="Dash" />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="text-sm font-semibold">Combat basics</div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-200">
          <li>
            Mace damage and knockback scale with fall height. Wind-charge up, then
            drop in for huge hits.
          </li>
          <li>
            Shield blocks frontal damage but burns durability. Axe hits can disable
            shields briefly.
          </li>
          <li>
            Ender pearls teleport on impact. Use them to escape combos or to
            surprise-close distance.
          </li>
          <li>
            Golden apples have an eating delay, but give healing + absorption for
            survivability swings.
          </li>
        </ul>
      </div>
    </div>
  )
}

function KeyLine({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-28 rounded-lg border border-zinc-700 bg-zinc-900/40 px-2 py-1 text-center text-xs font-semibold tracking-[0.25em] text-zinc-300">
        {k}
      </div>
      <div className="min-w-0 flex-1 text-sm text-zinc-200">{v}</div>
    </div>
  )
}
