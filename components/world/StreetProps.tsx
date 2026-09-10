"use client";
import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, BufferGeometry, Color, Matrix4, Mesh, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  BAKERY,
  C,
  LAYOUT,
  MATERIAL,
  PROP,
  REFINEMENT,
  SHOP,
  STORE_RUNS,
  type V3,
} from "@/lib/world";
import { addCollider } from "@/lib/collisions";
import type { SurfaceMaterials } from "@/lib/textures/surfaces";
import { paintVending } from "@/lib/textures/painters";
import Lanterns from "./Lanterns";
import RubbishBags from "./RubbishBags";
import Instances, { type Part } from "./Instances";
const cones: Part[] = [0,1].map(i=>({position:[i?2.6:3.02,PROP.cone.height/2,i?21.4:-2],scale:[PROP.cone.radius,PROP.cone.height,PROP.cone.radius]}));
const boxes: Part[] = [],
  cylinders: Part[] = [],
  binParts: Part[] = [],
  lanterns: Part[] = [],
  crateParts: Part[] = [],
  grilles: Part[] = [];
const add = (
  list: Part[],
  position: V3,
  scale: V3,
  color: string,
  rotation?: V3,
) => list.push({ position, scale, color, rotation });
const wallX = (side: number, depth: number) => side * (4.3 - depth / 2),
  base = LAYOUT.kerb.height;
const vending = [
  { side: -1, z: -16.8 },
  { side: 1, z: -7.2 },
  { side: -1, z: 7.2 },
  { side: 1, z: BAKERY.end + SHOP.doorWidth + SHOP.jamb + PROP.vending.width/2 },
];
const vendingPanels: Part[] = vending.map(v => ({
  position: [wallX(v.side, PROP.vending.depth) - v.side * (PROP.vending.depth / 2 + 0.004), base + PROP.vending.height / 2, v.z],
  rotation: [0, v.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0],
  scale: [PROP.vending.width, PROP.vending.height, 1],
}));
const scooters = [
  { side: 1, z: -17.6 },
  { side: -1, z: -8 },
  { side: 1, z: 4.6 },
  { side: -1, z: 18.6 },
];
for (const machine of vending) {
  const v = PROP.vending,
    x = wallX(machine.side, v.depth);
  add(
    boxes,
    [x, base + v.height / 2, machine.z],
    [v.depth, v.height, v.width],
    C.shutter,
  );
  addCollider(`vending-${machine.z}`, x, machine.z, v.depth, v.width);
}
for (let i = 0; i < 9; i++) {
  const side = i % 2 ? -1 : 1,
    initialZ = -20 + i * 4.6,
    run = side < 0 ? STORE_RUNS.west : STORE_RUNS.east,
    bayIndex = run.findIndex(([a,b])=>initialZ>=a && initialZ<=b),
    bay = run[bayIndex],
    doorZ = bay && bayIndex>0 ? (bayIndex%2===0 ? bay[0]+0.3+SHOP.doorWidth/2 : bay[1]-0.3-SHOP.doorWidth/2) : Infinity,
    clearance = (SHOP.doorWidth+PROP.crate.width)/2+SHOP.jamb*2,
    z = Math.abs(initialZ-doorZ)<clearance ? doorZ+(initialZ<doorZ ? -clearance : clearance) : initialZ,
    x = wallX(side, PROP.crate.depth),
    count = 2 + (i % 3);
  for (let row = 0; row < count; row++) {
    const y = base + PROP.crate.height * (row + 0.5),
      color = [C.crateKraft, C.crateTimber, C.concrete, C.metalDark][i % 4];
    add(
      crateParts,
      [x, y, z],
      [PROP.crate.depth, PROP.crate.height, PROP.crate.width],
      color,
    );
    for (const line of [-1, 1])
      add(
        boxes,
        [
          x - side * (PROP.crate.depth / 2 + 0.004),
          y,
          z + (line * PROP.crate.width) / 4,
        ],
        [0.004, PROP.crate.height, SHOP.slatDepth],
        C.metalDark,
      );
  }
  addCollider(`crates-${i}`, x, z, PROP.crate.depth, PROP.crate.width);
}
for (let i = 0; i < 2; i++) {
  const side = i ? -1 : 1,
    z = i ? 19.8 : -12.6,
    x = wallX(side, PROP.bin.radius * 2),
    b = PROP.bin;
  add(
    binParts,
    [x, base + b.height / 2, z],
    [b.radius, b.height, b.radius],
    C.metalDark,
  );
  for (const y of [b.height / 4, (b.height * 3) / 4, b.height])
    add(binParts, [x, base + y, z], [b.lid, SHOP.slatDepth, b.lid], C.shutter);
  add(
    binParts,
    [x, base + b.height + SHOP.slatDepth, z],
    [b.lid, SHOP.slatDepth, b.lid],
    C.metalDark,
  );
  add(
    binParts,
    [x, base + b.height + SHOP.slatDepth * 2, z],
    [PROP.pipe.radius, SHOP.slatDepth, PROP.pipe.radius],
    C.metalDark,
  );
  for (let rib=0;rib<REFINEMENT.bin.ribs;rib++) {
    const angle=rib/REFINEMENT.bin.ribs*Math.PI*2;
    add(binParts,[x+Math.cos(angle)*b.radius,base+b.height/2,z+Math.sin(angle)*b.radius],[REFINEMENT.bin.ribRadius,b.height,REFINEMENT.bin.ribRadius],C.metalDark);
  }
  addCollider(`bin-${i}`, x, z, b.radius * 2, b.radius * 4);
}
for (const side of [-1, 1]) {
  const run = side < 0 ? STORE_RUNS.west : STORE_RUNS.east;
  const joints = run
    .flatMap(([a, b]) => [a, b])
    .filter((z, i, all) => all.indexOf(z) === i && z > LAYOUT.gateZ+LAYOUT.wall/2 && z < LAYOUT.bounds.maxZ);
  for (let i = 0; i < joints.length; i++) {
    const z = joints[i],
      height = i % 2 ? PROP.pipe.short : PROP.pipe.tall;
    add(
      cylinders,
      [side * 4.09, (height + PROP.pipe.base) / 2, z],
      [PROP.pipe.radius, height - PROP.pipe.base, PROP.pipe.radius],
      C.metalDark,
    );
    for (const y of [height / 4, (height * 3) / 4])
      add(
        cylinders,
        [side * 4.09, y, z],
        [
          PROP.pipe.radius + SHOP.slatDepth,
          SHOP.slatDepth,
          PROP.pipe.radius + SHOP.slatDepth,
        ],
        C.shutter,
      );
    // A return into the facade and solid mounting blocks make the run supported.
    add(cylinders,[side*(4.09+4.5)/2,height,z],[PROP.pipe.radius,4.5-4.09,PROP.pipe.radius],C.metalDark,[0,0,Math.PI/2]);
    for(const y of [height/4,height*3/4])add(boxes,[side*(4.09+4.5)/2,y,z],[4.5-4.09,SHOP.slatDepth,PROP.pipe.radius],C.metalDark);
    if (i < 6)
      addCollider(
        `pipe-${side}-${i}`,
        side * 4.09,
        z,
        PROP.pipe.radius * 2,
        PROP.pipe.radius * 2,
      );
  }
}
for (let i = 0; i < 11; i++) {
  const side = i % 2 ? -1 : 1,
    lan = PROP.lantern;
  let z = -20 + i * 4;
  const signRuns=(side<0?STORE_RUNS.west:STORE_RUNS.east).filter((_,index)=>index%2===(side<0?0:1));
  for(const [a,b] of signRuns){
    const center=(a+b)/2,clearance=SHOP.signWidth/2+lan.radius+SHOP.jamb;
    if(Math.abs(z-center)<clearance)z=center+(z<center?-clearance:clearance);
  }
  add(
    lanterns,
    [side * (4.5 - lan.bracket - lan.radius), lan.y, z],
    [lan.radius, lan.height, lan.radius],
    C.lantern,
  );
  add(boxes,[side*(4.5-SHOP.slatDepth/2),lan.y+lan.height*3/4,z],[SHOP.slatDepth,lan.radius,lan.radius],C.metalDark);
  add(cylinders,[side*(4.5-lan.bracket-lan.radius),lan.y+lan.height*5/8,z],[SHOP.slatDepth/2,lan.height/4,SHOP.slatDepth/2],C.metalDark);
  for (const end of [-1, 1])
    add(
      cylinders,
      [side * (4.5 - lan.bracket - lan.radius), lan.y + (end * lan.height) / 2, z],
      [lan.radius / 2, SHOP.slatDepth, lan.radius / 2],
      C.void,
    );
  add(
    boxes,
    [side * (4.5 - (lan.bracket + lan.radius) / 2), lan.y + lan.height * 3/4, z],
    [lan.bracket + lan.radius, SHOP.slatDepth, SHOP.slatDepth],
    C.metalDark,
  );
}
for (let i = 0; i < 16; i++) {
  const side = i % 2 ? -1 : 1,
    z = -20 + Math.floor(i / 2) * 6.2,
    y = i % 3 ? 4.6 : 6.5,
    w = PROP.vending.width,
    h = PROP.vending.depth,
    d = PROP.crate.depth;
  add(boxes, [wallX(side, d), y, z], [d, h, w], C.metalDark);
  add(
    cylinders,
    [wallX(side, d) - (side * d) / 2, y, z - w / 4],
    [h / 3, SHOP.slatDepth, h / 3],
    C.void,
    [0, 0, Math.PI / 2],
  );
  for (let slat = 0; slat < 6; slat++)
    add(
      grilles,
      [
        wallX(side, d) - side * (d / 2 + SHOP.slatDepth),
        y - h / 3 + (slat * h) / 9,
        z + w / 4,
      ],
      [SHOP.slatDepth, SHOP.slatDepth, w / 3],
      C.shutter,
    );
  for (const end of [-1, 1])
    add(
      boxes,
      [wallX(side, d), y - h / 2, z + (end * w) / 3],
      [d + SHOP.jamb, SHOP.slatDepth, SHOP.slatDepth],
      C.metalDark,
    );
}
for (let i = 0; i < 2; i++) {
  const side = i ? -1 : 1,
    z = i ? 6.2 : -20.65,
    p = PROP.pole;
  add(
    cylinders,
    [side * p.x, base + p.height / 2, z],
    [p.radius, p.height, p.radius],
    C.concrete,
  );
  for (const y of [6.4, 7.1])
    add(
      boxes,
      [side * p.x, y, z],
      [PROP.vending.width, SHOP.jamb, SHOP.jamb],
      C.metalDark,
    );
  addCollider(`pole-${i}`, side * p.x, z, p.radius * 2, p.radius * 2);
}
for (let i = 0; i < 3; i++) {
  const z = -12 + i * 14;
  add(
    boxes,
    [3.02, 0.004, z],
    [PROP.crate.width, SHOP.slatDepth, PROP.crate.depth],
    C.void,
  );
  for (let j = 0; j < 6; j++)
    add(
      grilles,
      [3.02 - PROP.crate.width / 2 + j * SHOP.slatPitch, 0.024, z],
      [SHOP.slatDepth, SHOP.slatDepth, PROP.crate.depth],
      C.metalDark,
    );
}
for (let i = 0; i < 2; i++) {
  const x = i ? 2.6 : 3.02,
    z = i ? 21.4 : -2;
  add(
    boxes,
    [x, SHOP.slatDepth / 2, z],
    [PROP.cone.foot, SHOP.slatDepth, PROP.cone.foot],
    C.void,
  );
  addCollider(`cone-${i}`, x, z, PROP.cone.foot, PROP.cone.foot);
}
for (let i = 0; i < 5; i++) {
  const x = 0.9 + (i * (4.15 - 0.9)) / 4;
  add(boxes, [x, 0.84 / 2, 22], [0.07, 0.84, 0.07], C.metalDark);
}
for (const y of [0.84, 0.52])
  add(boxes, [(0.9 + 4.15) / 2, y, 22], [4.15 - 0.9, 0.07, 0.07], C.metalDark);
addCollider("guardrail", (0.9 + 4.15) / 2, 22, 4.15 - 0.9, 0.07);
for (const scooter of scooters)
  addCollider(
    `scooter-${scooter.z}`,
    wallX(scooter.side, PROP.scooter.width),
    scooter.z,
    PROP.scooter.width,
    PROP.scooter.length,
  );
function Scooters() {
  const gltf = useGLTF("/vespa.glb");
  const geometry = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(gltf.scene),
      size = bounds.getSize(new Vector3()),
      center = bounds.getCenter(new Vector3()),
      scale = PROP.scooter.length / Math.max(size.x, size.z);
    const groups: BufferGeometry[][] = [[], [], []];
    gltf.scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const material = Array.isArray(o.material) ? o.material[0] : o.material,
        color = material.color as Color | undefined,
        light = color ? Math.max(color.r, color.g, color.b) : 1,
        bucket = light < 0.1 ? 1 : light < 0.4 ? 2 : 0;
      const geo = o.geometry.clone();
      geo.applyMatrix4(o.matrixWorld);
      geo.translate(-center.x, -bounds.min.y, -center.z);
      geo.scale(scale, scale, scale);
      if (size.z > size.x) geo.rotateY(Math.PI / 2);
      geo.deleteAttribute("uv");
      geo.deleteAttribute("uv1");
      geo.deleteAttribute("color");
      if (geo.index) {
        const nonindexed = geo.toNonIndexed();
        geo.dispose();
        groups[bucket].push(nonindexed);
      } else groups[bucket].push(geo);
    });
    return groups.map((parts) => {
      const merged = parts.length ? mergeGeometries(parts) : null;
      parts.forEach((p) => p.dispose());
      return merged;
    });
  }, [gltf.scene]);
  useEffect(() => () => geometry.forEach((g) => g?.dispose()), [geometry]);
  const matrices = useMemo(
    () =>
      scooters.map((s) =>
        new Matrix4()
          .makeRotationY(s.side > 0 ? Math.PI / 2 : -Math.PI / 2)
          .setPosition(wallX(s.side, PROP.scooter.width), base, s.z),
      ),
    [],
  );
  return (
    <>
      {geometry.map(
        (geo, i) =>
          geo && (
            <instancedMesh
              key={i}
              args={[geo, undefined, scooters.length]}
              ref={(mesh) => {
                if (mesh) {
                  matrices.forEach((matrix, j) => mesh.setMatrixAt(j, matrix));
                  mesh.instanceMatrix.needsUpdate = true;
                }
              }}
            >
              <meshStandardMaterial
                color={[C.scooterPaint, C.void, C.metalDark][i]}
                {...MATERIAL.metal}
              />
            </instancedMesh>
          ),
      )}
    </>
  );
}
export default function StreetProps({ mobile, surfaces }: { mobile: boolean; surfaces: SurfaceMaterials }) {
  const maps = useMemo(
    () => ({ vending: paintVending(mobile) }),
    [mobile],
  );
  useEffect(
    () => () => {
      maps.vending.dispose();
    },
    [maps],
  );
  return (
    <>
      <Instances
        parts={boxes}
        material={<meshStandardMaterial {...MATERIAL.metal} />}
      />
      <Instances
        parts={cylinders}
        shape="cylinder"
        material={<meshStandardMaterial {...MATERIAL.metal} />}
      />
      <Instances parts={binParts} shape="cylinder" material={<meshStandardMaterial {...surfaces.metal} {...MATERIAL.metal} />} />
      <RubbishBags />
      <Instances
        parts={grilles}
        material={<meshStandardMaterial {...MATERIAL.metal} />}
      />
      <Instances
        parts={crateParts}
        material={
          <meshStandardMaterial {...surfaces.crate} {...MATERIAL.concrete} />
        }
      />
      <Lanterns parts={lanterns} />
      <Instances parts={vendingPanels} shape="plane" material={<meshStandardMaterial map={maps.vending} {...MATERIAL.metal} />} />
      <Instances parts={cones} shape="cylinder" topRadius={PROP.cone.top/PROP.cone.radius} material={<meshStandardMaterial color={C.sodium} {...MATERIAL.fabric}/>} />
      <Suspense fallback={null}>
        <Scooters />
      </Suspense>
    </>
  );
}
