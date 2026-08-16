import * as THREE from "three";

/**
 * Shared material factory for the procedural LC105.
 *
 * Every call returns a FRESH material instance — parts never share a material.
 * That is what lets the viewer highlight a single part (it mutates `emissive`)
 * without lighting up every other part that happens to use the same finish.
 * The palette reads "Land Cruiser": weathered steel, deep paint, road-rubber.
 */

export const PALETTE = {
   // Body — a deep off-road green, the Land Cruiser's most beloved shade.
   body: "#2f4a3a",
   bodyTrim: "#20322a",
   // Cold-rolled steel for the frame and drivetrain.
   steel: "#8b939d",
   steelDark: "#454c55",
   // Aluminium / cast aluminium for the V8.
   alum: "#b9c0c7",
   // Road rubber.
   rubber: "#15171a",
   // Glass.
   glass: "#93d3ff",
   // The famous locks, called out in red on the transfer case.
   lock: "#d8442f",
   // Fuel.
   fuel: "#b23a2c",
} as const;

type Opt = Partial<{
   metalness: number;
   roughness: number;
   transparent: boolean;
   opacity: number;
   emissive: string;
   emissiveIntensity: number;
   side: THREE.Side;
}>;

function std(color: string, o: Opt = {}) {
   return new THREE.MeshStandardMaterial({
     color: new THREE.Color(color),
     metalness: o.metalness ?? 0.35,
     roughness: o.roughness ?? 0.55,
     transparent: o.transparent,
     opacity: o.opacity,
     emissive: new THREE.Color(o.emissive ?? "#000000"),
     emissiveIntensity: o.emissiveIntensity ?? 1,
     side: o.side ?? THREE.FrontSide,
   });
}

/** Painted bodywork. */
export const paint = (color: string, o: Opt = {}) =>
   std(color, { metalness: 0.4, roughness: 0.45, ...o });

/** Cold-rolled / machined metal. */
export const metal = (color: string = PALETTE.steel, o: Opt = {}) =>
   std(color, { metalness: 0.9, roughness: 0.34, ...o });

/** Cast aluminium (engine block). */
export const alum = (o: Opt = {}) =>
   std(PALETTE.alum, { metalness: 0.75, roughness: 0.4, ...o });

/** Road rubber. */
export const rubber = (o: Opt = {}) =>
   std(PALETTE.rubber, { metalness: 0.1, roughness: 0.9, ...o });

/** Glazing — light and transmissive-looking. */
export const glass = (o: Opt = {}) =>
   std(PALETTE.glass, {
     metalness: 0.1,
     roughness: 0.15,
     transparent: true,
     opacity: 0.32,
     ...o,
   });

/** A red call-out — the differential locks. */
export const lockMat = (o: Opt = {}) =>
   std(PALETTE.lock, { metalness: 0.5, roughness: 0.35, emissive: "#d8442f", emissiveIntensity: 0.15, ...o });
