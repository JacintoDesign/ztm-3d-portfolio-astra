import fs from "node:fs";
import path from "node:path";
import Portfolio from "@/components/ui/Portfolio";
import { getContent } from "@/lib/content";
import type { WeatherShaders } from "@/lib/shaders";
export default function Home() {
  const shaders = Object.fromEntries(
    ["rain", "ripple", "steam"].flatMap((name) =>
      ["vert", "frag"].map((stage) => [
        name + (stage === "vert" ? "Vertex" : "Fragment"),
        fs.readFileSync(
          path.join(process.cwd(), "shaders", `${name}.${stage}.glsl`),
          "utf8",
        ),
      ]),
    ),
  ) as WeatherShaders;
  shaders.surfaceVertex = fs.readFileSync(path.join(process.cwd(), "shaders", "surface-uv.vert.glsl"), "utf8");
  shaders.surfacePars = fs.readFileSync(path.join(process.cwd(), "shaders", "surface.pars.glsl"), "utf8");
  shaders.surfaceFragment = fs.readFileSync(path.join(process.cwd(), "shaders", "surface-color.frag.glsl"), "utf8");
  return <Portfolio content={getContent()} shaders={shaders} />;
}
