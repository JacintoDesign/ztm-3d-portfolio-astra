import { LAYOUT } from "./world";
export type Collider = {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};
export const colliders: Collider[] = [];
export function addCollider(
  id: string,
  x: number,
  z: number,
  width: number,
  depth: number,
) {
  const existing = colliders.findIndex((collider) => collider.id === id);
  const collider = {
    id,
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  };
  if (existing < 0) colliders.push(collider);
  else colliders[existing] = collider;
}
export function moveAxis(x: number, z: number, next: number, axis: "x" | "z") {
  const r = LAYOUT.radius;
  for (const b of colliders) {
    if (axis === "x" && z > b.minZ - r && z < b.maxZ + r) {
      if (x <= b.minX - r && next > b.minX - r) next = b.minX - r;
      else if (x >= b.maxX + r && next < b.maxX + r) next = b.maxX + r;
    }
    if (axis === "z" && x > b.minX - r && x < b.maxX + r) {
      if (z <= b.minZ - r && next > b.minZ - r) next = b.minZ - r;
      else if (z >= b.maxZ + r && next < b.maxZ + r) next = b.maxZ + r;
    }
  }
  return Math.max(
    axis === "x" ? LAYOUT.bounds.minX : LAYOUT.bounds.minZ,
    Math.min(axis === "x" ? LAYOUT.bounds.maxX : LAYOUT.bounds.maxZ, next),
  );
}
