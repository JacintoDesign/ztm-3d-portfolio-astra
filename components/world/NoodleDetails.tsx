"use client";
import { useEffect, useMemo } from "react";
import { BoxGeometry, BufferGeometry, Color, CubicBezierCurve3, CylinderGeometry, DoubleSide, Float32BufferAttribute, LatheGeometry, PlaneGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, CART, MATERIAL, REFINEMENT as R, type V3 } from "@/lib/world";

// Every object is baked once into one of three material batches.
import type { Part } from "./Instances";
export default function NoodleDetails({ structure, hardware }: { structure: Part[]; hardware: Part[] }) {
  const batches = useMemo(() => {
    const parts: Record<string, BufferGeometry[]> = { wood: [], metal: [], food: [], cloth: [] };
    const add = (kind: string, geometry: BufferGeometry, color: string, position: V3, rotation?: V3) => {
      if (rotation) { geometry.rotateX(rotation[0]); geometry.rotateY(rotation[1]); geometry.rotateZ(rotation[2]); }
      geometry.translate(...position);
      let g = geometry;
      if (g.index) { g = geometry.toNonIndexed(); geometry.dispose(); }
      const tint = new Color(color), colors = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) { colors[i] = tint.r; colors[i+1] = tint.g; colors[i+2] = tint.b; }
      g.setAttribute("color", new Float32BufferAttribute(colors, 3));
      parts[kind].push(g);
    };
    const beam = R.stool.leg * 2;
    const box = (kind: string, p: V3, s: V3, c: string) => add(kind, new BoxGeometry(...s), c, p);
    const cylinder = (kind: string, p: V3, radius: number, height: number, c: string, rotation?: V3) => add(kind, new CylinderGeometry(radius, radius, height, R.radial), c, p, rotation);
    const ring = (p: V3, radius: number, tube: number, c: string, kind = "metal", rotation: V3 = [Math.PI/2,0,0]) => add(kind, new TorusGeometry(radius, tube, R.noodle.sides, R.radial), c, p, rotation);
    structure.forEach(p=>add("wood",new BoxGeometry(...p.scale),p.color??C.crateTimber,p.position,p.rotation));
    hardware.forEach(p=>{const geometry=new CylinderGeometry(1,1,1,R.radial);geometry.scale(...p.scale);add("metal",geometry,p.color??C.metalDark,p.position,p.rotation);});
    // Slatted front and raised shelf leave the serving aperture open.
    for (let x = -CART.width/2 + R.slatPitch/2; x < CART.width/2; x += R.slatPitch)
      box("wood", [x, CART.counterY/2, CART.depth/2], [R.slatPitch-R.slatGap,CART.counterY,beam], C.crateTimber);
    box("wood", [0,R.shelf.y,-CART.depth/2+R.shelf.depth/2], [CART.width,beam,R.shelf.depth], C.crateTimber);
    for (const x of R.stool.x) {
      cylinder("wood", [x,R.stool.height,CART.depth/2+R.stool.z-CART.depth/2],R.stool.radius,R.stool.thickness,C.crateTimber);
      for (const side of [-1,1]) for (const depth of [-1,1]) {
        cylinder("metal",[x+side*R.stool.radius/2,R.stool.height/2,R.stool.z+depth*R.stool.radius/2],R.stool.leg,R.stool.height,C.metalDark);
      }
      box("metal",[x,R.stool.height/3,R.stool.z],[R.stool.radius*2,R.stool.leg,R.stool.leg],C.metalDark);
    }
    const bowl = (x: number, y: number, z: number, food: boolean) => {
      const b=R.bowl, profile = [[0,0],[b.radius/2,0],[b.radius,b.height],[b.radius-b.rim,b.height],[b.radius/2,b.rim],[0,b.rim]].map(([r,h])=>new Vector2(r,h));
      add("food",new LatheGeometry(profile,R.radial),C.signWhite,[x,y,z]);
      ring([x,y+b.height,z],b.radius-b.rim/2,b.rim/2,C.lantern,"food");
      if (!food) return;
      cylinder("food",[x,y+b.height-b.rim,z],b.radius-b.rim,b.rim,C.sodiumDeep);
      for(let n=0;n<R.folds;n++) {
        const offset=(n-(R.folds-1)/2)*b.radius/R.folds;
        const curve=new CubicBezierCurve3(new Vector3(-b.radius/2,0,offset),new Vector3(-b.radius/2,b.rim,offset+b.radius/2),new Vector3(b.radius/2,0,offset-b.radius/2),new Vector3(b.radius/2,0,offset));
        add("food",new TubeGeometry(curve,R.noodle.segments,R.noodle.radius,R.noodle.sides,false),C.vendGlow,[x,y+b.height,z]);
      }
      for(const side of [-1,1]) cylinder("wood",[x+side*R.chopstick.separation/2,y+b.height+b.rim,z],R.chopstick.radius,R.chopstick.length,C.crateKraft,[Math.PI/2,0,Math.PI/4]);
      for(const side of [-1,1]) ring([x+side*b.radius/3,y+b.height,z-b.radius/3],b.rim,b.rim/3,C.phoneGreen,"food");
    };
    R.bowl.x.forEach(x=>bowl(x,CART.counterY+beam,R.bowl.z,true));
    for(let i=0;i<R.shelf.bowls;i++) bowl(CART.width/4,R.shelf.y+beam/2+i*R.bowl.rim,-CART.depth/2+R.shelf.depth/2,false);
    const p=R.pot, potY=CART.counterY+beam+p.height/2;
    cylinder("metal",[p.x,potY,p.z],p.radius,p.height,C.metalDark);
    ring([p.x,potY+p.height/2,p.z],p.radius,p.wall,C.signWhite);
    cylinder("metal",[p.x,potY+p.height/2+p.wall,p.z],p.radius-p.wall,p.wall,C.metalDark);
    ring([p.x,potY+p.height/2+p.wall*2,p.z],p.radius/4,p.wall,C.metalDark,"metal",[0,0,0]);
    for(const side of [-1,1]) ring([p.x+side*(p.radius+p.wall),potY,p.z],p.radius/3,p.wall,C.metalDark,"metal",[0,Math.PI/2,0]);
    for(let i=0;i<R.bottle.count;i++) {
      const x=CART.width/4+i*R.bottle.radius*3,z=-CART.depth/4,y=CART.counterY+beam;
      cylinder("food",[x,y+R.bottle.height/2,z],R.bottle.radius,R.bottle.height,[C.lantern,C.crateKraft,C.metalDark][i]);
      cylinder("metal",[x,y+R.bottle.height,z],R.bottle.radius,R.bottle.radius,C.metalDark);
    }
    for(let i=0;i<R.curtains;i++) {
      const width=CART.width/R.curtains-R.slatGap;
      const cloth=new PlaneGeometry(width,CART.clothHeight,R.folds*4,2);
      const position=cloth.attributes.position;
      for(let n=0;n<position.count;n++) {
        const u=position.getX(n)/width+.5,v=position.getY(n)/CART.clothHeight+.5;
        position.setZ(n,Math.sin(u*Math.PI*2*R.folds)*R.pleat*(1-v));
      }
      cloth.computeVertexNormals();
      add("cloth",cloth,C.lantern,[-CART.width/2+(i+.5)*CART.width/R.curtains,CART.canopyY-CART.clothHeight/2,CART.depth/2+beam]);
    }
    return Object.fromEntries(Object.entries(parts).map(([kind, pieces]) => {
      const geometry=mergeGeometries(pieces); pieces.forEach(g=>g.dispose()); return [kind, geometry];
    }));
  }, [structure, hardware]);
  useEffect(()=>()=>Object.values(batches).forEach(g=>g?.dispose()),[batches]);
  return <>{Object.entries(batches).map(([kind,geometry])=>geometry&&<mesh key={kind} geometry={geometry}><meshStandardMaterial vertexColors {...(kind==="metal"?MATERIAL.metal:kind==="cloth"?MATERIAL.fabric:kind==="food"?MATERIAL.paper:MATERIAL.concrete)} side={kind==="cloth"?DoubleSide:undefined}/></mesh>)}</>;
}
