"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { Vector2 } from "three";
import { C, LAYOUT, REFLECTION } from "@/lib/world";
import { getState } from "@/lib/store";
import { paintGround, paintNormal } from "@/lib/textures/painters";
const normalScale = new Vector2(REFLECTION.normalScale, REFLECTION.normalScale);
export default function Ground({ mobile }: { mobile: boolean }) {
  const maps = useMemo(
    () => {
      const normal = paintNormal(mobile);
      const baseNormal = normal.clone();
      baseNormal.repeat.set(
        LAYOUT.ground / REFLECTION.width * REFLECTION.normalRepeat,
        LAYOUT.ground / REFLECTION.length * REFLECTION.normalRepeat,
      );
      baseNormal.offset.set(
        (REFLECTION.normalRepeat - baseNormal.repeat.x) / 2,
        REFLECTION.z / REFLECTION.length * REFLECTION.normalRepeat +
          (REFLECTION.normalRepeat - baseNormal.repeat.y) / 2,
      );
      return { rough: paintGround(mobile), normal, baseNormal, basePhase: baseNormal.offset.y };
    },
    [mobile],
  );
  useEffect(
    () => () => {
      maps.rough.dispose();
      maps.normal.dispose();
      maps.baseNormal.dispose();
    },
    [maps],
  );
  useFrame((_, dt) => {
    if (!getState().reduced)
      maps.normal.offset.y += dt * REFLECTION.normalScroll;
    maps.baseNormal.offset.y = maps.basePhase + maps.normal.offset.y;
  });
  return (
    <>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[LAYOUT.ground, LAYOUT.ground]} />
        <meshStandardMaterial
          color={C.asphalt}
          roughness={REFLECTION.roughness}
          normalMap={maps.baseNormal}
          normalScale={normalScale}
        />
      </mesh>
      <mesh
        position={[0, REFLECTION.y, REFLECTION.z]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry args={[REFLECTION.width, REFLECTION.length]} />
        <MeshReflectorMaterial
          resolution={
            mobile ? REFLECTION.mobileResolution : REFLECTION.resolution
          }
          blur={mobile ? REFLECTION.mobileBlur : REFLECTION.blur}
          mixBlur={mobile ? REFLECTION.mobileMixBlur : REFLECTION.mixBlur}
          mixStrength={REFLECTION.strength}
          mixContrast={REFLECTION.contrast}
          depthScale={REFLECTION.depthScale}
          minDepthThreshold={REFLECTION.minDepth}
          maxDepthThreshold={REFLECTION.maxDepth}
          depthToBlurRatioBias={REFLECTION.depthBias}
          distortion={
            mobile ? REFLECTION.mobileDistortion : REFLECTION.distortion
          }
          distortionMap={maps.rough}
          mirror={0}
          color={C.asphaltWet}
          roughness={mobile ? REFLECTION.mobileRoughness : REFLECTION.roughness}
          roughnessMap={maps.rough}
          normalMap={maps.normal}
          normalScale={normalScale}
          metalness={0}
        />
      </mesh>
    </>
  );
}
