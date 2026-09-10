"use client";
import {
  CanvasTexture,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { C, BOARD, REFINEMENT, REFLECTION, STRINGS, SURFACE, TRAFFIC, WINDOWS } from "@/lib/world";
export function random(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
export function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
export function texture(c: HTMLCanvasElement, repeat = false) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.minFilter = LinearMipmapLinearFilter;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
export function paintSign(
  text: string,
  color: string,
  vertical = false,
  width = 256,
  height = 512,
  banner = false,
  lightbox = false,
) {
  const c = canvas(width, height),
    g = c.getContext("2d")!;
  g.fillStyle = C.void;
  g.fillRect(0, 0, width, height);
  if (banner) {
    g.globalAlpha = 1 / 16;
    g.fillStyle = color;
    g.fillRect(0, 0, width, height);
    g.globalAlpha = 1;
  }
  if (lightbox) {
    const gradient = g.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,C.neonPink); gradient.addColorStop(1,C.neonMagenta);
    g.globalAlpha = REFINEMENT.titlePanel;
    g.fillStyle = gradient; g.fillRect(0,0,width,height);
    g.globalAlpha = 1;
    g.strokeStyle = C.neonPink;
    g.lineWidth = width * REFINEMENT.strip / BOARD.titleWidth;
    g.strokeRect(g.lineWidth/2,g.lineWidth/2,width-g.lineWidth,height-g.lineWidth);
  }
  g.fillStyle = color;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `${/^[\x00-\x7F]*$/.test(text) ? 500 : 600} ${vertical ? Math.min(width * 0.68, height / (text.length + 0.8)) : Math.min(height * 0.62, width / (text.length + 0.8))}px ${/^[\x00-\x7F]*$/.test(text) ? '"Avenir Next", "Helvetica Neue",' : ''} "Hiragino Sans", "Yu Gothic", sans-serif`;
  if (vertical) {
    const step = height / (text.length + 1);
    [...text].forEach((char, i) => g.fillText(char, width / 2, step * (i + 1)));
  } else {
    g.textBaseline = "alphabetic";
    const metrics = g.measureText(text);
    const baseline = height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    g.fillText(text, width / 2, baseline);
  }
  return texture(c);
}
export function paintGrain(mobile: boolean) {
  const n = mobile ? SURFACE.mobileSize : SURFACE.size,
    c = canvas(n, n),
    g = c.getContext("2d")!,
    r = random(SURFACE.grain.seed),
    data = g.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4,
        v =
          SURFACE.grain.base + Math.floor(r()*SURFACE.grain.speckle);
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
  g.putImageData(data, 0, 0);
  const t = texture(c, true);
  t.repeat.set(3, 3);
  return t;
}
export function paintWindows(mobile: boolean, variant: number) {
  const n = mobile ? WINDOWS.mobileCanvas : WINDOWS.canvas,
    c = canvas(n, n),
    g = c.getContext("2d")!,
    r = random(121 + variant * 27);
  g.fillStyle = C.facade;
  g.fillRect(0, 0, n, n);
  const cw = n / 5,
    ch = n / 3,
    ww = (cw * WINDOWS.width) / WINDOWS.pitch,
    wh = (ch * WINDOWS.height) / WINDOWS.floor;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 5; col++) {
      const x = col * cw + (cw - ww) / 2,
        y = n - ((row * WINDOWS.floor + WINDOWS.sill + WINDOWS.height) / (WINDOWS.floor * 3)) * n;
      g.fillStyle = C.metalDark;
      g.fillRect(x - 2, y - 2, ww + 4, wh + 4);
      g.fillStyle = r() < WINDOWS.lit ? C.rain : C.void;
      g.fillRect(x, y, ww, wh);
      g.fillStyle = C.facade;
      g.fillRect(x + ww / 2 - 1, y, 2, wh);
      g.fillRect(x, y + wh * 0.72, ww, 2);
      g.fillStyle = C.concrete;
      g.fillRect(x - 3, y + wh + 2, ww + 6, 3);
    }
  return texture(c);
}
export function paintGround(mobile: boolean) {
  const scale = mobile ? 0.5 : 1,
    w = REFLECTION.maskWidth * scale,
    h = REFLECTION.maskHeight * scale,
    c = canvas(w, h),
    g = c.getContext("2d")!,
    r = random(2001);
  g.fillStyle = `rgb(${Math.floor(REFLECTION.dry * 255)},${Math.floor(REFLECTION.dry * 255)},${Math.floor(REFLECTION.dry * 255)})`;
  g.fillRect(0, 0, w, h);
  g.filter = `blur(${REFLECTION.maskBlur * scale}px)`;
  g.fillStyle = `rgb(${Math.floor(REFLECTION.wet * 255)},${Math.floor(REFLECTION.wet * 255)},${Math.floor(REFLECTION.wet * 255)})`;
  for (let i = 0; i < 180; i++) {
    const x = r() * w,
      y = r() * h,
      major = ((0.8 + r() * 3.7) / 12) * w;
    g.beginPath();
    g.ellipse(
      x,
      y,
      major / 2,
      major * (0.35 + r() * 0.5),
      r() * Math.PI,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  g.filter = "none";
  const t = texture(c);
  t.colorSpace = "";
  return t;
}
export function paintNormal(mobile: boolean) {
  const n = mobile ? 256 : 512,
    c = canvas(n, n),
    g = c.getContext("2d")!,
    data = g.createImageData(n, n),
    field = new Float32Array(n * n),
    r = random(330);
  for (let i = 0; i < 140; i++) {
    const cx = r() * n,
      cy = r() * n,
      radius = (6 + r() * 16) * (n / 512),
      extent = Math.ceil(radius * 3);
    for (let oy = -extent; oy <= extent; oy++)
      for (let ox = -extent; ox <= extent; ox++) {
        const x = (Math.floor(cx) + ox + n) % n,
          y = (Math.floor(cy) + oy + n) % n;
        field[y * n + x] += Math.exp(
          -(ox * ox + oy * oy) / (2 * radius * radius),
        );
      }
  }
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const p = (y * n + x) * 4,
        dx =
          (field[y * n + ((x + 1) % n)] - field[y * n + ((x + n - 1) % n)]) *
          1.1,
        dy =
          (field[((y + 1) % n) * n + x] - field[((y + n - 1) % n) * n + x]) *
          1.1,
        length = Math.hypot(dx, dy, 1);
      data.data[p] = 128 - (dx / length) * 127;
      data.data[p + 1] = 128 - (dy / length) * 127;
      data.data[p + 2] = 128 + 127 / length;
      data.data[p + 3] = 255;
    }
  g.putImageData(data, 0, 0);
  const t = texture(c, true);
  t.colorSpace = "";
  t.repeat.set(REFLECTION.normalRepeat, REFLECTION.normalRepeat);
  return t;
}
export function paintVending(mobile: boolean) {
  const c = canvas(mobile ? 128 : 256, mobile ? 256 : 512),
    g = c.getContext("2d")!,
    w = c.width,
    h = c.height;
  g.fillStyle = C.shutter;
  g.fillRect(0, 0, w, h);
  g.fillStyle = C.void;
  g.fillRect(w * 0.08, h * 0.06, w * 0.72, h * 0.64);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      g.fillStyle = [C.vendGlow, C.neonPink, C.rain, C.scooterPaint, C.lantern][
        col
      ];
      g.fillRect(
        w * (0.12 + col * 0.13),
        h * (0.08 + row * 0.15),
        w * 0.07,
        h * 0.085,
      );
      g.fillStyle = C.metalDark;
      g.fillRect(
        w * (0.1 + col * 0.13),
        h * (0.18 + row * 0.15),
        w * 0.11,
        h * 0.015,
      );
    }
    g.fillStyle = C.metalDark;
    g.fillRect(w * 0.08, h * (0.21 + row * 0.15), w * 0.72, h * 0.015);
  }
  g.fillStyle = C.void;
  g.fillRect(w * 0.12, h * 0.82, w * 0.64, h * 0.11);
  g.fillStyle = C.scooterPaint;
  g.fillRect(w * 0.85, h * 0.3, w * 0.07, h * 0.07);
  g.fillStyle = C.metalDark;
  g.fillRect(w * 0.85, h * 0.43, w * 0.09, h * 0.025);
  return texture(c);
}
export function paintGate() {
  const c = canvas(512, 256),
    g = c.getContext("2d")!;
  g.fillStyle = C.void;
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = C.signWhite;
  g.lineWidth = 5;
  g.beginPath();
  g.roundRect(216, 32, 80, 94, 24);
  g.stroke();
  g.fillStyle = C.signWhite;
  g.fillRect(231, 49, 50, 30);
  g.beginPath();
  g.arc(234, 104, 5, 0, Math.PI * 2);
  g.arc(278, 104, 5, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(230, 125);
  g.lineTo(212, 146);
  g.moveTo(282, 125);
  g.lineTo(300, 146);
  g.stroke();
  g.textAlign = "center";
  g.font = '36px "Hiragino Sans",sans-serif';
  g.fillText(STRINGS[21], 256, 213);
  return texture(c);
}

/** §3.6: one radial alpha shared by contact shadows, underglow and tail smears. */
export function paintRoadAlphas(mobile: boolean) {
  const n = mobile ? TRAFFIC.mobileAlphaSize : TRAFFIC.alphaSize;
  const radialCanvas = canvas(n, n), beamCanvas = canvas(n, n);
  const radialContext = radialCanvas.getContext("2d")!, beamContext = beamCanvas.getContext("2d")!;
  const radial = radialContext.createImageData(n, n), beam = beamContext.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = (x + .5) / n, v = (y + .5) / n;
    const radius = Math.max(0, 1 - Math.hypot(u * 2 - 1, v * 2 - 1));
    const forward = (1 - u) * Math.max(0, 1 - Math.abs(v * 2 - 1) / u);
    const i = (y * n + x) * 4;
    radial.data[i] = radial.data[i + 1] = radial.data[i + 2] = radius * 255;
    beam.data[i] = beam.data[i + 1] = beam.data[i + 2] = forward * 255;
    radial.data[i + 3] = beam.data[i + 3] = 255;
  }
  radialContext.putImageData(radial, 0, 0); beamContext.putImageData(beam, 0, 0);
  const radialMap = texture(radialCanvas), beamMap = texture(beamCanvas);
  radialMap.colorSpace = beamMap.colorSpace = "";
  return { radial: radialMap, beam: beamMap };
}
