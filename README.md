# ⚔️ WindStrike Arena (2D Minecraft Mace PVP)

WindStrike Arena is a high-octane, browser-based 2D PvP duel game inspired by the unique mace combat mechanics of Minecraft. Battle against a reactive AI in a flat arena where movement, timing, and strategic item usage are the keys to victory.

**Play the game here:** [https://twod-minecraft-mace-pvp-v2.onrender.com/]
---

## 🚀 Features

### 🎮 Gameplay Mechanics
- **Mace Combat:** Damage and knockback scale with your fall height. Launch yourself into the air and land devastating blows.
- **Axe & Shield Mind-Games:** Use the Shield to block frontal attacks, but beware of the Axe, which can disable your shield briefly.
- **Dynamic Items:**
  - **Wind Charges:** Launch yourself upward to set up aerial attacks.
  - **Ender Pearls:** Teleport across the arena to escape combos or surprise your opponent.
  - **Golden Apples:** Heal and gain absorption hearts to swing the momentum.
- **Reactive Bot AI:** Choose from three difficulty levels (Easy, Normal, Hard) with distinct reaction speeds and combat strategies.

### 🛠️ Customization & Polish
- **Loadout Editor:** Drag and drop to customize your 1–9 hotbar slots.
- **Settings:** Full control over SFX/Music volume, screen shake, damage numbers, and particles.
- **Local Persistence:** Your stats (wins, losses, streaks), settings, and loadouts are saved locally to your browser.
- **Responsive Design:** Optimized for desktop play with a clean "Obsidian Arena Console" aesthetic.

---

## ⌨️ Controls

| Key | Action |
|-----|--------|
| **WASD** | Move & Jump |
| **Space** | Jump / Double Jump |
| **Shift** | Sprint |
| **1–9** | Select Hotbar Slot |
| **Double-tap A/D** | Dash |
| **LMB (Left Click)** | Attack (Mace/Axe) / Punch |
| **RMB (Right Click)** | Use Item / Block with Shield |

---

## 🛠️ Tech Stack

- **Framework:** [React 18](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Rendering:** HTML5 Canvas 2D
- **Audio:** WebAudio API

---

## 🏗️ Architecture

The game follows a **Research -> Strategy -> Execution** lifecycle with a robust game loop:
- **UI Layer (React):** Handles the dashboard, loadout editor, and HUD.
- **State Layer (Zustand):** Manages settings, stats, and local persistence.
- **Game Engine:** A custom HTML5 Canvas engine with fixed-timestep physics simulation for consistent combat feel.
- **Bot AI:** A two-layer system (Strategy & Controller) that synthesizes inputs based on the player's actions.

---

## 🛠️ Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/2d-minecraft-mace-pvp.git
   cd 2d-minecraft-mace-pvp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Scripts
- `npm run dev`: Start the development server.
- `npm run build`: Build the project for production.
- `npm run lint`: Run ESLint to check for code quality.
- `npm run check`: Run TypeScript type checking.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
