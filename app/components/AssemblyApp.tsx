"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Code2, PanelRightOpen, PanelRightClose } from "lucide-react";
import AssemblyViewer from "./AssemblyViewer";
import PartsPanel from "./PartsPanel";
import BuildTimeline from "./BuildTimeline";
import PartInfo from "./PartInfo";
import AiGuide from "./AiGuide";
import type { AssemblyViewer as Engine } from "../lib/three/viewer";
import { SYSTEMS, type SystemId } from "../lib/lc105-data";

const emptyFractions = () => Object.fromEntries(SYSTEMS.map((s) => [s.id, 0])) as Record<SystemId, number>;

/**
 * Page shell: 3D viewer (left, dominant) + side panel (right) + build
 * timeline (bottom, over the viewer) + the Ask-Qwen drawer.
 */
export default function AssemblyApp() {
  const engine = useRef<Engine | null>(null);
  const [selected, setSelected] = useState<SystemId | null>(null);
  const [hovered, setHovered] = useState<SystemId | null>(null);
  const [progress, setProgress] = useState(0);
  const [fractions, setFractions] = useState<Record<SystemId, number>>(emptyFractions);
  const [panelOpen, setPanelOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Sample per-part fractions from the engine whenever progress changes.
  const syncFractions = useCallback(() => {
    const v = engine.current;
    if (!v) return;
    const next = emptyFractions();
    for (const s of SYSTEMS) next[s.id] = v.partFraction(s.id);
    setFractions(next);
  }, []);

  useEffect(() => {
    syncFractions();
  }, [progress, syncFractions]);

  const select = useCallback((id: SystemId | null) => {
    setSelected(id);
    engine.current?.highlight(id);
  }, []);

  const toggle = useCallback((id: SystemId) => engine.current?.togglePart(id), []);

  // Keyboard: Esc clears selection, Space assembles/explodes, ? opens the guide.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") select(null);
      if (e.key === " ") {
        e.preventDefault();
        const v = engine.current;
        if (v) v.assembleTo(v.assemble > 0.5 ? 0 : 1);
      }
      if (e.key === "?") setGuideOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  // Cinematic intro: after mount, assemble once so first-time visitors see it build.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => engine.current?.assembleTo(1, { duration: 0.8, stagger: 0.18 }), 600);
    return () => clearTimeout(t);
  }, [ready]);

  const stepNext = () => {
    const v = engine.current;
    if (!v) return;
    const next = [...SYSTEMS].sort((a, b) => a.order - b.order).find((s) => v.partFraction(s.id) < 0.5);
    if (next) {
      v.togglePart(next.id, 1);
      select(next.id);
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[var(--bg)]">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--line)] px-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-tight">LC105 Revival</span>
          <span className="mono hidden text-[10px] uppercase tracking-[0.16em] text-[var(--fg-3)] sm:inline">
            Land Cruiser 100 · assemble by hand
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <a
            href="https://github.com/bluehawana/LC105-revival-threejs-next"
            target="_blank"
            rel="noreferrer"
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--fg-3)] hover:bg-[var(--panel-2)] hover:text-[var(--fg)]"
            aria-label="GitHub"
          >
            <Code2 size={16} />
          </a>
          <button
            type="button"
            onClick={() => setGuideOpen((o) => !o)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--line)] px-2.5 text-[12px] font-medium hover:border-[var(--sand)]"
          >
            <Bot size={14} className="text-[var(--sand)]" /> Ask Qwen
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--fg-3)] hover:bg-[var(--panel-2)] hover:text-[var(--fg)]"
            aria-label={panelOpen ? "Hide parts" : "Show parts"}
          >
            {panelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Viewer */}
        <main className="relative min-w-0 flex-1">
          <div className="absolute inset-0">
            <AssemblyViewer
              onReady={(v) => {
                engine.current = v;
                setReady(true);
              }}
              onSelect={select}
              onHover={setHovered}
              onProgress={setProgress}
            />
          </div>
          {!ready && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-[12px] text-[var(--fg-3)]">
              Loading the workshop…
            </div>
          )}
          {/* Hover label */}
          {hovered && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-[var(--line)] bg-[var(--panel)]/85 px-2.5 py-1.5 text-[12px] backdrop-blur">
              {SYSTEMS.find((s) => s.id === hovered)?.name}
            </div>
          )}
          {/* Timeline overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
            <div className="pointer-events-auto mx-auto max-w-3xl">
              <BuildTimeline
                progress={progress}
                onScrub={(a) => engine.current?.setAssemble(a)}
                onAssemble={() => engine.current?.assembleTo(1)}
                onExplode={() => engine.current?.assembleTo(0)}
                onStep={stepNext}
                onResetView={() => engine.current?.resetView()}
              />
            </div>
          </div>
        </main>

        {/* Side panel */}
        <aside
          className={[
            "scroll-thin flex w-[340px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[var(--line)] bg-[var(--bg-2)] p-3 transition-[margin] duration-300",
            panelOpen ? "mr-0" : "-mr-[340px]",
          ].join(" ")}
        >
          <PartInfo id={selected} fraction={selected ? fractions[selected] : 0} onClose={() => select(null)} onToggle={toggle} />
          <PartsPanel selected={selected} hovered={hovered} fractions={fractions} onSelect={select} onHover={setHovered} onToggle={toggle} />
          <p className="mono px-1 pb-2 text-[10px] leading-relaxed text-[var(--fg-3)]">
            Drag to orbit · scroll to zoom · click a part · double-click to fit / remove · Space = build/explode · Esc = clear · ? = guide
          </p>
        </aside>
      </div>

      <AiGuide open={guideOpen} onClose={() => setGuideOpen(false)} focus={selected} />
    </div>
  );
}
