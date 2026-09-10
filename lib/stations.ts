"use client";
import { pose, getState, openOverlay, travel } from "./store";
export type Station = {
  id: string;
  x: number;
  z: number;
  radius: number;
  label: string;
  open: () => void;
};
const registry = new Map<string, Station>();
export function registerStation(station: Station) {
  registry.set(station.id, station);
  return () => {
    registry.delete(station.id);
  };
}
export function nearestStation() {
  let result: Station | null = null,
    best = Infinity;
  for (const s of registry.values()) {
    const dx = s.x - pose.x,
      dz = s.z - pose.z,
      d = Math.hypot(dx, dz);
    if (
      d < s.radius &&
      d < best &&
      (dx * Math.sin(pose.yaw) + dz * Math.cos(pose.yaw)) /
        Math.max(d, 0.001) >=
        Math.cos((75 * Math.PI) / 180)
    ) {
      best = d;
      result = s;
    }
  }
  return result;
}
export function interact() {
  const s = getState();
  if (s.mode === "loading" || s.mode === "overlay") return;
  if (s.mode === "locked" && s.destination === "work") return;
  nearestStation()?.open();
}
export function openStation(id: string) {
  if (id === "work") travel("work");
  else openOverlay(id === "about" ? "about" : "contact");
}
