import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ItemId =
  | "mace"
  | "axe"
  | "shield"
  | "gapple"
  | "wind_charge"
  | "ender_pearl"

export type OffhandItemId = Extract<ItemId, "shield" | "wind_charge" | "gapple">

export type DifficultyId = "easy" | "normal" | "hard"

export type SettingsState = {
  sfxVolume: number
  musicVolume: number
  screenShakeEnabled: boolean
  showDamageNumbers: boolean
  particlesEnabled: boolean
}

export type StatsState = {
  wins: number
  losses: number
  bestStreak: number
  currentStreak: number
}

export type AppState = {
  settings: SettingsState
  difficulty: DifficultyId
  hotbar: ItemId[]
  offhand: OffhandItemId
  stats: StatsState
  actions: {
    setDifficulty: (difficulty: DifficultyId) => void
    setSettings: (partial: Partial<SettingsState>) => void
    setHotbar: (hotbar: ItemId[]) => void
    setOffhand: (offhand: OffhandItemId) => void
    resetHotbar: () => void
    recordWin: () => void
    recordLoss: () => void
    resetStats: () => void
  }
}

export const defaultHotbar: ItemId[] = [
  "mace",
  "axe",
  "shield",
  "gapple",
  "wind_charge",
  "ender_pearl",
  "mace",
  "wind_charge",
  "gapple",
]

export const defaultOffhand: OffhandItemId = "shield"

const defaultSettings: SettingsState = {
  sfxVolume: 0.8,
  musicVolume: 0.55,
  screenShakeEnabled: true,
  showDamageNumbers: true,
  particlesEnabled: true,
}

const defaultStats: StatsState = {
  wins: 0,
  losses: 0,
  bestStreak: 0,
  currentStreak: 0,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      difficulty: "normal",
      hotbar: defaultHotbar,
      offhand: defaultOffhand,
      stats: defaultStats,
      actions: {
        setDifficulty: (difficulty) => set({ difficulty }),
        setSettings: (partial) =>
          set((s) => ({ settings: { ...s.settings, ...partial } })),
        setHotbar: (hotbar) => set({ hotbar }),
        setOffhand: (offhand) => set({ offhand }),
        resetHotbar: () => set({ hotbar: defaultHotbar }),
        recordWin: () =>
          set((s) => {
            const currentStreak = s.stats.currentStreak + 1
            return {
              stats: {
                wins: s.stats.wins + 1,
                losses: s.stats.losses,
                currentStreak,
                bestStreak: Math.max(s.stats.bestStreak, currentStreak),
              },
            }
          }),
        recordLoss: () =>
          set((s) => ({
            stats: {
              wins: s.stats.wins,
              losses: s.stats.losses + 1,
              bestStreak: s.stats.bestStreak,
              currentStreak: 0,
            },
          })),
        resetStats: () => set({ stats: defaultStats }),
      },
    }),
    {
      name: "windstrike:v1",
      version: 1,
      partialize: (s) => ({
        settings: s.settings,
        difficulty: s.difficulty,
        hotbar: s.hotbar,
        offhand: s.offhand,
        stats: s.stats,
      }),
    },
  ),
)

export const selectSettings = (s: AppState) => s.settings
export const selectDifficulty = (s: AppState) => s.difficulty
export const selectHotbar = (s: AppState) => s.hotbar
export const selectOffhand = (s: AppState) => s.offhand
export const selectStats = (s: AppState) => s.stats
export const selectActions = (s: AppState) => s.actions
