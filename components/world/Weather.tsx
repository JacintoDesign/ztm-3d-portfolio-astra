"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { ATMOSPHERE, C, LAYOUT, REFLECTION, WEATHER } from "@/lib/world";
import { pose, useWorldState } from "@/lib/store";
import { paintGround, random } from "@/lib/textures/painters";
import type { WeatherShaders } from "@/lib/shaders";
function plane() {
  const p = new PlaneGeometry(1, 1),
    g = new InstancedBufferGeometry();
  g.index = p.index;
  g.attributes.position = p.attributes.position;
  g.attributes.uv = p.attributes.uv;
  return g;
}
function Rain({
  near,
  mobile,
  reduced,
  shaders,
}: {
  near: boolean;
  mobile: boolean;
  reduced: boolean;
  shaders: WeatherShaders;
}) {
  const material = useRef<ShaderMaterial>(null);
  const data = useMemo(() => {
    const count = Math.floor(
        (near
          ? mobile
            ? WEATHER.mobileNear
            : WEATHER.nearCount
          : mobile
            ? WEATHER.mobileFar
            : WEATHER.farCount) * (reduced ? 0.5 : 1),
      ),
      g = plane(),
      array = new Float32Array(count * 3),
      r = random(near ? 400 : 500);
    for (let i = 0; i < array.length; i++) array[i] = r();
    g.setAttribute("seed", new InstancedBufferAttribute(array, 3));
    g.instanceCount = count;
    return {
      g,
      uniforms: {
        time: { value: 0 },
        volume: {
          value: new Vector3(...(near ? WEATHER.nearBox : WEATHER.farBox)),
        },
        streak: {
          value: new Vector2(...(near ? WEATHER.nearSize : WEATHER.farSize)),
        },
        eye: { value: new Vector3() },
        follow: { value: near ? 1 : 0 },
        yaw: { value: 0 },
        fallSpeed: { value: WEATHER.speed },
        wind: { value: WEATHER.wind },
        opacity: {
          value: reduced
            ? WEATHER.reducedOpacity
            : near
              ? mobile
                ? WEATHER.mobileNearOpacity
                : WEATHER.nearOpacity
              : mobile
                ? WEATHER.mobileFarOpacity
                : WEATHER.farOpacity,
        },
        tint: { value: new Color(C.rain) },
        fogTint: { value: new Color(C.fogColor) },
        fogDensity: { value: ATMOSPHERE.fog },
      },
    };
  }, [near, mobile, reduced]);
  useEffect(() => () => data.g.dispose(), [data]);
  useFrame(({ clock, camera }) => {
    if (!material.current) return;
    material.current.uniforms.time.value = clock.elapsedTime;
    material.current.uniforms.eye.value.copy(camera.position);
    material.current.uniforms.yaw.value = pose.yaw;
  });
  return (
    <mesh name={near ? "rain-near" : "rain-far"} geometry={data.g} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={shaders.rainVertex}
        fragmentShader={shaders.rainFragment}
        uniforms={data.uniforms}
        transparent
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
function Ripples({
  mobile,
  shaders,
}: {
  mobile: boolean;
  shaders: WeatherShaders;
}) {
  const material = useRef<ShaderMaterial>(null);
  const data = useMemo(() => {
    const alleyCount = mobile ? WEATHER.mobileRipples : WEATHER.ripples,
      roadCount = mobile ? WEATHER.rippleRoad.mobile : WEATHER.rippleRoad.desktop,
      count = alleyCount + roadCount,
      g = plane(),
      centers = new Float32Array(count * 2 * 3),
      phases = new Float32Array(count * 2),
      jitters = new Float32Array(count * 2),
      identities = new Float32Array(count * 2),
      r = random(601),
      mask = paintGround(mobile),
      c = mask.image as HTMLCanvasElement,
      pixels = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    const wet = (x: number, z: number) => {
      const u = (x + REFLECTION.width / 2) / REFLECTION.width;
      const v = (z - (REFLECTION.z - REFLECTION.length / 2)) / REFLECTION.length;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
      const px = Math.floor(u * c.width), py = Math.floor((1 - v) * c.height);
      return pixels[(py * c.width + px) * 4] / 255 < WEATHER.rippleWetThreshold;
    };
    let n = 0;
    for (const road of [false, true]) {
      const target = n + (road ? roadCount : alleyCount);
      for (let attempt = 0; n < target && attempt < 10000; attempt++) {
        const x = road ? WEATHER.rippleRoad.minX + r() * (WEATHER.rippleRoad.maxX - WEATHER.rippleRoad.minX) : (r() * 2 - 1) * LAYOUT.kerb.inner;
        const z = road ? WEATHER.rippleRoad.minZ + r() * (WEATHER.rippleRoad.maxZ - WEATHER.rippleRoad.minZ) : (r() * 2 - 1) * LAYOUT.length / 2;
        if (!wet(x, z)) continue;
        let overlaps = false;
        for (let previous = 0; previous < n; previous++) {
          if (Math.hypot(x - centers[previous * 6], z - centers[previous * 6 + 2]) < WEATHER.rippleSeparation) { overlaps = true; break; }
        }
        if (overlaps) continue;
        let jitter = 0;
        for (const radius of WEATHER.rippleJitter) {
          let safe = true;
          for (let probe = 0; probe < 8; probe++) {
            const angle = probe * Math.PI / 4;
            if (!wet(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius)) { safe = false; break; }
          }
          if (safe) { jitter = radius; break; }
        }
        const phase = r() * WEATHER.ripplePeriod;
        for (let generation = 0; generation < 2; generation++) {
          const i = n * 2 + generation;
          centers.set([x, REFLECTION.y * 2.5, z], i * 3);
          phases[i] = phase + generation * WEATHER.ripplePeriod;
          jitters[i] = jitter / WEATHER.rippleDiameter;
          identities[i] = i;
        }
        n++;
      }
    }
    mask.dispose();
    g.setAttribute("center", new InstancedBufferAttribute(centers, 3));
    g.setAttribute("phase", new InstancedBufferAttribute(phases, 1));
    g.setAttribute("jitter", new InstancedBufferAttribute(jitters, 1));
    g.setAttribute("identity", new InstancedBufferAttribute(identities, 1));
    g.instanceCount = n * 2;
    return {
      g,
      uniforms: {
        time: { value: 0 },
        period: { value: WEATHER.ripplePeriod },
        diameter: { value: WEATHER.rippleDiameter },
        life: { value: WEATHER.rippleLife },
        opacity: { value: WEATHER.rippleOpacity },
        thickness: { value: WEATHER.rippleThickness },
        birth: { value: WEATHER.rippleBirth },
        variation: { value: WEATHER.rippleVariation },
        wobble: { value: WEATHER.rippleWobble },
        tint: { value: new Color(C.rain) },
        fogTint: { value: new Color(C.fogColor) },
        fogDensity: { value: ATMOSPHERE.fog },
      },
    };
  }, [mobile]);
  useEffect(() => () => data.g.dispose(), [data]);
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.time.value = clock.elapsedTime;
  });
  return (
    <mesh geometry={data.g} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={data.uniforms}
        vertexShader={shaders.rippleVertex}
        fragmentShader={shaders.rippleFragment}
        transparent
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
function Steam({
  mobile,
  reduced,
  shaders,
}: {
  mobile: boolean;
  reduced: boolean;
  shaders: WeatherShaders;
}) {
  const material = useRef<ShaderMaterial>(null);
  const data = useMemo(() => {
    const count =
        (mobile ? WEATHER.mobileSteam : WEATHER.steamCount) * (mobile ? 2 : 3),
      g = plane(),
      seeds = new Float32Array(count * 3),
      r = random(702);
    for (let i = 0; i < count; i++)
      seeds.set([r() * Math.PI * 2, r(), WEATHER.steamZ[i % (mobile ? 2 : WEATHER.steamZ.length)]], i * 3);
    g.setAttribute("seed", new InstancedBufferAttribute(seeds, 3));
    g.instanceCount = count;
    return {
      g,
      uniforms: {
        time: { value: 0 },
        rise: { value: WEATHER.steamRise },
        reduced: { value: reduced ? 1 : 0 },
        yaw: { value: 0 },
        opacity: {
          value: reduced ? WEATHER.reducedSteamOpacity : WEATHER.steamOpacity,
        },
        tint: { value: new Color(C.rain) },
        fogTint: { value: new Color(C.fogColor) },
        fogDensity: { value: ATMOSPHERE.fog },
      },
    };
  }, [mobile, reduced]);
  useEffect(() => () => data.g.dispose(), [data]);
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.time.value = clock.elapsedTime;
    material.current.uniforms.yaw.value = pose.yaw;
  });
  return (
    <mesh geometry={data.g} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={shaders.steamVertex}
        fragmentShader={shaders.steamFragment}
        uniforms={data.uniforms}
        transparent
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
export default function Weather({
  mobile,
  shaders,
}: {
  mobile: boolean;
  shaders: WeatherShaders;
}) {
  const s = useWorldState();
  return (
    <>
      <Rain near mobile={mobile} reduced={s.reduced} shaders={shaders} />
      <Rain
        near={false}
        mobile={mobile}
        reduced={s.reduced}
        shaders={shaders}
      />
      {!s.reduced && <Ripples mobile={mobile} shaders={shaders} />}
      <Steam mobile={mobile} reduced={s.reduced} shaders={shaders} />
    </>
  );
}
