"use client";
import { BAKERY,BEND,C,CONVENIENCE,LAYOUT,MATERIAL } from '@/lib/world';
import type { SurfaceMaterials } from "@/lib/textures/surfaces";
import Instances,{type Part} from './Instances';
const parts:Part[]=[
 ...[[-24,CONVENIENCE.start],[CONVENIENCE.end,25]].map(([a,b])=>({position:[-5,7,(a+b)/2] as [number,number,number],scale:[LAYOUT.wall,LAYOUT.westHeight,b-a] as [number,number,number],color:C.facadeWarm})),
 {position:[-5,(LAYOUT.westHeight+CONVENIENCE.head)/2,(CONVENIENCE.start+CONVENIENCE.end)/2],scale:[LAYOUT.wall,LAYOUT.westHeight-CONVENIENCE.head,CONVENIENCE.end-CONVENIENCE.start],color:C.facadeWarm},
 ...[[-24,BAKERY.start],[BAKERY.end,24]].map(([a,b])=>({position:[5,LAYOUT.eastHeight/2,(a+b)/2] as [number,number,number],scale:[LAYOUT.wall,LAYOUT.eastHeight,b-a] as [number,number,number],color:C.facade})),
 {position:[5,(LAYOUT.eastHeight+BAKERY.head)/2,(BAKERY.start+BAKERY.end)/2],scale:[LAYOUT.wall,LAYOUT.eastHeight-BAKERY.head,BAKERY.end-BAKERY.start],color:C.facade},
 {position:[0,7,-23],scale:[9,14,1],color:C.facade},
 {position:[BEND.x,(LAYOUT.westHeight-LAYOUT.kerb.height)/2,BEND.z],scale:[LAYOUT.bend.length,LAYOUT.westHeight+LAYOUT.kerb.height,LAYOUT.wall],rotation:[0,BEND.angle,0],color:C.facadeWarm},
 {position:[BEND.x,0,BEND.z],scale:[LAYOUT.bend.length,LAYOUT.kerb.height*2,LAYOUT.wall+LAYOUT.kerb.height],rotation:[0,BEND.angle,0],color:C.concrete},
];
const kerbs:Part[]=[-1,1].map(side=>({position:[side*(4.5-LAYOUT.kerb.width/2),LAYOUT.kerb.height/2,0],scale:[LAYOUT.kerb.width,LAYOUT.kerb.height,46],color:C.concrete}));
export default function Shell({surfaces}:{surfaces:SurfaceMaterials}){return <><Instances parts={parts} material={<meshStandardMaterial {...MATERIAL.facade} {...surfaces.facade}/>}/><Instances parts={kerbs} material={<meshStandardMaterial {...MATERIAL.concrete} {...surfaces.concrete}/>}/></>;}
