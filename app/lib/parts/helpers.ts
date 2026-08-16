import * as THREE from "three";

/**
 * Tiny helpers so each part builder reads as a list of "what the part is made
 * of" rather than a pile of geometry boilerplate. Every builder returns a
 * THREE.Group modelled around its own local origin (0,0,0); the viewer places
 * that group at the part's assembled position.
 */

/** A box of size w×h×d centred at (x,y,z). */
export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
   const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
   m.position.set(x, y, z);
   return m;
}

/** A right cylinder (axis +Y by default) of top/bottom radius r and height h. */
export function cyl(r: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 24) {
   const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
   m.position.set(x, y, z);
   return m;
}

/** A cone (axis +Y). */
export function cone(r: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 20) {
   const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
   m.position.set(x, y, z);
   return m;
}

/** A torus (a wheel, a ring). */
export function torus(R: number, r: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 28) {
   const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, seg), mat);
   m.position.set(x, y, z);
   return m;
}

/**
 * Add a mesh to a group and give it a subtle contact-shadow-friendly cast.
 * Returns the group so calls can be chained.
 */
export function add(group: THREE.Group, ...meshes: THREE.Mesh[]) {
   for (const m of meshes) {
     m.castShadow = false; // we use a baked contact shadow, not shadow maps
     m.receiveShadow = false;
     group.add(m);
   }
   return group;
}

/** Rotate a mesh so its +Y cylinder axis points along world Z (a wheel). */
export function layAlongZ(m: THREE.Object3D) {
   m.rotation.x = Math.PI / 2;
   return m;
}

/** Rotate a mesh so its +Y axis points along world X. */
export function layAlongX(m: THREE.Object3D) {
   m.rotation.z = Math.PI / 2;
   return m;
}
