import * as THREE from "three";
import { add, box, cyl, layAlongZ, layAlongX } from "./helpers";
import { metal, lockMat, PALETTE } from "../three/materials";

/**
 * A solid (live) axle: a long tube with a differential "pumpkin" in the middle,
 * hub flanges at each end and a red lock housing on the diff. This is the
 * long-travel, unbreakable front/rear end that fans swear by.
 */
function solidAxle(opts: { front: boolean }): THREE.Group {
  const g = new THREE.Group();
  const TRACK = 1.6;

  // Axle tube.
  add(g, layAlongZ(cyl(0.055, TRACK, metal(PALETTE.steelDark), 0, 0, 0, 16)) as THREE.Mesh);

  // Diff pumpkin (slightly offset to one side like the real thing).
  const off = opts.front ? 0.12 : -0.12;
  const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14), metal(PALETTE.steel));
  pumpkin.position.set(0, 0, off);
  pumpkin.scale.set(1.15, 1, 0.9);
  add(g, pumpkin);

  // Diff cover plate + drain — reads as a Toyota 9.5" diff.
  add(g, cyl(0.15, 0.03, metal(PALETTE.steelDark), opts.front ? -0.2 : 0.2, 0, off, 20));
  layAlongX(g.children[g.children.length - 1]);

  // Pinion nose pointing at the transfer case.
  const nose = layAlongX(cyl(0.05, 0.28, metal(PALETTE.steelDark), opts.front ? -0.28 : 0.28, 0.02, off, 14)) as THREE.Mesh;
  add(g, nose);

  // The differential LOCK actuator — the red call-out. Front = lock 1, rear = lock 3.
  // Named so the 3-Lock Lab can glow each actuator when its lock engages.
  const lock = layAlongZ(cyl(0.06, 0.12, lockMat(), 0, 0.14, off, 16)) as THREE.Mesh;
  lock.name = opts.front ? "lock-1" : "lock-3";
  add(g, lock);
  add(g, box(0.06, 0.06, 0.06, lockMat(), 0, 0.22, off));

  // Hub / knuckle flanges at both ends.
  for (const s of [1, -1]) {
    add(g, layAlongZ(cyl(0.11, 0.06, metal(PALETTE.steel), 0, 0, s * (TRACK / 2 - 0.02), 18)) as THREE.Mesh);
    if (opts.front) {
      // Steering knuckle + tie-rod end.
      add(g, box(0.1, 0.16, 0.08, metal(PALETTE.steelDark), 0, 0, s * (TRACK / 2 - 0.1)));
    }
  }
  if (opts.front) {
    // Tie rod running across behind the axle.
    add(g, layAlongZ(cyl(0.02, TRACK - 0.25, metal(PALETTE.steelDark), -0.18, -0.06, 0, 10)) as THREE.Mesh);
  }
  return g;
}

export const buildFrontAxle = () => solidAxle({ front: true });
export const buildRearAxle = () => solidAxle({ front: false });
