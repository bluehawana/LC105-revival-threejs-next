import * as THREE from "three";
import { add, box, cyl, layAlongX } from "./helpers";
import { metal, alum, PALETTE } from "../three/materials";

/**
 * Gearbox — bell housing at the engine end tapering to the tail housing that
 * mates to the transfer case.
 */
export function buildTransmission(): THREE.Group {
  const g = new THREE.Group();
  // Bell housing (front, +X) — a wide cone-ish cylinder.
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.22, 24), alum());
  bell.rotation.z = -Math.PI / 2;
  bell.position.set(0.32, 0, 0);
  add(g, bell);
  // Main case.
  add(g, box(0.5, 0.3, 0.3, alum(), 0, -0.02, 0));
  // Oil pan below.
  add(g, box(0.4, 0.08, 0.26, metal(PALETTE.steelDark), 0, -0.2, 0));
  // Tail housing to the transfer case (-X).
  add(g, layAlongX(cyl(0.11, 0.2, alum(), -0.35, 0, 0, 20)) as THREE.Mesh);
  // Shift linkage on top.
  add(g, cyl(0.014, 0.22, metal(PALETTE.steelDark), 0.02, 0.24, 0.05, 8));
  add(g, box(0.05, 0.03, 0.05, metal(PALETTE.steel), 0.02, 0.36, 0.05));
  return g;
}
