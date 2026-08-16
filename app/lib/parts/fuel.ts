import * as THREE from "three";
import { add, box, cyl, layAlongZ } from "./helpers";
import { metal, PALETTE } from "../three/materials";

/** ~138 L steel fuel tank slung between the frame rails behind the cab. */
export function buildFuel(): THREE.Group {
  const g = new THREE.Group();
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.72), metal(PALETTE.fuel, { roughness: 0.6, metalness: 0.5 }));
  add(g, tank);
  // Rounded look: two half-cylinders on the ends.
  for (const s of [1, -1]) {
    add(g, layAlongZ(cyl(0.14, 0.72, metal(PALETTE.fuel, { roughness: 0.6, metalness: 0.5 }), s * 0.35, 0, 0, 20)) as THREE.Mesh);
  }
  // Straps.
  for (const x of [-0.2, 0.2]) {
    add(g, box(0.04, 0.32, 0.78, metal(PALETTE.steelDark), x, 0, 0));
  }
  // Filler neck.
  const neck = cyl(0.03, 0.3, metal(PALETTE.steelDark), -0.2, 0.2, 0.3, 10);
  neck.rotation.z = 0.5;
  add(g, neck);
  // Fuel pump / sender flange on top.
  add(g, cyl(0.06, 0.03, metal(PALETTE.steel), 0.1, 0.15, -0.1, 16));
  return g;
}
