"use client";
import { BAKERY as B, C, CONVENIENCE as S, LAYOUT, MATERIAL, PROP, REFINEMENT as R, SHOP, type V3 } from "@/lib/world";
import BakeryBread from "./BakeryBread";
import Instances, {type Part} from "./Instances";
const room:Part[]=[],fittings:Part[]=[],bread:Part[]=[],round:Part[]=[],lamps:Part[]=[],screens:Part[]=[],glass:Part[]=[];
const add=(list:Part[],position:V3,scale:V3,color:string,rotation?:V3)=>list.push({position,scale,color,rotation});
const w=B.end-B.start,h=B.head-LAYOUT.kerb.height,g=SHOP.slatDepth;
add(room,[0,-g/2,-B.depth/2],[w,g,B.depth],C.crateTimber);
add(room,[0,h,-B.depth/2],[w,g,B.depth],C.crateKraft);
add(room,[0,h/2,-B.depth],[w,h,g],C.facadeWarm);
for(const side of [-1,1])add(room,[side*w/2,h/2,-B.depth/2],[g,h,B.depth],C.crateKraft);
// Long timber floorboards and a low, slatted serving counter.
for(let x=-w/2;x<w/2;x+=S.tile)add(fittings,[x,S.joint/2,-B.depth/2],[S.joint,S.joint,B.depth],C.metalDark);
const counterWidth=w/2,cz=-S.shelf.depth;
const registerBase=S.checkout+S.shelf.depth+g/2;
add(fittings,[0,(S.checkout-g)/2,cz],[counterWidth,S.checkout-g,S.fridge.depth],C.crateTimber);
add(fittings,[0,S.checkout-g/2,cz],[counterWidth+g*2,g,S.fridge.depth+g*2],C.crateKraft);
for(let x=-counterWidth/2;x<=counterWidth/2;x+=R.slatPitch)add(fittings,[x,S.checkout/2,cz+S.fridge.depth/2+S.joint],[g,S.checkout-g,S.joint],C.metalDark);
// Display case: metal uprights, frame rails and trays, keeping pastries visible.
for(const side of [-1,1]){
  add(fittings,[side*counterWidth/2,S.checkout+S.shelf.depth/2,cz],[g,S.shelf.depth,g],C.metalDark);
  add(fittings,[0,S.checkout+S.shelf.depth,cz+side*S.fridge.depth/2],[counterWidth-g,g,g],C.metalDark);
}
add(fittings,[0,S.checkout+S.shelf.depth,cz],[counterWidth-g,g,S.fridge.depth-g],C.crateTimber);
for(let tray=0;tray<3;tray++){
 const x=(tray-1)*counterWidth/3;
 add(fittings,[x,S.checkout+g,cz],[counterWidth/3-g,g,S.shelf.depth],C.metalDark);
 for(const side of [-1,1])add(bread,[x+side*R.bowl.radius/2,S.checkout+g*1.5+R.bowl.radius/2,cz],[R.bowl.radius/2,R.bowl.radius/2,R.bowl.radius/2],C.vendGlow);
}
// Three tiers of bread racks, each loaf scored with inset dark seams.
for(let row=0;row<3;row++){
 const y=(row+1)*S.shelf.height/3,z=-B.depth+S.shelf.depth;
 add(fittings,[0,y,z],[w-S.shelf.depth*2,g,S.shelf.depth*2],C.crateTimber);

 const count=Math.floor((w-S.shelf.depth*2)/(R.bowl.radius*3));
 for(let item=0;item<count;item++){
  const x=(item-(count-1)/2)*R.bowl.radius*3;
  add(bread,[x,y+g/2+R.bowl.radius/2,z],[R.bowl.radius,R.bowl.radius/2,R.bowl.radius/2],row%2?C.vendGlow:C.sodium);

 }
}
for(const side of [-1,1])add(fittings,[side*(w/2-S.shelf.depth),S.shelf.height/2,-B.depth+S.shelf.depth],[g,S.shelf.height,g],C.metalDark);
// Side packing station with stacked boxes, trays and a small till.
const px=-w/2+S.shelf.depth;
add(fittings,[px,S.checkout/2,-S.fridge.depth],[S.shelf.depth*2,S.checkout,S.fridge.depth],C.crateTimber);
for(let stack=0;stack<4;stack++){
 const y=S.checkout+(stack+.5)*S.package.minHeight;
 add(fittings,[px,y,-S.fridge.depth],[S.fridge.depth,S.package.minHeight-S.joint,S.shelf.depth],C.crateKraft);
 add(fittings,[px,y+S.package.minHeight/2,-S.fridge.depth],[S.fridge.depth+S.joint,g/2,S.shelf.depth+S.joint],C.signWhite);
}
add(fittings,[counterWidth/2-S.package.maxWidth,registerBase+S.package.minHeight,cz],[S.package.maxWidth*2,S.package.minHeight*2,S.package.maxWidth],C.metalDark);
add(screens,[counterWidth/2-S.package.maxWidth,registerBase+S.package.minHeight,cz+S.package.maxWidth/2+S.joint],[S.package.maxWidth,S.package.minHeight,S.joint],C.phoneGreen);
for(const x of [-w/3,0,w/3]){
 const y=h-PROP.lantern.height;
 add(round,[x,(y+h)/2,-B.depth/2],[SHOP.barRadius,h-y,SHOP.barRadius],C.metalDark);
 add(round,[x,y,-B.depth/2],[PROP.lantern.radius,PROP.lantern.height/2,PROP.lantern.radius],C.metalDark);
 add(lamps,[x,y-PROP.lantern.height/4-g/2,-B.depth/2],[PROP.lantern.radius-g,SHOP.slatDepth,PROP.lantern.radius-g],C.sodium);
}
// Glazing and metal corner members enclose the pastry case without opaque panels.
add(glass,[0,S.checkout+S.shelf.depth/2,cz+S.fridge.depth/2],[counterWidth,S.shelf.depth,1],C.signWhite);
for(const side of [-1,1]){
 add(glass,[side*counterWidth/2,S.checkout+S.shelf.depth/2,cz],[S.fridge.depth,S.shelf.depth,1],C.signWhite,[0,side*Math.PI/2,0]);
 add(fittings,[side*counterWidth/2,S.checkout+S.shelf.depth/2,cz+S.fridge.depth/2],[g,S.shelf.depth,g],C.metalDark);
 add(fittings,[side*counterWidth/2,S.checkout+S.shelf.depth,cz],[g,g,S.fridge.depth],C.metalDark);
}
for(let tray=0;tray<3;tray++){
 const x=(tray-1)*counterWidth/3;
 for(const side of [-1,1])add(fittings,[x,S.checkout+g*2,cz+side*S.shelf.depth/2],[counterWidth/3-g,g,g],C.metalDark);
}
// Blank ticket holders along shelf lips.
for(let row=0;row<3;row++)for(let item=-3;item<=3;item++)
 add(fittings,[item*R.bowl.radius*3,(row+1)*S.shelf.height/3,-B.depth+S.shelf.depth*2+S.joint],[S.package.minWidth,g,S.joint],C.crateKraft);
// Compact oven and cooling rack on the right-hand wall.
const ox=w/2-S.shelf.depth,oz=-B.depth/2;
add(fittings,[ox,S.checkout/2,oz],[S.shelf.depth*2,S.checkout,S.fridge.depth],C.metalDark);
add(fittings,[ox,S.checkout/2,oz+S.fridge.depth/2+g],[S.shelf.depth*2-g*2,S.checkout-g*4,g],C.shutter);
add(fittings,[ox,S.checkout/2,oz+S.fridge.depth/2+g*2],[S.shelf.depth*2-g*4,S.checkout-g*8,g],C.void);
add(fittings,[ox,S.checkout-g*3,oz+S.fridge.depth/2+g*3],[S.shelf.depth,g,g],C.signWhite);
for(const side of [-1,1])add(round,[ox+side*S.shelf.depth/2,S.checkout-g,oz+S.fridge.depth/2+g],[g,g,g],C.signWhite,[Math.PI/2,0,0]);
for(let level=0;level<3;level++){
 const y=S.checkout+S.package.maxHeight*(level+1);
 add(fittings,[ox,y,oz],[S.shelf.depth*2,g,S.fridge.depth],C.metalDark);
 for(const side of [-1,1])add(fittings,[ox+side*(S.shelf.depth-g),y,oz],[g,S.package.maxHeight,g],C.shutter);
 add(fittings,[ox,y+g,oz],[S.shelf.depth*2-g*2,S.joint,S.fridge.depth-g*2],C.shutter);
}
// Keypad and receipt emerging from the register.
const tx=counterWidth/2-S.package.maxWidth;
for(let row=0;row<3;row++)for(let col=0;col<3;col++)add(fittings,[tx+(col-1)*g,registerBase+S.package.minHeight*2+S.joint,cz+(row-1)*g],[g/2,S.joint,g/2],C.signWhite);
add(fittings,[tx+S.package.maxWidth,registerBase+S.package.minHeight*2,cz],[g,S.joint,S.package.minHeight],C.signWhite);
export default function Bakery(){return <group position={[B.front,LAYOUT.kerb.height,(B.start+B.end)/2]} rotation-y={-Math.PI/2}>
 <rectAreaLight position={[0,h-g*2,-B.depth/2]} rotation={[-Math.PI/2,0,0]} width={w*B.lightFraction} height={B.depth*B.lightFraction} color={C.vendGlow} intensity={B.lightPower}/>
 <Instances parts={room} material={<meshStandardMaterial {...MATERIAL.facade}/>}/>
 <Instances parts={fittings} colorGain={B.stockGain} material={<meshStandardMaterial {...MATERIAL.paper}/>}/>
 <BakeryBread parts={bread}/>
 <Instances parts={glass} shape="plane" material={<meshBasicMaterial transparent opacity={B.glassOpacity} depthWrite={false}/>}/>
 <Instances parts={round} shape="cylinder" material={<meshStandardMaterial {...MATERIAL.metal}/>}/>
 <Instances parts={screens} colorGain={S.fixture} material={<meshBasicMaterial toneMapped={false}/>}/>
 <Instances parts={lamps} shape="cylinder" colorGain={S.fixture} material={<meshBasicMaterial toneMapped={false}/>}/>
 </group>;}
