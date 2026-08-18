"use client";

import { useEffect, useMemo, useState } from "react";
import { Gauge, Power, Snowflake, X } from "lucide-react";
import {
  FREE,
  LOCK_FIX_TEXT,
  SURFACE_PRESETS,
  WHEEL_LABELS,
  simulate,
  type Grip,
  type LockId,
  type Locks,
} from "../lib/drive";
import type { AssemblyViewer as Engine } from "../lib/three/viewer";

const LOCK_META: { id: LockId; label: string }[] = [
  { id: 1, label: "Front diff" },
  { id: 2, label: "Centre" },
  { id: 3, label: "Rear diff" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  engine: Engine | null;
};

/**
 * The 3-Lock Lab console: a key, three lock switches and the ground, with a
 * live verdict. The scene and this panel both read `simulate`, so the picture
 * and the words always agree.
 */
export default function LockLab({ open, onClose, engine }: Props) {
  const [running, setRunning] = useState(false);
  const [locks, setLocks] = useState<Locks>({ 1: false, 2: false, 3: false });
  const [grip, setGrip] = useState<Grip>(SURFACE_PRESETS[0].grip);
  const presetIdx = SURFACE_PRESETS.findIndex((p) => p.grip.every((g, i) => g === grip[i]));

  const state = useMemo(() => simulate(locks, grip, running), [locks, grip, running]);

  // Feed the scene: closed lab = engine off = everything coasts to a stop.
  useEffect(() => {
    engine?.setDrive(open ? state : null, locks);
  }, [engine, open, state, locks]);

  const toggleGrip = (i: number) =>
    setGrip((g) => g.map((v, j) => (j === i ? !v : v)) as Grip);

  return (
    <aside
      className={[
        "fixed inset-y-0 right-0 z-30 flex w-full max-w-[420px] flex-col border-l border-[var(--line)] bg-[var(--panel)] shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      aria-hidden={!open}
    >
      <header className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
        <Gauge size={18} className="text-[var(--sand)]" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold">3-Lock Lab</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--fg-3)]">what happens when the ground lets go</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[var(--fg-3)] hover:bg-[var(--panel-2)] hover:text-[var(--fg)]"
          aria-label="Close lab"
        >
          <X size={16} />
        </button>
      </header>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Ignition */}
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-3 text-[13px] font-semibold tracking-wide transition-colors",
            running
              ? "border-[var(--green)] bg-[var(--green)]/20 text-[var(--green)]"
              : "border-[var(--line)] bg-[var(--bg-2)] text-[var(--fg-2)] hover:border-[var(--sand)] hover:text-[var(--fg)]",
          ].join(" ")}
        >
          <Power size={16} className={running ? "animate-pulse" : ""} />
          {running ? "ENGINE RUNNING — turn key off" : "TURN THE KEY"}
        </button>

        {/* The three locks */}
        <section>
          <SectionLabel>Locks</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {LOCK_META.map(({ id, label }) => {
              const on = locks[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLocks((l) => ({ ...l, [id]: !l[id] }))}
                  className={[
                    "flex items-center justify-between rounded-md border px-3 py-2 text-[13px] transition-colors",
                    on ? "border-[var(--lock)] bg-[var(--lock)]/15" : "border-[var(--line)] hover:border-[var(--fg-3)]",
                  ].join(" ")}
                >
                  <span className="flex items-baseline gap-2">
                    <b className={["mono text-[11px]", on ? "text-[var(--lock)]" : "text-[var(--fg-3)]"].join(" ")}>L{id}</b>
                    {label}
                  </span>
                  <span
                    className={[
                      "relative h-4 w-8 rounded-full transition-colors",
                      on ? "bg-[var(--lock)]" : "bg-[var(--line)]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 h-3 w-3 rounded-full bg-[var(--fg)] transition-all",
                        on ? "left-[18px]" : "left-0.5",
                      ].join(" ")}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* The ground */}
        <section>
          <SectionLabel>Ground</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {SURFACE_PRESETS.map((p, i) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setGrip(p.grip)}
                className={[
                  "rounded-full border px-2.5 py-1 text-[11px]",
                  presetIdx === i
                    ? "border-[var(--sand)] text-[var(--sand)]"
                    : "border-[var(--line)] text-[var(--fg-2)] hover:border-[var(--fg-3)]",
                ].join(" ")}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {grip.map((g, i) => (
              <button
                key={WHEEL_LABELS[i]}
                type="button"
                onClick={() => toggleGrip(i)}
                className={[
                  "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[11px]",
                  g ? "border-[var(--line)] text-[var(--fg-2)]" : "border-[var(--line)] bg-[var(--line)]/30 text-[var(--fg-2)]",
                ].join(" ")}
                title={`${WHEEL_LABELS[i]} — ${g ? "on firm ground" : "no grip"}`}
              >
                <span className="mono">{WHEEL_LABELS[i]}</span>
                {g ? (
                  <span className="text-[var(--green)]">grip</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#7fb3d9]">
                    <Snowflake size={10} /> free
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Verdict */}
        <section
          className={[
            "rounded-lg border p-3",
            !running
              ? "border-[var(--line)] bg-[var(--bg-2)]"
              : state.stuck
                ? "border-[var(--lock)] bg-[var(--lock)]/10"
                : "border-[var(--green)] bg-[var(--green)]/10",
          ].join(" ")}
        >
          <div
            className={[
              "text-[20px] font-bold tracking-[0.14em]",
              !running ? "text-[var(--fg-3)]" : state.stuck ? "text-[var(--lock)]" : "text-[var(--green)]",
            ].join(" ")}
          >
            {running ? (state.stuck ? "STUCK" : "MOVING") : "ENGINE OFF"}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--fg-2)]">
            {!running && "Turn the key to put the drivetrain to work."}
            {running && !state.stuck &&
              "Every bit of torque finds the ground — the truck moves, however slowly."}
            {running && state.stuck && state.fix && (
              <>
                Torque is escaping through the open differential
                {state.fix.length > 1 ? "s" : ""}. Engage L{state.fix.join(" + L")} — {state.fix
                  .map((l) => LOCK_FIX_TEXT[l])
                  .join("; ")}.
              </>
            )}
            {running && state.stuck && !state.fix &&
              "No tyre is touching the ground — no combination of locks will pull you out. Get a wheel back on the ground."}
          </p>
        </section>

        {/* Wheel telemetry */}
        <section>
          <SectionLabel>Wheels</SectionLabel>
          <div className="flex flex-col gap-1">
            {state.wheels.map((s, i) => {
              const free = s === FREE;
              return (
                <div
                  key={WHEEL_LABELS[i]}
                  className="flex items-center justify-between rounded-md bg-[var(--bg-2)] px-2.5 py-1.5 text-[12px]"
                >
                  <span className="text-[var(--fg-2)]">{WHEEL_LABELS[i]}</span>
                  <span
                    className={[
                      "mono text-[11px]",
                      !running ? "text-[var(--fg-3)]" : free ? "text-[var(--lock)]" : s > 0 ? "text-[var(--green)]" : "text-[var(--fg-3)]",
                    ].join(" ")}
                  >
                    {!running ? "off" : free ? "spinning in place" : s > 0 ? "rolling" : "stopped"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-[var(--fg-3)]">
            The lab models only the locks and the ground — no gear ratios, no weight transfer. But the one thing it
            models is the thing every Cruiser owner learns: torque takes the path of least resistance, and the 3-lock
            is how you argue with it.
          </p>
        </section>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mono mb-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--fg-3)]">{children}</div>;
}
