"use client";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import type { ThreeElements } from "@react-three/fiber";
import type { V3 } from "@/lib/world";
export type Part = { position: V3; scale: V3; rotation?: V3; color?: string };
const dummy = new Object3D(),
  color = new Color();
export default function Instances({
  parts,
  shape = "box",
  material,
  colorGain = 1,
  topRadius = 1,
  meshRef,
  ...events
}: {
  parts: Part[];
  shape?: "box" | "cylinder" | "sphere" | "plane";
  material: React.ReactNode;
  colorGain?:number;
  topRadius?:number;
  meshRef?: RefObject<InstancedMesh | null>;
} & Omit<ThreeElements["instancedMesh"], "args" | "ref" | "material">) {
  const ownRef = useRef<InstancedMesh>(null);
  const ref = meshRef ?? ownRef;
  const dimensions = useMemo(
    () =>
      [undefined, undefined, parts.length] as [undefined, undefined, number],
    [parts.length],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    parts.forEach((p, i) => {
      dummy.position.set(...p.position);
      dummy.scale.set(...p.scale);
      dummy.rotation.set(...(p.rotation ?? [0, 0, 0]));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (p.color) mesh.setColorAt(i, color.set(p.color).multiplyScalar(colorGain));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [parts,colorGain,ref]);
  if (!parts.length) return null;
  return (
    <instancedMesh ref={ref} args={dimensions} {...events}>
      {shape === "box" ? (
        <boxGeometry args={[1, 1, 1]} />
      ) : shape === "cylinder" ? (
        <cylinderGeometry args={[topRadius, 1, 1, 12]} />
      ) : shape === "plane" ? <planeGeometry args={[1,1]}/> : (
        <sphereGeometry args={[1, 12, 8]} />
      )}
      {material}
    </instancedMesh>
  );
}
