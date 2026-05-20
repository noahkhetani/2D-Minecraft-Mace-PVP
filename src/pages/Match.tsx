import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import GameView from "@/components/GameView"
import {
  selectActions,
  selectDifficulty,
  selectHotbar,
  selectOffhand,
  selectSettings,
  useAppStore,
} from "@/store/useAppStore"

export default function Match() {
  const navigate = useNavigate()
  const settings = useAppStore(selectSettings)
  const difficulty = useAppStore(selectDifficulty)
  const hotbar = useAppStore(selectHotbar)
  const offhand = useAppStore(selectOffhand)
  const actions = useAppStore(selectActions)

  const matchConfig = useMemo(
    () => ({
      difficulty,
      hotbar,
      offhand,
      settings,
    }),
    [difficulty, hotbar, offhand, settings],
  )

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <GameView
        config={matchConfig}
        onExit={(outcome) => {
          if (outcome === "win") actions.recordWin()
          if (outcome === "loss") actions.recordLoss()
          navigate("/")
        }}
      />
    </div>
  )
}
