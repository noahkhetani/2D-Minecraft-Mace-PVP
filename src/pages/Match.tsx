import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import GameView from "@/components/GameView"
import {
  selectActions,
  selectDifficulty,
  selectHotbar,
  selectSettings,
  useAppStore,
} from "@/store/useAppStore"

export default function Match() {
  const navigate = useNavigate()
  const settings = useAppStore(selectSettings)
  const difficulty = useAppStore(selectDifficulty)
  const hotbar = useAppStore(selectHotbar)
  const actions = useAppStore(selectActions)

  const matchConfig = useMemo(
    () => ({
      difficulty,
      hotbar,
      settings,
    }),
    [difficulty, hotbar, settings],
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
