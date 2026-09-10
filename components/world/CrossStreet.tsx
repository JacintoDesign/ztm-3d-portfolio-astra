"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  Vector3,
  Vector2,
  SRGBColorSpace,
  MeshStandardMaterial,
  type Texture,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, EMISSION, MATERIAL, STRINGS, TRAFFIC, WINDOWS } from "@/lib/world";
import { trafficX } from "@/lib/traffic";
import { getState } from "@/lib/store";
import { paintSign } from "@/lib/textures/painters";
import { createVehicleLamps } from "./vehicle-lamps";
import Instances, { type Part } from "./Instances";
const variants = TRAFFIC.models;
const marks: Part[] = Array.from({ length: 16 }, (_, i) => ({
  position: [-40 + i * 5, 0.024, 28.9],
  scale: [2, 0.004, 0.12],
  color: C.signWhite,
}));
function Car({
  variant,
  index,
  lane,
}: {
  variant: number;
  index: number;
  lane: number;
}) {
  const gltf = useGLTF(variants[variant].file),
    ref = useRef<Group>(null);
  const geometry = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(gltf.scene),
      size = bounds.getSize(new Vector3()),
      center = bounds.getCenter(new Vector3()),
      scale = variants[variant].length / Math.max(size.x, size.z),
      pieces: BufferGeometry[] = [];
    gltf.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      let geo = object.geometry.clone();
      geo.applyMatrix4(object.matrixWorld);
      geo.translate(-center.x, -bounds.min.y, -center.z);
      geo.scale(scale, scale, scale);
      if (size.z > size.x) geo.rotateY(Math.PI / 2);
      if (geo.index) {
        const indexed = geo;
        geo = indexed.toNonIndexed();
        indexed.dispose();
      }
      const material = Array.isArray(object.material)
          ? object.material[0]
          : object.material,
        original = material.color as Color | undefined;
      const tint = original ?? new Color(C.shutter);
      const map = (material as MeshStandardMaterial).map;
      let pixels: ImageData | undefined;
      if (map?.image) {
        const image = map.image as HTMLImageElement;
        const canvas = document.createElement("canvas");
        canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      }
      const uv = new Vector2(), sample = new Color();
      const originalColors = geo.attributes.color;
      const colors = new Float32Array(geo.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) {
        sample.copy(tint);
        if (pixels && map && geo.attributes.uv) {
          uv.fromBufferAttribute(geo.attributes.uv, i / 3);
          map.transformUv(uv);
          const x = Math.min(pixels.width - 1, Math.max(0, Math.floor(uv.x * pixels.width)));
          const y = Math.min(pixels.height - 1, Math.max(0, Math.floor(uv.y * pixels.height)));
          const offset = (y * pixels.width + x) * 4;
          sample.setRGB(pixels.data[offset] / 255, pixels.data[offset + 1] / 255, pixels.data[offset + 2] / 255, SRGBColorSpace).multiply(tint);
        }
        if (originalColors) {
          sample.r *= originalColors.getX(i / 3);
          sample.g *= originalColors.getY(i / 3);
          sample.b *= originalColors.getZ(i / 3);
        }
        colors[i] = sample.r;
        colors[i + 1] = sample.g;
        colors[i + 2] = sample.b;
      }
      geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
      for (const name of Object.keys(geo.attributes))
        if (!["position", "normal", "color"].includes(name))
          geo.deleteAttribute(name);
      pieces.push(geo);
    });
    const merged = mergeGeometries(pieces);
    pieces.forEach((p) => p.dispose());
    return merged;
  }, [gltf.scene, variant]);
  const lamps = useMemo(() => createVehicleLamps(geometry), [geometry]);
  useEffect(() => () => { geometry?.dispose(); lamps?.dispose(); }, [geometry, lamps]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.x = trafficX(clock.elapsedTime, lane, index, getState().reduced);
  });
  if (!geometry) return null;
  return (
    <group
      ref={ref}
      position={[0, 0, TRAFFIC.lanes[lane].z]}
      rotation-y={lane ? Math.PI : 0}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors {...MATERIAL.metal} />
      </mesh>
      {lamps && <mesh geometry={lamps}><meshBasicMaterial vertexColors /></mesh>}
    </group>
  );
}
function FarSigns() {
  const maps = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) =>
        paintSign(
          STRINGS[i],
          [C.neonMagenta, C.sodium, C.neonPink, C.neonCyan, C.neonBlue][i % 5],
          true,
          128,
          512,
        ),
      ),
    [],
  );
  useEffect(() => () => maps.forEach((t) => t.dispose()), [maps]);
  const groups=useMemo(()=>Array.from({length:9},(_,variant)=>Array.from({length:22},(_,i)=>i).filter(i=>i%9===variant).map(i=>{const size=[[1.1,2.6],[.8,1.6],[1.3,3.2]][i%3];return{position:[-25+i*2.9,size[1]/2+.12,32.68] as [number,number,number],rotation:[0,Math.PI,0] as [number,number,number],scale:[size[0],size[1],1] as [number,number,number]};})),[]);
 return <>{groups.map((parts,i)=><Instances key={i} parts={parts} shape="plane" material={<meshStandardMaterial color={C.void} emissive={C.signWhite} emissiveMap={maps[i]} emissiveIntensity={1.25}/>}/>)}</>;

}
const farWindowHeight = Math.floor((TRAFFIC.building.height - WINDOWS.base) / WINDOWS.floor) * WINDOWS.floor;
const farWindows: Part[][] = [0, 1, 2].map(variant => Array.from({length: TRAFFIC.building.width / WINDOWS.bay}, (_, i) => i).filter(i => i % 3 === variant).map(i => ({position: [-TRAFFIC.building.width / 2 + (i + .5) * WINDOWS.bay, WINDOWS.base + farWindowHeight / 2, TRAFFIC.building.faceZ - WINDOWS.panelOffset], rotation: [0, Math.PI, 0], scale: [WINDOWS.bay, farWindowHeight, 1]})));
export default function CrossStreet({ windowMaps }: { windowMaps: Texture[] }) {
  return (
    <>
      <mesh position={[0, 7, 33.3]}>
        <boxGeometry args={[80, 14, 1]} />
        <meshStandardMaterial color={C.facade} {...MATERIAL.facade} />
      </mesh>
      <mesh position={[0, 0.06, 32.25]}>
        <boxGeometry args={[80, 0.12, 1.3]} />
        <meshStandardMaterial color={C.concrete} {...MATERIAL.concrete} />
      </mesh>
      <Instances
        parts={marks}
        material={
          <meshBasicMaterial color={C.signWhite} transparent opacity={0.22} />
        }
      />
      {farWindows.map((parts, i) => <Instances key={i} parts={parts} shape="plane" material={<meshStandardMaterial color={C.facade} map={windowMaps[i]} emissive={C.rain} emissiveMap={windowMaps[i]} emissiveIntensity={EMISSION.window} {...MATERIAL.facade} />} />)}
      <FarSigns />
      <Suspense fallback={null}>
        {[0, 1].flatMap((lane) =>
          [0, 1, 2].map((variant, index) => (
            <Car
              key={`${lane}-${variant}`}
              lane={lane}
              variant={variant}
              index={index}
            />
          )),
        )}
      </Suspense>
    </>
  );
}
