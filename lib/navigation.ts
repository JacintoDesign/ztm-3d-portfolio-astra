"use client";
import { CAMERA } from './world';
import { canControl,getState,input,pose } from './store';
import { moveAxis } from './collisions';
/** Both input paths converge here. No allocation and no React subscription. */
export function stepWalking(dt:number){
 const s=getState();
 if(!canControl(s))return;
      let ix =
          Number(input.keys.has("d") || input.keys.has("arrowright")) -
          Number(input.keys.has("a") || input.keys.has("arrowleft")),
        iz =
          Number(input.keys.has("w") || input.keys.has("arrowup")) -
          Number(input.keys.has("s") || input.keys.has("arrowdown"));
      const keyboardLength = Math.hypot(ix, iz);
      if (keyboardLength > 1) {
        ix /= keyboardLength;
        iz /= keyboardLength;
      }
      ix += input.stickX;
      iz += input.stickY;
      const length = Math.hypot(ix, iz);
      if (length > 1) {
        ix /= length;
        iz /= length;
      }
      const vx =
          (-Math.cos(pose.yaw) * ix + Math.sin(pose.yaw) * iz) * CAMERA.speed,
        vz = (Math.sin(pose.yaw) * ix + Math.cos(pose.yaw) * iz) * CAMERA.speed;
      if (s.reduced) {
        pose.velocityX = vx;
        pose.velocityZ = vz;
      } else if (length > 0) {
        const dx = vx - pose.velocityX,
          dz = vz - pose.velocityZ,
          d = Math.hypot(dx, dz),
          factor = Math.min(
            1,
            (CAMERA.acceleration * dt) / Math.max(d, 0.0001),
          );
        pose.velocityX += dx * factor;
        pose.velocityZ += dz * factor;
      } else {
        pose.velocityX *= Math.exp(-CAMERA.damping * dt);
        pose.velocityZ *= Math.exp(-CAMERA.damping * dt);
      }
      pose.x = moveAxis(pose.x, pose.z, pose.x + pose.velocityX * dt, "x");
      pose.z = moveAxis(pose.x, pose.z, pose.z + pose.velocityZ * dt, "z");
}
