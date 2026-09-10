"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { CAMERA } from "@/lib/world";
import {
  canControl,
  clearInput,
  getState,
  input,
  openOverlay,
  pageProject,
  pose,
  release,
  recordArrival,
  targetPose,
  update,
} from "@/lib/store";
import { interact, nearestStation } from "@/lib/stations";
import { stepWalking } from "@/lib/navigation";
import Camera from "./Camera";
const motionKeys = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);
const glide = {
  id: -1,
  start: 0,
  duration: 1,
  x: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
  target: { ...CAMERA.spawn },
  done: false,
};
function arrive() {
  const current = getState();
  if (current.travelId !== glide.id || current.mode !== "locked") return;
  recordArrival();
  update({ arrived: true });
  if (current.destination === "contact" && current.mobile) openOverlay("contact");
}
function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export default function Player({ projectCount }: { projectCount: number }) {
  const camera = useThree((s) => s.camera);
  const lastPrompt = useRef("");
  useEffect(() => {
    camera.rotation.order = "YXZ";
    glide.id = -1;
    const c = camera as PerspectiveCamera;
    const resize = () => {
      c.fov = innerHeight > innerWidth ? CAMERA.portraitFov : CAMERA.fov;
      c.updateProjectionMatrix();
      const current = getState();
      if (current.mode === "locked" && current.destination === "work") update({ travelId: current.travelId + 1 });
    };
    resize();
    window.addEventListener("resize", resize);
    const down = (e: KeyboardEvent) => {
      const s = getState(),
        key = e.key.toLowerCase();
      if (s.mode === "loading") return;
      if (s.mode === "overlay") return;
      if (key === "e" && !e.repeat) {
        e.preventDefault();
        interact();
        return;
      }
      if (
        (key === "[" ||
          key === "]" ||
          ((key === "arrowleft" || key === "arrowright") &&
            s.mode === "locked" &&
            s.destination === "work")) &&
        !e.repeat
      ) {
        e.preventDefault();
        pageProject(key === "[" || key === "arrowleft" ? -1 : 1, projectCount);
        return;
      }
      if (motionKeys.has(key)) {
        e.preventDefault();
        if (s.mode === "locked") release();
        if (canControl(getState())) input.keys.add(key);
      }
    };
    const up = (e: KeyboardEvent) => {
      input.keys.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clearInput);
    document.addEventListener("visibilitychange", clearInput);
    const promptTimer = setInterval(() => {
      const s = getState();
      if (
        s.mode === "loading" ||
        s.mode === "overlay" ||
        (s.destination === "work" && s.mode === "locked") ||
        (s.mode === "locked" && !s.arrived)
      ) {
        if (lastPrompt.current) {
          lastPrompt.current = "";
          update({ prompt: "", station: null });
        }
        return;
      }
      const station = nearestStation(),
        label = station?.label ?? "";
      if (label !== lastPrompt.current) {
        lastPrompt.current = label;
        update({ prompt: label, station: station?.id ?? null });
      }
    }, 100);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearInput);
      document.removeEventListener("visibilitychange", clearInput);
      window.removeEventListener("resize", resize);
      clearInterval(promptTimer);
    };
  }, [camera, projectCount]);
  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05),
      s = getState(),
      now = clock.elapsedTime;
    if (s.mode === "overlay") {
      if (pose.entryTime >= 0) pose.entryTime += rawDelta * 1000;
      if (glide.id === s.travelId) glide.start += rawDelta;
      return;
    }
    if (s.mode === "locked" && s.destination) {
      if (pose.entryTime < 0) pose.entryTime = performance.now() - CAMERA.sweep.duration * 1000;
      if (glide.id !== s.travelId) {
        glide.id = s.travelId;
        glide.start = now;
        glide.x = pose.x;
        glide.z = pose.z;
        glide.yaw = pose.yaw;
        glide.pitch = pose.pitch;
        const target = targetPose(s.destination, s.mobile);
        Object.assign(glide.target, target);
        glide.target.yaw =
          pose.yaw +
          Math.atan2(
            Math.sin(target.yaw - pose.yaw),
            Math.cos(target.yaw - pose.yaw),
          );
        glide.duration = Math.max(
          CAMERA.guideMin,
          Math.hypot(target.x - pose.x, target.z - pose.z) / CAMERA.guideSpeed,
        );
        glide.done = false;
      }
      const t = s.reduced
          ? 1
          : Math.min(1, (now - glide.start) / glide.duration),
        a = ease(t);
      const centerZ = (glide.z + glide.target.z) / 2;
      pose.x = (1 - a) * (1 - a) * glide.x + a * a * glide.target.x;
      pose.z =
        (1 - a) * (1 - a) * glide.z +
        2 * (1 - a) * a * centerZ +
        a * a * glide.target.z;
      pose.yaw = glide.yaw + (glide.target.yaw - glide.yaw) * a;
      pose.pitch = glide.pitch + (glide.target.pitch - glide.pitch) * a;
      pose.lookYaw = pose.yaw;
      pose.lookPitch = pose.pitch;
      if (t === 1 && !glide.done) {
        glide.done = true;
        queueMicrotask(arrive);
      }
    } else if (canControl(s)) {
      const alpha = s.reduced ? 1 : 1 - Math.exp(-CAMERA.smoothing * dt);
      pose.yaw += (pose.lookYaw - pose.yaw) * alpha;
      pose.pitch += (pose.lookPitch - pose.pitch) * alpha;
      stepWalking(dt);
    }
    let bob = 0;
    if (canControl(s) && !s.reduced)
      bob =
        Math.sin(now * CAMERA.bobHz * Math.PI * 2) *
        CAMERA.bob *
        Math.min(1, Math.hypot(pose.velocityX, pose.velocityZ) / CAMERA.speed);
    let sweep = 0;
    if (s.entered && canControl(s) && pose.entryTime < 0) pose.entryTime = performance.now();
    if (s.entered && canControl(s) && !s.reduced && pose.entryTime >= 0)
      sweep = Math.pow(
        1 -
          Math.min(
            1,
            (performance.now() - pose.entryTime) /
              (CAMERA.sweep.duration * 1000),
          ),
        3,
      );
    camera.position.set(
      pose.x,
      CAMERA.eye + bob + CAMERA.sweep.rise * sweep,
      pose.z - CAMERA.sweep.back * sweep,
    );
    camera.rotation.set(pose.pitch, pose.yaw + Math.PI, 0, "YXZ");
  });
  return <Camera />;
}
