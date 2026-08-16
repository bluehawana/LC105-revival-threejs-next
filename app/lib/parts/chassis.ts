import * as THREE from "three";
import { add, box, cyl, layAlongZ } from "./helpers";
import { metal, PALETTE } from "../three/materials";

/**
 * Ladder frame — two long rails joined by cross-members. Everything hangs off
 * these. Modelled with the rails running along X (fore-aft), 0.9 m apart.
 */
export function buildChassis(): THREE.Group {
  const g = new THREE.Group();
  const rail = metal(PALETTE.steel);
  const RAIL_LEN = 4.4;
  const RAIL_H = 0.14;
  const RAIL_W = 0.08;
  const HALF = 0.45;

  // Two boxed rails.
  add(g, box(RAIL_LEN, RAIL_H, RAIL_W, rail, 0, 0, HALF));
  add(g, box(RAIL_LEN, RAIL_H, RAIL_W, metal(PALETTE.steel), 0, 0, -HALF));

  // Cross-members (tubes) tying the rails together.
  const xs = [-2.0, -1.35, -0.6, 0.2, 0.9, 1.5, 2.05];
  for (const x of xs) {
    add(g, layAlongZ(cyl(0.035, HALF * 2, metal(PALETTE.steelDark), x, 0, 0, 12)) as THREE.Mesh);
  }

  // Front & rear bumper mounts / crossbars.
  add(g, box(0.06, 0.16, 1.4, metal(PALETTE.steelDark), RAIL_LEN / 2 + 0.05, 0.02, 0));
  add(g, box(0.06, 0.16, 1.4, metal(PALETTE.steelDark), -RAIL_LEN / 2 - 0.05, 0.02, 0));

  // Body-mount outriggers.
  for (const x of [-1.6, -0.3, 1.1, 1.85]) {
    for (const s of [1, -1]) {
      add(g, box(0.1, 0.06, 0.24, metal(PALETTE.steelDark), x, 0.06, s * (HALF + 0.12)));
    }
  }
  return g;
}
