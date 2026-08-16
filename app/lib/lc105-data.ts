// ---------------------------------------------------------------------------
// LC105 REVIVAL — the parts catalog.
//
// This is the single source of truth for the whole app: the 3D viewer, the
// parts panel, the build timeline and the Qwen guide all read from here.
//
// Coordinate system: X = fore-aft (front of the truck is +X), Z = left-right
// (+Z is driver-left), Y = up. Units are roughly metres. The truck is centred
// on the origin with its tyres on the ground (y = 0).
//
// `assembled` is the part's real position in the built truck; `explode` is the
// extra offset added when the model is fully taken apart. The live position of a
// part is always:  assembled + explode * (1 - buildFraction).  buildFraction = 1
// means "fully assembled", 0 means "fully exploded".
//
// To add a new part: append a SystemSpec below, give it a builder in
// app/lib/parts/index.ts, and it appears everywhere automatically.
// ---------------------------------------------------------------------------

export type SystemId =
    | "chassis"
   | "fuel"
   | "front-axle"
   | "rear-axle"
   | "front-suspension"
   | "rear-suspension"
   | "transfer"
   | "transmission"
   | "engine"
   | "radiator"
   | "body-lower"
   | "body-upper"
   | "cabin"
   | "wheels";

export type Category =
    | "frame"
   | "drivetrain"
   | "powertrain"
   | "running"
   | "body"
   | "cabin";

/**
 * The "3-lock" is the soul of the V8 Land Cruiser: a front differential lock
 * (1), the centre/transfer-case lock that welds front and rear together (2),
 * and a rear differential lock (3). These three, plus low range, are what
 * millions of owners swear by. `lock` flags which of the three a system carries.
 */
export type Lock = 1 | 2 | 3;

export type SystemSpec = {
   id: SystemId;
   name: string;
   /** UI grouping. */
   category: Category;
   /** Accent colour used in the panel and for highlight glow. */
   accent: string;
   /** Real position in the built truck. */
   assembled: [number, number, number];
   /** Extra offset applied when fully exploded. */
   explode: [number, number, number];
   /** 1-based assembly sequence (chassis first, wheels last). */
   order: number;
   /** One-line human blurb. */
   blurb: string;
   /** Authentic-ish spec line. */
   spec: string;
   /** Which of the three differential locks this system carries, if any. */
   lock?: Lock;
   /** Optional fan/CC reference image in public/lc105/ — dropped in by hand. */
   reference?: string;
};

/** Short, human label for each category (shown as a panel section). */
export const CATEGORY_LABEL: Record<Category, string> = {
   frame: "Chassis & frame",
   drivetrain: "Drivetrain",
   powertrain: "Powertrain",
   running: "Running gear",
   body: "Body",
   cabin: "Cabin",
};

/** Category order as listed in the parts panel. */
export const CATEGORY_ORDER: Category[] = [
   "frame",
   "drivetrain",
   "powertrain",
   "running",
   "body",
   "cabin",
];

export const SYSTEMS: SystemSpec[] = [
   {
     id: "chassis",
     name: "Ladder Frame",
     category: "frame",
     accent: "#8b939d",
     assembled: [0, 0.45, 0],
     explode: [0, -1.5, 0],
     order: 1,
     blurb: "The twin-tubed ladder backbone. Everything hangs off these two rails.",
     spec: "Welded twin-tube steel · 2750 mm wheelbase · independent of body",
   },
   {
     id: "fuel",
     name: "Fuel Tank",
     category: "running",
     accent: "#b23a2c",
     assembled: [-0.85, 0.5, -0.4],
     explode: [0, -1.1, -1.9],
     order: 2,
     blurb: "Steel tank behind the cab — long range is the point of a Cruiser.",
     spec: "~138 L steel · desert run range",
   },
   {
     id: "front-axle",
     name: "Front Solid Axle",
     category: "drivetrain",
     accent: "#c7442f",
     assembled: [1.35, 0.45, 0],
     explode: [1.8, -1.0, 0],
     order: 3,
     lock: 1,
     blurb: "A rigid solid front axle — the classic long-travel Land Cruiser front end.",
     spec: "Rigid axle · leaf/coil · carries LOCK 1 (front diff lock)",
   },
   {
     id: "rear-axle",
     name: "Rear Solid Axle",
     category: "drivetrain",
     accent: "#c7442f",
     assembled: [-1.35, 0.45, 0],
     explode: [-1.8, -1.0, 0],
     order: 4,
     lock: 3,
     blurb: "Rear solid axle, locking — the tail of the 3-lock system.",
     spec: "Rigid axle · heavy-duty · carries LOCK 3 (rear diff lock)",
   },
   {
     id: "front-suspension",
     name: "Front Suspension",
     category: "running",
     accent: "#5a8fa3",
     assembled: [1.35, 0.82, 0],
     explode: [1.5, 0.6, 1.4],
     order: 5,
     blurb: "Coil-spring, long-travel front end — the reason it swallows big ruts.",
     spec: "Coil-spring · long travel · high articulation",
   },
   {
     id: "rear-suspension",
     name: "Rear Suspension",
     category: "running",
     accent: "#5a8fa3",
     assembled: [-1.35, 0.82, 0],
     explode: [-1.5, 0.6, 1.4],
     order: 6,
     blurb: "Long-travel rear end tuned to match the front articulation.",
     spec: "Long-travel · matched to front · big off-road travel",
   },
   {
     id: "transfer",
     name: "3-Lock Transfer Case",
     category: "drivetrain",
     accent: "#d8442f",
     assembled: [0.35, 0.6, 0.15],
     explode: [0.2, 0.7, 2.0],
     order: 7,
     lock: 2,
     blurb: "The heart of the icon: a locking transfer case with low range. The centre of the 3-lock.",
     spec: "4WD + LOW · carries LOCK 2 (centre/transfer lock) · welds front & rear",
   },
   {
     id: "transmission",
     name: "Transmission",
     category: "powertrain",
     accent: "#c98a3a",
     assembled: [-0.25, 0.62, 0.15],
     explode: [-0.4, 0.9, -1.9],
     order: 8,
     blurb: "Gearbox, mated to the V8 and the transfer case.",
     spec: "Mated to 1UZ-FE · feeds the transfer case",
   },
   {
     id: "engine",
     name: "1UZ-FE V8",
     category: "powertrain",
     accent: "#c98a3a",
     assembled: [1.05, 0.95, 0],
     explode: [1.6, 1.6, -1.3],
     order: 9,
     blurb: "The 4.0-litre 1UZ-FE V8 — the engine that earned the 3-lock.",
     spec: "4.0 L V8 · ~230 hp · DOHC 32-valve",
   },
   {
     id: "radiator",
     name: "Radiator & Cooling",
     category: "powertrain",
     accent: "#5a8fa3",
     assembled: [2.05, 0.78, 0],
     explode: [2.9, 0.2, 0],
     order: 10,
     blurb: "Up front, cooling the V8 through the desert.",
     spec: "Front-mounted · high flow · desert-duty",
   },
   {
     id: "body-lower",
     name: "Body Shell",
     category: "body",
     accent: "#2f4a3a",
     assembled: [0, 0.86, 0],
     explode: [0, 0.4, 0],
     order: 11,
     blurb: "The body, bolted to the frame on rubber bushings — body-on-frame.",
     spec: "Body-on-frame · off-road green · sills & rockers",
   },
   {
     id: "body-upper",
     name: "Roof & Glass",
     category: "body",
     accent: "#2f4a3a",
     assembled: [0, 1.5, 0],
     explode: [0, 1.7, 0],
     order: 12,
     blurb: "Roof, windows and the glasshouse that makes it read as a Cruiser.",
     spec: "Greenhouse · windscreen & side glass · roof",
   },
   {
     id: "cabin",
     name: "Cabin & Interior",
     category: "cabin",
     accent: "#b79b74",
     assembled: [-0.3, 0.98, 0],
     explode: [0, 2.3, 0],
     order: 13,
     blurb: "Seats, dash and the Double Cab — the Double Cab / LDV is the true 105.",
     spec: "Double Cab / LDV · 5–7 seats · off-road dash",
   },
   {
     id: "wheels",
     name: "Wheels & Tyres",
     category: "running",
     accent: "#3a3f47",
     assembled: [0, 0, 0],
     explode: [0, 2.0, 0],
     order: 14,
     blurb: "Four wheels, four corners — dropped on last, to stand it up.",
     spec: "4 × road-tyre · bead to the solid axles",
   },
];

/** Fast lookup: id → spec. */
export const byId: Record<SystemId, SystemSpec> = SYSTEMS.reduce(
    (acc, s) => {
       acc[s.id] = s;
       return acc;
    },
   {} as Record<SystemId, SystemSpec>,
);

/** The systems that carry one of the three differential locks — the 3-lock, in order. */
export const LOCK_SYSTEMS: SystemSpec[] = SYSTEMS.filter((s) => s.lock).sort(
    (a, b) => (a.lock ?? 9) - (b.lock ?? 9),
);
