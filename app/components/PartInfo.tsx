"use client";

import { Lock, X, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Image from "next/image";
import { byId, LOCK_SYSTEMS, type SystemId } from "../lib/lc105-data";

type Props = {
  id: SystemId | null;
  fraction: number;
  onClose: () => void;
  onToggle: (id: SystemId) => void;
};

/** Detail card for the selected system: blurb, spec, lock role, reference image. */
export default function PartInfo({ id, fraction, onClose, onToggle }: Props) {
  if (!id) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-[12px] leading-relaxed text-[var(--fg-3)]">
        <p className="mb-2 font-medium text-[var(--fg-2)]">Pick a system</p>
        Click any part in the 3D view or the list to read what it is and why it matters. Double-click a
        part (or use the button here) to snap it on or off the truck by hand.
        <p className="mt-3 flex items-center gap-1.5 text-[11px]">
          <Lock size={11} className="text-[var(--lock)]" />
          The three red-badged systems are the famous <b className="text-[var(--fg-2)]">3-lock</b>.
        </p>
      </div>
    );
  }
  const s = byId[id];
  const fitted = fraction > 0.5;
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--fg-3)]">
            Step {s.order} · {s.category}
          </div>
          <h2 className="mt-0.5 text-[17px] font-semibold leading-tight text-[var(--fg)]">{s.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-[var(--fg-3)] hover:bg-[var(--panel-2)] hover:text-[var(--fg)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {s.lock && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--lock)]/40 bg-[var(--lock)]/10 px-2.5 py-2 text-[12px]">
          <Lock size={14} className="shrink-0 text-[var(--lock)]" />
          <span>
            <b>Lock {s.lock} of 3</b> —{" "}
            {s.lock === 1 ? "front differential lock" : s.lock === 2 ? "centre / transfer lock" : "rear differential lock"}.
          </span>
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-[var(--fg-2)]">{s.blurb}</p>
      <p className="mono mt-2 rounded-md bg-[var(--bg-2)] px-2 py-1.5 text-[11px] text-[var(--fg-2)]">{s.spec}</p>

      {s.reference && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[var(--line)]">
          <Image src={s.reference} alt={`${s.name} reference`} width={640} height={400} className="h-auto w-full" />
        </div>
      )}

      <button
        type="button"
        onClick={() => onToggle(s.id)}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[12px] font-medium text-[var(--fg)] hover:border-[var(--sand)]"
      >
        {fitted ? <ArrowUpFromLine size={14} /> : <ArrowDownToLine size={14} />}
        {fitted ? "Take it off" : "Fit it by hand"}
      </button>

      {s.lock && (
        <div className="mt-3 border-t border-[var(--line)] pt-3">
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--fg-3)]">The 3-lock, in order</div>
          <ol className="flex flex-col gap-1 text-[12px]">
            {LOCK_SYSTEMS.map((l) => (
              <li key={l.id} className={["flex items-center gap-2", l.id === s.id ? "text-[var(--fg)]" : "text-[var(--fg-3)]"].join(" ")}>
                <span className="mono grid h-4 w-4 place-items-center rounded-sm bg-[var(--lock)] text-[9px] font-bold text-white">{l.lock}</span>
                {l.name}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
