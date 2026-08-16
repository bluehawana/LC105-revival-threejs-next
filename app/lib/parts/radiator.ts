import * as THREE from "three";
import { add, box, cyl, layAlongZ } from "./helpers";
import { metal, alum, PALETTE } from "../three/materials";

/**
 * Radiator + fan shroud + top/bottom hoses. Sits in front of the engine.
 */
export function buildRadiator(): THREE.Group {
  const g = new THREE.Group();
  // Core — a wide thin slab, dark with a fine "fin" texture suggested by ribs.
  add(g, box(0.06, 0.56, 0.78, metal("#2a2d33"), 0, 0, 0));
  for (let i = 0; i < 12; i++) {
    add(g, box(0.07, 0.56, 0.008, metal("#3a3e46"), 0, 0, -0.36 + i * 0.065));
  }
  // Tanks (aluminium end tanks) top and bottom.
  add(g, box(0.09, 0.07, 0.82, alum(), 0, 0.3, 0));
  add(g, box(0.09, 0.07, 0.82, alum(), 0, -0.3, 0));
  // Fan shroud ring behind the core (toward the engine, -X).
  const shroud = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 8, 32), metal(PALETTE.steelDark));
  shroud.rotation.y = Math.PI / 2;
  shroud.position.set(-0.08, -0.02, 0);
  add(g, shroud);
  // Top & bottom hoses (curved tubes to the engine).
  const hose = (y: number, z: number) => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, y, z),
      new THREE.Vector3(-0.12, y + 0.02, z * 0.8),
      new THREE.Vector3(-0.28, y - 0.03, z * 0.5),
    ]);
    return new THREE.Mesh(new THREE.TubeGeometry(c, 16, 0.025, 8, false), metal("#1e2024"));
  };
  add(g, hose(0.28, 0.28));
  add(g, hose(-0.28, -0.28));
  // Filler cap.
  add(g, cyl(0.03, 0.03, metal(PALETTE.steel), 0, 0.36, 0.28, 12));
  // Cross-brace / radiator support behind.
  add(g, layAlongZ(cyl(0.02, 0.9, metal(PALETTE.steelDark), -0.02, 0.4, 0, 8)) as THREE.Mesh);
  return g;
}
