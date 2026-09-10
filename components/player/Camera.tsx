"use client";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { CAMERA } from "@/lib/world";
import { canControl, getState, input, pose, release } from "@/lib/store";
export default function Camera() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    let pointer = -1,
      x = 0,
      y = 0;
    const down = (e: PointerEvent) => {
      if (!canControl(getState())) return;
      pointer = e.pointerId;
      x = e.clientX;
      y = e.clientY;
      input.pointerTravel = 0;
      canvas.setPointerCapture(pointer);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer || !canControl(getState())) return;
      const dx = e.clientX - x,
        dy = e.clientY - y;
      x = e.clientX;
      y = e.clientY;
      input.pointerTravel += Math.hypot(dx, dy);
      const sensitivity =
        e.pointerType === "touch"
          ? CAMERA.touchSensitivity
          : CAMERA.desktopSensitivity;
      pose.lookYaw -= dx * sensitivity;
      pose.lookPitch = Math.max(
        -CAMERA.pitchClamp,
        Math.min(CAMERA.pitchClamp, pose.lookPitch - dy * sensitivity),
      );
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = -1;
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    const empty = () => {
      if (
        getState().mode === "locked" &&
        input.pointerTravel <= CAMERA.clickGuard
      )
        release();
    };
    canvas.addEventListener("world-empty-click", empty);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("world-empty-click", empty);
    };
  }, [gl]);
  return null;
}
