"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Color, MeshBasicMaterial, SRGBColorSpace, Texture } from "three";
import { flickerAt } from "@/lib/flicker";
import { useFrame } from "@react-three/fiber";
import type { Content } from "@/lib/content";
import { BEND, BOARD, C, CAMERA, EMISSION, MATERIAL, REFINEMENT } from "@/lib/world";
import { getState, input, travel, useWorldState } from "@/lib/store";
import { registerStation } from "@/lib/stations";
import Instances, { type Part } from "./Instances";
import { canvas, paintSign } from "@/lib/textures/painters";
const titleTint = new Color(C.signWhite).multiplyScalar(EMISSION.title);
const cases: Part[] = [
  {position:[0,BOARD.base+BOARD.height/2,0],scale:[BOARD.width+BOARD.bezel*2,BOARD.height+BOARD.bezel*2,BOARD.depth]},
  {position:[0,BOARD.titleBase+BOARD.titleHeight/2,BOARD.titleDepth/2],scale:[BOARD.titleWidth,BOARD.titleHeight,BOARD.titleDepth]},
];
const frameParts = (thickness: number, inset: number, depth: number): Part[] => [-1, 1].flatMap(side => [
  { position: [side*(BOARD.width/2+inset),BOARD.base+BOARD.height/2,BOARD.depth/2+depth/2], scale: [thickness,BOARD.height+2*inset+thickness,depth] },
  { position: [0,BOARD.base+BOARD.height/2+side*(BOARD.height/2+inset),BOARD.depth/2+depth/2], scale: [BOARD.width+2*inset,thickness,depth] },
]);
const frameRails = frameParts(REFINEMENT.rail, BOARD.bezel, REFINEMENT.proud);
const frameLights = frameParts(REFINEMENT.strip, REFINEMENT.strip/2, REFINEMENT.strip);
for (const side of [-1,1]) {
  const y = BOARD.titleBase+BOARD.titleHeight/2, z=BOARD.titleDepth+REFINEMENT.proud/2;
  frameRails.push({position:[side*(BOARD.titleWidth-REFINEMENT.rail)/2,y,z],scale:[REFINEMENT.rail,BOARD.titleHeight,REFINEMENT.proud]});
  frameRails.push({position:[0,y+side*(BOARD.titleHeight-REFINEMENT.rail)/2,z],scale:[BOARD.titleWidth,REFINEMENT.rail,REFINEMENT.proud]});
  frameLights.push({position:[0,y+side*(BOARD.titleHeight/2-REFINEMENT.rail),z+REFINEMENT.proud/2],scale:[BOARD.titleWidth-REFINEMENT.rail*2,REFINEMENT.strip,REFINEMENT.strip]});
}
export default function Showcase({
  content,
  mobile,
}: {
  content: Content;
  mobile: boolean;
}) {
  const state = useWorldState(),
    [maps, setMaps] = useState<Map<number, Texture>>(() => new Map()),
    residentMaps = useRef(new Map<number, Texture>()),
    [displayed, setDisplayed] = useState(state.project),
    project = content.projects[displayed],
    screenMaterial = useRef<MeshBasicMaterial>(null),
    titleMaterial = useRef<MeshBasicMaterial>(null),
    transition = useRef({ out: -1, incoming: -1 });
  useEffect(() => {
    if (state.project === displayed) return;
    transition.current.out = performance.now();
    transition.current.incoming = -1;
    const timer = setTimeout(() => {
      transition.current.out = -1;
      transition.current.incoming = performance.now();
      setDisplayed(state.project);
    }, state.reduced ? 0 : BOARD.fadeOut + BOARD.hold);
    return () => clearTimeout(timer);
  }, [state.project, state.reduced, displayed]);
  useFrame(({ clock }) => {
    const now = performance.now(), reduced = getState().reduced;
    if (screenMaterial.current) {
      const phase = transition.current;
      screenMaterial.current.opacity = REFINEMENT.screenOpacity * (reduced ? 1 : phase.out >= 0
        ? Math.max(0, 1 - (now - phase.out) / BOARD.fadeOut)
        : phase.incoming >= 0 ? Math.min(1, (now - phase.incoming) / BOARD.fadeIn) : 1);
    }
    if (titleMaterial.current) {
      titleMaterial.current.color.copy(titleTint).multiplyScalar(reduced ? 1 : flickerAt(clock.elapsedTime));
    }
  });
  const title = useMemo(
    () => paintSign(project?.name.toUpperCase() ?? "", C.signWhite, false, 1024, 256, false, true),
    [project?.name],
  );
  useEffect(() => () => title.dispose(), [title]);
  useEffect(
    () =>
      registerStation({
        id: "work",
        x: BOARD.position[0],
        z: BOARD.position[2],
        radius: BOARD.radius,
        label: "View Projects",
        open: () => travel("work"),
      }),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    const resident = residentMaps.current,
      controllers: AbortController[] = [];
    const desired = Array.from(
      new Set(
        [-1, 0, 1].map(
          (offset) =>
            (displayed + offset + content.projects.length) %
            content.projects.length,
        ),
      ),
    );
    for (const [index, texture] of resident) {
      if (!desired.includes(index)) { texture.dispose(); resident.delete(index); }
    }
    queueMicrotask(() => { if (!cancelled) setMaps(new Map(resident)); });
    for (const index of desired) {
      if (resident.has(index)) continue;
      const source = content.projects[index]?.screenshot;
      if (!source) continue;
      const controller = new AbortController();
      controllers.push(controller);
      void fetch(source, { signal: controller.signal })
        .then((r) => {
          if (!r.ok) throw new Error("unavailable");
          return r.blob();
        })
        .then((blob) => createImageBitmap(blob))
        .then((image) => {
          if (cancelled) {
            image.close();
            return;
          }
          const c = canvas(
            mobile ? BOARD.screenWidth / 2 : BOARD.screenWidth,
            mobile ? BOARD.screenHeight / 2 : BOARD.screenHeight,
          );
          c.getContext("2d")!.drawImage(image, 0, 0, c.width, c.height);
          image.close();
          const t = new CanvasTexture(c);
          t.colorSpace = SRGBColorSpace;
          t.anisotropy = mobile ? 4 : 8;
          resident.set(index, t);
          setMaps(new Map(resident));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      controllers.forEach((c) => c.abort());
    };
  }, [displayed, content.projects, mobile]);
  useEffect(() => {
    const resident = residentMaps.current;
    return () => { resident.forEach((texture) => texture.dispose()); resident.clear(); };
  }, []);
  const screen = maps.get(displayed);
  return (
    <group
      position={BOARD.position}
      rotation-y={Math.PI + BEND.angle}
      onClick={(e) => {
        e.stopPropagation();
        if (
          input.pointerTravel <= CAMERA.clickGuard &&
          e.delta <= CAMERA.clickGuard &&
          getState().mode !== "overlay"
        )
          travel("work");
      }}
    >
      <Instances parts={cases} material={<meshStandardMaterial color={C.shutter} {...MATERIAL.case} />} />
      <Instances parts={frameRails} material={<meshStandardMaterial color={C.metalDark} {...MATERIAL.metal} />} />
      <Instances parts={frameLights} material={<meshStandardMaterial color={C.void} emissive={C.neonPink} emissiveIntensity={REFINEMENT.frameEmission} />} />
      <mesh
        position={[0, BOARD.base + BOARD.height / 2, BOARD.depth / 2 + 0.004]}
      >
        <planeGeometry args={[BOARD.width, BOARD.height]} />
        <meshBasicMaterial
          key={`${displayed}-${Boolean(screen)}`}
          ref={screenMaterial}
          transparent
          depthWrite={false}
          color={screen ? undefined : C.resting}
          map={screen ?? null}
          opacity={REFINEMENT.screenOpacity}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <mesh
        position={[
          0,
          BOARD.titleBase + BOARD.titleHeight / 2,
          BOARD.titleDepth + REFINEMENT.proud,
        ]}
      >
        <planeGeometry args={[BOARD.titleWidth-REFINEMENT.rail*2, BOARD.titleHeight-REFINEMENT.rail*2]} />
        <meshBasicMaterial
          color={titleTint}
          ref={titleMaterial}
          map={title}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
