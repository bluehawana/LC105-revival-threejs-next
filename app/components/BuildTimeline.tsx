"use client";

import { Play, RotateCcw, Boxes, Wrench, ChevronRight } from "lucide-react";
import { SYSTEMS } from "../lib/lc105-data";

type Props = {
  progress: number; // 0..1
  onScrub: (a: number) => void;
  onAssemble: () => void;
  onExplode: () => void;
  onStep: () => void;
  onResetView: () => void;
};

/** Scrub slider 0→100% + Assemble / Explode / Step / Reset view. */
export default function BuildTimeline({ progress, onScrub, onAssemble, onExplode, onStep, onResetView }: Props) {
  const pct = Math.round(progress * 100);
  const fitted = SYSTEMS.filter((s) => s.order / SYSTEMS.length <= progress + 1e-6).length;
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel)]/85 p-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] text-[var(--fg-2)]">
          <Wrench size={14} className="text-[var(--sand)]" />
          <span className="font-medium text-[var(--fg)]">Build</span>
          <span className="mono">{pct}%</span>
          <span className="hidden text-[var(--fg-3)] sm:inline">
            · ~{fitted}/{SYSTEMS.length} systems fitted
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Btn onClick={onExplode} title="Take it all apart">
            <Boxes size={14} /> <span className="hidden sm:inline">Explode</span>
          </Btn>
          <Btn onClick={onStep} title="Fit the next system in build order">
            <ChevronRight size={14} /> <span className="hidden sm:inline">Step</span>
          </Btn>
          <Btn onClick={onAssemble} primary title="Assemble in build order">
            <Play size={14} /> Assemble
          </Btn>
          <Btn onClick={onResetView} title="Reset camera">
            <RotateCcw size={14} />
          </Btn>
        </div>
      </div>
      <input
        type="range"
        className="scrub"
        min={0}
        max={1000}
        value={Math.round(progress * 1000)}
        onChange={(e) => onScrub(Number(e.target.value) / 1000)}
        style={{ ["--pct" as string]: `${pct}%` }}
        aria-label="Build progress"
      />
      <div className="mono flex justify-between text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
        <span>Exploded</span>
        <span>Chassis → drivetrain → V8 → body → wheels</span>
        <span>Assembled</span>
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  primary,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
        primary
          ? "border-[var(--sand)] bg-[var(--sand)] text-black hover:brightness-110"
          : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--fg)] hover:border-[var(--fg-3)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
