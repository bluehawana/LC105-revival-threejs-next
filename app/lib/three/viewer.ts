import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { SYSTEMS, type SystemId, type SystemSpec } from "../lc105-data";
import { BUILDERS } from "../parts";
import { disposeObject } from "./dispose";

/**
 * AssemblyViewer — the raw three.js engine behind the LC105 build.
 *
 * Every system is a THREE.Group whose live position is
 *     assembled + explode * (1 - a)
 * where `a` is that part's own build fraction (0 = exploded, 1 = assembled).
 * A global scrub sets all parts at once; "assemble in order" staggers them by
 * `order` so the truck visibly builds chassis-first, wheels-last.
 *
 * Render-on-demand: we only draw when something changed (controls, tween,
 * hover) so an idle tab costs nothing. Mirrors the anatomy AnatomyViewer.
 */

export type ViewerEvents = {
  onSelect?: (id: SystemId | null) => void;
  onHover?: (id: SystemId | null) => void;
  onProgress?: (a: number) => void;
};

type MatBase = { emissive: THREE.Color; emissiveIntensity: number; opacity: number; transparent: boolean };

type PartEntry = {
  spec: SystemSpec;
  group: THREE.Group;
  a: number; // per-part build fraction
  mats: THREE.MeshStandardMaterial[];
  base: MatBase[];
};

export class AssemblyViewer {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private root = new THREE.Group();
  private parts = new Map<SystemId, PartEntry>();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private dirty = true;
  private raf = 0;
  private disposed = false;
  private hovered: SystemId | null = null;
  private selected: SystemId | null = null;
  private globalA = 0;
  private events: ViewerEvents;
  private ro?: ResizeObserver;
  private idleSpin = true;
  private lastT = 0;
  private tl: gsap.core.Timeline | null = null;

  constructor(canvas: HTMLCanvasElement, events: ViewerEvents = {}) {
    this.canvas = canvas;
    this.events = events;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(6.2, 3.2, 6.4);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0.9, 0);
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.addEventListener("change", () => (this.dirty = true));
    this.controls.addEventListener("start", () => (this.idleSpin = false));

    this.buildScene();
    this.buildParts();
    this.setAssemble(0);

    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("click", this.onClick);
    canvas.addEventListener("pointerleave", () => this.setHover(null));

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    document.addEventListener("visibilitychange", this.onVisibility);
    this.loop(0);
    // Dev handle for poking the engine from the console.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __lc105?: AssemblyViewer }).__lc105 = this;
  }

  // ---------------------------------------------------------------- scene --

  private buildScene() {
    this.scene.add(this.root);

    // Lighting: warm key, cool fill, soft sky.
    const hemi = new THREE.HemisphereLight("#f2e6d0", "#20242b", 0.9);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight("#fff1dc", 2.2);
    key.position.set(5, 8, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight("#9fb8d6", 0.7);
    fill.position.set(-6, 3, -4);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight("#ffffff", 0.6);
    rim.position.set(-2, 4, 7);
    this.scene.add(rim);

    // Ground plinth — a wide, low disc.
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.4, 0.08, 72),
      new THREE.MeshStandardMaterial({ color: "#1b1e23", roughness: 0.95, metalness: 0.05 }),
    );
    plinth.position.y = -0.04;
    this.scene.add(plinth);
    // A subtle rim ring on the plinth.
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.3, 0.012, 6, 96),
      new THREE.MeshBasicMaterial({ color: "#d9b77a", transparent: true, opacity: 0.35 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.005;
    this.scene.add(ring);

    // Baked radial contact shadow under the truck.
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.4), new THREE.MeshBasicMaterial({
      map: makeShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.006;
    this.scene.add(shadow);

    // Faint grid for scale.
    const grid = new THREE.GridHelper(8, 16, "#2b3038", "#22262c");
    grid.position.y = 0.002;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    this.scene.add(grid);
  }

  private buildParts() {
    for (const spec of SYSTEMS) {
      const group = BUILDERS[spec.id]();
      group.name = spec.id;
      group.userData.systemId = spec.id;
      const mats: THREE.MeshStandardMaterial[] = [];
      const base: MatBase[] = [];
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && (m.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const mat = m.material as THREE.MeshStandardMaterial;
          mats.push(mat);
          base.push({
            emissive: mat.emissive.clone(),
            emissiveIntensity: mat.emissiveIntensity,
            opacity: mat.opacity,
            transparent: mat.transparent,
          });
        }
        o.userData.systemId = spec.id;
      });
      this.root.add(group);
      this.parts.set(spec.id, { spec, group, a: 0, mats, base });
    }
  }

  // ------------------------------------------------------------- assembly --

  private applyPart(p: PartEntry) {
    const [ax, ay, az] = p.spec.assembled;
    const [ex, ey, ez] = p.spec.explode;
    const k = 1 - p.a;
    p.group.position.set(ax + ex * k, ay + ey * k, az + ez * k);
    // A tiny tilt while exploded reads as "floating parts on a bench".
    p.group.rotation.z = k * 0.06 * (p.spec.order % 2 === 0 ? 1 : -1);
    this.dirty = true;
  }

  /** Set every part's build fraction at once (used by the scrub slider). */
  setAssemble(a: number) {
    this.killTimeline();
    this.globalA = clamp01(a);
    for (const p of this.parts.values()) {
      p.a = this.globalA;
      this.applyPart(p);
    }
    this.events.onProgress?.(this.globalA);
  }

  /** Current global build fraction. */
  get assemble() {
    return this.globalA;
  }

  /**
   * Tween all parts to `target` in build order — chassis first, wheels last
   * when assembling; reversed when exploding. `duration` is per part.
   */
  assembleTo(target: number, opts: { duration?: number; stagger?: number } = {}) {
    this.killTimeline();
    this.idleSpin = false;
    const t = clamp01(target);
    const dur = opts.duration ?? 0.7;
    const stag = opts.stagger ?? 0.22;
    const ordered = [...this.parts.values()].sort((x, y) => x.spec.order - y.spec.order);
    if (t < this.globalA) ordered.reverse();
    const tl = gsap.timeline({
      onUpdate: () => {
        // Report the mean fraction as the global progress.
        let sum = 0;
        for (const p of this.parts.values()) sum += p.a;
        this.globalA = sum / this.parts.size;
        this.events.onProgress?.(this.globalA);
      },
      onComplete: () => {
        this.globalA = t;
        this.events.onProgress?.(t);
        this.tl = null;
        if (t === 1) this.idleSpin = true;
      },
    });
    ordered.forEach((p, i) => {
      tl.to(p, { a: t, duration: dur, ease: "power2.inOut", onUpdate: () => this.applyPart(p) }, i * stag);
    });
    this.tl = tl;
    return tl;
  }

  /** Snap one part in or out (click-to-assemble). */
  togglePart(id: SystemId, to?: number) {
    const p = this.parts.get(id);
    if (!p) return;
    const target = to ?? (p.a > 0.5 ? 0 : 1);
    gsap.to(p, {
      a: target,
      duration: 0.6,
      ease: "power3.inOut",
      onUpdate: () => {
        this.applyPart(p);
        let sum = 0;
        for (const q of this.parts.values()) sum += q.a;
        this.globalA = sum / this.parts.size;
        this.events.onProgress?.(this.globalA);
      },
    });
  }

  /** Per-part fraction (for the parts panel's progress dots). */
  partFraction(id: SystemId) {
    return this.parts.get(id)?.a ?? 0;
  }

  private killTimeline() {
    if (this.tl) {
      this.tl.kill();
      this.tl = null;
    }
  }

  // ------------------------------------------------------------ highlight --

  /**
   * Re-derive every material's look from its captured base state plus the
   * current hover/selection. Selected part glows in its accent; hovered part
   * gets a warm sand tint; everything else dims when something is selected.
   */
  private refreshHighlights() {
    for (const p of this.parts.values()) {
      const isSel = p.spec.id === this.selected;
      const isHov = p.spec.id === this.hovered && !isSel;
      const dim = !!this.selected && !isSel;
      p.mats.forEach((m, i) => {
        const b = p.base[i];
        const wasTransparent = m.transparent;
        m.emissive.copy(b.emissive);
        m.emissiveIntensity = b.emissiveIntensity;
        m.opacity = b.opacity;
        m.transparent = b.transparent;
        if (isSel) {
          m.emissive.set(p.spec.accent);
          m.emissiveIntensity = 0.45;
        } else if (isHov) {
          m.emissive.set("#d9b77a");
          m.emissiveIntensity = 0.18;
        } else if (dim) {
          m.transparent = true;
          m.opacity = Math.min(b.opacity, 0.28);
        }
        // three bakes an OPAQUE define into the shader when transparent=false,
        // so flipping `transparent` needs a recompile (programs are cached, so
        // this is a one-time cost per material variant).
        if (m.transparent !== wasTransparent) m.needsUpdate = true;
      });
    }
    this.dirty = true;
  }

  highlight(id: SystemId | null) {
    if (this.selected === id) return;
    this.selected = id;
    this.refreshHighlights();
    if (id) this.frame(id);
  }

  private setHover(id: SystemId | null) {
    if (this.hovered === id) return;
    this.hovered = id;
    this.canvas.style.cursor = id ? "pointer" : "grab";
    this.refreshHighlights();
    this.events.onHover?.(id);
  }

  /** Gently swing the camera to look at a part without yanking the user. */
  private frame(id: SystemId) {
    const p = this.parts.get(id);
    if (!p) return;
    const target = p.group.position.clone();
    gsap.to(this.controls.target, {
      x: target.x * 0.6,
      y: Math.max(0.6, target.y * 0.8),
      z: target.z * 0.6,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => (this.dirty = true),
    });
  }

  // ------------------------------------------------------------- pointer --

  private pick(ev: PointerEvent | MouseEvent): SystemId | null {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.root.children, true);
    for (const h of hits) {
      const id = h.object.userData.systemId as SystemId | undefined;
      if (id) return id;
    }
    return null;
  }

  private onPointerMove = (ev: PointerEvent) => {
    if (ev.buttons) return; // dragging the orbit
    this.setHover(this.pick(ev));
  };

  private onClick = (ev: MouseEvent) => {
    const id = this.pick(ev);
    this.events.onSelect?.(id);
  };

  // ---------------------------------------------------------------- loop --

  private onVisibility = () => {
    if (document.hidden) cancelAnimationFrame(this.raf);
    else this.loop(performance.now());
  };

  private loop = (t: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (t - this.lastT) / 1000);
    this.lastT = t;
    if (this.idleSpin && this.globalA > 0.999 && !this.selected) {
      this.root.rotation.y += dt * 0.12;
      this.dirty = true;
    }
    if (this.controls.update() || this.dirty) {
      this.dirty = false;
      this.renderer.render(this.scene, this.camera);
    }
  };

  resize() {
    const el = this.canvas.parentElement ?? this.canvas;
    const w = Math.max(1, el.clientWidth);
    const h = Math.max(1, el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  /** Reset the camera to the hero angle. */
  resetView() {
    this.idleSpin = false;
    gsap.to(this.camera.position, { x: 6.2, y: 3.2, z: 6.4, duration: 0.9, ease: "power2.inOut", onUpdate: () => (this.dirty = true) });
    gsap.to(this.controls.target, { x: 0, y: 0.9, z: 0, duration: 0.9, ease: "power2.inOut", onUpdate: () => (this.dirty = true) });
    gsap.to(this.root.rotation, { y: 0, duration: 0.9, ease: "power2.inOut", onUpdate: () => (this.dirty = true) });
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.killTimeline();
    this.ro?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("click", this.onClick);
    this.controls.dispose();
    disposeObject(this.scene);
    this.renderer.dispose();
  }
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}

/** A soft radial gradient used as a fake contact shadow. */
function makeShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 64, 8, 128, 64, 120);
  g.addColorStop(0, "rgba(0,0,0,0.85)");
  g.addColorStop(0.55, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
