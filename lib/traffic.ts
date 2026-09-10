import { TRAFFIC } from "./world";

/** One trajectory feeds the model and its painted light, including reduced motion. */
export function trafficX(time: number, laneIndex: number, index: number, reduced: boolean) {
  const lane = TRAFFIC.lanes[laneIndex];
  const travelled = reduced ? 0 : time * lane.speed;
  return (((travelled + lane.gaps[index] + lane.phase + TRAFFIC.loop / 2) % TRAFFIC.loop + TRAFFIC.loop) % TRAFFIC.loop) - TRAFFIC.loop / 2;
}
