import * as THREE from "three";
import { add, box, cyl, layAlongX } from "./helpers";
import { metal, PALETTE } from "../three/materials";

/** A coil spring drawn as a helical tube. */
function coil(r: number, h: number, turns: number, mat: THREE.Material) {
  const pts: THREE.Vector3[] = [];
  const N = turns * 16;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, t * h - h / 2, Math.sin(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, N * 2, 0.014, 8, false);
  return new THREE.Mesh(geo, mat);
}

/**
 * Coil-spring long-travel suspension. Two coils + two dampers + a lateral
 * (Panhard) rod and trailing arms. Same builder for front and rear; the
 * rear gets a slightly longer coil, like the real long-travel rear.
 */
function suspension(opts: { rear: boolean }): THREE.Group {
  const g = new THREE.Group();
  const Z = 0.62;
  const H = opts.rear ? 0.36 : 0.32;

  for (const s of [1, -1]) {
    // Coil spring.
    add(g, coil(0.085, H, 5, metal(PALETTE.steel)) as THREE.Mesh);
    g.children[g.children.length - 1].position.set(0, 0, s * Z);
    // Damper (shock absorber) beside the coil, canted a touch.
    const damper = cyl(0.028, H + 0.1, metal(PALETTE.steelDark), 0.16, 0.02, s * (Z + 0.06), 12);
    damper.rotation.z = 0.12;
    add(g, damper);
    // Damper body highlight in a darker rubber-boot band.
    add(g, cyl(0.036, 0.12, metal("#2a2e34"), 0.16, -0.06, s * (Z + 0.06), 12));
    // Trailing / radius arm.
    const arm = layAlongX(cyl(0.02, 0.6, metal(PALETTE.steelDark), opts.rear ? 0.3 : -0.3, -0.16, s * (Z - 0.1), 10)) as THREE.Mesh;
    add(g, arm);
  }
  // Panhard rod running across.
  const rod = cyl(0.018, Z * 2, metal(PALETTE.steelDark), opts.rear ? -0.15 : 0.15, -0.1, 0, 10);
  rod.rotation.x = Math.PI / 2;
  rod.rotation.z = 0.06;
  add(g, rod);
  // Upper spring seats (little cups on the frame).
  for (const s of [1, -1]) add(g, box(0.16, 0.03, 0.16, metal(PALETTE.steel), 0, H / 2 + 0.02, s * Z));
  return g;
}

export const buildFrontSuspension = () => suspension({ rear: false });
export const buildRearSuspension = () => suspension({ rear: true });
