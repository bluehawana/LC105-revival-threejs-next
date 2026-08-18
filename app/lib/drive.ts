// ---------------------------------------------------------------------------
// 3-Lock Lab — the pure drivetrain simulation.
//
// Models the one thing the 3-lock exists for: what happens to torque when the
// ground lets go. Each wheel either has grip (its speed is limited by the
// ground) or is free (ice / off the ground — it can spin without limit).
//
//   Locked diff:  both wheels are forced to the same speed. A free wheel is
//                 dragged along while the grippy one pushes the truck.
//   Open diff:    torque follows the path of least resistance. One free wheel
//                 and the axle spins with zero push — the classic stuck truck.
//   Transfer:     LOCK 2 welds the front and rear axles to one speed; open,
//                 the whole output dumps into whichever axle can spin free.
//
// Pure on purpose: the 3D engine (for wheel/prop spin) and the React console
// (for the MOVING / STUCK verdict) both call `simulate`, so the picture and
// the words can never disagree.
// ---------------------------------------------------------------------------

export type LockId = 1 | 2 | 3;
/** l1 = front diff, l2 = centre (transfer), l3 = rear diff. */
export type Locks = Record<LockId, boolean>;

/**
 * Wheel order everywhere in this app: [front-left, front-right, rear-left,
 * rear-right]. A wheel with grip is on firm ground; without, it is free.
 */
export type Grip = [boolean, boolean, boolean, boolean];

/** "No speed limit" — a free wheel or a free-spinning shaft. */
export const FREE = 99;

export type DriveState = {
  /** True when the key is on (even while stuck — the engine is idling). */
  running: boolean;
  /** Normalised truck speed: 0 = stuck, 1 = moving at full grip. */
  truck: number;
  /** True when the truck cannot move for physical reasons. */
  stuck: boolean;
  /** Display spin per wheel (0 = stopped, 1 = truck speed, FREE = spinning in place). */
  wheels: [number, number, number, number];
  /** Display spin per prop shaft, [front, rear] — same convention. */
  shafts: [number, number];
  /**
   * When stuck and it is the open diffs that are to blame: the smallest set of
   * locks to engage (on top of the ones already on) that gets it moving.
   * Null when no combination of locks helps (no grip anywhere).
   */
  fix: LockId[] | null;
};

type AxleOut = {
  /** Shaft speed if constrained by the ground, FREE if it can spin in place. */
  s: number;
  /** False when torque can escape this axle without pushing the ground. */
  constrained: boolean;
  spins: [number, number];
};

/** One solid axle with a locking diff. `caps` are the two wheels' speed limits. */
function axle(caps: [number, number], locked: boolean): AxleOut {
  const [cl, cr] = caps;
  const grippy = caps.filter((c) => c !== FREE);
  if (locked) {
    if (!grippy.length) return { s: FREE, constrained: false, spins: [FREE, FREE] };
    const s = Math.min(...grippy);
    return { s, constrained: true, spins: [s, s] };
  }
  // Open diff: any free wheel becomes the pressure-relief valve for the torque.
  if (cl === FREE || cr === FREE) {
    return {
      s: FREE,
      constrained: false,
      spins: [cl === FREE ? FREE : 0, cr === FREE ? FREE : 0],
    };
  }
  const s = Math.min(cl, cr);
  return { s, constrained: true, spins: [s, s] };
}

/** Pure physics, no advice — `simulate` wraps this and adds `fix`. */
function core(locks: Locks, grip: Grip): { truck: number; wheels: [number, number, number, number]; shafts: [number, number] } {
  const caps: number[] = grip.map((g) => (g ? 1 : FREE));
  const front = axle([caps[0], caps[1]], locks[1]);
  const rear = axle([caps[2], caps[3]], locks[3]);

  let truck = 0;
  let wheels: [number, number, number, number];
  let shafts: [number, number];

  if (locks[2]) {
    // Centre locked: one welded speed — limited by the slowest grounded wheel,
    // free axles are simply dragged along.
    const constrained = [front, rear].filter((a) => a.constrained);
    const s = constrained.length ? Math.min(...constrained.map((a) => a.s)) : FREE;
    truck = s === FREE ? 0 : s;
    wheels = [s, s, s, s];
    shafts = [s, s];
  } else {
    const free = [front, rear].some((a) => !a.constrained);
    if (free) {
      // Open transfer: everything dumps into the axle that can spin free; the
      // grounded axle gets no rotation at all.
      truck = 0;
      const idle = (a: AxleOut): [number, number] => (a.constrained ? [0, 0] : a.spins);
      wheels = [idle(front)[0], idle(front)[1], idle(rear)[0], idle(rear)[1]];
      shafts = [front.constrained ? 0 : FREE, rear.constrained ? 0 : FREE];
    } else {
      const s = Math.min(front.s, rear.s);
      truck = s;
      wheels = [s, s, s, s];
      shafts = [s, s];
    }
  }

  return { truck, wheels, shafts };
}

/** Smallest set of additional locks that gets the truck moving, if any. */
function findFix(current: Locks, grip: Grip): LockId[] | null {
  const combos: LockId[][] = [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]];
  for (const combo of combos) {
    const next: Locks = { ...current };
    for (const l of combo) next[l] = true;
    if (core(next, grip).truck > 0) return combo;
  }
  return null;
}

export function simulate(locks: Locks, grip: Grip, running: boolean): DriveState {
  const c = core(locks, grip);
  const stuck = !running || c.truck === 0;
  return { running, ...c, stuck, fix: running && c.truck === 0 ? findFix(locks, grip) : null };
}

/** Preset surfaces for the lab console. Names read like field conditions. */
export const SURFACE_PRESETS: { name: string; grip: Grip }[] = [
  { name: "Firm ground", grip: [true, true, true, true] },
  { name: "Front-left on ice", grip: [false, true, true, true] },
  { name: "Both left in mud", grip: [false, true, false, true] },
  { name: "Front off the ground", grip: [false, false, true, true] },
  { name: "All on ice", grip: [false, false, false, false] },
];

export const WHEEL_LABELS = ["Front-left", "Front-right", "Rear-left", "Rear-right"] as const;

/** Human reason each lock exists — used in the STUCK advice. */
export const LOCK_FIX_TEXT: Record<LockId, string> = {
  1: "the front diff lock forces both front wheels to turn together",
  2: "the centre lock welds the front and rear axles together",
  3: "the rear diff lock forces both rear wheels to turn together",
};
