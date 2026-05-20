# Tripo GLB models

Put Tripo Studio GLB exports in this folder with these filenames:

- `liver.glb`
- `plant-cell.glb`
- `animal-cell.glb`
- `neuron.glb`
- `white-blood-cell.glb`
- `mitochondria.glb`
- `nucleus.glb`
- `iphone-pro-test.glb` (technical test asset, not classroom content)

The viewer first tries these GLB files through `modelPath` in `cell-data.ts`.
If a file is missing or cannot load, the app falls back to the procedural Three.js preview model.
