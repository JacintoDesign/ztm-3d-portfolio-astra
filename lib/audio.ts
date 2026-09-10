"use client";
import { AUDIO } from "./world";
let context: AudioContext | null = null,
  muteGain: GainNode | null = null;
const db = (value: number) => Math.pow(10, value / 20);
export function unlockAudio(muted: boolean) {
  if (muted) {
    setMuted(true);
    return;
  }
  try {
    if (context) {
      void context.resume();
      setMuted(muted);
      return;
    }
    context = new AudioContext();
    const buffer = context.createBuffer(
        1,
        context.sampleRate * AUDIO.bufferSeconds,
        context.sampleRate,
      ),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = AUDIO.cutoff;
    filter.Q.value = AUDIO.q;
    const lfo = context.createOscillator(),
      depth = context.createGain();
    lfo.frequency.value = AUDIO.lfoHz;
    depth.gain.value = AUDIO.lfoDepth;
    lfo.connect(depth).connect(filter.frequency);
    const bed = context.createGain(),
      master = context.createGain();
    bed.gain.value = db(AUDIO.rainDb);
    master.gain.value = db(AUDIO.masterDb);
    muteGain = context.createGain();
    muteGain.gain.value = muted ? 0 : 1;
    source
      .connect(filter)
      .connect(bed)
      .connect(master)
      .connect(muteGain)
      .connect(context.destination);
    source.start();
    lfo.start();
    void context.resume();
  } catch {
    /* Sound is optional; navigation must never depend on audio. */
  }
}
export function setMuted(muted: boolean) {
  if (muteGain) muteGain.gain.value = muted ? 0 : 1;
  try {
    localStorage.setItem("last-train-muted", String(muted));
  } catch {}
}
