import * as THREE from "three";
import { add, box, cyl, layAlongX, layAlongZ } from "./helpers";
import { metal, alum, PALETTE } from "../three/materials";

/**
 * The 1UZ-FE 4.0 L V8. Two banks of cylinder heads at ~90°, a plenum on top,
 * eight intake runners, exhaust manifolds each side, an alternator, a fan
 * pulley up front. Reads as a V8 from any angle.
 */
export function buildEngine(): THREE.Group {
  const g = new THREE.Group();

  // Block.
  add(g, box(0.62, 0.34, 0.5, alum(), 0, 0, 0));
  // Sump.
  add(g, box(0.5, 0.16, 0.36, metal(PALETTE.steelDark), 0.02, -0.25, 0));

  // Two cylinder banks (heads + cam covers) canted at ±45°.
  for (const s of [1, -1]) {
    const bank = new THREE.Group();
    add(bank, box(0.6, 0.16, 0.24, alum(), 0, 0, 0));
    // Cam cover — a slightly darker, ribbed cap.
    add(bank, box(0.56, 0.06, 0.2, metal("#5f666e"), 0, 0.11, 0));
    for (let i = 0; i < 4; i++) {
      add(bank, box(0.02, 0.03, 0.18, alum(), -0.21 + i * 0.14, 0.15, 0));
    }
    bank.position.set(0, 0.22, s * 0.16);
    bank.rotation.x = s * -Math.PI / 4;
    g.add(bank);
  }

  // Intake plenum on top, between the banks.
  add(g, box(0.5, 0.12, 0.26, alum(), -0.02, 0.4, 0));
  // Intake runners — 8 tubes fanning down into each bank.
  for (let i = 0; i < 4; i++) {
    for (const s of [1, -1]) {
      const r = cyl(0.022, 0.2, alum(), -0.19 + i * 0.13, 0.32, s * 0.2, 10);
      r.rotation.x = s * 0.9;
      add(g, r);
    }
  }
  // Throttle body up front of the plenum.
  add(g, layAlongX(cyl(0.05, 0.1, alum(), 0.28, 0.4, 0, 16)) as THREE.Mesh);

  // Exhaust manifolds each side (log style).
  for (const s of [1, -1]) {
    add(g, layAlongX(cyl(0.035, 0.5, metal("#3b3f45"), 0, 0.02, s * 0.32, 12)) as THREE.Mesh);
    for (let i = 0; i < 4; i++) {
      add(g, layAlongZ(cyl(0.02, 0.1, metal("#3b3f45"), -0.19 + i * 0.13, 0.08, s * 0.29, 8)) as THREE.Mesh);
    }
  }

  // Front accessories: crank pulley + fan hub + alternator.
  add(g, layAlongX(cyl(0.09, 0.05, metal(PALETTE.steelDark), 0.34, -0.06, 0, 20)) as THREE.Mesh);
  add(g, layAlongX(cyl(0.05, 0.16, metal(PALETTE.steel), 0.42, -0.06, 0, 16)) as THREE.Mesh);
  // Viscous fan.
  const fan = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const blade = box(0.02, 0.22, 0.06, metal(PALETTE.steelDark), 0, 0.14, 0);
    const p = new THREE.Group();
    p.add(blade);
    p.rotation.x = (i / 7) * Math.PI * 2;
    fan.add(p);
  }
  fan.position.set(0.5, -0.06, 0);
  g.add(fan);
  // Alternator.
  add(g, layAlongX(cyl(0.07, 0.12, metal(PALETTE.steel), 0.3, 0.16, 0.3, 16)) as THREE.Mesh);
  // Serpentine belt hint.
  add(g, layAlongX(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 6, 30), metal("#1d1f22"))) as THREE.Mesh);
  g.children[g.children.length - 1].position.set(0.37, -0.06, 0);
  g.children[g.children.length - 1].rotation.y = Math.PI / 2;

  return g;
}
