"use client";
import { useSyncExternalStore } from "react";
import { BOARD, CAMERA, LAYOUT, rad } from "./world";
export type Mode = "loading" | "play" | "locked" | "overlay";
export type Destination = "spawn" | "about" | "work" | "contact" | "gate";
export type Overlay = "about" | "contact" | "help" | null;
export type State = {
  mode: Mode;
  entered: boolean;
  ready: boolean;
  failed: boolean;
  mobile: boolean;
  reduced: boolean;
  overlay: Overlay;
  destination: Destination | null;
  travelId: number;
  arrived: boolean;
  project: number;
  manualPaging: boolean;
  muted: boolean;
  prompt: string;
  station: string | null;
};
const initial: State = {
  mode: "loading",
  entered: false,
  ready: false,
  failed: false,
  mobile: false,
  reduced: false,
  overlay: null,
  destination: null,
  travelId: 0,
  arrived: false,
  project: 0,
  manualPaging: false,
  muted: true,
  prompt: "",
  station: null,
};
let state = initial;
const listeners = new Set<() => void>();
export const getState = () => state;
export function update(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}
export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function useWorldState() {
  return useSyncExternalStore(subscribe, getState, () => initial);
}
export const canControl = (s: State) => s.mode === "play";
export const pose = {
  ...CAMERA.spawn,
  velocityX: 0,
  velocityZ: 0,
  lookYaw: CAMERA.spawn.yaw,
  lookPitch: CAMERA.spawn.pitch,
  entryTime: -1,
};
export const input = {
  keys: new Set<string>(),
  stickX: 0,
  stickY: 0,
  pointerTravel: 0,
};
export const telemetry = { fps: 0, calls: 0, triangles: 0, textures: 0, travelMs: 0 };
let travelStarted = 0;
export function recordArrival() {
  telemetry.travelMs = Math.round(performance.now() - travelStarted);
}
export function clearInput() {
  input.keys.clear();
  input.stickX = 0;
  input.stickY = 0;
  pose.velocityX = 0;
  pose.velocityZ = 0;
}
export function release() {
  clearInput();
  pose.lookYaw = pose.yaw;
  pose.lookPitch = pose.pitch;
  update({
    mode: "play",
    overlay: null,
    destination: null,
    arrived: false,
    prompt: "",
    station: null,
  });
}
export function travel(destination: Destination) {
  clearInput();
  travelStarted = performance.now();
  update({
    mode: "locked",
    destination,
    travelId: state.travelId + 1,
    arrived: false,
    overlay: null,
    prompt: "",
    station: null,
  });
}
export function openOverlay(overlay: Overlay) {
  clearInput();
  update({ mode: "overlay", overlay, prompt: "", station: null });
}
export function closeTop() {
  if (state.overlay) {
    update({ overlay: null, mode: state.destination ? "locked" : "play" });
  } else if (state.mode === "locked") release();
}
export const destinations = [
  "spawn",
  "about",
  "work",
  "contact",
  "gate",
] as const;
export function nextStop() {
  travel(
    destinations[
      (destinations.indexOf(state.destination ?? "spawn") + 1) %
        destinations.length
    ],
  );
}
const stopPoses = {
 spawn: CAMERA.spawn,
 about: { x: .2, z: 19, yaw: rad(90), pitch: -Math.atan((CAMERA.eye-1.17)/3.6) },
 work: { x: -3.081, z: 16.028, yaw: rad(11.87), pitch: rad(14.68) },
 contact: { x: -2.6, z: 14, yaw: rad(-90), pitch: -Math.atan((CAMERA.eye-1.22)/1.6) },
 gate: { x: 0, z: -20, yaw: rad(180), pitch: Math.atan((2.1-CAMERA.eye)/3) }
};
const mobileContactPose = { x: -.8, z:14, yaw:rad(-90), pitch:-Math.atan((CAMERA.eye-1.22)/3.4) };
const workPose={...stopPoses.work};
export function targetPose(destination:Destination,mobile:boolean){
 if(mobile && destination === 'contact') return mobileContactPose;
 if(destination === 'work') {
  const origin=stopPoses.work,dx=BOARD.position[0]-origin.x,dz=BOARD.position[2]-origin.z;
  const yaw=Math.atan2(dx,dz),aspect=typeof window==='undefined'?390/844:innerWidth/innerHeight;
  const fov=aspect<1?CAMERA.portraitFov:CAMERA.fov;
  const fit=(BOARD.width+BOARD.bezel*2)*1.05/(2*Math.tan(rad(fov)/2)*aspect);
  const distance=Math.max(Math.hypot(dx,dz),fit);
  workPose.x=Math.max(LAYOUT.bounds.minX,Math.min(LAYOUT.bounds.maxX,BOARD.position[0]-Math.sin(yaw)*distance));
  const horizontal=BOARD.position[0]-workPose.x;
  workPose.z=Math.max(LAYOUT.bounds.minZ,Math.min(LAYOUT.bounds.maxZ,BOARD.position[2]-Math.sqrt(Math.max(0,distance*distance-horizontal*horizontal))));
  workPose.yaw=Math.atan2(horizontal,BOARD.position[2]-workPose.z);
  workPose.pitch=Math.atan(Math.tan(origin.pitch)*Math.hypot(dx,dz)/Math.hypot(horizontal,BOARD.position[2]-workPose.z));
  return workPose;
 }
 return stopPoses[destination];
}
export function pageProject(direction: number, count: number) {
  if (count < 1) return;
  update({
    project: (state.project + direction + count) % count,
    manualPaging: true,
  });
}
