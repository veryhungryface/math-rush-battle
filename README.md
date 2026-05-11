# Math Rush Battle

전자칠판에서 플레이하는 초등 수학 러너 슈터 게임 프로토타입입니다.

- Production: `https://math-rush-battle.vercel.app/math-rush-battle`
- Local: `http://127.0.0.1:3014/math-rush-battle`
- App route: `apps/web/app/math-rush-battle`
- Game assets: `apps/web/public/math-rush-battle-v2`

## Run

```bash
npm install
npm run build -w web
npm run start -w web -- -p 3014
```

## Structure

```text
apps/web/app/math-rush-battle/       # Game route, UI, Phaser bridge, problem bank
apps/web/public/math-rush-battle-v2/ # Runtime game assets
tools/                               # Math Rush asset/export helpers
```

The game uses a perspective road background, sprite-based heroes and enemies,
straight projectile fire, selectable elementary math units, and a Phaser canvas
with DOM HUD/menu overlays.
