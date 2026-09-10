"use client";
import { useEffect, useMemo } from "react";
import { BoxGeometry, BufferGeometry, LatheGeometry, TorusGeometry, Vector2 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, LAYOUT, MATERIAL, PROP, REFINEMENT as R } from "@/lib/world";
export default function RubbishBags() {
  const geometry = useMemo(() => {
    const bags: BufferGeometry[]=[],handles: BufferGeometry[]=[];
    for(let i=0;i<2;i++) {
      const side=i?-1:1,z=i?19.8:-12.6,x=side*(4.30-PROP.bin.radius);
      for(const end of [-1,1]) {
        const profile:Vector2[]=[];
        for(let row=0;row<=R.bag.vertical;row++) {
          const t=row/R.bag.vertical;
          // Broad resting base, full shoulder, tightly gathered neck.
          const radius=PROP.bin.radius*(R.bag.neck+R.bag.bulge*Math.pow(Math.sin(Math.PI*Math.pow(t,0.5)),0.5));
          profile.push(new Vector2(radius,t*R.bag.height));
        }
        const bag=new LatheGeometry(profile,R.bag.radial),position=bag.attributes.position;
        for(let n=0;n<position.count;n++) {
          const y=position.getY(n),t=y/R.bag.height,a=Math.atan2(position.getZ(n),position.getX(n));
          const crease=1+R.bag.amplitude*Math.sin(a*R.bag.creases+t*Math.PI+end)*Math.sin(Math.PI*t);
          position.setXYZ(n,position.getX(n)*crease+R.bag.amplitude*PROP.bin.radius*Math.sin(t*Math.PI),Math.max(0,y),position.getZ(n)*crease*R.bag.depth);
        }
        bag.computeVertexNormals();
        bag.rotateY((i+(end+1)/2)*Math.PI/2);
        bag.translate(x,LAYOUT.kerb.height,z+end*PROP.bin.radius*2);
        bags.push(bag);
        const tie = new TorusGeometry(PROP.bin.radius*R.bag.neck,R.noodle.radius,R.noodle.sides,R.radial);
        tie.rotateX(Math.PI/2);tie.translate(x,LAYOUT.kerb.height+R.bag.height,z+end*PROP.bin.radius*2);bags.push(tie);
        for(const fold of [-1,1]) {
          const tail=new BoxGeometry(PROP.bin.radius*R.bag.neck,R.bag.twist,R.noodle.radius);
          tail.rotateZ(fold*Math.PI/4);tail.translate(x+fold*PROP.bin.radius*R.bag.neck/2,LAYOUT.kerb.height+R.bag.height+R.bag.twist/2,z+end*PROP.bin.radius*2);bags.push(tail);
        }
        const handle=new TorusGeometry(R.bin.handle,R.bin.tube,R.noodle.sides,R.radial);
        handle.rotateY(Math.PI/2);handle.translate(x+end*(PROP.bin.radius+R.bin.tube),LAYOUT.kerb.height+PROP.bin.height*3/4,z);handles.push(handle);
      }
    }
    const result={bags:mergeGeometries(bags),handles:mergeGeometries(handles)};
    bags.forEach(g=>g.dispose());handles.forEach(g=>g.dispose());return result;
  },[]);
  useEffect(()=>()=>{geometry.bags?.dispose();geometry.handles?.dispose();},[geometry]);
  return <>{geometry.bags&&<mesh geometry={geometry.bags}><meshStandardMaterial color={C.metalDark} roughness={R.bag.roughness} metalness={0}/></mesh>}{geometry.handles&&<mesh geometry={geometry.handles}><meshStandardMaterial color={C.metalDark} {...MATERIAL.metal}/></mesh>}</>;
}
