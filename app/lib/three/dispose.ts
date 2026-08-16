import * as THREE from "three";

/** Recursively free every geometry, material and texture under an object. */
export function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach(disposeMaterial);
    else if (mat) disposeMaterial(mat);
  });
}

function disposeMaterial(m: THREE.Material) {
  const anyM = m as unknown as Record<string, unknown>;
  for (const k of Object.keys(anyM)) {
    const v = anyM[k];
    if (v && typeof v === "object" && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
  }
  m.dispose();
}
