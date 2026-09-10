"use client";
import { useEffect,useMemo } from "react";
import { Color, Float32BufferAttribute, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BAKERY, C, MATERIAL } from "@/lib/world";
import { random } from "@/lib/textures/painters";
import type { Part } from "./Instances";
export default function BakeryBread({parts}:{parts:Part[]}){
 const geometry=useMemo(()=>{
  const b=BAKERY.bread,rng=random(b.seed),color=new Color();
  const pieces=parts.map(p=>{
   const geo=new SphereGeometry(1,b.radial,b.rows),pos=geo.attributes.position;
   const colors=new Float32Array(pos.count*3);
   for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    let score=0;
    for(const cut of [-.5,0,.5])score+=Math.exp(-Math.pow((x+z*.25-cut)/b.scoreWidth,2))*Math.max(0,y);
    const shrink=1-b.scoreDepth*score;
    pos.setXYZ(i,x*shrink,Math.max(-.65,y*shrink),z*shrink);
    color.set(p.color!).multiplyScalar(1-b.crustVariation*(rng()+Math.max(0,y))+score*b.crustVariation);
    color.toArray(colors,i*3);
   }
   geo.setAttribute('color',new Float32BufferAttribute(colors,3));geo.computeVertexNormals();
   geo.scale(...p.scale);geo.translate(p.position[0],p.position[1]-.35*p.scale[1],p.position[2]);return geo;
  });
  const merged=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return merged;
 },[parts]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry}><meshStandardMaterial color={C.crateKraft} vertexColors {...MATERIAL.paper}/></mesh>;
}
