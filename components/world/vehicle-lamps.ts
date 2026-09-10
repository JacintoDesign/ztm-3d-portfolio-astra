"use client";
import { BoxGeometry, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, Quaternion, Raycaster, Vector3 } from "three";
import { C, EMISSION, TRAFFIC } from "@/lib/world";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Fit shallow lenses to the actual normalized body, never to empty bounds. */
export function createVehicleLamps(geometry: BufferGeometry | null) {
    if (!geometry) return null;
    geometry.computeBoundingBox();
    const size = geometry.boundingBox!.getSize(new Vector3());
    const pieces: BufferGeometry[] = [];
    const probeMaterial = new MeshBasicMaterial({side:DoubleSide});
    const probe = new Mesh(geometry, probeMaterial), ray = new Raycaster();
    probe.updateMatrixWorld(true);
    for (const head of [true, false]) {
      const shape = head ? TRAFFIC.lamps.head : TRAFFIC.lamps.tail;
      const light = new Color(head ? C.signWhite : C.lantern).multiplyScalar(head ? EMISSION.carLamp : EMISSION.tail);
      for (const side of [-1, 1]) {
        const direction = head ? 1 : -1;
        const origin = new Vector3(direction*(size.x/2+shape.depth),size.y*shape.heightFraction,side*(size.z/2-shape.width));
        ray.ray.direction.set(-direction,0,0);
        let hit;
        for(let inset=0;inset<size.z/2;inset+=shape.width) {
          ray.ray.origin.copy(origin);
          ray.ray.origin.z=side*Math.max(0,Math.abs(origin.z)-inset);
          hit=ray.intersectObject(probe,false)[0];
          if(hit) break;
        }
        if(!hit) continue;
        const part = new BoxGeometry(TRAFFIC.lamps.proud*2, shape.height, shape.width);
        const normal=hit.face!.normal.clone();
        if(normal.x*direction<0) normal.negate();
        part.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(1,0,0),normal));
        part.translate(hit.point.x,hit.point.y,hit.point.z);
        const colors = new Float32Array(part.attributes.position.count * 3);
        for (let i = 0; i < colors.length; i += 3) { colors[i] = light.r; colors[i + 1] = light.g; colors[i + 2] = light.b; }
        part.setAttribute("color", new Float32BufferAttribute(colors, 3));
        pieces.push(part);
      }
    }
    const merged = pieces.length ? mergeGeometries(pieces) : null;
    pieces.forEach(part => part.dispose());
    probeMaterial.dispose();
    return merged;
}
