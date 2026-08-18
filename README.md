# LC105 Revival — assemble the Land Cruiser by hand

An interactive 3D tribute to the **Toyota Land Cruiser 100 series (LC105)**. Toyota stopped building it around 2007, but for millions of fans it remains the perfect truck: **solid front and rear axles**, a **3‑lock** drivetrain (front / centre / rear differential locks) and the 1UZ‑FE V8. This project reborns it in the browser — an exploded 3D assembly you can scrub through, take apart, and put back together piece by piece.

Built with **Next.js 16 · React 19 · three.js (raw WebGL, no R3F) · gsap · Tailwind 4**, with an optional **Qwen 3.8** assembly guide. Inspired by [thebuggeddev/anatomy](https://github.com/thebuggeddev/anatomy) and [img2threejs](https://github.com/img2threejs/img2threejs).

## What it does

- **Explode / assemble** — a build timeline scrubs every system between its exploded position and its real place on the truck. *Assemble* builds it in order: ladder frame first, wheels last.
- **Assemble by hand** — click any part to focus it (x‑ray highlight), double‑click or hit *Fit it by hand* to snap a single system on or off.
- **The 3‑lock, first‑class** — the front axle (lock 1), transfer case (lock 2) and rear axle (lock 3) are badged red everywhere: in the 3D model, the parts panel and the guide.
- **The 3‑Lock Lab** — a console to test the one thing the 3‑lock exists for: *what happens when the ground lets go.* Put the key on, pick a surface (front on ice, both left in the mud, front off the ground, all on ice) and lock or unlock each of the three diffs. The truck either moves or it doesn't — and the scene shows exactly where the torque goes: free wheels spin in place, locked axles are welded together, the red actuator glows on whichever lock you engaged. The verdict (MOVING / STUCK + which lock fixes it) comes from one pure simulation (`app/lib/drive.ts`) that both the 3D engine and the console read, so the picture and the words can never disagree.
- **Ask Qwen** — an AI assembly guide + a catalog quiz. Works with **no API key** (answers from the parts catalog in offline mode); with a key it calls Qwen 3.8 — cloud or local.
- **Code‑built 3D** — every part is procedural three.js primitives (`app/lib/parts/*.ts`). No GLB files, no Toyota assets, nothing to license.

Keyboard: `Space` build/explode · `Esc` clear selection · `?` open the guide · `L` open the 3‑Lock Lab.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

That's it — the 3D assembly needs zero configuration.

### Optional: turn on the Qwen guide

Copy `.env.example` → `.env.local` and pick one:

**Cloud (Alibaba DashScope / Model Studio)**
```
DASHSCOPE_API_KEY=sk-...
QWEN_MODEL=qwen3.8-max
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

**Local on Apple Silicon (oMLX)** — fully offline, no cloud
```
DASHSCOPE_API_KEY=<your omlx api key>
QWEN_MODEL=mlx-community--Qwen3.8-27B-4bit
QWEN_BASE_URL=http://127.0.0.1:8000/v1
```
(`hf download mlx-community/Qwen3.8-27B-4bit && omlx start` — any OpenAI‑compatible server works, e.g. Ollama at `http://127.0.0.1:11434/v1`.)

Restart `npm run dev` after editing `.env.local`. The header of the guide shows **live** or **offline** so you always know which mode you're in.

### Optional: hack on this repo with Claude Code running on local Qwen

`scripts/qclaude` launches Claude Code against the same local oMLX Qwen 3.8 — fully offline, your Anthropic login untouched (it's env‑var only, no `~/.claude/settings.json` edits).

```bash
cp scripts/qclaude ~/.local/bin/qclaude && chmod +x ~/.local/bin/qclaude   # once
cd LC105-revival-threejs-next
qclaude                       # 8-bit  (default — near-lossless, the daily driver)
qclaude --fast                # 4-bit  (~2× faster, a touch less sharp)
qclaude --max                 # bf16   (full precision, ~2× slower than 8-bit)
qclaude -p "explain app/lib/three/viewer.ts"
QCLAUDE_MODEL=<other-omlx-model-id> qclaude
```

Tiers map to `mlx-community/Qwen3.8-27B-{4bit,8bit,bf16}` (16 / 30 / 55 GB — grab them with `hf download …`). If a tier isn't downloaded yet it falls back 16 → 8 → 4 and says so. It auto‑starts oMLX if it's down, checks the model is served, and reads the API key from `~/.omlx/settings.json`.

Rough M‑series numbers with nothing else on the GPU: ~1,500 tok/s prefill, first Claude Code turn ~80 s at 8‑bit / ~2 min at bf16 (cold model load + the ~20k‑token system prompt), then much faster. **Don't run two local models at once** — an Ollama runner and oMLX sharing the GPU cut prefill to ~90 tok/s and a single turn takes half an hour.

**Prefer GGUF / Ollama?** `ollama pull hf.co/AtomicChat/Qwen3.8-27B-GGUF:Q8_0` (28.9 GB) then point the app at it: `QWEN_BASE_URL=http://127.0.0.1:11434/v1`, `QWEN_MODEL=hf.co/AtomicChat/Qwen3.8-27B-GGUF:Q8_0`, any non‑empty `DASHSCOPE_API_KEY`. GGUF doesn't load in oMLX, so `qclaude` sticks to the MLX builds.

## Project layout

```
app/
  lib/lc105-data.ts        the parts catalog — single source of truth (14 systems)
  lib/drive.ts             the 3-lock lab's pure drivetrain sim (wheels, props, locks, fix)
  lib/parts/*.ts           procedural builders, one file per system → THREE.Group
  lib/parts/index.ts       SystemId → builder map
  lib/three/viewer.ts      AssemblyViewer engine (renderer, orbit, tween, pick, highlight, lab drive rig)
  lib/three/materials.ts   shared material factory (paint / metal / rubber / glass / lock red)
  lib/quiz.ts              client-side quiz generated from the catalog
  components/              AssemblyApp · AssemblyViewer · PartsPanel · BuildTimeline · PartInfo · AiGuide · LockLab
  api/ask/route.ts         Qwen proxy with graceful offline fallback
public/lc105/              optional fan/CC reference images (drop in, then set `reference` on a part)
```

### Coordinate system
`X` = fore‑aft (front is +X), `Y` = up, `Z` = left‑right (+Z is driver‑left). Metres, tyres on `y = 0`. A part's live position is always `assembled + explode · (1 − buildFraction)`.

## Add a part

1. Write a builder in `app/lib/parts/<name>.ts` that returns a `THREE.Group` modelled around its own origin (use the helpers in `helpers.ts`, materials from `materials.ts` — every builder gets **fresh** materials so highlight never leaks between parts).
2. Register it in `app/lib/parts/index.ts`.
3. Add a `SystemSpec` to `app/lib/lc105-data.ts` (`assembled`, `explode`, `order`, blurb, spec, optional `lock`).

It then appears in the 3D view, the parts panel, the timeline, the quiz and the guide automatically.

## Where this is going

The **experience** — the workshop, the exploded build, the 3‑Lock Lab, the guide — is the product. It's code: written once, it scales to every car. The **car itself is content** (a per‑model parts catalog), which is the commodity that repeats. The business model follows from that split:

- **Free** — a pre‑built icon you can play with, fully. This repo *is* the free tier: the LC105 is the beachhead.
- **Paid — icon packs** — other rare models (LC80, Evo, WRX STI, …) as finished packs: made once, sold many.
- **Paid — "your car" service** — the customer supplies the **name** of their model and a **2D photo** of their own car; we return a pack with their livery/trim matched and their **accessories** (grille, wheels, bumpers, intakes) rendered from the photo, so they can assemble *their* truck in the visual world.

Two honest notes on the "name + photo" promise:

- **The name supplies the geometry; the photo supplies *their* car.** An Evo is a *known* model — that geometry is a one‑time problem per model. Free‑form "photo → 14‑part exploded truck" is not a promise worth making (image‑to‑3D gives hero meshes, not mated part sets); "known model + your paint, your mods" is one we can keep.
- **Accessories are the safe target** for pure photo input — a single part from a photo is a bounded mesh problem, and it slots straight into the assembly.

The architecture prerequisite for all of it: the engine must become **pack‑driven** — a car = `manifest.json` (systems, anchors, accents, which lab modules it carries) + asset files, so adding a model is a data drop instead of a scene rewrite. (Not built yet; the LC105 is still hardcoded builders today.)

## Honest scope

- This is a **stylized tribute**, not a CAD model — ~14 iconic systems, not 10,000 bolts.
- We don't scrape Toyota's parts catalog (not open / not licensable). Reference imagery, if any, is fan/CC drop‑ins in `public/lc105/`.
- It's a **fan project** to start with. The moment any of it is sold, naming around the brands (Toyota, Subaru) needs a defensible line.

## Scripts

```
npm run dev · npm run build · npm run start · npm run typecheck · npm run lint
```

MIT — go build your Cruiser.
