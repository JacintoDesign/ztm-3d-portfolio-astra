"use client";
import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, Mesh, ShaderMaterial, SRGBColorSpace } from "three";
import type { WeatherShaders } from "@/lib/shaders";
import type { Content } from "@/lib/content";
import { ATMOSPHERE, CAMERA, PERFORMANCE } from "@/lib/world";
import { getState, pose, telemetry, update } from "@/lib/store";
import Player from "@/components/player/Player";
import Ground from "./Ground";
import Atmosphere from "./Atmosphere";
import Effects from "./Effects";
import { createSurfaceTextures } from "@/lib/textures/surfaces";
import { paintWindows } from "@/lib/textures/painters";
import SurfaceDetails from "./SurfaceDetails";
import Shell from "./Shell";
import Bakery from "./Bakery";
import ConvenienceStore from "./ConvenienceStore";
import CrossStreet from "./CrossStreet";
import Weather from "./Weather";
import StreetProps from "./StreetProps";
import Showcase from "./Showcase";
import Stations from "./Stations";
import Surroundings from "./Surroundings";
function Ready() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    let frames=0,last=performance.now(),id=0,ready=false,maxCalls=0,maxTriangles=0;
    const originalRender=gl.render.bind(gl);
    gl.render=(scene,camera)=>{originalRender(scene,camera);maxCalls=Math.max(maxCalls,gl.info.render.calls);maxTriangles=Math.max(maxTriangles,gl.info.render.triangles);};
    const inspect=new URLSearchParams(location.search).has('inspect');
    const sample=()=>{
      frames++;const now=performance.now();
      if(!ready&&frames>=2){ready=true;update({ready:true});}
      if(now-last>2000){
        telemetry.fps=Math.round(frames*1000/(now-last));telemetry.calls=maxCalls;telemetry.triangles=maxTriangles;telemetry.textures=gl.info.memory.textures;
        if(inspect) console.info('[Last Train]',JSON.stringify({...telemetry,rainTime:((scene.getObjectByName('rain-near') as Mesh)?.material as ShaderMaterial)?.uniforms?.time?.value,mode:getState().mode,x:pose.x,z:pose.z,yaw:pose.yaw,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,visualViewport:[visualViewport?.width,visualViewport?.height,visualViewport?.scale],root:document.querySelector('.portfolio')?.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}));
        frames=0;last=now;maxCalls=0;maxTriangles=0;
      }
      id=requestAnimationFrame(sample);
    };
    id=requestAnimationFrame(sample);
    const lost = (e: Event) => {
      e.preventDefault();
      update({ failed: true, ready: true });
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(id);
      gl.render=originalRender;
      gl.domElement.removeEventListener("webglcontextlost", lost);
    };
  }, [gl, scene]);
  return null;
}
export default function World({
  content,
  mobile,
  shaders,
}: {
  content: Content;
  mobile: boolean;
  shaders: WeatherShaders;
}) {
  const surfaces = useMemo(() => createSurfaceTextures(mobile, shaders), [mobile, shaders]);
  useEffect(() => () => surfaces.dispose(), [surfaces]);
  const windowMaps = useMemo(() => [0, 1, 2].map(index => paintWindows(mobile, index)), [mobile]);
  useEffect(() => () => windowMaps.forEach(map => map.dispose()), [windowMaps]);
  return (
    <Canvas
      camera={{
        position: [0, CAMERA.eye, CAMERA.spawn.z],
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
      }}
      dpr={[1, PERFORMANCE.dpr]}
      gl={{
        antialias: !mobile,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = ATMOSPHERE.exposure;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      onPointerMissed={(e) => {
        if (e.type === "click" && getState().mode === "locked")
          (e.target as HTMLElement)?.dispatchEvent(
            new Event("world-empty-click"),
          );
      }}
    >
      <Atmosphere mobile={mobile} />
      <Ground mobile={mobile} />
      <Shell surfaces={surfaces.materials} />
      <ConvenienceStore />
      <Bakery />
      <CrossStreet windowMaps={windowMaps} />
      <Surroundings mobile={mobile} windowMaps={windowMaps} surfaces={surfaces.materials} />
      <StreetProps mobile={mobile} surfaces={surfaces.materials} />
      <SurfaceDetails mobile={mobile} />
      <Showcase content={content} mobile={mobile} />
      <Stations content={content} />
      <Weather mobile={mobile} shaders={shaders} />
      <Player projectCount={content.projects.length} />
      <Effects mobile={mobile} />
      <Ready />
    </Canvas>
  );
}
