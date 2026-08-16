# LC105 Revival — assemble the Land Cruiser by hand

An interactive 3D tribute to the **Toyota Land Cruiser 100 series (LC105)**. Toyota stopped building it around 2007, but for millions of fans it remains the perfect truck: **solid front and rear axles**, a **3‑lock** drivetrain (front / centre / rear differential locks) and the 1UZ‑FE V8. This project reborns it in the browser — an exploded 3D assembly you can scrub through, take apart, and put back together piece by piece.

Built with **Next.js 16 · React 19 · three.js (raw WebGL, no R3F) · gsap · Tailwind 4**, with an optional **Qwen 3.8** assembly guide. Inspired by [thebuggeddev/anatomy](https://github.com/thebuggeddev/anatomy) and [img2threejs](https://github.com/img2threejs/img2threejs).

## What it does

- **Explode / assemble** — a build timeline scrubs every system between its exploded position and its real place on the truck. *Assemble* builds it in order: ladder frame first, wheels last.
- **Assemble by hand** — click any part to focus it (x‑ray highlight), double‑click or hit *Fit it by hand* to snap a single system on or off.
- **The 3‑lock, first‑class** — the front axle (lock 1), transfer case (lock 2) and rear axle (lock 3) are badged red everywhere: in the 3D model, the parts panel and the guide.
- **Ask Qwen** — an AI assembly guide + a catalog quiz. Works with **no API key** (answers from the parts catalog in offline mode); with a key it calls Qwen 3.8 — cloud or local.
- **Code‑built 3D** — every part is procedural three.js primitives (`app/lib/parts/*.ts`). No GLB files, no Toyota assets, nothing to license.

Keyboard: `Space` build/explode · `Esc` clear selection · `?` open the guide.

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
qclaude                       # interactive session on this folder
qclaude -p "explain app/lib/three/viewer.ts"
QCLAUDE_MODEL=<other-omlx-model-id> qclaude
```

It auto‑starts oMLX if it's down, checks the model is served, and reads the API key from `~/.omlx/settings.json`.

## Project layout

```
app/
  lib/lc105-data.ts        the parts catalog — single source of truth (14 systems)
  lib/parts/*.ts           procedural builders, one file per system → THREE.Group
  lib/parts/index.ts       SystemId → builder map
  lib/three/viewer.ts      AssemblyViewer engine (renderer, orbit, tween, pick, highlight)
  lib/three/materials.ts   shared material factory (paint / metal / rubber / glass / lock red)
  lib/quiz.ts              client-side quiz generated from the catalog
  components/              AssemblyApp · AssemblyViewer · PartsPanel · BuildTimeline · PartInfo · AiGuide
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

## Honest scope

- This is a **stylized tribute**, not a CAD model — ~14 iconic systems, not 10,000 bolts.
- We don't scrape Toyota's parts catalog (not open / not licensable). Reference imagery, if any, is fan/CC drop‑ins in `public/lc105/`.

## Scripts

```
npm run dev · npm run build · npm run start · npm run typecheck · npm run lint
```

MIT — go build your Cruiser.
