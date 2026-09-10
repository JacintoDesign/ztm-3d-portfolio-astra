import { FLICKER } from "./world";
const period = FLICKER.sequence.length * FLICKER.step + FLICKER.hold;
export function flickerAt(time: number, phase = 0) {
  const tick = (time + phase * period) % period;
  return FLICKER.sequence[Math.floor(tick / FLICKER.step)] ?? 1;
}
