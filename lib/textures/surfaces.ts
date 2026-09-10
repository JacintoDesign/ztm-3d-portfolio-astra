"use client";
import { Vector2, type MeshStandardMaterial, type Texture } from "three";
import type { WeatherShaders } from "@/lib/shaders";
import { SURFACE } from "@/lib/world";
import { canvas, paintGrain, texture } from "./painters";

type SurfaceKind = keyof typeof SURFACE.materials;
export type SurfaceMaterials = Record<SurfaceKind, {
  map: Texture;
  roughnessMap: Texture;
  normalMap: Texture;
  normalScale: Vector2;
  onBeforeCompile: MeshStandardMaterial["onBeforeCompile"];
  customProgramCacheKey: () => string;
}>;

export function createSurfaceTextures(mobile: boolean, shaders: WeatherShaders) {
  const grain = paintGrain(mobile);
  const source = grain.image as HTMLCanvasElement;
  const size = source.width;
  const pixels = source.getContext("2d")!.getImageData(0, 0, size, size).data;
  const normalCanvas = canvas(size, size);
  const context = normalCanvas.getContext("2d")!;
  const normals = context.createImageData(size, size);
  const height = (x: number, y: number) => pixels[(((y + size) % size) * size + (x + size) % size) * 4] / 255;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (height(x + 1, y - 1) + 2 * height(x + 1, y) + height(x + 1, y + 1) - height(x - 1, y - 1) - 2 * height(x - 1, y) - height(x - 1, y + 1)) / 8;
    const dy = (height(x - 1, y + 1) + 2 * height(x, y + 1) + height(x + 1, y + 1) - height(x - 1, y - 1) - 2 * height(x, y - 1) - height(x + 1, y - 1)) / 8;
    const length = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
    normals.data[i] = 128 - dx / length * 127;
    normals.data[i + 1] = 128 - dy / length * 127;
    normals.data[i + 2] = 128 + 127 / length;
    normals.data[i + 3] = 255;
  }
  context.putImageData(normals, 0, 0);
  const normal = texture(normalCanvas, true);
  normal.colorSpace = "";
  const owned = [grain, normal];
  const materials = {} as SurfaceMaterials;
  for (const kind of Object.keys(SURFACE.materials) as SurfaceKind[]) {
    const settings = SURFACE.materials[kind];
    const map = grain.clone(), normalMap = normal.clone();
    map.repeat.set(settings.repeat, settings.repeat);
    normalMap.repeat.copy(map.repeat);
    owned.push(map, normalMap);
    materials[kind] = { map, roughnessMap: map, normalMap, normalScale: new Vector2(settings.normal, settings.normal),
      onBeforeCompile: shader => {
        shader.uniforms.surfaceBroadScale = {value:new Vector2(SURFACE.grain.grids[0],SURFACE.grain.grids[1])};
        shader.uniforms.surfaceBroadAmplitude = {value:new Vector2(SURFACE.grain.broad[0]/SURFACE.grain.base,SURFACE.grain.broad[1]/SURFACE.grain.base)};
        shader.uniforms.surfaceGrainSeed = {value:SURFACE.grain.seed};
        shader.vertexShader = shader.vertexShader.replace("#include <common>","#include <common>\n"+shaders.surfacePars).replace("#include <uv_vertex>", shaders.surfaceVertex);
        shader.fragmentShader = shader.fragmentShader.replace("#include <common>","#include <common>\n"+shaders.surfacePars).replace("#include <map_fragment>", shaders.surfaceFragment);
      },
      customProgramCacheKey: () => shaders.surfaceVertex+shaders.surfaceFragment+shaders.surfacePars,
    };
  }
  return { materials, dispose: () => owned.forEach(map => map.dispose()) };
}
