"use client";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, LatheGeometry, Vector2 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, EMISSION, MATERIAL, PROP, REFINEMENT, SURFACE } from "@/lib/world";
import { canvas, random, texture } from "@/lib/textures/painters";
import Instances, {type Part} from "./Instances";

export default function Lanterns({parts}:{parts:Part[]}) {
  const data=useMemo(()=>{
    const lan=PROP.lantern,points=[];
    for(let row=0;row<=lan.ribs*4;row++){
      const t=row/(lan.ribs*4);
      const radius=.5+.5*Math.sin(Math.PI*t)-lan.relief/lan.radius*(1-Math.cos(t*lan.ribs*Math.PI*2))/2;
      points.push(new Vector2(radius,t-.5));
    }
    const source=new LatheGeometry(points,lan.segments);
    const pieces=parts.map(p=>{const g=source.clone();g.scale(...p.scale);g.translate(...p.position);return g;});
    const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());source.dispose();
    const c=canvas(lan.textureSize,lan.textureSize),g=c.getContext('2d')!,rng=random(SURFACE.grain.seed);
    g.fillStyle=C.lantern;g.fillRect(0,0,c.width,c.height);
    for(let y=0;y<c.height;y++){
      g.globalAlpha=REFINEMENT.titlePanel*(1-Math.cos(y/c.height*lan.ribs*Math.PI*2))/2;
      g.fillStyle=C.metalDark;g.fillRect(0,y,c.width,1);
      for(let x=0;x<c.width;x++){
        g.globalAlpha=rng()*SURFACE.grain.speckle/(SURFACE.grain.base*4);
        g.fillStyle=rng()>.5?C.crateKraft:C.lantern;g.fillRect(x,y,1,1);
      }
    }
    const glowCanvas=canvas(lan.textureSize,lan.textureSize),ctx=glowCanvas.getContext('2d')!,half=lan.textureSize/2;
    const gradient=ctx.createRadialGradient(half,half,0,half,half,half);
    gradient.addColorStop(0,'white');gradient.addColorStop(1,'black');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,lan.textureSize,lan.textureSize);
    const glow=texture(glowCanvas);glow.colorSpace='';
    const washes:Part[]=parts.map(p=>({position:[Math.sign(p.position[0])*4.14,p.position[1],p.position[2]],rotation:[0,p.position[0]<0?Math.PI/2:-Math.PI/2,0],scale:[lan.glowSize,lan.glowSize,1]}));
    return {geometry,map:texture(c),glow,washes};
  },[parts]);
  useEffect(()=>()=>{data.geometry.dispose();data.map.dispose();data.glow.dispose();},[data]);
  return <><mesh geometry={data.geometry}><meshStandardMaterial color={C.void} toneMapped={false} map={data.map} emissiveMap={data.map} emissive={C.signWhite} emissiveIntensity={EMISSION.lantern} {...MATERIAL.paper}/></mesh><Instances parts={data.washes} shape="plane" material={<meshBasicMaterial color={C.lantern} alphaMap={data.glow} transparent opacity={PROP.lantern.glowOpacity} blending={AdditiveBlending} depthWrite={false} toneMapped={false}/>}/></>;
}
