"use client";
import { useEffect, useMemo } from "react";
import { DoubleSide, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Content } from "@/lib/content";
import {
  C,
  CAMERA,
  CART,
  EMISSION,
  LAYOUT,
  MAIL,
  MATERIAL,
  PROP,
  REFINEMENT,
  type V3,
} from "@/lib/world";
import { getState, input, openOverlay } from "@/lib/store";
import { registerStation } from "@/lib/stations";
import { addCollider } from "@/lib/collisions";
import { canvas, texture, paintSign } from "@/lib/textures/painters";
import NoodleDetails from "./NoodleDetails";
import Instances, { type Part } from "./Instances";
const cartParts: Part[] = [];
const cartMetal: Part[] = [];
const cartCloth: Part[] = [];

const add = (
  list: Part[],
  position: V3,
  scale: V3,
  color: string,
  rotation?: V3,
) => list.push({ position, scale, color, rotation });
const timber = C.crateTimber,
  beam = PROP.pipe.radius * 2;
// All detail dimensions derive from the authored cart, canopy modules and pipe stock.
add(cartParts, [0, CART.counterY, 0], [CART.width, beam, CART.depth], timber);
add(
  cartParts,
  [0, CART.counterY / 2, -CART.depth / 2 + beam / 2],
  [CART.width, CART.counterY, beam],
  timber,
);
for (const end of [-1, 1]) {
  add(
    cartParts,
    [(end * (CART.width - beam)) / 2, CART.counterY / 2, 0],
    [beam, CART.counterY, CART.depth],
    timber,
  );
  for (const depth of [-1, 1]) {
    add(
      cartParts,
      [
        (end * (CART.width - beam)) / 2,
        CART.height / 2,
        (depth * (CART.depth - beam)) / 2,
      ],
      [beam, CART.height, beam],
      timber,
    );
    add(
      cartParts,
      [
        (end * (CART.width - beam)) / 2,
        beam / 2,
        (depth * (CART.depth - beam)) / 2,
      ],
      [beam * 2, beam, beam * 2],
      C.metalDark,
    );
  }
}
add(
  cartParts,
  [0, CART.height, 0],
  [CART.width + beam, CART.height - CART.canopyY, CART.depth + beam],
  C.shutter,
);
for (let i = 0; i < 4; i++) {
  add(
    cartParts,
    [
      -CART.width / 2 + ((i + 0.5) * CART.width) / 4,
      CART.canopyY - beam / 2,
      0,
    ],
    [beam, beam, CART.depth],
    timber,
  );
  const end = i < 2 ? -1 : 1;
  add(
    cartCloth,
    [
      end * (CART.width / 2 - CART.clothWidth * ((i % 2) + 0.5)),
      CART.canopyY - CART.clothHeight / 2,
      CART.depth / 2,
    ],
    [CART.clothWidth, CART.clothHeight, beam / 4],
    C.lantern,
  );
}
for (let i = 0; i < 2; i++) {
  add(
    cartMetal,
    [
      -CART.width / 2 + PROP.bin.radius,
      PROP.bin.radius,
      ((i ? 1 : -1) * 0.58) / 2,
    ],
    [PROP.bin.radius, beam, PROP.bin.radius],
    C.metalDark,
    [Math.PI / 2, 0, 0],
  );

}
addCollider("food-cart", CART.x, CART.z, CART.depth, CART.width);
REFINEMENT.stool.x.forEach((x,i)=>addCollider(`cart-stool-${i}`,CART.x-REFINEMENT.stool.z,CART.z+x,REFINEMENT.stool.radius*2,REFINEMENT.stool.radius*2));
const canopyParts:Part[]=Array.from({length:CART.panels},(_,i)=>({position:[-CART.width/2+(i+.5)*CART.width/CART.panels,CART.canopyY,0],rotation:[Math.PI/2,0,0],scale:[CART.panelWidth,CART.panelHeight,1]}));
function FoodCart({ label }: { label: string }) {
  const map = useMemo(
    () => paintSign(label.toUpperCase(), C.vendGlow, false, 512, 128),
    [label],
  );
  useEffect(() => () => map.dispose(), [map]);
  return (
    <group
      position={[CART.x, LAYOUT.kerb.height, CART.z]}
      rotation-y={-Math.PI / 2}
      onClick={(e) => {
        e.stopPropagation();
        if (
          e.delta <= CAMERA.clickGuard &&
          input.pointerTravel <= CAMERA.clickGuard &&
          getState().mode !== "loading"
        )
          openOverlay("about");
      }}
    >
      <NoodleDetails structure={cartParts} hardware={cartMetal} />
      <Instances parts={canopyParts} shape="plane" material={<meshStandardMaterial color={C.void} emissive={C.vendGlow} emissiveIntensity={EMISSION.bio} side={DoubleSide}/>}/>
      <mesh position={[0, CART.counterY - 0.3 / 2, CART.depth / 2 + REFINEMENT.stool.leg + 0.004]}>
        <planeGeometry args={[CART.signWidth, CART.signHeight]} />
        <meshStandardMaterial
          color={C.void}
          emissive={C.signWhite}
          emissiveMap={map}
          emissiveIntensity={EMISSION.bio}
        />
      </mesh>
    </group>
  );
}
function Mailboxes({content}:{content:Content}){
 const channels=content.channels,rows=Math.ceil(channels.length/MAIL.columns),width=(MAIL.columns-1)*MAIL.pitchX+MAIL.width+MAIL.plateMargin*2,height=(rows-1)*MAIL.pitchY+MAIL.height+MAIL.plateMargin*2;
 const assembly=useMemo(()=>{
  const boxes:Part[]=channels.map((_,i)=>({position:[(i%MAIL.columns-1)*MAIL.pitchX,MAIL.centerY+((rows-1)/2-Math.floor(i/MAIL.columns))*MAIL.pitchY,MAIL.depth/2],scale:[MAIL.width,MAIL.height,MAIL.depth],color:C.metalDark}));
  boxes.push({position:[0,MAIL.centerY,-.04],scale:[width,height,.04],color:C.shutter});
  for(const x of [-1,1])for(const y of [-1,1])boxes.push({position:[x*(width/2-.08),MAIL.centerY+y*(height/2-.08),0],scale:[.056,.056,.056],color:C.metalDark});
  const flags:Part[]=[],planes:PlaneGeometry[]=[];const cell=64,atlasHeight=Math.pow(2,Math.ceil(Math.log2(Math.max(1,channels.length)*cell))),atlas=canvas(256,atlasHeight),g=atlas.getContext('2d')!;
  channels.forEach((channel,i)=>{const x=(i%MAIL.columns-1)*MAIL.pitchX,y=MAIL.centerY+((rows-1)/2-Math.floor(i/MAIL.columns))*MAIL.pitchY,label=paintSign(channel.name,C.signWhite,false,256,cell);g.drawImage(label.image as HTMLCanvasElement,0,i*cell);label.dispose();const plane=new PlaneGeometry(MAIL.labelWidth,MAIL.labelHeight),uv=plane.attributes.uv;for(let n=0;n<uv.count;n++)uv.setY(n,1-(i+1)*cell/atlasHeight+uv.getY(n)*cell/atlasHeight);plane.translate(x,y,MAIL.depth+MAIL.labelOffset);planes.push(plane);flags.push({position:[x+MAIL.width/2-MAIL.flag,y+MAIL.height/2,MAIL.depth],scale:[MAIL.flag,MAIL.flag,MAIL.flag],color:[C.neonMagenta,C.neonCyan,C.sodium,C.phoneGreen,C.neonPink,C.neonBlue][i%6]});boxes.push({position:[x,y+MAIL.height/4,MAIL.depth+.004],scale:[MAIL.labelWidth,MAIL.labelOffset,MAIL.labelOffset],color:C.void});});
  const geometry=planes.length?mergeGeometries(planes):null;planes.forEach(p=>p.dispose());return{boxes,flags,geometry,map:texture(atlas)};
 },[channels,rows,width,height]);
 useEffect(()=>()=>{assembly.geometry?.dispose();assembly.map.dispose();},[assembly]);
 return <group position={[-4.46,0,MAIL.z]} rotation-y={Math.PI/2}><Instances parts={assembly.boxes} material={<meshStandardMaterial {...MATERIAL.metal}/>} onClick={e=>{e.stopPropagation();if(e.delta>CAMERA.clickGuard||input.pointerTravel>CAMERA.clickGuard||e.instanceId===undefined)return;const channel=channels[e.instanceId];if(!channel)return;if(getState().mobile){openOverlay('contact');return;}if(channel.url.startsWith('mailto:'))location.href=channel.url;else window.open(channel.url,'_blank','noopener,noreferrer');}}/>{assembly.geometry&&<mesh geometry={assembly.geometry} raycast={()=>{}}><meshStandardMaterial color={C.void} emissive={C.signWhite} emissiveMap={assembly.map} emissiveIntensity={EMISSION.label}/></mesh>}<Instances parts={assembly.flags} colorGain={EMISSION.flag} raycast={()=>{}} material={<meshBasicMaterial toneMapped={false}/>}/></group>;
}
export default function Stations({ content }: { content: Content }) {
  useEffect(() => {
    const bio = registerStation({
        id: "about",
        x: CART.x,
        z: CART.z,
        radius: CART.radius,
        label: "About",
        open: () => openOverlay("about"),
      }),
      contact = registerStation({
        id: "contact",
        x: MAIL.x,
        z: MAIL.z,
        radius: MAIL.radius,
        label: "View all contact channels",
        open: () => openOverlay("contact"),
      });
    return () => {
      bio();
      contact();
    };
  }, []);
  return (
    <>
      <FoodCart label={content.about.eyebrow} />
      <Mailboxes content={content} />
    </>
  );
}
