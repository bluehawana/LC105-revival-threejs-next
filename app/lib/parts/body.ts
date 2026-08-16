import * as THREE from "three";
import { add, box, cyl, layAlongZ } from "./helpers";
import { paint, metal, glass, PALETTE } from "../three/materials";

/**
 * Body shell (lower): the boxy Land Cruiser tub — sills, doors, front wings,
 * bonnet, tailgate, big wheel arches (cut with a subtractive look using dark
 * arch liners), front grille + round-ish headlamps, bumpers, running boards.
 * The group's local origin sits at the sill line (~y=0.86 in world space).
 */
export function buildBodyLower(): THREE.Group {
  const g = new THREE.Group();
  const P = () => paint(PALETTE.body);
  const T = () => paint(PALETTE.bodyTrim, { roughness: 0.7 });

  const L = 4.7; // overall length
  const W = 1.86; // overall width
  const H = 0.62; // sill to belt line

  // Main tub.
  add(g, box(L - 0.6, H, W, P(), 0.05, H / 2, 0));

  // Bonnet, stepped down slightly from the belt line and forward.
  add(g, box(1.1, 0.12, W - 0.16, P(), 1.6, H - 0.02, 0));
  // Front wings drop lower than the tub near the arches.
  add(g, box(1.05, 0.5, W, P(), 1.55, 0.25, 0));

  // Rear quarter/tailgate.
  add(g, box(0.5, H, W, P(), -2.05, H / 2, 0));

  // Wheel arches — dark liners with a paint lip. Front and rear on both sides.
  for (const x of [1.35, -1.35]) {
    for (const s of [1, -1]) {
      const liner = layAlongZ(cyl(0.5, 0.2, T(), x, 0.06, s * (W / 2 - 0.02), 32)) as THREE.Mesh;
      add(g, liner);
      // Fender flare — a torus segment look via a slightly larger dark ring.
      const flare = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 8, 30, Math.PI), T());
      flare.rotation.y = Math.PI / 2;
      flare.position.set(x, 0.06, s * (W / 2 + 0.005));
      add(g, flare);
    }
  }

  // Sills / rocker panels + running boards.
  for (const s of [1, -1]) {
    add(g, box(2.1, 0.08, 0.14, T(), 0.05, 0.02, s * (W / 2 + 0.05)));
  }

  // Doors — thin recessed lines suggested with darker vertical strips.
  for (const x of [0.75, 0.05, -0.65]) {
    for (const s of [1, -1]) {
      add(g, box(0.02, H - 0.08, 0.02, T(), x, H / 2, s * (W / 2 + 0.005)));
    }
  }
  // Door handles.
  for (const x of [0.5, -0.25]) {
    for (const s of [1, -1]) {
      add(g, box(0.16, 0.03, 0.03, metal(PALETTE.steel), x, H - 0.16, s * (W / 2 + 0.02)));
    }
  }

  // Front face: grille, headlamps, bumper.
  const front = L / 2 - 0.3;
  add(g, box(0.06, 0.32, W - 0.4, metal("#5b6169"), front + 0.03, 0.34, 0)); // grille block
  for (let i = 0; i < 6; i++) {
    add(g, box(0.07, 0.03, W - 0.5, metal("#c9ced4"), front + 0.05, 0.22 + i * 0.045, 0)); // grille bars
  }
  // Headlamps (rectangular on the 100-series).
  for (const s of [1, -1]) {
    add(g, box(0.06, 0.16, 0.34, glass({ opacity: 0.85 }), front + 0.05, 0.36, s * (W / 2 - 0.26)));
    // Indicator.
    add(g, box(0.06, 0.06, 0.12, paint("#e58a1f", { roughness: 0.4 }), front + 0.05, 0.22, s * (W / 2 - 0.12)));
  }
  // Front bumper.
  add(g, box(0.16, 0.14, W + 0.06, T(), front + 0.1, 0.02, 0));
  // Bull bar / nudge bar hint (chrome tubes).
  add(g, layAlongZ(cyl(0.02, W - 0.4, metal("#c9ced4"), front + 0.2, 0.32, 0, 10)) as THREE.Mesh);
  add(g, layAlongZ(cyl(0.02, W - 0.4, metal("#c9ced4"), front + 0.2, 0.12, 0, 10)) as THREE.Mesh);
  for (const s of [1, -1]) {
    add(g, cyl(0.02, 0.24, metal("#c9ced4"), front + 0.2, 0.22, s * (W / 2 - 0.22), 10));
  }

  // Rear bumper + tail lamps.
  add(g, box(0.14, 0.14, W + 0.06, T(), -L / 2 + 0.2, 0.02, 0));
  for (const s of [1, -1]) {
    add(g, box(0.05, 0.22, 0.14, paint("#a8231b", { roughness: 0.4 }), -L / 2 + 0.28, 0.32, s * (W / 2 - 0.12)));
  }
  // Spare wheel carrier hint on the tailgate.
  add(g, layAlongZ(cyl(0.05, 0.03, metal(PALETTE.steelDark), -L / 2 + 0.28, 0.5, 0.25, 16)) as THREE.Mesh);
  return g;
}

/**
 * Roof & glass (upper body): the glasshouse — pillars, windscreen, side glass,
 * roof, roof rack rails, and rain gutters. Sits on top of the tub's belt line.
 */
export function buildBodyUpper(): THREE.Group {
  const g = new THREE.Group();
  const P = () => paint(PALETTE.body);
  const T = () => paint(PALETTE.bodyTrim, { roughness: 0.7 });
  const W = 1.78;
  const H = 0.62; // belt line to roof
  const LEN = 3.0; // greenhouse length

  // Roof.
  add(g, box(LEN, 0.05, W, P(), -0.35, H, 0));
  // Rain gutters / roof rails.
  for (const s of [1, -1]) {
    add(g, box(LEN - 0.4, 0.04, 0.03, T(), -0.35, H + 0.04, s * (W / 2 - 0.05)));
    // Roof rack side rails.
    add(g, box(LEN - 0.9, 0.05, 0.05, metal(PALETTE.steelDark), -0.4, H + 0.13, s * (W / 2 - 0.2)));
    for (const x of [-1.6, -0.4, 0.75]) {
      add(g, cyl(0.02, 0.1, metal(PALETTE.steelDark), x, H + 0.08, s * (W / 2 - 0.2), 8));
    }
  }

  // Pillars: A (raked), B, C, D.
  const pillar = (x: number, s: number, rake = 0) => {
    const p = box(0.08, H, 0.06, P(), x, H / 2, s * (W / 2 - 0.03));
    p.rotation.z = rake;
    add(g, p);
  };
  for (const s of [1, -1]) {
    pillar(1.15, s, -0.42); // A pillar, raked back
    pillar(0.35, s);
    pillar(-0.45, s);
    pillar(-1.85, s);
  }

  // Windscreen — a raked glass slab.
  const ws = box(0.03, H - 0.05, W - 0.16, glass(), 1.05, H / 2, 0);
  ws.rotation.z = -0.42;
  add(g, ws);
  // Rear glass.
  add(g, box(0.03, H - 0.1, W - 0.2, glass(), -1.85, H / 2, 0));
  // Side glass panels between pillars.
  for (const s of [1, -1]) {
    add(g, box(0.72, H - 0.12, 0.02, glass(), 0.75, H / 2, s * (W / 2 - 0.02)));
    add(g, box(0.72, H - 0.12, 0.02, glass(), -0.05, H / 2, s * (W / 2 - 0.02)));
    add(g, box(1.3, H - 0.12, 0.02, glass(), -1.15, H / 2, s * (W / 2 - 0.02)));
  }
  // Wing mirrors.
  for (const s of [1, -1]) {
    add(g, box(0.16, 0.12, 0.08, T(), 1.05, 0.28, s * (W / 2 + 0.1)));
    add(g, box(0.02, 0.1, 0.06, glass({ opacity: 0.6 }), 1.14, 0.28, s * (W / 2 + 0.1)));
  }
  // Snorkel — the iconic touch, on the A-pillar (driver-left, +Z).
  const snorkel = new THREE.Group();
  add(snorkel, cyl(0.045, H + 0.06, T(), 0, H / 2, 0, 12));
  const head = box(0.16, 0.12, 0.09, T(), 0.06, H + 0.02, 0);
  add(snorkel, head);
  add(snorkel, cyl(0.045, 0.3, T(), 0.02, -0.16, -0.05, 12));
  snorkel.position.set(1.02, 0, W / 2 + 0.06);
  g.add(snorkel);
  return g;
}
