# Working diary

Session log for the LC105 Revival — what got built, why, and where the next session picks up. Newest first.

## 2026‑08‑18 — The 3‑Lock Lab ships

The lab's physics (`app/lib/drive.ts`) and the named wheel corners existed from the previous session, but nothing consumed them — no engine support, no UI. This session built the rest and verified it end to end.

**What got built**

- `drive.ts` gained a `running` field on `DriveState` (the sim wraps it in; the engine needs it to idle the fan while the truck is stuck).
- The scene learned its rotors and call‑outs: `shaft-front` / `shaft-rear` yokes (`transfer.ts`), `lock-1` / `lock-3` actuators (`axles.ts`), `lock-2` on the transfer case, `engine-fan` (`engine.ts`).
- `viewer.ts` grew a drive rig: `setDrive(state, locks)` feeds the lab's verdict into the scene — wheels spin about their own axles (left pair +z, right pair −z so the truck visibly rolls *forward*), prop yokes and the fan turn about x, all with a smooth exponential coast instead of snapping. The red lock actuators glow (emissive 1.1) as their lock engages; the glow is a separate channel re‑applied inside `refreshHighlights` so part selection/hover can never eat it. The lazy turntable pauses while the engine is running.
- New `LockLab` drawer: ignition, L1/L2/L3 switches, five surface presets + a per‑wheel grip grid, a live STUCK / MOVING / ENGINE OFF verdict with the "engage L…" advice from the sim's `fix`, and per‑wheel telemetry (rolling / spinning in place / stopped). Wired into the header with a button and the `L` hotkey.
- README: the lab documented in *What it does*, plus a *Where this is going* section laying out the product direction (free icon → paid icon packs → "your car" name + photo service) and the pack‑manifest prerequisite.

**Design notes**

- The sim stays pure and is the single source of truth: the 3D engine and the React console both call `simulate`, so the picture and the words cannot disagree. Display spin is `0` / `1` / `FREE`; the scene maps that to rad/s (2.4 / 7.5) at render time — the sim never knows about time.
- Wheel direction is easy to get wrong: the right‑hand wheels are `y = π`‑flipped (dish out), so the same local +z spin reads as backward. The sign lives in the corner table in `findDriveRig`, next to the names.

**Verified**

- Pure‑sim table: FL‑on‑ice → fix `[1]`; both‑left‑in‑mud → fix `[1,2]`; front off the ground → fix `[2]`; all on ice + all locked → stuck, no fix exists. All physically correct.
- `tsc`, `build`, `lint` all green.
- Driven in headless Chrome (Playwright + system Chrome, SwiftShader WebGL) against the dev server: front off ground → **STUCK** → engage L2 → **MOVING**, with wheel Δz of ±2.44 rad over 1 s sampled from the live scene, lock‑2 glow at 1.10, fan advancing; mud + L2 → STUCK with "Engage L1" → L1 → MOVING; all ice → STUCK "No tyre is touching the ground". Zero console errors.

**Next step**

The pack seam: `packs/<id>/manifest.json` + GLB assets so a *car* becomes a data drop and the viewer stops being LC105‑shaped. That's the first real step toward the paid pipeline — proven by porting one or two LC105 parts to GLB through it.
