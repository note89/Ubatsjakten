# Ubåtsjakten - TypeScript Port

Browser-based game ported from Unity to TypeScript + Canvas.

## Setup

```bash
bun install
bun run dev
```

Opens at `http://localhost:3000`

## Build

```bash
bun run build
```

Bundles TypeScript → `dist/index.js`

## Gameplay

- **↑/↓**: Move player (Kungen)
- **SPACE**: Shoot bullets at submarines
- **ESC**: Pause
- **SPACE** (game over): Restart

### Mechanics
- Destroy Russian submarines spawning from right
- Spawn rate increases over time
- Game ends when player hit by submarine
- Score: submarines destroyed

## Deploy to ubåt.borrowed.computer

1. Build: `bun run build`
2. Copy `index.html` + `dist/` to server
3. Serve as static site

## Project Structure

```
src/
  index.ts       - Entry point
  game.ts        - Game loop, state, spawning
  entities.ts    - Player, Enemy, Bullet classes
  audio.ts       - Web Audio API sound effects
  server.ts      - Dev server
```

## Original Unity Project

This was ported from `Assets/` (UnityScript/JavaScript game from ~2015).
Main logic preserved; graphics are simple Canvas shapes.
