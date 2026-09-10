"use client";
import { C, CONVENIENCE as S, LAYOUT, MATERIAL, SHOP, type V3 } from "@/lib/world";
import Instances, { type Part } from "./Instances";
import { random } from "@/lib/textures/painters";

const width=S.end-S.start, height=S.head-LAYOUT.kerb.height, gauge=SHOP.slatDepth;
const room:Part[]=[],stock:Part[]=[],bottles:Part[]=[],fixtures:Part[]=[];
const add=(list:Part[],position:V3,scale:V3,color:string)=>list.push({position,scale,color});
add(room,[0,-gauge/2,-S.depth/2],[width,gauge,S.depth],C.concrete);
add(room,[0,height,-S.depth/2],[width,gauge,S.depth],C.signWhite);
add(room,[0,height/2,-S.depth],[width,height,gauge],C.facade);
for(const side of [-1,1]) add(room,[side*width/2,height/2,-S.depth/2],[gauge,height,S.depth],C.signWhite);
for(let x=-width/2;x<=width/2;x+=S.tile) add(stock,[x,S.joint/2,-S.depth/2],[S.joint,S.joint,S.depth],C.shutter);
for(let z=0;z>=-S.depth;z-=S.tile) add(stock,[0,S.joint/2,z],[width,S.joint,S.joint],C.shutter);
const rng=random(18),colors=[C.crateKraft,C.crateTimber,C.shutter,C.lantern,C.sodium,C.signWhite];
const shelvesLength=S.depth-S.fridge.depth-S.shelf.depth;
// Side aisles: shelves, uprights and distinct rows of cartons.
for(const side of [-1,1]) {
  const x=side*(width/2-S.shelf.depth/2),z=-S.shelf.depth-shelvesLength/2;
  for(const end of [-1,1])add(stock,[side*(width/2-S.shelf.depth),S.shelf.height/2,z+end*shelvesLength/2],[gauge,S.shelf.height,gauge],C.metalDark);
  for(let row=0;row<S.shelf.levels;row++){
    const y=(row+1)*S.shelf.height/S.shelf.levels;
    add(stock,[x,y,z],[S.shelf.depth,gauge,shelvesLength],C.metalDark);
    // Folded shelf lips and small blank price-ticket holders.
    add(stock,[x-side*S.shelf.depth/2,y,z],[gauge,gauge*2,shelvesLength],C.signWhite);
    for(let ticket=-shelvesLength/2+S.package.maxWidth;ticket<shelvesLength/2;ticket+=S.package.maxWidth*2)
      add(stock,[x-side*(S.shelf.depth/2+gauge),y,z+ticket],[S.joint,gauge,S.package.minWidth],C.crateKraft);
    for(let at=-shelvesLength/2+S.package.maxWidth;at<shelvesLength/2-S.package.maxWidth;at+=S.package.maxWidth){
      const w=S.package.minWidth+rng()*(S.package.maxWidth-S.package.minWidth),h=S.package.minHeight+rng()*(S.package.maxHeight-S.package.minHeight);
      const px=x-side*S.package.minWidth/2,py=y+gauge/2+h/2,pz=z+at;
      add(stock,[px,py,pz],[w,h,w],colors[Math.floor(rng()*colors.length)]);
      add(stock,[px-side*(w/2+S.joint/2),py,pz],[S.joint,h/3,w-gauge],C.signWhite);
      add(stock,[px,py+h/2,pz],[w-gauge,S.joint,w-gauge],C.crateKraft);
    }
  }
}
// Glass-door refrigerator silhouettes: recessed contents, steel frames and handles.
const fridgeWidth=width-S.shelf.depth*2, doors=Math.floor(fridgeWidth/(S.fridge.depth*2)),doorWidth=fridgeWidth/doors;
for(let door=0;door<doors;door++){
  const x=-fridgeWidth/2+(door+.5)*doorWidth,front=-S.depth+S.fridge.depth;
  add(stock,[x,S.fridge.height/2,-S.depth+gauge],[doorWidth,S.fridge.height,gauge],C.shutter);
  for(const side of [-1,1])add(stock,[x+side*doorWidth/2,S.fridge.height/2,front],[gauge,S.fridge.height,gauge],C.metalDark);
  for(const y of [0,S.fridge.height])add(stock,[x,y,front],[doorWidth,gauge,gauge],C.metalDark);
  add(stock,[x+doorWidth/2-gauge*2,S.fridge.height/2,front+gauge],[S.joint,S.shelf.depth,S.joint],C.signWhite);
  add(fixtures,[x,S.fridge.height-gauge,front],[doorWidth-gauge*2,S.joint,S.joint],C.signWhite);
  for(let row=0;row<S.shelf.levels;row++){
    const y=(row+1)*(S.fridge.height-S.package.maxHeight)/(S.shelf.levels+1);
    add(stock,[x,y,front-S.fridge.depth/2],[doorWidth-gauge,gauge,S.fridge.depth],C.metalDark);
    for(let col=-doorWidth/2+S.package.maxWidth;col<doorWidth/2-S.package.minWidth;col+=S.package.maxWidth){
      const h=S.package.minHeight+rng()*(S.package.maxHeight-S.package.minHeight),r=S.package.minWidth/2;
      const bx=x+col,bz=front-S.package.maxWidth;
      add(bottles,[bx,y+gauge/2+h/2,bz],[r,h,r],colors[Math.floor(rng()*colors.length)]);
      add(bottles,[bx,y+gauge/2+h,bz],[r/2,gauge*2,r/2],C.signWhite);
      add(bottles,[bx,y+gauge/2+h/2,bz],[r+S.joint/2,h/3,r+S.joint/2],C.signWhite);
    }
  }
}
// Refrigerator kickplates, vent slots and deep door gaskets.
for(let door=0;door<doors;door++){
  const x=-fridgeWidth/2+(door+.5)*doorWidth,front=-S.depth+S.fridge.depth;
  add(stock,[x,S.package.minHeight/2,front],[doorWidth-gauge,S.package.minHeight,gauge],C.metalDark);
  for(let slot=-doorWidth/2+gauge*2;slot<doorWidth/2-gauge;slot+=gauge*2)
    add(stock,[x+slot,S.package.minHeight/2,front+gauge],[S.joint,S.package.minHeight-gauge,S.joint],C.shutter);
  for(const side of [-1,1])add(stock,[x+side*(doorWidth/2-gauge),S.fridge.height/2,front-gauge],[S.joint,S.fridge.height,gauge*2],C.shutter);
}
// Checkout and small register, to one side of the sightline.
const counterX=width/4,counterZ=-S.fridge.depth;
add(stock,[counterX,(S.checkout-gauge)/2,counterZ],[S.fridge.depth*2,S.checkout-gauge,S.fridge.depth],C.shutter);
add(room,[counterX,S.checkout-gauge/2,counterZ],[S.fridge.depth*2,gauge,S.fridge.depth],C.signWhite);
add(stock,[counterX,S.checkout+S.package.minHeight/2,counterZ],[S.fridge.depth,S.package.minHeight,S.shelf.depth],C.metalDark);
add(stock,[counterX,S.checkout+S.shelf.depth/2,counterZ-S.shelf.depth/2],[S.fridge.depth,S.shelf.depth,gauge],C.metalDark);
add(fixtures,[counterX,S.checkout+S.shelf.depth/2,counterZ-S.shelf.depth/2+gauge],[S.fridge.depth-gauge*2,S.shelf.depth-gauge*2,S.joint],C.phoneGreen);
// Cash drawer, keypad, receipt roll and shallow counter merchandise tray.
add(stock,[counterX,S.checkout+gauge,counterZ+S.shelf.depth/2],[S.fridge.depth-gauge,gauge,S.joint],C.shutter);
for(let row=0;row<3;row++)for(let col=0;col<3;col++)
  add(stock,[counterX+(col-1)*gauge*2,S.checkout+S.package.minHeight+S.joint,counterZ+row*gauge],[gauge,S.joint,gauge],C.signWhite);
add(stock,[counterX+S.fridge.depth/2-gauge,S.checkout+S.package.minHeight,counterZ],[gauge*2,S.joint,S.package.minHeight],C.signWhite);
const trayX=counterX-S.fridge.depth/2-S.package.maxWidth;
add(stock,[trayX,S.checkout+gauge,counterZ],[S.package.maxWidth*2,gauge,S.shelf.depth],C.crateKraft);
for(let item=0;item<3;item++)add(stock,[trayX,S.checkout+gauge*2,counterZ+(item-1)*S.package.minWidth],[S.package.maxWidth,gauge,S.package.minWidth-S.joint],colors[item]);
// Stacked open shopping baskets with slotted sides.
for(let tier=0;tier<S.shelf.levels;tier++){
  const x=-width/4,y=S.package.minHeight*(tier+1),z=-S.shelf.depth;
  add(stock,[x,y,z],[S.fridge.depth,S.joint,S.shelf.depth],C.lantern);
  for(const side of [-1,1]){
    add(stock,[x+side*S.fridge.depth/2,y+S.package.minHeight,z],[S.joint,S.joint,S.shelf.depth],C.lantern);
    for(let at=-S.shelf.depth/2;at<=S.shelf.depth/2;at+=S.package.minWidth)
      add(stock,[x+side*S.fridge.depth/2,y+S.package.minHeight/2,z+at],[S.joint,S.package.minHeight,S.joint],C.lantern);
    add(stock,[x+side*S.fridge.depth/2,y+S.package.minHeight+S.joint,z],[gauge,S.joint,S.package.minWidth],C.metalDark);
    add(stock,[x,y+S.package.minHeight,z+side*S.shelf.depth/2],[S.fridge.depth,S.joint,S.joint],C.lantern);
    for(let at=-S.fridge.depth/2;at<=S.fridge.depth/2;at+=S.package.minWidth)add(stock,[x+at,y+S.package.minHeight/2,z+side*S.shelf.depth/2],[S.joint,S.package.minHeight,S.joint],C.lantern);
  }
}
for(const side of [-1,1]){
  add(stock,[side*width/4,height-gauge,-S.depth/2],[S.shelf.depth,gauge,S.depth-S.fridge.depth],C.metalDark);
  add(fixtures,[side*width/4,height-gauge*2,-S.depth/2],[S.shelf.depth-gauge*2,S.joint,S.depth-S.fridge.depth-gauge*2],C.signWhite);
}
export default function ConvenienceStore(){return <group position={[S.front,LAYOUT.kerb.height,(S.start+S.end)/2]} rotation-y={Math.PI/2}>
  <Instances parts={room} colorGain={S.glow} material={<meshBasicMaterial toneMapped={false}/>}/>
  <Instances parts={stock} material={<meshStandardMaterial {...MATERIAL.case}/>}/>
  <Instances parts={bottles} shape="cylinder" material={<meshStandardMaterial {...MATERIAL.case}/>}/>
  <Instances parts={fixtures} colorGain={S.fixture} material={<meshBasicMaterial toneMapped={false}/>}/>
</group>;}
