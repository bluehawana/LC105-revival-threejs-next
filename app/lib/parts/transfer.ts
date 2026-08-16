import * as THREE from "three";
import { add, box, cyl, layAlongX, layAlongZ } from "./helpers";
import { metal, lockMat, alum, PALETTE } from "../three/materials";

/**
 * The 3-lock transfer case — the most detailed part on purpose. A cast housing
 * with the centre (lock 2) actuator called out in red, a low-range selector,
 * front and rear output yokes, and the little "4LO" indicator drum.
 */
export function buildTransfer(): THREE.Group {
  const g = new THREE.Group();

  // Main cast housing — two lobes.
  const main = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.36), alum());
  add(g, main);
  const lobe = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.3, 24), alum());
  lobe.rotation.z = Math.PI / 2;
  lobe.position.set(-0.05, -0.05, -0.16);
  add(g, lobe);

  // Ribs on the housing (cast cooling fins).
  for (let i = 0; i < 5; i++) {
    add(g, box(0.36, 0.012, 0.02, alum(), 0, -0.14 + i * 0.07, 0.19));
  }

  // Front output yoke (toward +X) and rear output yoke (toward -X).
  add(g, layAlongX(cyl(0.05, 0.16, metal(PALETTE.steelDark), 0.28, -0.02, -0.16, 16)) as THREE.Mesh);
  add(g, layAlongX(cyl(0.05, 0.16, metal(PALETTE.steelDark), -0.28, -0.02, -0.16, 16)) as THREE.Mesh);
  // Input from the transmission (toward -X, on the main lobe).
  add(g, layAlongX(cyl(0.06, 0.12, metal(PALETTE.steelDark), -0.26, 0.02, 0.06, 16)) as THREE.Mesh);

  // ---- LOCK 2: the centre differential lock actuator (red). ----
  const l2 = cyl(0.07, 0.14, lockMat(), 0.04, 0.24, 0.02, 20);
  add(g, l2);
  add(g, box(0.05, 0.05, 0.05, lockMat(), 0.04, 0.33, 0.02));
  // The two lever shafts running to the front & rear locks (thin red rods).
  add(g, layAlongX(cyl(0.012, 0.5, lockMat(), 0.3, 0.2, 0.06, 8)) as THREE.Mesh);
  add(g, layAlongX(cyl(0.012, 0.5, lockMat(), -0.3, 0.2, 0.06, 8)) as THREE.Mesh);

  // Low-range selector shaft with a knob (H / L).
  const sel = cyl(0.02, 0.28, metal(PALETTE.steelDark), -0.14, 0.24, 0.16, 10);
  add(g, sel);
  add(g, box(0.06, 0.06, 0.06, metal(PALETTE.steel), -0.14, 0.4, 0.16));

  // Little indicator drum on the side ("4H / 4L").
  add(g, layAlongZ(cyl(0.05, 0.03, metal(PALETTE.steel), 0.16, 0.06, 0.2, 18)) as THREE.Mesh);
  return g;
}
