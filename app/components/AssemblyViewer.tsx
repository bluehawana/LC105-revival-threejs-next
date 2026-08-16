"use client";

import { useEffect, useRef } from "react";
import { AssemblyViewer as Engine, type ViewerEvents } from "../lib/three/viewer";

type Props = ViewerEvents & {
  /** Receive the engine instance so the parent can drive it. */
  onReady?: (v: Engine) => void;
  className?: string;
};

/**
 * Thin client wrapper that mounts the raw-three AssemblyViewer into a canvas.
 * Mirrors anatomy's OrganViewer.tsx: the engine owns the canvas, React owns
 * the chrome around it.
 */
export default function AssemblyViewer({ onReady, onSelect, onHover, onProgress, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Keep the latest callbacks in a ref (updated in an effect, not during
  // render) so the engine is created exactly once.
  const cb = useRef({ onSelect, onHover, onProgress, onReady });
  useEffect(() => {
    cb.current = { onSelect, onHover, onProgress, onReady };
  }, [onSelect, onHover, onProgress, onReady]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const v = new Engine(canvas, {
      onSelect: (id) => cb.current.onSelect?.(id),
      onHover: (id) => cb.current.onHover?.(id),
      onProgress: (a) => cb.current.onProgress?.(a),
    });
    cb.current.onReady?.(v);
    return () => v.dispose();
  }, []);

  return <canvas ref={ref} className={className} style={{ display: "block", width: "100%", height: "100%", cursor: "grab" }} />;
}
