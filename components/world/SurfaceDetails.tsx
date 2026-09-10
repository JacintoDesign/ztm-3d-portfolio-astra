"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, Object3D, Texture } from "three";
import { C, CONTACT_SHADOW, LAYOUT, TRAFFIC, type V3 } from "@/lib/world";
import { colliders } from "@/lib/collisions";
import { trafficX } from "@/lib/traffic";
import { getState } from "@/lib/store";
import { paintRoadAlphas } from "@/lib/textures/painters";
import Instances, { type Part } from "./Instances";

const placement = new Object3D();
const tint = new Color();
type PoolKind = "under" | "head" | "tail";
function RoadPool({ kind, alpha }: { kind: PoolKind; alpha: Texture }) {
  const mesh = useRef<InstancedMesh>(null);
  const settings = TRAFFIC[kind];
  useLayoutEffect(() => {
    if (!mesh.current) return;
    for (let i = 0; i < 6; i++) {
      const color = kind === "under" ? TRAFFIC.colors[i] : kind === "head" ? C.signWhite : C.lantern;
      mesh.current.setColorAt(i, tint.set(color));
    }
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [kind]);
  useFrame(({ clock }) => {
    const current = mesh.current;
    if (!current) return;
    const reduced = getState().reduced;
    for (let lane = 0; lane < TRAFFIC.lanes.length; lane++) {
      const direction = lane ? -1 : 1;
      for (let index = 0; index < TRAFFIC.models.length; index++) {
        const carLength = TRAFFIC.models[index].length;
        const length = kind === "under" ? carLength * TRAFFIC.under.lengthFactor : kind === "head" ? TRAFFIC.head.length : TRAFFIC.tail.length;
        const offset = kind === "under" ? 0 : (carLength + length) / 2 * (kind === "head" ? 1 : -1);
        placement.position.set(trafficX(clock.elapsedTime, lane, index, reduced) + direction * offset, settings.y, TRAFFIC.lanes[lane].z);
        placement.scale.set(length, settings.width, 1);
        placement.rotation.set(-Math.PI / 2, 0, lane ? Math.PI : 0);
        placement.updateMatrix();
        current.setMatrixAt(lane * TRAFFIC.models.length + index, placement.matrix);
      }
    }
    current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, 6]} frustumCulled={false}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial alphaMap={alpha} transparent opacity={settings.opacity} depthWrite={false} />
  </instancedMesh>;
}

export default function SurfaceDetails({ mobile }: { mobile: boolean }) {
  const maps = useMemo(() => paintRoadAlphas(mobile), [mobile]);
  useEffect(() => () => { maps.radial.dispose(); maps.beam.dispose(); }, [maps]);
  const shadows = useMemo<Part[]>(() => colliders.map((collider) => {
    const x = (collider.minX + collider.maxX) / 2;
    const z = (collider.minZ + collider.maxZ) / 2;
    // Props on the pavement need their decal on its surface, not hidden beneath it.
    const base = Math.abs(x) >= LAYOUT.kerb.inner ? LAYOUT.kerb.height : 0;
    return { position: [x, base + CONTACT_SHADOW.y, z] as V3, rotation: [-Math.PI / 2, 0, 0] as V3, scale: [(collider.maxX - collider.minX) * CONTACT_SHADOW.footprint, (collider.maxZ - collider.minZ) * CONTACT_SHADOW.footprint, 1] as V3 };
  }), []);
  return <>
    <Instances parts={shadows} shape="plane" material={<meshBasicMaterial color={C.void} alphaMap={maps.radial} transparent opacity={CONTACT_SHADOW.opacity} depthWrite={false} />} />
    <RoadPool kind="under" alpha={maps.radial} />
    <RoadPool kind="head" alpha={maps.beam} />
    <RoadPool kind="tail" alpha={maps.radial} />
  </>;
}
