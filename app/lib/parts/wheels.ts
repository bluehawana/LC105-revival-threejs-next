import * as THREE from "three";
import { add, cyl, layAlongZ, box } from "./helpers";
import { metal, rubber, PALETTE } from "../three/materials";

/** One wheel: tyre torus + rim disc + hub + 6 lug pattern. Axis along Z. */
function wheel(): THREE.Group {
  const g = new THREE.Group();
  const R = 0.39;
  const r = 0.12;
  // Tyre.
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(R - r, r, 14, 40), rubber());
  add(g, tyre);
  // Tread blocks — a ring of small boxes on the outside of the tyre.
  const N = 26;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const b = box(0.06, 0.05, 0.16, rubber(), Math.cos(a) * (R - 0.02), Math.sin(a) * (R - 0.02), 0);
    b.rotation.z = a;
    add(g, b);
  }
  // Rim (steel wheel look).
  add(g, layAlongZ(cyl(R - r - 0.01, 0.16, metal(PALETTE.steel), 0, 0, 0, 30)) as THREE.Mesh);
  // Dish + hub cap.
  add(g, layAlongZ(cyl(0.16, 0.2, metal(PALETTE.steelDark), 0, 0, 0.02, 24)) as THREE.Mesh);
  add(g, layAlongZ(cyl(0.06, 0.24, metal(PALETTE.steel), 0, 0, 0.03, 16)) as THREE.Mesh);
  // Six lug nuts.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    add(g, layAlongZ(cyl(0.015, 0.06, metal("#c9ced4"), Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.11, 8)) as THREE.Mesh);
  }
  return g;
}

/**
 * All four wheels as one system, positioned at the four corners in the
 * wheels group's local space (the group's assembled position is the origin).
 */
export function buildWheels(): THREE.Group {
  const g = new THREE.Group();
  const X = 1.35;
  const Z = 0.9;
  const Y = 0.39;
  // Named so the 3-Lock Lab can spin each corner independently.
  const corners: [string, number, number][] = [
    ["wheel-fl", X, Z],
    ["wheel-fr", X, -Z],
    ["wheel-rl", -X, Z],
    ["wheel-rr", -X, -Z],
  ];
  for (const [name, x, z] of corners) {
    const w = wheel();
    w.name = name;
    w.position.set(x, Y, z);
    // Flip the outer wheels so the dish faces out.
    if (z < 0) w.rotation.y = Math.PI;
    g.add(w);
  }
  return g;
}
