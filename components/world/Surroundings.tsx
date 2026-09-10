"use client";
import { useEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, MeshStandardMaterial, PlaneGeometry, type Texture } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useFrame } from "@react-three/fiber";
import { flickerAt } from "@/lib/flicker";
import { getState } from "@/lib/store";
import type { SurfaceMaterials } from "@/lib/textures/surfaces";
import Instances, { type Part } from "./Instances";
import {
  BEND,
  BAKERY,
  C,
  CONVENIENCE,
  EMISSION,
  FLICKER,
  LAYOUT,
  MATERIAL,
  NEON,
  PROP,
  SHOP,
  SIGN,
  STORE_RUNS,
  STRINGS,
  WINDOWS,
  type V3,
} from "@/lib/world";
import {
  paintGate,
  paintSign,
} from "@/lib/textures/painters";
const box = (position: V3, scale: V3, color?: string, rotation?: V3): Part => ({
  position,
  scale,
  color,
  rotation,
});
function build() {
  const concrete: Part[] = [],
    frame: Part[] = [],
    metal: Part[] = [],
    shutters: Part[] = [],
    dark: Part[] = [],
    fabric: Part[] = [],
    cables: Part[] = [],
    windows: { pos: V3; rotation: V3; variant: number; height: number }[] = [],
    lit: Part[] = [];
  for (const side of [-1, 1]) {
    const run = side < 0 ? STORE_RUNS.west : STORE_RUNS.east;
    run.forEach(([start, b], i) => {
      const a = Math.max(start, LAYOUT.gateZ + LAYOUT.wall/2 + SHOP.jamb);
      const hasDoor = i !== 0;
      const open = (side === CONVENIENCE.side && i === CONVENIENCE.index) || (side === BAKERY.side && i === BAKERY.index);
      const w = b - a,
        z = (a + b) / 2,
        inner = side * 4.15,
        doorZ =
          i % 2 === 0
            ? a + 0.3 + SHOP.doorWidth / 2
            : b - 0.3 - SHOP.doorWidth / 2;
      concrete.push(
        box(
          [side * 4.4, LAYOUT.kerb.height + 0.05, z],
          [0.2, 0.1, w],
          C.concrete,
        ),
      );
      concrete.push(
        box(
          [side * 4.325, (SHOP.head + SHOP.height) / 2, z],
          [0.35, SHOP.height - SHOP.head, w],
          side < 0 ? C.facadeWarm : C.facade,
        ),
      );
      for (const edge of [a, b])
        concrete.push(
          box(
            [inner, SHOP.head / 2, edge],
            [0.35, SHOP.head, 0.12],
            C.concrete,
          ),
        );
      if (!open) dark.push(
        box(
          [side * 4.31, SHOP.head / 2, z],
          [0.03, SHOP.head, w - 0.3],
          C.void,
        ),
      );
      const shutterStart =
          hasDoor && i % 2 === 0 ? a + 0.3 + SHOP.doorWidth + SHOP.jamb * 2 : a + 0.3,
        shutterEnd =
          !hasDoor || i % 2 === 0 ? b - 0.3 : b - 0.3 - SHOP.doorWidth - SHOP.jamb * 2,
        sw = shutterEnd - shutterStart,
        sz = (shutterStart + shutterEnd) / 2,
        ajar = false;
      const bottom = open ? SHOP.head : ajar ? SHOP.ajar : 0.1;
      for (
        let y = bottom + SHOP.slatPitch / 2;
        y < SHOP.head;
        y += SHOP.slatPitch
      )
        shutters.push(
          box(
            [side * 4.24, y, sz],
            [SHOP.slatDepth, SHOP.slatPitch * SHOP.slatFill, sw],
            C.shutter,
          ),
        );
      const roll = open ? Math.sqrt(SHOP.roll*SHOP.roll+(SHOP.head-0.1)*SHOP.slatDepth/Math.PI) : SHOP.roll;
      metal.push(
        box(
          [side * 4.18, SHOP.head, sz],
          [roll, sw, roll],
          C.metalDark,
          [Math.PI / 2, 0, 0],
        ),
      );
      if (hasDoor) {
      dark.push(
        box(
          [side * 4.23, (SHOP.doorHeight + LAYOUT.kerb.height) / 2, doorZ],
          [SHOP.slatDepth, SHOP.doorHeight - LAYOUT.kerb.height, SHOP.doorWidth],
          C.shutter,
        ),
      );
      for (const end of [-1, 1])
        concrete.push(
          box(
            [
              side * 4.2,
              SHOP.doorHeight / 2,
              doorZ + (end * (SHOP.doorWidth + SHOP.jamb)) / 2,
            ],
            [0.15, SHOP.doorHeight, SHOP.jamb],
            C.metalDark,
          ),
        );
      concrete.push(
        box(
          [side * 4.2, SHOP.doorHeight + SHOP.jamb / 2, doorZ],
          [0.15, SHOP.jamb, SHOP.doorWidth + SHOP.jamb * 2],
          C.metalDark,
        ),
      );
      dark.push(box([side*4.205,SHOP.doorHeight/4,doorZ],[SHOP.slatDepth/2,SHOP.doorHeight/4,SHOP.doorWidth-SHOP.jamb*2],C.metalDark));
      const latchZ=doorZ+SHOP.doorWidth/3;
      concrete.push(box([side*4.19,SHOP.doorHeight/2,latchZ],[SHOP.slatDepth,SHOP.jamb*2,SHOP.jamb],C.metalDark));
      concrete.push(box([side*(4.19-SHOP.slatDepth),SHOP.doorHeight/2,latchZ-SHOP.jamb/2],[SHOP.slatDepth,SHOP.slatDepth,SHOP.jamb*2],C.signWhite));
      for(const fraction of [1/4,1/2,3/4]) metal.push(box([side*4.19,SHOP.doorHeight*fraction,doorZ-SHOP.doorWidth/2],[SHOP.slatDepth/2,SHOP.jamb,SHOP.slatDepth/2],C.metalDark));
      }
      if (ajar && !open)
        lit.push(
          box(
            [side * 4.3, SHOP.ajar / 2, sz],
            [0.02, SHOP.ajar, sw],
            side < 0 ? C.sodium : C.vendGlow,
          ),
        );
      if (
        (side < 0 && [1, 4].includes(i)) ||
        (side > 0 && [0, 2, 5].includes(i))
      ) {
        fabric.push(
          box(
            [side * (4.5 - SHOP.awningDepth / 2), SHOP.awningY, z],
            [SHOP.awningDepth, 0.07, w],
            i % 2 ? C.lantern : C.facade,
          ),
        );
        metal.push(
          box(
            [side * (4.5 - SHOP.awningDepth), SHOP.awningY, z],
            [SHOP.barRadius, w, SHOP.barRadius],
            C.metalDark,
            [Math.PI / 2, 0, 0],
          ),
        );
      }
    });
    const height = side < 0 ? WINDOWS.floor * 3 : WINDOWS.floor * 2;
    for (let bay = 0; bay < 6; bay++) {
      windows.push({
        pos: [side * (4.5 - 0.004), WINDOWS.base + height / 2, -20 + bay * 8],
        rotation: [0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0],
        variant: bay % 3,
        height,
      });
      const edgePier = (WINDOWS.pitch - WINDOWS.width) / 2;
      for (let column = 0; column <= WINDOWS.bay / WINDOWS.pitch; column++) {
        const edge = column === 0 || column === WINDOWS.bay / WINDOWS.pitch;
        const width = edge ? edgePier : edgePier * 2;
        const z = -24 + bay * WINDOWS.bay + column * WINDOWS.pitch + (column === 0 ? width / 2 : column === 5 ? -width / 2 : 0);
        frame.push(box([side * (LAYOUT.width / 2 - WINDOWS.panelOffset - WINDOWS.pierDepth / 2), WINDOWS.base + height / 2, z], [WINDOWS.pierDepth, height, width], C.facade));
      }
      const floors = Math.floor(height / WINDOWS.floor);
      for (let level = 0; level <= floors; level++) {
        const bottom = level === 0 ? 0 : (level - 1) * WINDOWS.floor + WINDOWS.sill + WINDOWS.height;
        const top = level === floors ? height : level * WINDOWS.floor + WINDOWS.sill;
        frame.push(box([side * (LAYOUT.width / 2 - WINDOWS.panelOffset - WINDOWS.spandrelDepth / 2), WINDOWS.base + (bottom + top) / 2, -20 + bay * WINDOWS.bay], [WINDOWS.spandrelDepth, top - bottom, WINDOWS.bay], C.facade));
      }
    }
  }
  // The shutter behind spawn: the same manufactured slat pitch as every shop.
  for (let y = SHOP.slatPitch / 2; y < 3.4; y += SHOP.slatPitch)
    shutters.push(
      box(
        [0, y, -22.47],
        [9, SHOP.slatPitch * SHOP.slatFill, SHOP.slatDepth],
        C.shutter,
      ),
    );
  metal.push(
    box([0, 3.4, -22.44], [SHOP.roll, 9, SHOP.roll], C.metalDark, [
      0,
      0,
      Math.PI / 2,
    ]),
  );
  concrete.push(
    box(
      [
        BEND.x - 0.65 * Math.sin(BEND.angle),
        LAYOUT.kerb.height / 2 - 0.002,
        BEND.z - 0.65 * Math.cos(BEND.angle),
      ],
      [6, LAYOUT.kerb.height, LAYOUT.kerb.width],
      C.concrete,
      [0, BEND.angle, 0],
    ),
  );
  // Three-segment catenaries: all spans are instances of one cylinder.
  for (let i = 0; i < PROP.cable.count; i++) {
    const z = -22 + (i * 44) / (PROP.cable.count - 1),
      y = PROP.cable.minY + ((i % 6) / 5) * (PROP.cable.maxY - PROP.cable.minY),
      sag =
        PROP.cable.minSag +
        ((i % 4) / 3) * (PROP.cable.maxSag - PROP.cable.minSag),
      offset = ((i % 3) - 1) * 3;
    const points: V3[] = [
      [-4.5, y, z],
      [-1.5, y - sag, z + offset / 3],
      [1.5, y - sag, z + (offset * 2) / 3],
      [4.5, y, z + offset],
    ];
    for (let j = 0; j < 3; j++) {
      const a = points[j],
        b = points[j + 1],
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        dz = b[2] - a[2],
        length = Math.hypot(dx, dy, dz);
      cables.push(
        box(
          [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
          [PROP.cable.radius, length, PROP.cable.radius],
          C.metalDark,
          [Math.atan2(dz, dy), 0, -Math.atan2(dx, Math.hypot(dy, dz))],
        ),
      );
    }
  }
  return { concrete, frame, metal, shutters, dark, fabric, cables, windows, lit };
}
const scene = build();
const flickerColor = new Color();
const rimParts:Part[]=NEON.map((s,i)=>({position:[s.side*(4.5-SIGN.projectionMax),s.y+(s.vertical?STRINGS[i].length*SIGN.charHeight+SIGN.padding:SIGN.horizontalHeight)/2,s.z],scale:[(s.vertical?SIGN.verticalWidth:STRINGS[i].length*SIGN.charWidth+SIGN.horizontalPadding)+SIGN.rim*2,(s.vertical?STRINGS[i].length*SIGN.charHeight+SIGN.padding:SIGN.horizontalHeight)+SIGN.rim*2,SIGN.depth],color:s.color}));
const bracketParts:Part[]=NEON.flatMap((s,i)=>(s.vertical?[-1,1]:[0]).map(end=>({position:[s.side*(4.5-SIGN.projectionMax/2),rimParts[i].position[1]+end*SIGN.bracketOffset,s.z] as V3,scale:[SIGN.projectionMax,SIGN.bracket,SIGN.bracket] as V3,color:C.metalDark})));
const windowParts=[false,true].flatMap(east=>[0,1,2].map(variant=>({east,variant,parts:scene.windows.filter(b=>b.variant===variant&&(b.pos[0]>0)===east).map(b=>({position:b.pos,rotation:b.rotation,scale:[WINDOWS.bay,b.height,1] as V3}))})));
function Sign({index}:{index:number}){
 const material=useRef<MeshStandardMaterial>(null);
 const flicker=FLICKER.signs.find(sign=>sign.index===index);
 useFrame(({clock})=>{if(material.current&&flicker)material.current.emissiveIntensity=EMISSION.sign*(getState().reduced?1:flickerAt(clock.elapsedTime,flicker.phase));});
 const sign=NEON[index],text=STRINGS[index],vertical=sign.vertical,width=vertical?SIGN.verticalWidth:text.length*SIGN.charWidth+SIGN.horizontalPadding,height=vertical?text.length*SIGN.charHeight+SIGN.padding:SIGN.horizontalHeight;
 const data=useMemo(()=>{const front=new PlaneGeometry(width,height),back=new PlaneGeometry(width,height);front.translate(0,0,SIGN.depth/2+.004);back.rotateY(Math.PI);back.translate(0,0,-SIGN.depth/2-.004);const geometry=mergeGeometries([front,back]);front.dispose();back.dispose();return{geometry,map:paintSign(text,sign.color,vertical,vertical?128:512,vertical?512:128)};},[width,height,text,sign.color,vertical]);
 useEffect(()=>()=>{data.geometry.dispose();data.map.dispose();},[data]);
 return <mesh position={rimParts[index].position} geometry={data.geometry}><meshStandardMaterial ref={material} color={C.void} emissive={C.signWhite} emissiveMap={data.map} emissiveIntensity={EMISSION.sign}/></mesh>;
}
function Panel({
  text,
  color,
  position,
  rotation = [0, 0, 0],
  width,
  height,
  emission = EMISSION.shop,
  twoSided = false,
  flickerPhase,
}: {
  text: string;
  color: string;
  position: V3;
  rotation?: V3;
  width: number;
  height: number;
  emission?: number;
  twoSided?: boolean;
  flickerPhase?: number;
}) {
  const material = useRef<MeshStandardMaterial>(null);
  const geometry = useMemo(() => {
    const front = new PlaneGeometry(width, height);
    if (!twoSided) return front;
    const back = new PlaneGeometry(width, height);
    back.rotateY(Math.PI);
    const merged = mergeGeometries([front, back]);
    front.dispose(); back.dispose();
    return merged;
  }, [width, height, twoSided]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({clock}) => {
    if (material.current && flickerPhase !== undefined) material.current.emissiveIntensity = emission * (getState().reduced ? 1 : flickerAt(clock.elapsedTime, flickerPhase));
  });
  const map = useMemo(
    () => paintSign(text, color, false, 512, 128),
    [text, color],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={position} rotation={rotation} geometry={geometry}>
      <meshStandardMaterial
        color={C.void}
        emissive={C.signWhite}
        emissiveMap={map}
        emissiveIntensity={emission}
        ref={material}
      />
    </mesh>
  );
}
export default function Surroundings({ windowMaps, surfaces }: { mobile: boolean; windowMaps: Texture[]; surfaces: SurfaceMaterials }) {
  const rimRef = useRef<InstancedMesh>(null);
  const previousFlicker = useRef([1, 1]);
  useFrame(({clock}) => {
    const mesh = rimRef.current;
    if (!mesh) return;
    for (let i = 0; i < FLICKER.signs.length; i++) {
      const sign = FLICKER.signs[i];
      const factor = getState().reduced ? 1 : flickerAt(clock.elapsedTime, sign.phase);
      if (factor === previousFlicker.current[i]) continue;
      previousFlicker.current[i] = factor;
      mesh.setColorAt(sign.index, flickerColor.set(NEON[sign.index].color).multiplyScalar(EMISSION.tube * factor));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  const eastWindows = useMemo(() => windowMaps.map(map => { const copy = map.clone(); copy.repeat.y = 2 / 3; return copy; }), [windowMaps]);
  useEffect(() => () => eastWindows.forEach(map => map.dispose()), [eastWindows]);
  const maps = useMemo(
    () => ({
      notice: paintGate(),
    }),
    [],
  );
  useEffect(
    () => () => {
      maps.notice.dispose();
    },
    [maps],
  );
  return (
    <>
      <Instances
        parts={scene.concrete}
        material={
          <meshStandardMaterial {...surfaces.concrete} {...MATERIAL.concrete} />
        }
      />
      <Instances
        parts={scene.metal}
        shape="cylinder"
        material={<meshStandardMaterial {...MATERIAL.metal} />}
      />
      <Instances
        parts={scene.shutters}
        material={<meshStandardMaterial {...MATERIAL.shutter} />}
      />
      <Instances
        parts={scene.dark}
        material={<meshStandardMaterial {...MATERIAL.facade} />}
      />
      <Instances
        parts={scene.fabric}
        material={
          <meshStandardMaterial {...surfaces.fabric} {...MATERIAL.fabric} />
        }
      />
      <Instances
        parts={scene.cables}
        shape="cylinder"
        material={<meshStandardMaterial {...MATERIAL.metal} />}
      />
      <Instances
        parts={scene.lit}
        material={
          <meshStandardMaterial
            color={C.void}
            emissive={C.vendGlow}
            emissiveIntensity={EMISSION.spill}
          />
        }
      />
      <Instances meshRef={rimRef} parts={rimParts} colorGain={EMISSION.tube} material={<meshBasicMaterial toneMapped={false}/>}/>
      <Instances parts={bracketParts} material={<meshStandardMaterial {...MATERIAL.metal}/>}/>
      <Instances parts={scene.frame} material={<meshStandardMaterial {...surfaces.facade} {...MATERIAL.facade} />} />
      {windowParts.map(({parts,variant,east},i)=><Instances key={i} parts={parts} shape="plane" material={<meshStandardMaterial color={C.facade} map={(east?eastWindows:windowMaps)[variant]} emissive={C.rain} emissiveMap={(east?eastWindows:windowMaps)[variant]} emissiveIntensity={EMISSION.window} roughness={MATERIAL.facade.roughness}/>}/>)}
      {NEON.map((_, i) => (
        <Sign key={i} index={i} />
      ))}
      {[0, 1, 2].map((i) => (
        <Panel
          key={i}
          text={STRINGS[9 + i]}
          color={[C.neonPink, C.sodium, C.neonCyan][i]}
          position={[0, PROP.cable.minY - PROP.banner.drop, -12 + i * 14]}
          rotation={[0, Math.PI, 0]}
          width={PROP.banner.width}
          height={PROP.banner.height}
          emission={EMISSION.banner}
          twoSided
          flickerPhase={FLICKER.banners[i]}
        />
      ))}
      {[-1, 1].flatMap((side) =>
        (side < 0 ? STORE_RUNS.west : STORE_RUNS.east)
          .filter((_, i) => i % 2 === (side < 0 ? 0 : 1))
          .map(([a, b], i) => (
            <Panel
              key={`${side}-${i}`}
              text={STRINGS[14 + ((i + (side > 0 ? 4 : 0)) % 7)]}
              color={[C.neonPink, C.sodium, C.neonMagenta, C.neonCyan][i]}
              position={[
                side * 4.005,
                SHOP.signY + SHOP.signHeight / 2,
                (a + b) / 2,
              ]}
              rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
              width={SHOP.signWidth}
              height={SHOP.signHeight}
            />
          )),
      )}
      <Panel
        text={STRINGS[13]}
        color={C.signWhite}
        position={[0, 4.2, -22.44]}
        width={1.62}
        height={0.86}
        emission={EMISSION.station}
      />
      <mesh position={[0, 2.1, -22.42]}>
        <planeGeometry args={[1.15, 0.72]} />
        <meshStandardMaterial
          color={C.void}
          emissive={C.signWhite}
          emissiveIntensity={EMISSION.station}
          emissiveMap={maps.notice}
        />
      </mesh>
    </>
  );
}
