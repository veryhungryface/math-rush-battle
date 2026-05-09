from __future__ import annotations

import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps/web"
NEXT = WEB / ".next"
OUT = WEB / ".vercel/output"
STATIC = OUT / "static"


ROUTES = ["index", "math-rush-battle", "circle-battle", "fraction-target", "_not-found"]


def copytree(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def main() -> None:
    if not NEXT.exists():
        raise SystemExit("Run `npm run build -w web` before exporting Vercel static output.")

    if OUT.exists():
        shutil.rmtree(OUT)
    STATIC.mkdir(parents=True, exist_ok=True)

    copytree(WEB / "public", STATIC)
    copytree(NEXT / "static", STATIC / "_next/static")

    app_dir = NEXT / "server/app"
    for route in ROUTES:
        source = app_dir / f"{route}.html"
        if route == "_not-found":
            source = app_dir / "_not-found.html"
            dest = STATIC / "404.html"
        elif route == "index":
            dest = STATIC / "index.html"
        else:
            dest = STATIC / f"{route}.html"
        if source.exists():
            shutil.copy2(source, dest)

    config = {
        "version": 3,
        "routes": [
            {"src": "/math-rush-battle/?", "dest": "/math-rush-battle.html"},
            {"src": "/circle-battle/?", "dest": "/circle-battle.html"},
            {"src": "/fraction-target/?", "dest": "/fraction-target.html"},
            {"src": "/", "dest": "/index.html"},
            {"handle": "filesystem"},
            {"src": "/(.*)", "status": 404, "dest": "/404.html"},
        ],
    }
    (OUT / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
