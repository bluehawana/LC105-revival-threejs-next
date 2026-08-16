"use client";

import { Lock } from "lucide-react";
import { CATEGORY_LABEL, CATEGORY_ORDER, SYSTEMS, type SystemId } from "../lib/lc105-data";

type Props = {
  selected: SystemId | null;
  hovered: SystemId | null;
  fractions: Record<SystemId, number>;
  onSelect: (id: SystemId | null) => void;
  onHover: (id: SystemId | null) => void;
  onToggle: (id: SystemId) => void;
};

/** Systems grouped by category; click to focus, double-click / button to snap in/out. */
export default function PartsPanel({ selected, hovered, fractions, onSelect, onHover, onToggle }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {CATEGORY_ORDER.map((cat) => {
        const items = SYSTEMS.filter((s) => s.category === cat).sort((a, b) => a.order - b.order);
        return (
          <section key={cat}>
            <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-3)]">
              {CATEGORY_LABEL[cat]}
            </h3>
            <ul className="flex flex-col gap-1">
              {items.map((s) => {
                const isSel = selected === s.id;
                const isHov = hovered === s.id;
                const f = fractions[s.id] ?? 0;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(isSel ? null : s.id)}
                      onDoubleClick={() => onToggle(s.id)}
                      onMouseEnter={() => onHover(s.id)}
                      onMouseLeave={() => onHover(null)}
                      className={[
                        "group flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors",
                        isSel
                          ? "border-[var(--sand)]/60 bg-[var(--panel-2)]"
                          : isHov
                            ? "border-[var(--line)] bg-[var(--panel-2)]/60"
                            : "border-transparent hover:border-[var(--line)] hover:bg-[var(--panel-2)]/40",
                      ].join(" ")}
                      aria-pressed={isSel}
                    >
                      <span
                        className="mono grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] font-bold text-black/80"
                        style={{ background: s.accent }}
                        title={`Build step ${s.order}`}
                      >
                        {s.order}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--fg)]">
                          <span className="truncate">{s.name}</span>
                          {s.lock && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[9px] font-bold uppercase tracking-wide text-white"
                              style={{ background: "var(--lock)" }}
                              title={`Differential lock ${s.lock} of 3`}
                            >
                              <Lock size={9} strokeWidth={3} /> {s.lock}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-[var(--fg-3)]">{s.spec}</span>
                      </span>
                      {/* Per-part build state dot. */}
                      <span
                        className="h-2 w-2 shrink-0 rounded-full transition-colors"
                        style={{ background: f > 0.5 ? "var(--sand)" : "var(--line)", boxShadow: f > 0.5 ? "0 0 6px var(--sand)" : "none" }}
                        title={f > 0.5 ? "Fitted" : "Off the truck"}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
