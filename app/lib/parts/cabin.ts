import * as THREE from "three";
import { add, box, cyl, layAlongZ, torus } from "./helpers";
import { paint, metal, PALETTE } from "../three/materials";

/**
 * Cabin & interior: floor, dash, steering wheel, three rows of seats,
 * centre console with the transfer & lock levers, and the cargo floor.
 */
export function buildCabin(): THREE.Group {
  const g = new THREE.Group();
  const seatMat = () => paint("#b79b74", { roughness: 0.85, metalness: 0.05 });
  const dashMat = () => paint("#2a2b2e", { roughness: 0.8, metalness: 0.05 });
  const carpet = () => paint("#3a342c", { roughness: 0.95, metalness: 0 });

  // Floor pan + transmission tunnel.
  add(g, box(3.2, 0.04, 1.6, carpet(), 0, 0, 0));
  add(g, box(1.6, 0.14, 0.32, carpet(), 0.6, 0.06, 0));

  // Dashboard.
  add(g, box(0.5, 0.36, 1.6, dashMat(), 1.3, 0.3, 0));
  // Instrument binnacle bump (driver-left, +Z).
  add(g, box(0.28, 0.14, 0.4, dashMat(), 1.15, 0.5, 0.42));
  // Steering column + wheel.
  const col = cyl(0.025, 0.4, metal(PALETTE.steelDark), 0.9, 0.42, 0.42, 10);
  col.rotation.z = -1.0;
  add(g, col);
  const wheel = torus(0.17, 0.02, dashMat(), 0.72, 0.56, 0.42, 30);
  wheel.rotation.y = Math.PI / 2;
  wheel.rotation.x = 0.4;
  add(g, wheel);
  // Spokes.
  for (const a of [0, Math.PI / 2, Math.PI]) {
    const spoke = box(0.02, 0.28, 0.02, dashMat(), 0.72, 0.56, 0.42);
    spoke.rotation.x = a + 0.4;
    add(g, spoke);
  }

  // Seats — a helper.
  const seat = (x: number, z: number, wide = 0.5) => {
    add(g, box(0.5, 0.12, wide, seatMat(), x, 0.14, z)); // cushion
    const back = box(0.1, 0.5, wide, seatMat(), x - 0.22, 0.42, z);
    back.rotation.z = 0.15;
    add(g, back);
    add(g, box(0.1, 0.14, wide * 0.6, seatMat(), x - 0.28, 0.72, z)); // headrest
  };
  // Front row.
  seat(0.55, 0.42);
  seat(0.55, -0.42);
  // Second row bench.
  seat(-0.35, 0, 1.4);
  // Third row (jump seats — the true 7-seat 105 wagon).
  seat(-1.2, 0.35, 0.5);
  seat(-1.2, -0.35, 0.5);

  // Centre console: gear lever, transfer lever, and the LOCK switch cluster.
  add(g, box(0.5, 0.2, 0.28, dashMat(), 0.6, 0.18, 0));
  add(g, cyl(0.014, 0.24, metal(PALETTE.steel), 0.7, 0.4, 0, 8));
  add(g, cyl(0.03, 0.04, dashMat(), 0.7, 0.54, 0, 12)); // gear knob
  add(g, cyl(0.012, 0.18, metal(PALETTE.steel), 0.5, 0.36, 0.06, 8));
  add(g, cyl(0.025, 0.035, paint(PALETTE.lock, { roughness: 0.4 }), 0.5, 0.46, 0.06, 12)); // transfer knob (red)
  // Three lock switches on the console.
  for (let i = 0; i < 3; i++) {
    add(g, box(0.05, 0.02, 0.05, paint(PALETTE.lock, { roughness: 0.4, emissive: PALETTE.lock, emissiveIntensity: 0.25 }), 0.42, 0.29, -0.06 + i * 0.06));
  }

  // Cargo floor & side trim at the back.
  add(g, box(0.7, 0.03, 1.5, carpet(), -1.55, 0.02, 0));
  // Grab handles above doors.
  for (const s of [1, -1]) {
    add(g, layAlongZ(cyl(0.012, 0.16, dashMat(), 0.4, 0.98, s * 0.78, 8)) as THREE.Mesh);
  }
  return g;
}
